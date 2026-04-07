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
    private readonly ApplicationDbContext _db;

    public AdminUsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
    {
        _userManager = userManager;
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

        await _userManager.AddToRoleAsync(user, roleName);

        if (roleName == IntexRoles.Admin && body.SafehouseIds is { Length: > 0 })
        {
            foreach (var sid in body.SafehouseIds.Distinct())
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

        user.FullName = string.IsNullOrWhiteSpace(body.FullName) ? null : body.FullName.Trim();
        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            return BadRequest(new { error = string.Join("; ", update.Errors.Select(e => e.Description)) });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, roleName);

        var assignments = await _db.StaffSafehouseAssignments.Where(a => a.UserId == id).ToListAsync(ct);
        _db.StaffSafehouseAssignments.RemoveRange(assignments);

        if (roleName == IntexRoles.Admin && body.SafehouseIds is { Length: > 0 })
        {
            foreach (var sid in body.SafehouseIds.Distinct())
            {
                _db.StaffSafehouseAssignments.Add(new StaffSafehouseAssignment { UserId = id, SafehouseId = sid });
            }
        }

        await _db.SaveChangesAsync(ct);

        var status = (body.Status ?? "active").Trim().ToLowerInvariant();
        if (status == "locked")
        {
            await _userManager.SetLockoutEnabledAsync(user, true);
            await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddYears(100));
        }
        else
        {
            await _userManager.SetLockoutEndDateAsync(user, null);
        }

        var fresh = await _userManager.Users.AsNoTracking().FirstAsync(u => u.Id == id, ct);
        return Ok(await MapUserAsync(fresh, ct));
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
}
