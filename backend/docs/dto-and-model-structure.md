# DTO and model structure

## Source of truth

Column names and types match **`schema.sql`** (repo root) and **`backend/lighthouse_csv_v7/*.csv`**. DTO property names are **PascalCase** in C#; JSON to React is **camelCase** by default (`donationType`, `caseControlNo`, …).

## Separation (strict)

| Kind | Purpose | Location | Exposed from API? |
|------|---------|----------|-------------------|
| **Entity** | EF Core table mapping | `Data/Entities/` (example) | **Never** |
| **Request/response DTO** | Stable JSON contract for React | `Contracts/` or `Dtos/` per feature | **Yes** |

Map **snake_case** columns on **entities** only (Fluent API or `[Column]`).

## PostgreSQL → C# (reminder)

- `bigint` / `int8` → `long`
- `numeric` → `decimal`
- `date` → `DateOnly` (recommended)
- `timestamp` → `DateTime` (document UTC vs local)
- `text` → `string`
- `boolean` → `bool`
- `jsonb` → `JsonDocument`, `string`, or a typed POCO for `metric_payload_json`

## Currency and donation semantics

Dataset uses **PHP** for many monetary rows; **non-monetary** types (e.g. **Time**) may leave **`currency_code`** / **`amount`** empty and use **`estimated_value`** + **`impact_unit`**. Validate in **services** by **`donation_type`**.

---

## Supporters (`supporters` — lighthouse_csv_v7)

CSV columns: `supporter_id`, `supporter_type`, `display_name`, `organization_name`, `first_name`, `last_name`, `relationship_type`, `region`, `country`, `email`, `phone`, `status`, `created_at`, `first_donation_date`, `acquisition_channel`.  
After Identity **`ALTER`** (see `schema.sql`): `identity_user_id`, `can_login`.

```csharp
public class SupporterSummaryDto
{
    public long SupporterId { get; set; }
    public string SupporterType { get; set; } = default!;
    public string DisplayName { get; set; } = default!;
    public string? OrganizationName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Email { get; set; }
    public string? Status { get; set; }
}

public class SupporterDetailDto : SupporterSummaryDto
{
    public string? RelationshipType { get; set; }
    public string? Phone { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateOnly? FirstDonationDate { get; set; }
    public string? AcquisitionChannel { get; set; }
    public string? IdentityUserId { get; set; }
    public bool CanLogin { get; set; }
}

public class CreateSupporterDto
{
    [Required, MaxLength(100)]
    public string SupporterType { get; set; } = default!;

    [Required, MaxLength(300)]
    public string DisplayName { get; set; } = default!;

    [MaxLength(300)]
    public string? OrganizationName { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(100)]
    public string? RelationshipType { get; set; }

    [MaxLength(100)]
    public string? Region { get; set; }

    [MaxLength(100)]
    public string? Country { get; set; }

    [EmailAddress, MaxLength(320)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    [MaxLength(100)]
    public string? AcquisitionChannel { get; set; }
}
```

---

## Donations & allocations (`donations`, `donation_allocations`)

**Donations** CSV: `donation_id`, `supporter_id`, `donation_type`, `donation_date`, `is_recurring`, `campaign_name`, `channel_source`, `currency_code`, `amount`, `estimated_value`, `impact_unit`, `notes`, `referral_post_id`.

**Allocations** CSV: `allocation_id`, `donation_id`, `safehouse_id`, `program_area`, `amount_allocated`, `allocation_date`, `allocation_notes`.

```csharp
public class DonationAllocationDto
{
    public long AllocationId { get; set; }
    public long DonationId { get; set; }
    public long SafehouseId { get; set; }
    public string ProgramArea { get; set; } = default!;
    public decimal AmountAllocated { get; set; }
    public DateOnly AllocationDate { get; set; }
    public string? AllocationNotes { get; set; }
}

public class DonationSummaryDto
{
    public long DonationId { get; set; }
    public long SupporterId { get; set; }
    public string DonationType { get; set; } = default!;
    public DateOnly? DonationDate { get; set; }
    public bool IsRecurring { get; set; }
    public string? CampaignName { get; set; }
    public string? ChannelSource { get; set; }
    public string? CurrencyCode { get; set; }
    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }
    public string? ImpactUnit { get; set; }
    public string? Notes { get; set; }
    public long? ReferralPostId { get; set; }
}

public class DonationDetailDto : DonationSummaryDto
{
    public IReadOnlyList<DonationAllocationDto> Allocations { get; set; } = Array.Empty<DonationAllocationDto>();
}

public class CreateDonationAllocationItemDto
{
    [Required]
    public long SafehouseId { get; set; }

    [Required, MaxLength(100)]
    public string ProgramArea { get; set; } = default!;

    [Range(typeof(decimal), "0", "1000000000")]
    public decimal AmountAllocated { get; set; }

    public DateOnly? AllocationDate { get; set; }

    [MaxLength(4000)]
    public string? AllocationNotes { get; set; }
}

public class CreateDonationDto
{
    [Required]
    public long SupporterId { get; set; }

    [Required, MaxLength(100)]
    public string DonationType { get; set; } = default!;

    public DateOnly? DonationDate { get; set; }
    public bool IsRecurring { get; set; }

    [MaxLength(300)]
    public string? CampaignName { get; set; }

    [MaxLength(100)]
    public string? ChannelSource { get; set; }

    [MaxLength(10)]
    public string? CurrencyCode { get; set; }

    public decimal? Amount { get; set; }
    public decimal? EstimatedValue { get; set; }

    [MaxLength(100)]
    public string? ImpactUnit { get; set; }

    [MaxLength(8000)]
    public string? Notes { get; set; }

    public long? ReferralPostId { get; set; }

    public List<CreateDonationAllocationItemDto> Allocations { get; set; } = new();
}
```

---

## Residents (`residents`)

v7 is a full **case-management** row: identifiers, safehouse, demographics, category flags, family flags, admission/reintegration, risk, dates, **`notes_restricted`**. Use **`ResidentDetailDto`** for admin reads; expose a smaller **`ResidentSummaryDto`** for lists.

```csharp
public class ResidentSummaryDto
{
    public long ResidentId { get; set; }
    public string CaseControlNo { get; set; } = default!;
    public string? InternalCode { get; set; }
    public long? SafehouseId { get; set; }
    public string? CaseStatus { get; set; }
    public string? CaseCategory { get; set; }
    public string? CurrentRiskLevel { get; set; }
    public string? AssignedSocialWorker { get; set; }
}

public class ResidentDetailDto
{
    public long ResidentId { get; set; }
    public string CaseControlNo { get; set; } = default!;
    public string? InternalCode { get; set; }
    public long? SafehouseId { get; set; }
    public string? CaseStatus { get; set; }
    public string? Sex { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? BirthStatus { get; set; }
    public string? PlaceOfBirth { get; set; }
    public string? Religion { get; set; }
    public string? CaseCategory { get; set; }
    public bool SubCatOrphaned { get; set; }
    public bool SubCatTrafficked { get; set; }
    public bool SubCatChildLabor { get; set; }
    public bool SubCatPhysicalAbuse { get; set; }
    public bool SubCatSexualAbuse { get; set; }
    public bool SubCatOsaec { get; set; }
    public bool SubCatCicl { get; set; }
    public bool SubCatAtRisk { get; set; }
    public bool SubCatStreetChild { get; set; }
    public bool SubCatChildWithHiv { get; set; }
    public bool IsPwd { get; set; }
    public string? PwdType { get; set; }
    public bool HasSpecialNeeds { get; set; }
    public string? SpecialNeedsDiagnosis { get; set; }
    public bool FamilyIs4ps { get; set; }
    public bool FamilySoloParent { get; set; }
    public bool FamilyIndigenous { get; set; }
    public bool FamilyParentPwd { get; set; }
    public bool FamilyInformalSettler { get; set; }
    public DateOnly? DateOfAdmission { get; set; }
    public string? AgeUponAdmission { get; set; }
    public string? PresentAge { get; set; }
    public string? LengthOfStay { get; set; }
    public string? ReferralSource { get; set; }
    public string? ReferringAgencyPerson { get; set; }
    public DateOnly? DateColbRegistered { get; set; }
    public DateOnly? DateColbObtained { get; set; }
    public string? AssignedSocialWorker { get; set; }
    public string? InitialCaseAssessment { get; set; }
    public DateOnly? DateCaseStudyPrepared { get; set; }
    public string? ReintegrationType { get; set; }
    public string? ReintegrationStatus { get; set; }
    public string? InitialRiskLevel { get; set; }
    public string? CurrentRiskLevel { get; set; }
    public DateOnly? DateEnrolled { get; set; }
    public DateOnly? DateClosed { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? NotesRestricted { get; set; }
}

public class CreateResidentDto
{
    [Required, MaxLength(50)]
    public string CaseControlNo { get; set; } = default!;

    [MaxLength(50)]
    public string? InternalCode { get; set; }

    public long? SafehouseId { get; set; }

    [MaxLength(50)]
    public string? CaseStatus { get; set; }

    // Include additional fields as required for your intake flow — mirror `schema.sql` / CSV.
    public DateOnly? DateOfBirth { get; set; }
    [MaxLength(100)]
    public string? CaseCategory { get; set; }
    [MaxLength(50)]
    public string? AssignedSocialWorker { get; set; }
    [MaxLength(50)]
    public string? CurrentRiskLevel { get; set; }
}
```

(Expand **`CreateResidentDto`** to match every column your intake API allows.)

**JSON naming:** `subCatOrphaned`, `dateColbRegistered`, `notesRestricted`, etc.

---

## Case conferences (`case_conferences` — in `schema.sql`, not v7 CSV)

```csharp
public class CaseConferenceSummaryDto
{
    public long ConferenceId { get; set; }
    public long ResidentId { get; set; }
    public DateOnly ConferenceDate { get; set; }
    public string? ConferenceType { get; set; }
    public DateOnly? NextConferenceDate { get; set; }
}

public class CaseConferenceDetailDto : CaseConferenceSummaryDto
{
    public string? Summary { get; set; }
    public string? DecisionsMade { get; set; }
    public string? NextSteps { get; set; }
    public string? CreatedBy { get; set; }
}

public class CreateCaseConferenceDto
{
    public DateOnly ConferenceDate { get; set; }
    [MaxLength(100)] public string? ConferenceType { get; set; }
    [MaxLength(8000)] public string? Summary { get; set; }
    [MaxLength(8000)] public string? DecisionsMade { get; set; }
    [MaxLength(8000)] public string? NextSteps { get; set; }
    public DateOnly? NextConferenceDate { get; set; }
}
```

(`residentId` from route `residents/{residentId}/case-conferences`, not body, if that is your convention.)

---

## Process recordings (`process_recordings`)

CSV: `recording_id`, `resident_id`, `session_date`, `social_worker`, `session_type`, `session_duration_minutes`, `emotional_state_observed`, `emotional_state_end`, `session_narrative`, `interventions_applied`, `follow_up_actions`, `progress_noted`, `concerns_flagged`, `referral_made`, `notes_restricted`.

```csharp
public class CreateProcessRecordingDto
{
    [Required]
    public DateOnly SessionDate { get; set; }

    [MaxLength(50)]
    public string? SocialWorker { get; set; }

    [MaxLength(100)]
    public string? SessionType { get; set; }

    public int? SessionDurationMinutes { get; set; }

    [MaxLength(100)]
    public string? EmotionalStateObserved { get; set; }

    [MaxLength(100)]
    public string? EmotionalStateEnd { get; set; }

    [MaxLength(8000)]
    public string? SessionNarrative { get; set; }

    [MaxLength(2000)]
    public string? InterventionsApplied { get; set; }

    [MaxLength(2000)]
    public string? FollowUpActions { get; set; }

    public bool ProgressNoted { get; set; }
    public bool ConcernsFlagged { get; set; }
    public bool ReferralMade { get; set; }

    [MaxLength(8000)]
    public string? NotesRestricted { get; set; }
}
```

---

## Home visitations (`home_visitations`)

CSV: `visitation_id`, `resident_id`, `visit_date`, `social_worker`, `visit_type`, `location_visited`, `family_members_present`, `purpose`, `observations`, `family_cooperation_level`, `safety_concerns_noted`, `follow_up_needed`, `follow_up_notes`, `visit_outcome`.

```csharp
public class CreateHomeVisitationDto
{
    [Required]
    public DateOnly VisitDate { get; set; }

    [MaxLength(50)]
    public string? SocialWorker { get; set; }

    [MaxLength(100)]
    public string? VisitType { get; set; }

    [MaxLength(500)]
    public string? LocationVisited { get; set; }

    [MaxLength(2000)]
    public string? FamilyMembersPresent { get; set; }

    [MaxLength(2000)]
    public string? Purpose { get; set; }

    [MaxLength(8000)]
    public string? Observations { get; set; }

    [MaxLength(100)]
    public string? FamilyCooperationLevel { get; set; }

    public bool SafetyConcernsNoted { get; set; }
    public bool FollowUpNeeded { get; set; }

    [MaxLength(4000)]
    public string? FollowUpNotes { get; set; }

    [MaxLength(200)]
    public string? VisitOutcome { get; set; }
}
```

---

## Pagination wrapper

```csharp
public class PagedResult<T>
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
}
```

## Other tables

**`education_records`**, **`health_wellbeing_records`**, **`incident_reports`**, **`intervention_plans`**, **`in_kind_donation_items`**, **`partners`**, **`partner_assignments`**, **`safehouses`**, **`safehouse_monthly_metrics`**, **`social_media_posts`**, **`public_impact_snapshots`** — mirror **`schema.sql`** the same way (Summary/Detail/Create DTOs per feature).

## Mapping

Prefer **explicit mapping** in services so field names stay aligned with **`lighthouse_csv_v7`** and **`schema.sql`**.
