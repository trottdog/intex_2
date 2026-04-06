# Backend overview

## Purpose

The backend is a **.NET 10 Web API** deployed on **Microsoft Azure** (e.g. **Azure App Service** for Linux + .NET 10, or **Azure Container Apps** if you ship a container). It serves a **React** single-page app (front end may be on Azure Static Web Apps, App Service, or elsewhere). **Supabase** hosts **PostgreSQL**; the API is the only component that uses the database connection string and enforces security—Azure hosts the **compute**, not the INTEX relational database.

The backend owns:

- Authentication and authorization (**ASP.NET Identity** with roles **Admin** and **Donor**; **anonymous** users hit only explicit **`[AllowAnonymous]`** public routes such as the impact dashboard).
- Business rules and validation for fundraising (including **PHP-centric monetary** and **non-monetary** donations), safehouse/program data, **resident case management**, **case conferences**, social analytics, and reporting.
- Data access via **EF Core** (Npgsql) to Postgres on Supabase.

**Supabase** = where the data lives. **.NET** = who may read or write it. **React** = HTTP client to the API (no DB credentials in the browser).

## Responsibilities

| Area | Backend owns |
|------|----------------|
| Identity | Sign-in, passwords, roles, claims |
| CRUD | Allowed operations per role on each resource |
| Queries | Filters, pagination, sorting, aggregations for dashboards |
| Validation | Request shape, ranges, required fields, cross-field rules (including **`donation_type`** rules) |
| Errors | Consistent **Problem Details** JSON—see `error-handling-and-validation.md` |

## High-level data flow

1. **React** sends HTTPS requests (JWT in `Authorization` or cookie session—team picks one and documents it in `auth-and-security.md`). Public pages may call **`public/…`** without auth.
2. **API** runs authentication middleware where required; resolves roles **Admin** / **Donor**.
3. **Controller** binds DTOs, authorizes the action, delegates to a **service**, returns DTOs (never raw EF entities).
4. **Service** applies business rules, uses transactions when needed, maps entities ↔ DTOs; **resolves `supporter_id` from Identity** for donor-scoped reads.
5. **DbContext** runs parameterized SQL against **Supabase Postgres** (TLS over the public internet from Azure to Supabase—use SSL-required connection strings).

```text
React  →  HTTPS  →  Azure-hosted ASP.NET Core (Auth, Controllers)
                        ↓
                 Services (business logic)
                        ↓
                 DbContext  →  TLS  →  PostgreSQL (Supabase)
```

## Schema reference

The **repository root** file **`schema.sql`** defines all tables and columns to match **`backend/lighthouse_csv_v7`** (no seed data). Backend, React, and docs should stay aligned with it.

## Domains (aligned with schema)

| Domain | Primary tables |
|--------|----------------|
| Fundraising | `supporters`, `donations`, `donation_allocations`, `in_kind_donation_items` |
| Programs / safehouses | `safehouses`, `safehouse_monthly_metrics`, `partners`, `partner_assignments` |
| Case management | `residents`, **`case_conferences`** (added), `intervention_plans`, `education_records`, `health_wellbeing_records`, `home_visitations`, `incident_reports`, `process_recordings` |
| Comms / impact | `social_media_posts`, `public_impact_snapshots`; **public aggregates** via `public/impact` |

`donation_allocations` links **donations** to **safehouses** and **program_area** (split gifts across sites/programs).

## Architecture (layers)

- **Controllers**: HTTP only—routes, `[Authorize]` / `[AllowAnonymous]`, call services, return `ActionResult<T>` of DTOs.
- **Services**: Business logic, row-level checks, transactions, mapping.
- **Data**: `DbContext`, entities, Fluent API mappings; **database-first baseline** + **migrations for additive INTEX changes** (`database-access-patterns.md`).

## Core principles

1. **Security-first**: Default deny on CUD; explicit policies per endpoint; never trust client-sent role names or arbitrary `supporterId` on donor “my data” routes.
2. **Modular by domain**: Folder/namespace layout matches donors, residents, public impact, analytics—not one giant class.
3. **Simple**: One `ApplicationDbContext`, explicit DTOs, global exception handling → Problem Details.
4. **Stable API contract**: React depends on DTO shapes, not database columns.
5. **ML-ready**: Reserve columns or side tables for model version and scores; services interpret predictions for the API.

## Technology stack

- **Runtime**: .NET 10, ASP.NET Core Web API.
- **Hosting**: **Azure** (typical INTEX path: **App Service** with deployment from GitHub/Azure DevOps; configure **Application settings** for connection strings and JWT secrets).
- **ORM**: EF Core + Npgsql → PostgreSQL on Supabase (SSL required from Azure to Supabase).
- **Frontend consumer**: React (JSON over HTTPS; default serialization **camelCase**); must call the **Azure API base URL** in production.
- **Auth**: ASP.NET Identity.

## Azure deployment notes (practical)

- Set **`ConnectionStrings__Default`** (or your configured key) and **`JWT`** / Identity secrets in **Azure App Service → Configuration → Application settings**, not in `appsettings.Production.json` in git. Optional: **Azure Key Vault** references for production.
- Enable **HTTPS only** on App Service; your public API URL becomes the React app’s **`VITE_API_URL`** (or equivalent).
- **Outbound**: Allow the app to reach Supabase Postgres (default: HTTPS/Npgsql to Supabase host; no special “allow list” unless your org locks down egress).
- **CORS**: In `Program.cs`, allow the **deployed React origin** (and localhost for dev)—see `api-architecture.md` / `auth-and-security.md`.
- **Logging**: Use **Application Insights** if the course expects telemetry; otherwise App Service **Log stream** + structured logs are enough for the sprint.

## Sprint scope note

Real-time features, microservices, and training ML inside this API are out of scope; **integrating prediction reads/writes** later is in scope.

See sibling docs: `api-architecture.md`, `database-access-patterns.md`, `auth-and-security.md`, `service-layer-design.md`, `dto-and-model-structure.md`, `error-handling-and-validation.md`.
