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

    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();

    public DbSet<Supporter> Supporters => Set<Supporter>();

    public DbSet<Partner> Partners => Set<Partner>();

    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();

    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();

    public DbSet<Resident> Residents => Set<Resident>();

    public DbSet<CaseConference> CaseConferences => Set<CaseConference>();

    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();

    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();

    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();

    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();

    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();

    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();

    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();

    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PublicImpactSnapshot>(e =>
            e.Property(x => x.MetricPayloadJson).HasColumnType("jsonb"));
    }
}
