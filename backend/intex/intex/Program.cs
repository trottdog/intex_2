using DotNetEnv;
using intex.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var contentRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));
var envPath = Path.Combine(contentRoot, ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(args);

var defaultCs = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(defaultCs))
{
    Console.WriteLine("[config] WARNING: ConnectionStrings:DefaultConnection is missing or empty.");
}
else if (defaultCs.Contains("YOUR_PROJECT_REF", StringComparison.OrdinalIgnoreCase)
         || defaultCs.Contains("YOUR_DB_PASSWORD", StringComparison.OrdinalIgnoreCase)
         || defaultCs.Contains("YOUR_DATABASE_PASSWORD", StringComparison.OrdinalIgnoreCase))
{
    Console.WriteLine("[config] WARNING: DefaultConnection still contains placeholder text — replace with values from Supabase (Project Settings → Database).");
}
else if (builder.Environment.IsDevelopment())
{
    try
    {
        var npg = new NpgsqlConnectionStringBuilder(defaultCs);
        Console.WriteLine($"[config] DB target: Host={npg.Host}; Port={npg.Port}; Database={npg.Database}; Username={npg.Username}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[config] WARNING: Could not parse DefaultConnection: {ex.Message}");
    }
}

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "Lighthouse INTEX API",
        Version = "v1",
        Description =
            "Route map for the nonprofit platform. Stubs return placeholders until services + EF are wired.",
    });
});

// Supabase transaction pooler (PgBouncer, port 6543): session reset + prepared statements + multiplexing
// all fight transaction pooling; without these tweaks the first request often works then the next fails.
static string PoolerSafeNpgsqlConnectionString(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return raw ?? string.Empty;
    var csb = new NpgsqlConnectionStringBuilder(raw)
    {
        MaxAutoPrepare = 0,
        NoResetOnClose = true,
        Multiplexing = false,
        // Drop client-side pooled connections before PgBouncer / network idle limits cause odd reuse.
        ConnectionLifetime = 300,
    };
    // PgBouncer transaction mode + Npgsql's client pool can leave connectors in a bad state; avoid reuse.
    try
    {
        if (csb.Port == 6543)
        {
            csb.Pooling = false;
        }
    }
    catch
    {
        /* ignore parse edge cases */
    }

    return csb.ConnectionString;
}

/// <summary>Supabase transaction pooler (PgBouncer, 6543) is not suitable for EF migrations / DDL.</summary>
static bool IsTransactionPoolerConnection(string? raw)
{
    if (string.IsNullOrWhiteSpace(raw)) return false;
    try
    {
        return new NpgsqlConnectionStringBuilder(raw).Port == 6543;
    }
    catch
    {
        return false;
    }
}

var npgsqlCs = PoolerSafeNpgsqlConnectionString(builder.Configuration.GetConnectionString("DefaultConnection"));
var useTxnPooler = IsTransactionPoolerConnection(npgsqlCs);
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(npgsqlCs, npgsql =>
    {
        // PgBouncer transaction mode + multiplexed commands: large batches and retry policies can
        // surface Npgsql ObjectDisposedException on the connector; keep saves single-statement.
        if (useTxnPooler)
        {
            npgsql.MaxBatchSize(1);
        }
        else
        {
            npgsql.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(15),
                errorCodesToAdd: null);
        }
    }));

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        // Demo passwords in SETUP.md (e.g. Lighthouse1) are alphanumeric only.
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 8;
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

builder.Services.AddAuthorization();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "Beacon.Auth";
    options.Cookie.HttpOnly = true;
    // Local SPA → local API: Lax is fine. Local SPA → HTTPS API (cross-site): need None + Secure
    // so fetch(..., credentials: 'include') receives Set-Cookie. Enable with Auth:Cookie:CrossSite (e.g. Azure).
    var crossSite = builder.Configuration.GetValue("Auth:Cookie:CrossSite", false);
    if (crossSite)
    {
        options.Cookie.SameSite = SameSiteMode.None;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    }
    else
    {
        options.Cookie.SameSite = SameSiteMode.Lax;
    }
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddCors();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "INTEX v1");
        options.RoutePrefix = "swagger";
    });
}

// Vite defaults to 5173; credentials required for Identity auth cookie from the SPA.
app.UseCors(x => x
    .WithOrigins(
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "https://beacon.trottdog.com",
        "https://www.beacon.trottdog.com")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials());

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

var spaWebRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var spaIndexPath = Path.Combine(spaWebRoot, "index.html");
IResult ServeSpaIndex()
{
    if (!File.Exists(spaIndexPath))
    {
        return Results.NotFound("SPA index.html was not found in wwwroot.");
    }
    return Results.File(spaIndexPath, "text/html; charset=utf-8");
}

var spaPublicRoutes = new[]
{
    "/",
    "/404",
    "/impact",
    "/programs",
    "/about",
    "/social",
    "/donate",
    "/login",
    "/privacy",
    "/cookies",
};

foreach (var route in spaPublicRoutes)
{
    app.MapGet(route, () => ServeSpaIndex());
}

// Deep-link reload support for SPA app routes (e.g. /app/admin/contributions).
app.MapGet("/app/{*path}", () => ServeSpaIndex());

var apiRouteRoots = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "auth",
    "public",
    "supporters",
    "residents",
    "safehouses",
    "partners",
    "partner-assignments",
    "social-media-posts",
    "public-impact-snapshots",
    "donations",
};

// Fallback for unknown frontend routes so the SPA can render its own 404 screen.
app.MapFallback(async context =>
{
    if (!(HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method)))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var pathValue = context.Request.Path.Value ?? string.Empty;
    if (Path.HasExtension(pathValue))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    var trimmed = pathValue.Trim('/');
    var firstSegment = trimmed.Length == 0 ? string.Empty : trimmed.Split('/', 2)[0];
    if (!string.IsNullOrWhiteSpace(firstSegment) && apiRouteRoots.Contains(firstSegment))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    if (!File.Exists(spaIndexPath))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsync("SPA index.html was not found in wwwroot.");
        return;
    }

    context.Response.ContentType = "text/html; charset=utf-8";
    await context.Response.SendFileAsync(spaIndexPath);
});

await EnsureIntexExtensionTablesAsync(app);

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var applyMigrations = app.Configuration.GetValue("Database:ApplyMigrations", app.Environment.IsDevelopment());
    var cs = app.Configuration.GetConnectionString("DefaultConnection");
    if (applyMigrations)
    {
        if (IsTransactionPoolerConnection(cs))
        {
            app.Logger.LogWarning(
                "Skipping EF Core migrations: connection uses transaction pooler port 6543 (DDL is unreliable). " +
                "Apply Identity schema with a direct Postgres URL (port 5432), e.g. " +
                "`dotnet ef database update` from backend/intex/intex, or run the SQL scripts in backend/docs. See identity-and-seed.md.");
        }
        else
        {
            await db.Database.MigrateAsync();
        }
    }
}

if (app.Configuration.GetValue("Auth:Seed:Enabled", app.Environment.IsDevelopment()))
{
    if (IsTransactionPoolerConnection(app.Configuration.GetConnectionString("DefaultConnection")))
    {
        app.Logger.LogWarning(
            "Identity startup seed is skipped: DefaultConnection uses the Supabase transaction pooler (port 6543), " +
            "which does not support the EF Core write patterns used by ASP.NET Identity seeding. " +
            "For demo logins: (1) point ConnectionStrings:DefaultConnection at direct Postgres (db.*.supabase.co port 5432; user postgres) and restart, " +
            "or (2) run backend/docs/identity-seed.sql in the Supabase SQL Editor after users exist. See backend/docs/identity-and-seed.md and SEED-DATA.md.");
    }
    else
    {
        await IdentityDevSeeder.SeedAsync(app);
    }
}

if (app.Environment.IsDevelopment())
{
    await IdentityPasswordBootstrapper.RunAsync(app);
}

app.Run();

static async Task EnsureIntexExtensionTablesAsync(WebApplication app)
{
    var cs = app.Configuration.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(cs)) return;
    try
    {
        var npg = new NpgsqlConnectionStringBuilder(cs);
        // Transaction pooler (PgBouncer, e.g. Supabase 6543): DDL is unreliable or disallowed — use SQL Editor or port 5432.
        if (npg.Port == 6543)
        {
            app.Logger.LogInformation(
                "Skipping case_conferences DDL on pooler port {Port}; create the table from schema.sql (Supabase SQL Editor) or use a direct DB connection.",
                npg.Port);
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS case_conferences (
                conference_id         BIGSERIAL PRIMARY KEY,
                resident_id           BIGINT NOT NULL REFERENCES residents (resident_id) ON DELETE CASCADE,
                conference_date       DATE NOT NULL,
                conference_type       TEXT,
                summary               TEXT,
                decisions_made        TEXT,
                next_steps            TEXT,
                next_conference_date  DATE,
                created_by            TEXT
            );
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS idx_case_conferences_resident ON case_conferences (resident_id);
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS ml_pipeline_runs (
                run_id BIGSERIAL PRIMARY KEY,
                pipeline_name TEXT NOT NULL,
                display_name TEXT,
                model_name TEXT,
                status TEXT NOT NULL DEFAULT 'completed',
                trained_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                data_source TEXT,
                source_commit TEXT,
                metrics_json JSONB,
                manifest_json JSONB
            );
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS idx_ml_pipeline_runs_pipeline_time
            ON ml_pipeline_runs (pipeline_name, trained_at DESC);
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS ml_prediction_snapshots (
                prediction_id BIGSERIAL PRIMARY KEY,
                run_id BIGINT NOT NULL REFERENCES ml_pipeline_runs (run_id) ON DELETE CASCADE,
                pipeline_name TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id BIGINT,
                entity_key TEXT NOT NULL,
                entity_label TEXT,
                safehouse_id BIGINT,
                record_timestamp TIMESTAMPTZ,
                prediction_value INTEGER,
                prediction_score DOUBLE PRECISION NOT NULL,
                rank_order INTEGER NOT NULL,
                context_json JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS idx_ml_prediction_snapshots_run_rank
            ON ml_prediction_snapshots (run_id, rank_order);
            """);
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS idx_ml_prediction_snapshots_pipeline_entity
            ON ml_prediction_snapshots (pipeline_name, entity_id);
            """);
        app.Logger.LogInformation("Verified case_conferences and ML reporting tables exist (CREATE IF NOT EXISTS).");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "EnsureIntexExtensionTablesAsync failed (e.g. missing DB or residents table).");
    }
}
