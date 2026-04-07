using intex.Data.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace intex.Data;

/// <summary>
/// EF Core context: INTEX domain tables plus ASP.NET Identity (same Postgres database).
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<StaffSafehouseAssignment> StaffSafehouseAssignments => Set<StaffSafehouseAssignment>();

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

    public DbSet<MlPipelineRun> MlPipelineRuns => Set<MlPipelineRun>();

    public DbSet<MlPredictionSnapshot> MlPredictionSnapshots => Set<MlPredictionSnapshot>();

    public DbSet<DonationTrendRow> ReportDonationTrends => Set<DonationTrendRow>();

    public DbSet<AccomplishmentReportRow> ReportAccomplishments => Set<AccomplishmentReportRow>();

    public DbSet<ReintegrationStatRow> ReportReintegrationStats => Set<ReintegrationStatRow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PublicImpactSnapshot>(e =>
            e.Property(x => x.MetricPayloadJson).HasColumnType("jsonb"));

        modelBuilder.Entity<MlPipelineRun>(e =>
        {
            e.Property(x => x.MetricsJson).HasColumnType("jsonb");
            e.Property(x => x.ManifestJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<MlPredictionSnapshot>(e =>
        {
            e.Property(x => x.ContextJson).HasColumnType("jsonb");
        });

        modelBuilder.Entity<StaffSafehouseAssignment>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.SafehouseId }).IsUnique();
            e.HasOne(x => x.Safehouse)
                .WithMany()
                .HasForeignKey(x => x.SafehouseId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
