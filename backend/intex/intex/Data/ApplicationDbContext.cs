using Microsoft.EntityFrameworkCore;

namespace intex.Data;

/// <summary>
/// EF Core context for Supabase Postgres (same <c>AddDbContext</c> + <c>GetConnectionString</c> pattern as the BookList sample app).
/// Add <see cref="DbSet{TEntity}"/> properties when you map entities from <c>schema.sql</c>.
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }
}
