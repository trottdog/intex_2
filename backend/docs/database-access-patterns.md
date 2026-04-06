# Database access patterns

## Supabase + PostgreSQL + .NET

- **Supabase** hosts **PostgreSQL**. The **.NET** Web API runs on **Azure** and connects **outbound** to Supabase using the **connection string** (pooling + **SSL required**). Treat the connection string as an **Azure Application setting** in production, not a file checked into git.
- **Row Level Security (RLS)**: Optional for this stack. If **only** the Web API uses the DB user password, **RBAC in the API + parameterized EF** is the realistic sprint default. Revisit RLS if you ever expose the database to other clients with the Supabase anon key.

## Canonical schema (repo root)

**`schema.sql`** at the **repository root** matches **`backend/lighthouse_csv_v7/*.csv`** (columns + inferred Postgres types). DDL only—**no seed**. Use it for EF, OpenAPI, and **frontend** typing.

Also in `schema.sql`: **`case_conferences`** (INTEX addition); FK **`donations.referral_post_id`** → **`social_media_posts`**; trailing **`ALTER TABLE supporters`** adds **`identity_user_id`** / **`can_login`** (not in v7 CSVs). **`intervention_plans.case_conference_date`** remains the single-date field from v7; use **`case_conferences`** for full history.

**Tables in lighthouse_csv_v7:**  
`donation_allocations`, `donations`, `education_records`, `health_wellbeing_records`, `home_visitations`, `in_kind_donation_items`, `incident_reports`, `intervention_plans`, `partner_assignments`, `partners`, `process_recordings`, `public_impact_snapshots`, `residents`, `safehouse_monthly_metrics`, `safehouses`, `social_media_posts`, `supporters`.

Supabase UI may show tables as **UNRESTRICTED**—that is **not** application security. The API must still enforce roles.

## EF Core: database-first reality

Your **data** already matches **lighthouse_csv_v7** / Supabase. Use repo root **`schema.sql`** as the column checklist when scaffolding or hand-writing entities.

1. **Scaffold or hand-map** to existing tables: `dotnet ef dbcontext scaffold …` or Fluent configuration.
2. **Apply migrations only for deltas** not yet in production—for example:
   - `case_conferences` + FK to `residents`
   - `supporters.identity_user_id` / `can_login` (see **`ALTER`** block in `schema.sql`)

Do **not** run the full `schema.sql` blindly against a populated Supabase project if tables already exist; use EF migrations or manual `ALTER` for new pieces only.

## Table: `case_conferences` (add via migration)

| Column | Type | Notes |
|--------|------|--------|
| `conference_id` | `bigint` PK, identity | |
| `resident_id` | `bigint` FK → `residents` | |
| `conference_date` | `date` | |
| `conference_type` | `text` (nullable) | |
| `summary` | `text` (nullable) | |
| `decisions_made` | `text` (nullable) | |
| `next_steps` | `text` (nullable) | |
| `next_conference_date` | `date` (nullable) | **upcoming** conference hint |
| `created_by` | `text` or `varchar` (nullable) | Identity user id or display name per team choice |

Index `resident_id` for list queries. Services enforce **Admin-only** CUD unless rubric says otherwise.

## DbContext-first (default)

- Inject **`ApplicationDbContext`** into **services**, not controllers.
- Use **`DbSet<T>`** per entity; configure snake_case column names in Fluent API to match Postgres.

### Example: `donation_allocations`

| Column (Postgres) | Typical C# type |
|-------------------|-----------------|
| `allocation_id` (int8, PK) | `long` |
| `donation_id` (int8, FK) | `long` |
| `safehouse_id` (int8, FK) | `long` |
| `program_area` (text) | `string` |
| `amount_allocated` (numeric) | `decimal` |
| `allocation_date` (date) | `DateOnly` (or `DateTime` with date-only convention—pick one team-wide) |
| `allocation_notes` (text) | `string?` |

### Example: `donations` (lighthouse_csv_v7)

Columns: **`donation_id`**, **`supporter_id`**, **`donation_type`**, **`donation_date`**, **`is_recurring`**, **`campaign_name`**, **`channel_source`**, **`currency_code`**, **`amount`**, **`estimated_value`**, **`impact_unit`**, **`notes`**, **`referral_post_id`**. See root **`schema.sql`**.

## Queries and projections

- Prefer **`Select`** into DTO shapes for reads (**`AsNoTracking()`** on read-only queries).
- Use **`Include` / `ThenInclude`** when you need a graph and then map in memory—avoid serializing entities directly.

```csharp
// Conceptual: service-layer read
var dto = await _db.Donations
    .AsNoTracking()
    .Where(d => d.DonationId == id)
    .Select(d => new DonationDetailDto
    {
        DonationId = d.DonationId,
        // Map donation_type, channel_source, currency_code, amount, …
        Allocations = d.Allocations.Select(a => new DonationAllocationDto { /* … */ }).ToList()
    })
    .FirstOrDefaultAsync(ct);
```

## Joins and aggregations

- Express joins and **`GroupBy`** aggregations in **LINQ** inside services; project to small read DTOs for dashboards and **`public/impact`** (aggregates only, no PII).
- **Pagination**: `OrderBy` + `Skip` + `Take` on the server before materializing large lists.

## Transactions

Use **`BeginTransactionAsync`** in the **service** when multiple writes must commit together, for example:

- Insert `donations` row and multiple `donation_allocations` rows.
- Create a `resident` and related `case_conferences` / plans in one unit of work.

## Repository pattern (optional)

Use **thin** repositories only if the same complex query is reused or testing boundaries help. Avoid a repository per table full of one-line wrappers for a 4–5 day sprint.

## Anti-patterns

- Raw SQL with string concatenation from user input.
- **`DbContext`** in controllers.
- Returning tracked **entities** from API actions.
- N+1 loads in tight loops without projection strategy.

## Connection strings and environments

- **Development**: Supabase or local Postgres pointing at dev data (user secrets / local env).
- **Production (Azure)**: Supabase connection string in **App Service Configuration** (or Key Vault); **never** commit secrets. The API process reads the same `ConnectionStrings:*` / custom keys your `Program.cs` expects.

Document where the team applies migrations (startup vs CI, or manual `dotnet ef database update` against Supabase) in the main backend README if not duplicated here.

## Errors returned from the API

All error bodies use **RFC 7807 Problem Details**—see `error-handling-and-validation.md`.
