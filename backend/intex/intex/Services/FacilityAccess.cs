using intex.Data;
using intex.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace intex.Services;

/// <summary>
/// Query helpers for facility-scoped authorization (regular admins).
/// </summary>
public static class FacilityAccess
{
    public static IQueryable<Resident> WhereInFacilityScope(this IQueryable<Resident> query, FacilityDataScope scope)
    {
        if (scope.IsUnrestricted)
        {
            return query;
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return query.Where(_ => false);
        }

        return query.Where(r => r.SafehouseId != null && scope.SafehouseIds.Contains(r.SafehouseId.Value));
    }

    public static IQueryable<Safehouse> WhereInFacilityScope(this IQueryable<Safehouse> query, FacilityDataScope scope)
    {
        if (scope.IsUnrestricted)
        {
            return query;
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return query.Where(_ => false);
        }

        return query.Where(s => scope.SafehouseIds.Contains(s.SafehouseId));
    }

    public static async Task<bool> ResidentInScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long residentId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.Residents.AsNoTracking().AnyAsync(r => r.ResidentId == residentId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return await db.Residents.AsNoTracking()
            .AnyAsync(
                r => r.ResidentId == residentId &&
                     r.SafehouseId != null &&
                     scope.SafehouseIds.Contains(r.SafehouseId.Value),
                ct);
    }

    public static async Task<bool> SafehouseInScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long safehouseId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.Safehouses.AsNoTracking().AnyAsync(s => s.SafehouseId == safehouseId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return scope.SafehouseIds.Contains(safehouseId);
    }

    public static async Task<bool> DonationInScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long donationId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.Donations.AsNoTracking().AnyAsync(d => d.DonationId == donationId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return await db.DonationAllocations.AsNoTracking()
            .AnyAsync(a => a.DonationId == donationId && scope.SafehouseIds.Contains(a.SafehouseId), ct);
    }

    public static IQueryable<long> DonationIdsTouchingScope(ApplicationDbContext db, FacilityDataScope scope)
    {
        return db.DonationAllocations.AsNoTracking()
            .Where(a => scope.SafehouseIds.Contains(a.SafehouseId))
            .Select(a => a.DonationId)
            .Distinct();
    }

    public static IQueryable<long> SupporterIdsTouchingScope(ApplicationDbContext db, FacilityDataScope scope)
    {
        return db.Donations.AsNoTracking()
            .Where(d => db.DonationAllocations.Any(a => a.DonationId == d.DonationId && scope.SafehouseIds.Contains(a.SafehouseId)))
            .Select(d => d.SupporterId)
            .Distinct();
    }

    public static IQueryable<Partner> PartnersInScope(ApplicationDbContext db, FacilityDataScope scope, IQueryable<Partner> query)
    {
        if (scope.IsUnrestricted)
        {
            return query;
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return query.Where(_ => false);
        }

        var partnerIds = db.PartnerAssignments.AsNoTracking()
            .Where(a => a.SafehouseId != null && scope.SafehouseIds.Contains(a.SafehouseId.Value))
            .Select(a => a.PartnerId)
            .Distinct();

        return query.Where(p => partnerIds.Contains(p.PartnerId));
    }

    public static async Task<bool> PartnerInScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long partnerId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.Partners.AsNoTracking().AnyAsync(p => p.PartnerId == partnerId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return await db.PartnerAssignments.AsNoTracking()
            .AnyAsync(a => a.PartnerId == partnerId && a.SafehouseId != null && scope.SafehouseIds.Contains(a.SafehouseId.Value), ct);
    }

    public static IQueryable<PartnerAssignment> AssignmentsInScope(IQueryable<PartnerAssignment> query, FacilityDataScope scope)
    {
        if (scope.IsUnrestricted)
        {
            return query;
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return query.Where(_ => false);
        }

        return query.Where(a => a.SafehouseId != null && scope.SafehouseIds.Contains(a.SafehouseId.Value));
    }

    public static async Task<bool> PartnerAssignmentInScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long assignmentId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.PartnerAssignments.AsNoTracking().AnyAsync(a => a.AssignmentId == assignmentId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return await db.PartnerAssignments.AsNoTracking()
            .AnyAsync(
                a => a.AssignmentId == assignmentId &&
                     a.SafehouseId != null &&
                     scope.SafehouseIds.Contains(a.SafehouseId.Value),
                ct);
    }

    /// <summary>Whether a supporter has any donation touching the facility scope (for admin list/detail).</summary>
    public static async Task<bool> SupporterTouchesScopeAsync(
        ApplicationDbContext db,
        FacilityDataScope scope,
        long supporterId,
        CancellationToken ct)
    {
        if (scope.IsUnrestricted)
        {
            return await db.Supporters.AsNoTracking().AnyAsync(s => s.SupporterId == supporterId, ct);
        }

        if (!scope.IsFacilityAdmin || scope.SafehouseIds.Count == 0)
        {
            return false;
        }

        return await db.Donations.AsNoTracking()
            .AnyAsync(
                d => d.SupporterId == supporterId &&
                     db.DonationAllocations.Any(a => a.DonationId == d.DonationId && scope.SafehouseIds.Contains(a.SafehouseId)),
                ct);
    }
}
