using intex.Data;
using System.Text;
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
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext db,
        ILogger<AuthController> logger)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _db = db;
        _logger = logger;
    }

    public record LoginRequest(
        string Email,
        string Password,
        string? TwoFactorCode,
        string? RecoveryCode,
        bool RememberMachine = false);
    public record EnableMfaRequest(string Code);

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

        if (result.RequiresTwoFactor)
        {
            if (!string.IsNullOrWhiteSpace(body.TwoFactorCode))
            {
                var normalizedCode = NormalizeAuthenticatorCode(body.TwoFactorCode);
                var twoFactorResult = await _signInManager.TwoFactorAuthenticatorSignInAsync(
                    normalizedCode,
                    isPersistent: true,
                    rememberClient: body.RememberMachine);

                if (twoFactorResult.IsLockedOut)
                {
                    return BadRequest(new { error = "Account is locked. Try again later." });
                }

                if (!twoFactorResult.Succeeded)
                {
                    return BadRequest(new { error = "Invalid or expired authenticator code." });
                }

                var mePayload = await BuildAuthenticatedPayloadAsync(user, cancellationToken);
                return Ok(mePayload);
            }

            if (!string.IsNullOrWhiteSpace(body.RecoveryCode))
            {
                var normalizedRecoveryCode = NormalizeRecoveryCode(body.RecoveryCode);
                var recoveryResult = await _signInManager.TwoFactorRecoveryCodeSignInAsync(normalizedRecoveryCode);

                if (recoveryResult.IsLockedOut)
                {
                    return BadRequest(new { error = "Account is locked. Try again later." });
                }

                if (!recoveryResult.Succeeded)
                {
                    return BadRequest(new { error = "Invalid recovery code." });
                }

                var mePayload = await BuildAuthenticatedPayloadAsync(user, cancellationToken);
                return Ok(mePayload);
            }

            return Ok(new
            {
                requiresTwoFactor = true,
                message = "Two-factor authentication code is required.",
            });
        }

        if (result.IsLockedOut)
        {
            return BadRequest(new { error = "Account is locked. Try again later." });
        }

        if (!result.Succeeded)
        {
            // 400: bad credentials (401 is reserved for missing/invalid auth on protected routes)
            return BadRequest(new { error = "Invalid email or password." });
        }

        var payload = await BuildAuthenticatedPayloadAsync(user, cancellationToken);
        return Ok(payload);
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

        var payload = await BuildAuthenticatedPayloadAsync(user, cancellationToken);
        return Ok(payload);
    }

    [HttpGet("mfa/status")]
    [Authorize]
    public async Task<IActionResult> GetMfaStatus()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var status = await BuildMfaStatusAsync(user, Array.Empty<string>());
        return Ok(status);
    }

    [HttpPost("mfa/enable")]
    [Authorize]
    public async Task<IActionResult> EnableMfa([FromBody] EnableMfaRequest body)
    {
        if (string.IsNullOrWhiteSpace(body.Code))
        {
            return BadRequest(new { error = "Authenticator code is required." });
        }

        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var verified = await _userManager.VerifyTwoFactorTokenAsync(
            user,
            _userManager.Options.Tokens.AuthenticatorTokenProvider,
            NormalizeAuthenticatorCode(body.Code));

        if (!verified)
        {
            return BadRequest(new { error = "Invalid or expired authenticator code." });
        }

        var setEnabledResult = await _userManager.SetTwoFactorEnabledAsync(user, true);
        if (!setEnabledResult.Succeeded)
        {
            return BadRequest(new
            {
                error = "Unable to enable MFA.",
                details = setEnabledResult.Errors.Select(e => e.Description),
            });
        }

        var recoveryCodes = (await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToArray() ?? Array.Empty<string>();
        _logger.LogInformation("MFA enabled for user {UserId}.", user.Id);

        var status = await BuildMfaStatusAsync(user, recoveryCodes);
        return Ok(status);
    }

    [HttpPost("mfa/disable")]
    [Authorize]
    public async Task<IActionResult> DisableMfa()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        var setEnabledResult = await _userManager.SetTwoFactorEnabledAsync(user, false);
        if (!setEnabledResult.Succeeded)
        {
            return BadRequest(new
            {
                error = "Unable to disable MFA.",
                details = setEnabledResult.Errors.Select(e => e.Description),
            });
        }

        await _signInManager.ForgetTwoFactorClientAsync();
        _logger.LogInformation("MFA disabled for user {UserId}.", user.Id);

        var status = await BuildMfaStatusAsync(user, Array.Empty<string>());
        return Ok(status);
    }

    [HttpPost("mfa/recovery-codes/reset")]
    [Authorize]
    public async Task<IActionResult> ResetRecoveryCodes()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { error = "Not authenticated." });
        }

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
        {
            return BadRequest(new { error = "Enable MFA before generating recovery codes." });
        }

        var recoveryCodes = (await _userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10))?.ToArray() ?? Array.Empty<string>();
        _logger.LogInformation("Recovery codes reset for user {UserId}.", user.Id);

        var status = await BuildMfaStatusAsync(user, recoveryCodes);
        return Ok(status);
    }

    private async Task<object> BuildAuthenticatedPayloadAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
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

        return new
        {
            authenticated = true,
            id = user.Id,
            email = user.Email,
            fullName = user.FullName,
            roles,
            supporterId,
            safehouseIds,
        };
    }

    private async Task<object> BuildMfaStatusAsync(ApplicationUser user, string[] recoveryCodes)
    {
        var rawKey = await EnsureAuthenticatorKeyAsync(user);
        var email = user.Email ?? user.UserName ?? "beacon-user";

        return new
        {
            sharedKey = FormatAuthenticatorKey(rawKey),
            authenticatorUri = BuildOtpAuthUri(email, rawKey),
            recoveryCodesLeft = await _userManager.CountRecoveryCodesAsync(user),
            recoveryCodes,
            isTwoFactorEnabled = await _userManager.GetTwoFactorEnabledAsync(user),
            isMachineRemembered = await _signInManager.IsTwoFactorClientRememberedAsync(user),
        };
    }

    private async Task<string> EnsureAuthenticatorKeyAsync(ApplicationUser user)
    {
        var unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (!string.IsNullOrWhiteSpace(unformattedKey))
        {
            return unformattedKey;
        }

        await _userManager.ResetAuthenticatorKeyAsync(user);
        unformattedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrWhiteSpace(unformattedKey))
        {
            throw new InvalidOperationException("Unable to load authenticator key.");
        }

        return unformattedKey;
    }

    private static string NormalizeAuthenticatorCode(string? code) =>
        (code ?? string.Empty)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Trim();

    private static string NormalizeRecoveryCode(string? recoveryCode) =>
        (recoveryCode ?? string.Empty)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .Trim();

    private static string FormatAuthenticatorKey(string unformattedKey)
    {
        var result = new StringBuilder();
        var currentPosition = 0;

        while (currentPosition + 4 < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition, 4)).Append(' ');
            currentPosition += 4;
        }

        if (currentPosition < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition));
        }

        return result.ToString().ToLowerInvariant();
    }

    private static string BuildOtpAuthUri(string email, string unformattedKey)
    {
        var encodedIssuer = Uri.EscapeDataString("Project Beacon");
        var encodedEmail = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}?secret={unformattedKey}&issuer={encodedIssuer}&digits=6";
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public IActionResult Register() =>
        Ok(new { message = "Registration is not enabled in this build. Use seeded accounts or contact an administrator." });
}
