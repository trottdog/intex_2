using DotNetEnv;
using intex.Data;
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
    return csb.ConnectionString;
}

var npgsqlCs = PoolerSafeNpgsqlConnectionString(builder.Configuration.GetConnectionString("DefaultConnection"));
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(npgsqlCs, npgsql =>
        npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(15),
            errorCodesToAdd: null)));

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

// BookList: app.UseCors(x => x.WithOrigins("http://localhost:3000"));
// Vite (this repo) defaults to 5173; include both for local full-stack dev.
app.UseCors(x => x.WithOrigins("http://localhost:5173", "http://localhost:3000"));

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
