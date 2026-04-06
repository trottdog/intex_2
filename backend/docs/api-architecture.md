# API architecture

**Tables and columns:** see repo root **`schema.sql`** (aligned with **`backend/lighthouse_csv_v7`**).

## Controller structure (by domain)

Place controllers under `Controllers/` (or feature folders). Align routes with schema **clusters**, not one controller per table.

| Controller | Base route | Primary tables |
|------------|------------|----------------|
| `AuthController` (or Identity endpoints) | `api/auth` | Identity (users, roles) |
| `PublicImpactController` | `api/public` | Aggregates only (no PII); see **Public impact** below |
| `SupportersController` | `api/supporters` | `supporters` |
| `DonationsController` | `api/donations` | `donations`, `donation_allocations`, `in_kind_donation_items` |
| `SafehousesController` | `api/safehouses` | `safehouses`, `safehouse_monthly_metrics` |
| `PartnersController` | `api/partners` | `partners`, `partner_assignments` |
| `ResidentsController` | `api/residents` | `residents` |
| `ResidentCaseConferencesController` (or nested routes) | `api/residents/{residentId}/case-conferences` | `case_conferences` (**new**; see schema doc) |
| `ResidentInterventionPlansController` (or nested actions) | `api/residents/{residentId}/intervention-plans` | `intervention_plans` |
| Similar nested routes | `…/education-records`, `…/health-wellbeing-records`, `…/home-visitations`, `…/incident-reports`, `…/process-recordings` | matching tables |
| `SocialMediaController` / `AnalyticsController` (Admin/staff) | `api/social-media-posts`, `api/analytics/…` | `social_media_posts`, `public_impact_snapshots` |

Add **Admin-only** controllers only when needed (e.g. bulk import).

## Case conferences (required feature)

Support **history** and **upcoming** conferences per resident. INTEX allows adding tables—use `case_conferences` (see `database-access-patterns.md`).

**Preferred routes** (pick one style; nested keeps resident scoping obvious):

```http
GET    api/residents/{residentId}/case-conferences
GET    api/residents/{residentId}/case-conferences/{conferenceId}
POST   api/residents/{residentId}/case-conferences
PUT    api/residents/{residentId}/case-conferences/{conferenceId}
DELETE api/residents/{residentId}/case-conferences/{conferenceId}
```

Optional alternate: `CaseConferencesController` with `GET api/case-conferences?residentId=` for convenience—still enforce resident-scoped authorization in the **service**.

List endpoint should support filtering **past** vs **upcoming** (e.g. query `upcomingOnly=true` or date range) for the “history and upcoming” UI.

## Public impact dashboard (anonymous)

The donor-facing **public impact** page must work for **non-authenticated** users. Expose **aggregated, non-PII** data only:

```http
GET api/public/impact
GET api/public/impact/safehouses
GET api/public/impact/donation-summary
```

Implement these on `PublicImpactController` with **`[AllowAnonymous]`**. Services must return **summaries** (totals, counts by region/program, time buckets)—no resident names, case numbers, or supporter-identifying fields unless the course explicitly allows it on a public page (default: **no**).

Admin/internal dashboards can use separate authenticated routes under `api/analytics/…` that may join more detail.

## Route patterns

- **Plural** resource names: `api/residents`, `api/donations`.
- **REST-style** verbs:

  - `GET api/residents` — list (`page`, `pageSize`, `sort`, filters as query params).
  - `GET api/residents/{id}` — detail.
  - `POST api/residents` — create.
  - `PUT api/residents/{id}` — full update (or `PATCH` if the team standardizes partial updates).
  - `DELETE api/residents/{id}` — delete (prefer soft-delete if you add flags later).

- **Nested** resources (child always belongs to parent):

  - `GET|POST api/residents/{residentId}/home-visitations`
  - `GET|PUT|DELETE api/residents/{residentId}/home-visitations/{id}`
  - Same pattern for `process-recordings`, `case-conferences`, etc.

Keep nesting **shallow** (two levels: collection + item).

### Donation allocations

Pick **one** pattern and document it in the team README:

- **Preferred**: `GET|POST api/donations/{donationId}/allocations` plus `GET|PUT|DELETE api/donations/{donationId}/allocations/{allocationId}`, **or**
- Flat: `api/donation-allocations` with `donationId` in body for creates.

## Versioning

For INTEX, use a single URL prefix: **`api/`**. Introduce `api/v2/` only after a breaking contract change.

## Organization rules

1. **`[Authorize]`** (role or policy) on every mutating action and on reads that expose PII—except **`[AllowAnonymous]`** where explicitly documented (e.g. `api/public/…`, login).
2. **DTOs** in and out—see `dto-and-model-structure.md`.
3. **Status codes**: 200/201 success, 204 delete-no-body, 400 validation, 401/403 authz, 404 missing, 409 conflict.
4. **Pagination**: `page`, `pageSize` with a hard cap (e.g. 100).
5. **Filtering**: query string only; build **parameterized LINQ** in services—no string-concat SQL from query params in controllers.

## Example endpoints (fundraising)

```http
GET    api/supporters
GET    api/supporters/{id}
POST   api/supporters
PUT    api/supporters/{id}
DELETE api/supporters/{id}

GET    api/donations
GET    api/donations/{id}
POST   api/donations
PUT    api/donations/{id}
DELETE api/donations/{id}

GET    api/donations/{donationId}/allocations
POST   api/donations/{donationId}/allocations
```

## React integration

- **`BaseAddress`**: API URL from configuration—**local**: `https://localhost:7xxx` (Kestrel) or dev tunnel; **production**: the **Azure App Service** (or API Management) HTTPS URL, e.g. `https://yourapp.azurewebsites.net`. Store as a React build env var (e.g. `VITE_API_BASE_URL`) that points at Azure in production builds.
- **JSON**: ASP.NET Core serializes with **camelCase** property names by default—match TypeScript interfaces.
- **Dates**: Prefer **UTC** ISO-8601 in JSON where types are `timestamp`; **`date`** fields may serialize as date-only per serializer settings—document the choice.
- **CORS**: Restrict to React origin(s); if using **cookies**, use explicit origins and `AllowCredentials`—never `*` with credentials.

## OpenAPI

Enable Swashbuckle (Swagger) in Development; document request/response types as DTOs so the frontend can generate or hand-type clients.

## Cross-cutting

- Global exception handler → **RFC 7807 Problem Details** only (`error-handling-and-validation.md`).
- `UseAuthentication` / `UseAuthorization` before mapping controllers.
- HTTPS redirection and HSTS in production.
