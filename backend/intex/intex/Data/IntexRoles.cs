namespace intex.Data;

public static class IntexRoles
{
    public const string Donor = nameof(Donor);
    public const string Admin = nameof(Admin);
    public const string SuperAdmin = nameof(SuperAdmin);

    public static IReadOnlyList<string> All { get; } = [Donor, Admin, SuperAdmin];
}
