using intex.Data;
using intex.Data.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("admin/users")]
[Authorize(Roles = IntexRoles.SuperAdmin)]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ApplicationDbContext _db;

    public AdminUsersController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    public record AdminUserRow(string Id, string Name, string? Email, string Role, string FacilityScope, string Status, long[]? SafehouseIds);

    public record CreateUserBody(string Email, string Password, string FullName, string Role, long[]? SafehouseIds);

    public record UpdateUserBody(string FullName, string Role, string Status, long[]? SafehouseIds);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminUserRow>>> List(CancellationToken ct)
    {
        var users = await _userManager.Users.AsNoTracking()
            .OrderBy(u => u.Email)
            .ToListAsync(ct);
        var result = new List<AdminUserRow>(users.Count);
        foreach (var u in users)
        {
            result.Add(await MapUserAsync(u, ct));
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<AdminUserRow>> Create([FromBody] CreateUserBody body, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        var roleName = NormalizeRole(body.Role);
        if (roleName is null)
        {
            return BadRequest(new { error = "Role must be Donor, Admin, or SuperAdmin." });
        }

        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = $"Required Identity role '{roleName}' was not found. Run identity role seed/migrations and retry."
            });
        }

        var validatedSafehouseIds = await ValidateSafehouseIdsAsync(roleName, body.SafehouseIds, ct);
        if (!validatedSafehouseIds.IsValid)
        {
            return BadRequest(new { error = validatedSafehouseIds.ErrorMessage });
        }

        var email = body.Email.Trim();
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = string.IsNullOrWhiteSpace(body.FullName) ? null : body.FullName.Trim(),
            EmailConfirmed = true,
        };

        var create = await _userManager.CreateAsync(user, body.Password);
        if (!create.Succeeded)
        {
            return BadRequest(new { error = string.Join("; ", create.Errors.Select(e => e.Description)) });
        }

        var addRole = await _userManager.AddToRoleAsync(user, roleName);
        if (!addRole.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return BadRequest(new { error = string.Join("; ", addRole.Errors.Select(e => e.Description)) });
        }

        if (roleName == IntexRoles.Admin && validatedSafehouseIds.SafehouseIds.Length > 0)
        {
            foreach (var sid in validatedSafehouseIds.SafehouseIds)
            {
                _db.StaffSafehouseAssignments.Add(new StaffSafehouseAssignment
                {
                    UserId = user.Id,
                    SafehouseId = sid,
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        var created = await _userManager.Users.AsNoTracking().FirstAsync(u => u.Id == user.Id, ct);
        return StatusCode(StatusCodes.Status201Created, await MapUserAsync(created, ct));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AdminUserRow>> Update(string id, [FromBody] UpdateUserBody body, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var roleName = NormalizeRole(body.Role);
        if (roleName is null)
        {
            return BadRequest(new { error = "Role must be Donor, Admin, or SuperAdmin." });
        }

        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = $"Required Identity role '{roleName}' was not found. Run identity role seed/migrations and retry."
            });
        }

        var validatedSafehouseIds = await ValidateSafehouseIdsAsync(roleName, body.SafehouseIds, ct);
        if (!validatedSafehouseIds.IsValid)
        {
            return BadRequest(new { error = validatedSafehouseIds.ErrorMessage });
        }

        var status = NormalizeStatus(body.Status);
        if (status is null)
        {
            return BadRequest(new { error = "Status must be active or locked." });
        }

        user.FullName = string.IsNullOrWhiteSpace(body.FullName) ? null : body.FullName.Trim();
        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            return BadRequest(new { error = string.Join("; ", update.Errors.Select(e => e.Description)) });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!currentRoles.Contains(roleName, StringComparer.OrdinalIgnoreCase))
        {
            var addRole = await _userManager.AddToRoleAsync(user, roleName);
            if (!addRole.Succeeded)
            {
                return BadRequest(new { error = string.Join("; ", addRole.Errors.Select(e => e.Description)) });
            }
        }

        var rolesToRemove = currentRoles
            .Where(r => !string.Equals(r, roleName, StringComparison.OrdinalIgnoreCase))
            .ToArray();
        if (rolesToRemove.Length > 0)
        {
            var removeRoles = await _userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeRoles.Succeeded)
            {
                return BadRequest(new { error = string.Join("; ", removeRoles.Errors.Select(e => e.Description)) });
            }
        }

        var assignments = await _db.StaffSafehouseAssignments.Where(a => a.UserId == id).ToListAsync(ct);
        _db.StaffSafehouseAssignments.RemoveRange(assignments);

        if (roleName == IntexRoles.Admin && validatedSafehouseIds.SafehouseIds.Length > 0)
        {
            foreach (var sid in validatedSafehouseIds.SafehouseIds)
            {
                _db.StaffSafehouseAssignments.Add(new StaffSafehouseAssignment { UserId = id, SafehouseId = sid });
            }
        }

        if (status == "locked")
        {
            var lockoutEnabled = await _userManager.SetLockoutEnabledAsync(user, true);
            if (!lockoutEnabled.Succeeded)
            {
                return BadRequest(new { error = string.Join("; ", lockoutEnabled.Errors.Select(e => e.Description)) });
            }

            var lockoutEnd = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
            if (!lockoutEnd.Succeeded)
            {
                return BadRequest(new { error = string.Join("; ", lockoutEnd.Errors.Select(e => e.Description)) });
            }
        }
        else
        {
            var unlock = await _userManager.SetLockoutEndDateAsync(user, null);
            if (!unlock.Succeeded)
            {
                return BadRequest(new { error = string.Join("; ", unlock.Errors.Select(e => e.Description)) });
            }
        }

        await _db.SaveChangesAsync(ct);

        var updated = await _userManager.Users.AsNoTracking().FirstAsync(u => u.Id == id, ct);
        return Ok(await MapUserAsync(updated, ct));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        var current = await _userManager.GetUserAsync(User);
        if (current is not null && current.Id == id)
        {
            return BadRequest(new { error = "You cannot delete your own account." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var assignments = await _db.StaffSafehouseAssignments.Where(a => a.UserId == id).ToListAsync(ct);
        _db.StaffSafehouseAssignments.RemoveRange(assignments);
        await _db.SaveChangesAsync(ct);

        var del = await _userManager.DeleteAsync(user);
        if (!del.Succeeded)
        {
            return BadRequest(new { error = string.Join("; ", del.Errors.Select(e => e.Description)) });
        }

        return NoContent();
    }

    private static string? NormalizeRole(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var n = raw.Trim().ToLowerInvariant().Replace("-", string.Empty);
        return n switch
        {
            "superadmin" => IntexRoles.SuperAdmin,
            "admin" => IntexRoles.Admin,
            "donor" => IntexRoles.Donor,
            _ => null,
        };
    }

    private static string? NormalizeStatus(string? raw)
    {
        var status = string.IsNullOrWhiteSpace(raw)
            ? "active"
            : raw.Trim().ToLowerInvariant();

        return status is "active" or "locked" ? status : null;
    }

    private async Task<AdminUserRow> MapUserAsync(ApplicationUser u, CancellationToken ct)
    {
        var roles = await _userManager.GetRolesAsync(u);
        var role = MapPrimaryRole(roles);
        var facilityScope = await ResolveFacilityScopeAsync(u.Id, roles, ct);
        var status = ResolveStatus(u);
        long[]? safehouseIds = null;
        if (roles.Contains(IntexRoles.Admin))
        {
            safehouseIds = await _db.StaffSafehouseAssignments.AsNoTracking()
                .Where(a => a.UserId == u.Id)
                .OrderBy(a => a.SafehouseId)
                .Select(a => a.SafehouseId)
                .ToArrayAsync(ct);
        }

        return new AdminUserRow(
            u.Id,
            u.FullName?.Trim() ?? u.UserName ?? u.Email ?? "User",
            u.Email,
            role,
            facilityScope,
            status,
            safehouseIds);
    }

    private static string MapPrimaryRole(IList<string> roles)
    {
        var norm = roles.Select(r => r.Trim().ToLowerInvariant()).ToHashSet();
        if (norm.Contains("superadmin")) return IntexRoles.SuperAdmin;
        if (norm.Contains("admin")) return IntexRoles.Admin;
        if (norm.Contains("donor")) return IntexRoles.Donor;
        return roles.FirstOrDefault() ?? "Unassigned";
    }

    private async Task<string> ResolveFacilityScopeAsync(string userId, IList<string> roles, CancellationToken ct)
    {
        if (roles.Contains(IntexRoles.SuperAdmin))
        {
            return "All facilities";
        }

        if (roles.Contains(IntexRoles.Admin))
        {
            var names = await _db.StaffSafehouseAssignments.AsNoTracking()
                .Where(a => a.UserId == userId)
                .Join(_db.Safehouses.AsNoTracking(), a => a.SafehouseId, s => s.SafehouseId, (a, s) => s.Name)
                .OrderBy(n => n)
                .ToListAsync(ct);
            return names.Count == 0 ? "No safehouse assigned" : string.Join(", ", names);
        }

        if (roles.Contains(IntexRoles.Donor))
        {
            return "Donor portal";
        }

        return "—";
    }

    private static string ResolveStatus(ApplicationUser u) =>
        u.LockoutEnd is { } end && end > DateTimeOffset.UtcNow ? "locked" : u.EmailConfirmed ? "active" : "pending";

    private async Task<(bool IsValid, long[] SafehouseIds, string? ErrorMessage)> ValidateSafehouseIdsAsync(
        string roleName,
        long[]? safehouseIds,
        CancellationToken ct)
    {
        if (roleName != IntexRoles.Admin || safehouseIds is not { Length: > 0 })
        {
            return (true, [], null);
        }

        var uniqueIds = safehouseIds
            .Where(id => id > 0)
            .Distinct()
            .OrderBy(id => id)
            .ToArray();

        if (uniqueIds.Length != safehouseIds.Length)
        {
            return (false, [], "SafehouseIds must be unique positive integers.");
        }

        var existingIds = await _db.Safehouses.AsNoTracking()
            .Where(s => uniqueIds.Contains(s.SafehouseId))
            .Select(s => s.SafehouseId)
            .ToArrayAsync(ct);

        var missingIds = uniqueIds.Except(existingIds).ToArray();
        if (missingIds.Length > 0)
        {
            return (false, [], $"Unknown safehouseIds: {string.Join(", ", missingIds)}.");
        }

        return (true, uniqueIds, null);
    }
}
