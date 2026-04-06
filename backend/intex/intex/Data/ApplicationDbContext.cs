using intex.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace intex.Data;

/// <summary>
/// EF Core context for Supabase Postgres (same <c>AddDbContext</c> + <c>GetConnectionString</c> pattern as the BookList sample app).
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Donation> Donations => Set<Donation>();

    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
}
