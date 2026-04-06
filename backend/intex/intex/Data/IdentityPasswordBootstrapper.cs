using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace intex.Data;

/// <summary>
/// Development helper: reset passwords for seeded demo accounts to match <c>Auth:Seed:*Password</c> (User Secrets).
/// Use when full <see cref="IdentityDevSeeder"/> cannot run (e.g. Supabase transaction pooler) but users already exist in <c>AspNetUsers</c>.
/// </summary>
public static class IdentityPasswordBootstrapper
{
    public static async Task RunAsync(WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            return;
        }

        if (!app.Configuration.GetValue("Auth:BootstrapPasswords", false))
        {
            return;
        }

        var superPw = app.Configuration["Auth:Seed:SuperAdminPassword"];
        var staffPw = app.Configuration["Auth:Seed:StaffPassword"];
        var donorPw = app.Configuration["Auth:Seed:DonorPassword"];
        if (string.IsNullOrWhiteSpace(superPw) && string.IsNullOrWhiteSpace(staffPw) && string.IsNullOrWhiteSpace(donorPw))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("IdentityPasswordBootstrap");
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        try
        {
            async Task TryResetAsync(string email, string? password, string label)
            {
                if (string.IsNullOrWhiteSpace(password))
                {
                    return;
                }

                email = email.Trim().ToLowerInvariant();
                var user = await userManager.FindByEmailAsync(email);
                if (user is null)
                {
                    logger.LogDebug("Bootstrap skip: no user for email {Email} ({Label})", email, label);
                    return;
                }

                if (await userManager.IsLockedOutAsync(user))
                {
                    await userManager.SetLockoutEndDateAsync(user, null);
                }

                await userManager.ResetAccessFailedCountAsync(user);

                var token = await userManager.GeneratePasswordResetTokenAsync(user);
                var result = await userManager.ResetPasswordAsync(user, token, password);
                if (result.Succeeded)
                {
                    logger.LogInformation("Bootstrap: password synced for {Email} ({Label})", email, label);
                }
                else
                {
                    logger.LogWarning(
                        "Bootstrap: could not reset {Email} ({Label}): {Errors}",
                        email,
                        label,
                        string.Join("; ", result.Errors.Select(e => e.Description)));
                }
            }

            var config = app.Configuration;
            var superEmail = config["Auth:Seed:SuperAdminEmail"]?.Trim().ToLowerInvariant() ?? "julie.hernando@lighthouse.intex";
            await TryResetAsync(superEmail, superPw, "SuperAdmin");

            for (var sh = 1; sh <= 9; sh++)
            {
                for (var slot = 1; slot <= 2; slot++)
                {
                    var email = $"sh{sh:D2}.staff{slot}@lighthouse.intex";
                    await TryResetAsync(email, staffPw, $"staff {sh:D2}-{slot}");
                }
            }

            if (!string.IsNullOrWhiteSpace(donorPw))
            {
                var donors = await userManager.GetUsersInRoleAsync(IntexRoles.Donor);
                foreach (var user in donors)
                {
                    if (!string.IsNullOrWhiteSpace(user.Email))
                    {
                        await TryResetAsync(user.Email, donorPw, "donor");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Identity password bootstrap failed (e.g. DB connectivity).");
        }
    }
}
