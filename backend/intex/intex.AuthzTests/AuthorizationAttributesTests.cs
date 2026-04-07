using System.Reflection;
using intex.Controllers;
using intex.Security;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace intex.AuthzTests;

public class AuthorizationAttributesTests
{
    [Fact]
    public void DonationsController_Uses_DonorOrAdmin_Policy()
    {
        var attr = typeof(DonationsController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attr);
        Assert.Equal(AuthorizationPolicies.DonorOrAdmin, attr!.Policy);
    }

    [Theory]
    [InlineData(nameof(DonationsController.Create))]
    [InlineData(nameof(DonationsController.Update))]
    [InlineData(nameof(DonationsController.Delete))]
    public void DonationsController_Mutations_Use_AdminOnly_Policy(string methodName)
    {
        var method = typeof(DonationsController).GetMethod(methodName);
        Assert.NotNull(method);

        var attr = method!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(attr);
        Assert.Equal(AuthorizationPolicies.AdminOnly, attr!.Policy);
    }

    [Fact]
    public void DonationAllocationsController_Uses_DonorOrAdmin_Policy()
    {
        var attr = typeof(DonationAllocationsController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attr);
        Assert.Equal(AuthorizationPolicies.DonorOrAdmin, attr!.Policy);
    }

    [Fact]
    public void InKindDonationItemsController_Uses_DonorOrAdmin_Policy()
    {
        var attr = typeof(InKindDonationItemsController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(attr);
        Assert.Equal(AuthorizationPolicies.DonorOrAdmin, attr!.Policy);
    }

    [Fact]
    public void PublicImpactController_Allows_Anonymous_Access()
    {
        var attr = typeof(PublicImpactController).GetCustomAttribute<AllowAnonymousAttribute>();

        Assert.NotNull(attr);
    }
}
