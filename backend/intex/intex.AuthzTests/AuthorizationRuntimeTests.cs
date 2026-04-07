using System.Net;
using Xunit;

namespace intex.AuthzTests;

public class AuthorizationRuntimeTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;

    public AuthorizationRuntimeTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ProtectedMutation_Anonymous_Returns401()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsync("/donations", content: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedMutation_Donor_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Donor");

        var response = await client.PostAsync("/donations", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedMutation_Admin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PostAsync("/donations", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task ProtectedMutation_SuperAdmin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "SuperAdmin");

        var response = await client.PostAsync("/donations", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task AllocationsMutation_Donor_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Donor");

        var response = await client.PostAsync("/donations/1/allocations", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AllocationsMutation_Admin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PostAsync("/donations/1/allocations", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task SafehousesMutation_Admin_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PostAsync("/safehouses", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task SafehousesMutation_SuperAdmin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "SuperAdmin");

        var response = await client.PostAsync("/safehouses", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task PartnersMutation_Donor_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Donor");

        var response = await client.PostAsync("/partners", content: null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PartnersMutation_Admin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PostAsync("/partners", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task SafehouseMetricsMutation_Admin_Returns201()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.PostAsync("/safehouses/1/monthly-metrics", content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task AdminUsersEndpoint_Admin_Returns403()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Role", "Admin");

        var response = await client.GetAsync("/admin/users");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
