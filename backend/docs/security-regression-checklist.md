# Security Regression Checklist

Use this checklist after auth/RBAC changes or before release demos.

## Authentication Session

1. Sign in with known valid credentials and verify `/auth/me` returns `authenticated: true`.
2. Sign out and verify `/auth/me` returns `authenticated: false`.
3. Confirm auth cookie is `HttpOnly` and not exposed to JavaScript.

## Protected API Access

1. Call a protected endpoint without login and verify `401`.
2. Call an admin-only mutation as donor and verify `403` or `404` (based on scope-safe behavior).
3. Call donor route with an unrelated donor resource id and verify access is denied.

## Donor Ownership Rules

1. Donor sees own rows in `/donations` list.
2. Donor cannot retrieve another donor donation by id.
3. Donor cannot read allocations or in-kind items for another donor donation.

## Facility Scope Rules (Admin)

1. Facility admin sees only scoped residents and safehouses.
2. Facility admin donation reads are restricted to donations allocated to scoped safehouses.
3. Facility admin cannot read intentionally global-only resources where restricted by design.

## Super Admin Rules

1. Super admin can access all scoped resources.
2. Super admin can perform admin-only mutations.
3. Super admin access does not regress public anonymous endpoints.

## Public Endpoint Safety

1. `/public/impact*` remains anonymous.
2. Public endpoints return aggregate/safe payloads only.
3. No resident-sensitive data is leaked through public routes.

## Frontend Route Protection

1. Unauthenticated access to `/app/*` redirects to login.
2. Role mismatch shows forbidden state.
3. Login form enforces minimum password length UX constraints.
