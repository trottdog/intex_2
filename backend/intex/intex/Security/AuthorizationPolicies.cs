namespace intex.Security;

public static class AuthorizationPolicies
{
    public const string DonorOnly = nameof(DonorOnly);
    public const string DonorOrAdmin = nameof(DonorOrAdmin);
    public const string AdminOnly = nameof(AdminOnly);
}