using System.Security.Claims;
using intex.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace intex.Services;

/// <summary>
/// Facility-aware data scope for Admin vs SuperAdmin. Donors and other roles are not facility-scoped here.
/// </summary>
public sealed record FacilityDataScope(bool IsUnrestricted, bool IsFacilityAdmin, IReadOnlyList<long> SafehouseIds)
{
    public static FacilityDataScope SuperAdmin() =>
        new(true, false, Array.Empty<long>());

    /// <summary>Staff admin scoped to zero or more safehouses. Empty list means no in-scope rows.</summary>
    public static FacilityDataScope Admin(IReadOnlyList<long> safehouseIds) =>
        new(false, true, safehouseIds);

    public static FacilityDataScope NonFacilityUser() =>
        new(false, false, Array.Empty<long>());
}

public interface IFacilityDataScopeResolver
{
    Task<FacilityDataScope> ResolveAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default);
}

public sealed class FacilityDataScopeResolver : IFacilityDataScopeResolver
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly ApplicationDbContext _db;

    public FacilityDataScopeResolver(UserManager<ApplicationUser> users, ApplicationDbContext db)
    {
        _users = users;
        _db = db;
    }

    public async Task<FacilityDataScope> ResolveAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return FacilityDataScope.NonFacilityUser();
        }

        if (principal.IsInRole(IntexRoles.SuperAdmin))
        {
            return FacilityDataScope.SuperAdmin();
        }

        if (principal.IsInRole(IntexRoles.Admin))
        {
            var uid = _users.GetUserId(principal);
            if (string.IsNullOrEmpty(uid))
            {
                return FacilityDataScope.Admin(Array.Empty<long>());
            }

            var ids = await _db.StaffSafehouseAssignments.AsNoTracking()
                .Where(a => a.UserId == uid)
                .OrderBy(a => a.SafehouseId)
                .Select(a => a.SafehouseId)
                .ToArrayAsync(cancellationToken);

            return FacilityDataScope.Admin(ids);
        }

        return FacilityDataScope.NonFacilityUser();
    }
}
