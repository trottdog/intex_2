using DotNetEnv;
using intex.Data;
using Microsoft.EntityFrameworkCore;

// Local secrets: same idea as BookList's appsettings ConnectionStrings, but loaded from .env for Supabase.
var contentRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));
var envPath = Path.Combine(contentRoot, ".env");
if (File.Exists(envPath))
{
    Env.Load(envPath);
    Console.WriteLine($"[config] Loaded .env from {envPath}");
}
else
{
    Console.WriteLine($"[config] No .env at {envPath} — using appsettings / machine env only.");
}

var builder = WebApplication.CreateBuilder(args);

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

// Same pattern as BookList: AddDbContext + GetConnectionString — Postgres/Supabase instead of SQLite.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
