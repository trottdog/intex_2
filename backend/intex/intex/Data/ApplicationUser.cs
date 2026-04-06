using Microsoft.AspNetCore.Identity;

namespace intex.Data;

/// <summary>
/// ASP.NET Identity user; primary key is <see cref="IdentityUser{TKey}.Id"/> (string GUID) and matches <c>supporters.identity_user_id</c> for donors.
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>Display name for UI (e.g. Julie Hernando).</summary>
    public string? FullName { get; set; }
}
