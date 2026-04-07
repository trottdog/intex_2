# Authorization Endpoint Matrix

This matrix reflects the current backend authorization model after the April 2026 security hardening pass.

## Policies

- `DonorOnly`: donor role only.
- `DonorOrAdmin`: donor, admin, or super-admin.
- `AdminOnly`: admin or super-admin.

## Public + Auth

| Endpoint group | Anonymous | Donor | Admin | SuperAdmin | Notes |
|---|---|---|---|---|---|
| `/public/impact*` | Yes | Yes | Yes | Yes | Explicit `AllowAnonymous`. |
| `/auth/login` | Yes | Yes | Yes | Yes | Entry point for cookie auth. |
| `/auth/me` | Yes | Yes | Yes | Yes | Returns `authenticated:false` if no session. |
| `/auth/logout` | No | Yes | Yes | Yes | Requires authenticated user. |

## Donations Domain

| Endpoint group | Anonymous | Donor | Admin | SuperAdmin | Notes |
|---|---|---|---|---|---|
| `/donations` GET | No | Scoped to own supporter linkage | Yes | Yes | Donor row-level ownership enforced. |
| `/donations/{id}` GET | No | Own donation only | Yes | Yes | Facility-admin scoping also applied. |
| `/donations` POST/PUT/DELETE | No | No | Yes | Yes | `AdminOnly` policy on mutating actions. |
| `/donations/{id}/allocations` GET | No | Own donation only | Yes | Yes | Facility-admin safehouse filtering applied. |
| `/donations/{id}/allocations` POST/PUT/DELETE | No | No | Yes | Yes | `AdminOnly` policy. |
| `/donations/{id}/in-kind-items` GET | No | Own donation only | Yes | Yes | Facility-admin scoping supported. |

## Operational Domain

| Endpoint group | Anonymous | Donor | Admin | SuperAdmin | Notes |
|---|---|---|---|---|---|
| `/supporters` | No | Limited self-read path by identity | Yes | Yes | Admin list + scoped reads in facility mode. |
| `/residents` and nested case routes | No | No | Yes | Yes | Scoped by facility resolver where applicable. |
| `/safehouses` and `/safehouses/*/monthly-metrics` | No | No | Yes | Yes | Safehouse-in-scope checks for facility admins. |
| `/partners` and `/partner-assignments` | No | No | Yes | Yes | Scope-aware filtering for facility admins. |
| `/social-media-posts` | No | No | Yes | Yes | Facility admins intentionally restricted. |
| `/public-impact-snapshots` | No | No | Yes | Yes | Facility admins intentionally restricted. |

## ML Endpoints

| Endpoint group | Anonymous | Donor | Admin | SuperAdmin | Notes |
|---|---|---|---|---|---|
| `/ml/pipelines*` | No | Yes | Yes | Yes | `DonorOrAdmin` policy. |
| `/ml/residents/{residentId}/insights` | No | No | Yes | Yes | Admin-only restriction. |
| `/ml/supporters/{supporterId}/insights` | No | Own supporter only | Yes | Yes | Donor self-scope enforced. |
| `/ml/safehouses/{safehouseId}/insights` | No | No | Yes | Yes | Admin-only restriction with facility safehouse scope checks. |

## Verification References

- Controller policies and attributes are asserted by tests in `backend/intex/intex.AuthzTests/AuthorizationAttributesTests.cs`.
- Runtime HTTP authorization behavior is validated in `backend/intex/intex.AuthzTests/AuthorizationRuntimeTests.cs` via a test host and synthetic role identities (donations, allocations, partners, safehouses, safehouse metrics, and admin-users gates).
