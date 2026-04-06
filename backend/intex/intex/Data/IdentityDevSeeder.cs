using System.Linq;
using intex.Data.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace intex.Data;

/// <summary>
/// Idempotent seed for Identity users/roles and supporter linkage (runs when <c>Auth:Seed:Enabled</c> is true, defaulting to Development).
/// </summary>
public static class IdentityDevSeeder
{
    public static async Task SeedAsync(WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        var config = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("IdentityDevSeeder");

        var db = services.GetRequiredService<ApplicationDbContext>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var scopeFactory = services.GetRequiredService<IServiceScopeFactory>();

        try
        {
            await EnsureRolesAsync(roleManager);
            await SeedSuperAdminAsync(config, userManager, logger, scopeFactory);
            await SeedStaffAdminsAsync(config, db, userManager, logger, scopeFactory);
            await SeedDonorSubsetAsync(config, db, userManager, logger, scopeFactory);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Identity dev seed failed. Ensure migrations are applied and seed passwords are configured.");
        }
    }

    private static async Task EnsureRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        foreach (var role in IntexRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    /// <summary>
    /// PgBouncer transaction pooling can invalidate the Npgsql connector between Identity operations.
    /// Role assignment runs in a new DI scope so it uses a fresh connection.
    /// </summary>
    private static async Task EnsureUserInRoleInNewScopeAsync(
        IServiceScopeFactory scopeFactory,
        string userId,
        string roleName,
        ILogger logger)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var um = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var user = await um.FindByIdAsync(userId);
            if (user is null)
            {
                logger.LogWarning("EnsureUserInRole: user {UserId} not found.", userId);
                return;
            }

            if (await um.IsInRoleAsync(user, roleName))
            {
                return;
            }

            var result = await um.AddToRoleAsync(user, roleName);
            if (!result.Succeeded)
            {
                logger.LogWarning(
                    "Could not add user {UserId} to role {Role}: {Errors}",
                    userId,
                    roleName,
                    string.Join("; ", result.Errors.Select(e => e.Description)));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "EnsureUserInRole failed for user {UserId} role {Role}.", userId, roleName);
        }
    }

    private static async Task SeedSuperAdminAsync(
        IConfiguration config,
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        IServiceScopeFactory scopeFactory)
    {
        var password = config["Auth:Seed:SuperAdminPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("Skipping SuperAdmin seed because Auth:Seed:SuperAdminPassword is not configured.");
            return;
        }

        const string defaultUserName = "julie.hernando";
        var email = config["Auth:Seed:SuperAdminEmail"]?.Trim().ToLowerInvariant() ?? "julie.hernando@lighthouse.intex";
        var fullName = config["Auth:Seed:SuperAdminFullName"]?.Trim() ?? "Julie Hernando";
        var userName = config["Auth:Seed:SuperAdminUserName"]?.Trim() ?? defaultUserName;

        var user = await FindByUserNameOrEmailAsync(userManager, userName, email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = userName,
                Email = email,
                EmailConfirmed = true,
                FullName = fullName
            };

            var create = await userManager.CreateAsync(user, password);
            if (!create.Succeeded)
            {
                logger.LogWarning(
                    "Could not seed SuperAdmin user {UserName}: {Errors}",
                    userName,
                    string.Join("; ", create.Errors.Select(e => e.Description)));
                return;
            }
        }
        else
        {
            user.FullName = fullName;
            user.Email ??= email;
            user.UserName ??= userName;
            await userManager.UpdateAsync(user);
        }

        await EnsureUserInRoleInNewScopeAsync(scopeFactory, user.Id, IntexRoles.SuperAdmin, logger);
    }

    private static async Task SeedStaffAdminsAsync(
        IConfiguration config,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        IServiceScopeFactory scopeFactory)
    {
        var password = config["Auth:Seed:StaffPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("Skipping staff admin seed because Auth:Seed:StaffPassword is not configured.");
            return;
        }

        var safehouseIds = await db.Safehouses.AsNoTracking()
            .OrderBy(s => s.SafehouseId)
            .Select(s => s.SafehouseId)
            .Take(9)
            .ToListAsync();

        if (safehouseIds.Count == 0)
        {
            logger.LogInformation("Skipping staff admin seed because no safehouses are available.");
            return;
        }

        foreach (var safehouseId in safehouseIds)
        {
            for (var slot = 1; slot <= 2; slot++)
            {
                var userName = $"sh{safehouseId:D2}_staff{slot}";
                var email = $"sh{safehouseId:D2}.staff{slot}@lighthouse.intex";
                var fullName = $"Safehouse {safehouseId:D2} Staff {slot}";

                var user = await FindByUserNameOrEmailAsync(userManager, userName, email);
                if (user is null)
                {
                    user = new ApplicationUser
                    {
                        UserName = userName,
                        Email = email,
                        EmailConfirmed = true,
                        FullName = fullName
                    };

                    var create = await userManager.CreateAsync(user, password);
                    if (!create.Succeeded)
                    {
                        logger.LogWarning(
                            "Could not seed staff user {UserName}: {Errors}",
                            userName,
                            string.Join("; ", create.Errors.Select(e => e.Description)));
                        continue;
                    }
                }
                else
                {
                    user.FullName = fullName;
                    await userManager.UpdateAsync(user);
                }

                await EnsureUserInRoleInNewScopeAsync(scopeFactory, user.Id, IntexRoles.Admin, logger);

                var hasAssignment = await db.StaffSafehouseAssignments
                    .AnyAsync(x => x.UserId == user.Id && x.SafehouseId == safehouseId);
                if (!hasAssignment)
                {
                    db.StaffSafehouseAssignments.Add(new StaffSafehouseAssignment
                    {
                        UserId = user.Id,
                        SafehouseId = safehouseId
                    });
                }
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedDonorSubsetAsync(
        IConfiguration config,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        IServiceScopeFactory scopeFactory)
    {
        var password = config["Auth:Seed:DonorPassword"];
        if (string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("Skipping donor seed because Auth:Seed:DonorPassword is not configured.");
            return;
        }

        var donorCount = config.GetValue<int?>("Auth:Seed:DonorCount") ?? 20;
        if (donorCount <= 0)
        {
            return;
        }

        // Take supporters with unique non-empty emails, no existing link.
        var supporters = await db.Supporters
            .Where(s => s.Email != null && s.Email != "")
            .OrderBy(s => s.SupporterId)
            .ToListAsync();

        var selected = supporters
            .GroupBy(s => s.Email!.Trim().ToLowerInvariant())
            .Select(g => g.First())
            .Take(donorCount)
            .ToList();

        foreach (var supporter in selected)
        {
            var email = supporter.Email!.Trim().ToLowerInvariant();
            var userName = $"donor_{supporter.SupporterId}";
            var fullName = string.IsNullOrWhiteSpace(supporter.DisplayName)
                ? $"Donor {supporter.SupporterId}"
                : supporter.DisplayName.Trim();

            ApplicationUser? user = null;
            if (!string.IsNullOrWhiteSpace(supporter.IdentityUserId))
            {
                user = await userManager.FindByIdAsync(supporter.IdentityUserId);
            }

            user ??= await FindByUserNameOrEmailAsync(userManager, userName, email);

            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = userName,
                    Email = email,
                    EmailConfirmed = true,
                    FullName = fullName
                };

                var create = await userManager.CreateAsync(user, password);
                if (!create.Succeeded)
                {
                    logger.LogWarning(
                        "Could not seed donor user for supporter {SupporterId}: {Errors}",
                        supporter.SupporterId,
                        string.Join("; ", create.Errors.Select(e => e.Description)));
                    continue;
                }
            }
            else
            {
                user.FullName = fullName;
                await userManager.UpdateAsync(user);
            }

            await EnsureUserInRoleInNewScopeAsync(scopeFactory, user.Id, IntexRoles.Donor, logger);

            supporter.IdentityUserId = user.Id;
            supporter.CanLogin = true;
        }

        await db.SaveChangesAsync();
    }

    private static async Task<ApplicationUser?> FindByUserNameOrEmailAsync(
        UserManager<ApplicationUser> userManager,
        string userName,
        string email)
    {
        var byName = await userManager.FindByNameAsync(userName);
        if (byName is not null)
        {
            return byName;
        }

        var byEmail = await userManager.FindByEmailAsync(email);
        return byEmail;
    }
}
