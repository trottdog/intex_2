# Service layer design

Entity and DTO shapes should match **`schema.sql`** (repo root) and **`dto-and-model-structure.md`**.

## Responsibilities

Services sit between **controllers** and **`DbContext`**. They **must**:

- Apply **business rules** (valid splits, **`donation_type`**-specific required fields, `program_area` enums, case status rules).
- Enforce **data-dependent authorization** (donor ↔ **supporter** linkage via **`identity_user_id`**, resident assignment).
- **Map** entities ↔ DTOs.
- Run **transactions** for multi-table writes (e.g. donation + `donation_allocations`).
- Host non-trivial **LINQ** (joins, aggregates for dashboards and **public impact** summaries).

They **must not**:

- Touch **`HttpContext`** directly (pass `userId` / `isAdmin` from controller or inject a small `ICurrentUser` abstraction).
- Return **entities** to controllers for serialization.

## Suggested folder layout

```text
Services/
  Supporters/
    ISupporterService.cs
    SupporterService.cs
  Donations/
    IDonationService.cs
    DonationService.cs
  Safehouses/
    ISafehouseService.cs
    SafehouseService.cs
  Partners/
    IPartnerService.cs
    PartnerService.cs
  Residents/
    IResidentService.cs
    ResidentService.cs
  CaseConferences/
    ICaseConferenceService.cs
    CaseConferenceService.cs
  PublicImpact/
    IPublicImpactService.cs
    PublicImpactService.cs
  Analytics/
    IAnalyticsService.cs
    AnalyticsService.cs
```

Register implementations in **`Program.cs`** as **scoped** (same lifetime as `DbContext`).

## Donor account ↔ supporter record (explicit)

**Requirement:** A donor user must be connected to **historical donations** for grading.

1. On registration (or admin link), set **`supporters.identity_user_id`** = current Identity user id and **`can_login`** = true (columns from **`schema.sql`** `ALTER TABLE supporters` block).
2. **`DonorService` / `SupporterService`**: `GetLinkedSupporterIdAsync(userId)` returns null or the supporter PK.
3. **Donation read endpoints for donors**: always filter by that supporter id; **ignore** a client-supplied supporter id if it does not match the linked row (or do not accept supporter id in URL for “me” views—use `GET api/donors/me/donations` pattern if you add it).

Admin-only flows may create historical rows without a login; when a donor registers later, **link** the existing `supporters` row instead of duplicating.

## Interface shape (sprint-friendly)

```csharp
public interface IDonationService
{
    Task<PagedResult<DonationSummaryDto>> ListAsync(DonationQuery query, CancellationToken ct);
    Task<DonationDetailDto?> GetByIdAsync(long id, CancellationToken ct);
    Task<Result<long>> CreateAsync(CreateDonationDto dto, CancellationToken ct);
    Task<Result> UpdateAsync(long id, UpdateDonationDto dto, CancellationToken ct);
    Task<Result> DeleteAsync(long id, CancellationToken ct);
}
```

Use a small **`Result` / `Result<T>`** type **or** return nullable DTOs + throw **domain exceptions** mapped to **Problem Details**—**one** strategy for the team (`error-handling-and-validation.md`).

## Service examples tied to schema

### `SupporterService` (`supporters`)

- Create/update with uniqueness rules per your columns.
- **Link Identity:** set **`identity_user_id`** and **`can_login`** when creating a donor account or when admin links an existing supporter to a user.
- List/filter for Admin; Donor sees **only** the supporter row matching `User.FindFirst(ClaimTypes.NameIdentifier)`.

### `DonationService` (`donations`, `donation_allocations`, `in_kind_donation_items`)

- Validate **`donation_type`**: monetary rows need **`currency_code`** / **`amount`** as appropriate (**PHP**-centric data); non-monetary may emphasize **`estimated_value`** / **`impact_unit`**—match dataset rules.
- Map fields: **`channel_source`**, **`is_recurring`**, **`campaign_name`**, **`referral_post_id`**.
- **Create donation** with child allocations in one transaction when allocations are provided.
- Validate **`program_area`** against allowed categories when the product requires it.
- Validate **`amount_allocated`** sum vs donation **`amount`** if that is a business rule in your DB.

### `CaseConferenceService` (`case_conferences`)

- List by **`resident_id`** with filters for **past** vs **upcoming** (use `conference_date` and **`next_conference_date`**).
- Admin CUD; no Donor access unless rubric changes.

### `ResidentService` (`residents` + related tables)

- CRUD **`residents`** for Admin using case fields (`case_control_no`, `internal_code`, `safehouse_id`, `case_status`, `date_of_birth`, `case_category`, `assigned_social_worker`, `reintegration_status`, `current_risk_level`, …).
- Nested operations for **`intervention_plans`**, **`education_records`**, **`health_wellbeing_records`**, **`home_visitations`**, **`incident_reports`**, **`process_recordings`**—split into small collaborators if files grow too large.

### `PublicImpactService` (aggregates only)

- Serve **`GET api/public/impact`**, **`…/safehouses`**, **`…/donation-summary`**: query `public_impact_snapshots`, `donations`, `safehouses`, etc., but return **aggregated** DTOs with **no PII** (no resident identifiers, no supporter emails on public routes unless explicitly allowed).

### `SafehouseService` / `PartnerService`

- **`safehouses`**, **`safehouse_monthly_metrics`**, **`partners`**, **`partner_assignments`**.

### `AnalyticsService` (authenticated / Admin)

- Read-only or staff-only detail over **`social_media_posts`** and related internal metrics.

## ML integration (later)

- Add methods such as `GetLatestPredictionForResidentAsync` or `AttachMlScoreAsync` that read/write designated columns or tables.
- Keep **controller** DTOs stable; version model outputs in the DB, not in route names.

## Testing (optional)

If time allows: one **happy path** and one **forbidden** path per critical service; use test doubles or a test database—don’t block the sprint on full coverage.
