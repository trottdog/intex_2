using intex.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace intex.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;

    public AuthController(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _db = db;
    }

    public record LoginRequest(string Email, string Password);

    /// <summary>Cookie-based sign-in for the React app (use credentials: 'include').</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
        {
            return BadRequest(new { error = "Email and password are required." });
        }

        var user = await _userManager.FindByEmailAsync(body.Email.Trim());
        if (user is null)
        {
            return BadRequest(new { error = "Invalid email or password." });
        }

        var result = await _signInManager.PasswordSignInAsync(
            user,
            body.Password,
            isPersistent: true,
            lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            return BadRequest(new { error = "Account is locked. Try again later." });
        }

        if (!result.Succeeded)
        {
            // 400: bad credentials (401 is reserved for missing/invalid auth on protected routes)
            return BadRequest(new { error = "Invalid email or password." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            email = user.Email,
            fullName = user.FullName,
            roles,
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(new { message = "Signed out." });
    }

    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Ok(new { authenticated = false });
        }

        var roles = await _userManager.GetRolesAsync(user);
        long? supporterId = null;
        if (roles.Contains(IntexRoles.Donor))
        {
            supporterId = await _db.Supporters.AsNoTracking()
                .Where(s => s.IdentityUserId == user.Id)
                .Select(s => (long?)s.SupporterId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        long[] safehouseIds = [];
        if (roles.Contains(IntexRoles.Admin))
        {
            safehouseIds = await _db.StaffSafehouseAssignments.AsNoTracking()
                .Where(a => a.UserId == user.Id)
                .OrderBy(a => a.SafehouseId)
                .Select(a => a.SafehouseId)
                .ToArrayAsync(cancellationToken);
        }

        return Ok(new
        {
            authenticated = true,
            id = user.Id,
            email = user.Email,
            fullName = user.FullName,
            roles,
            supporterId,
            safehouseIds,
        });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public IActionResult Register() =>
        Ok(new { message = "Registration is not enabled in this build. Use seeded accounts or contact an administrator." });
}
