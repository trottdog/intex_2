using intex.Data;
using intex.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace intex.Controllers;

/// <summary>Case-management subresources are only available for residents the user may access.</summary>
[Authorize(Roles = IntexRoles.Admin + "," + IntexRoles.SuperAdmin)]
public abstract class ResidentScopedControllerBase : ControllerBase
{
    protected ApplicationDbContext Db { get; }

    private readonly IFacilityDataScopeResolver _scopeResolver;

    protected ResidentScopedControllerBase(ApplicationDbContext db, IFacilityDataScopeResolver scopeResolver)
    {
        Db = db;
        _scopeResolver = scopeResolver;
    }

    protected async Task<bool> CanAccessResident(long residentId, CancellationToken ct)
    {
        var scope = await _scopeResolver.ResolveAsync(User, ct);
        return await FacilityAccess.ResidentInScopeAsync(Db, scope, residentId, ct);
    }
}
