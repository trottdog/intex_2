# API endpoint checklist

Base URL: `http://localhost:5110`  
Last updated: **2026-04-06** — all routes below are wired; **GET** list endpoints read from Postgres via EF when the matching table has rows. An empty table still returns `[]`, which is valid.

## Legend

| Mark | Meaning |
|------|---------|
| **[x]** | Implemented: returns data from DB when present, or expected 2xx for mutators. |

---

## Public & auth

| Done | Method | Path | Notes |
|------|--------|------|--------|
| [x] | GET | `/public/impact` | Aggregates: donation count/sum, resident/safehouse counts |
| [x] | GET | `/public/impact/safehouses` | Safehouse summary rows from DB |
| [x] | GET | `/public/impact/donation-summary` | Donations grouped by `donationType` |
| [x] | POST | `/auth/login` | Stub response (wire Identity when ready) |
| [x] | POST | `/auth/register` | Stub response |

---

## Supporters

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/supporters` |
| [x] | GET | `/supporters/{id}` |
| [x] | POST | `/supporters` |
| [x] | PUT | `/supporters/{id}` |
| [x] | DELETE | `/supporters/{id}` |

---

## Donations (dedicated controllers)

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/donations` |
| [x] | GET | `/donations/{id}` |
| [x] | POST | `/donations` |
| [x] | PUT | `/donations/{id}` |
| [x] | DELETE | `/donations/{id}` |
| [x] | GET | `/donations/{donationId}/allocations` |
| [x] | GET | `/donations/{donationId}/allocations/{allocationId}` |
| [x] | POST | `/donations/{donationId}/allocations` |
| [x] | PUT | `/donations/{donationId}/allocations/{allocationId}` |
| [x] | DELETE | `/donations/{donationId}/allocations/{allocationId}` |
| [x] | GET | `/donations/{donationId}/in-kind-items` |
| [x] | GET | `/donations/{donationId}/in-kind-items/{itemId}` |

---

## Residents & nested resources

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/residents` |
| [x] | GET | `/residents/{id}` |
| [x] | POST | `/residents` |
| [x] | PUT | `/residents/{id}` |
| [x] | DELETE | `/residents/{id}` |
| [x] | GET | `/residents/{residentId}/case-conferences` |
| [x] | GET | `/residents/{residentId}/case-conferences/{conferenceId}` |
| [x] | POST | `/residents/{residentId}/case-conferences` |
| [x] | PUT | `/residents/{residentId}/case-conferences/{conferenceId}` |
| [x] | DELETE | `/residents/{residentId}/case-conferences/{conferenceId}` |
| [x] | GET | `/residents/{residentId}/home-visitations` |
| [x] | GET | `/residents/{residentId}/home-visitations/{visitationId}` |
| [x] | POST | `/residents/{residentId}/home-visitations` |
| [x] | PUT | `/residents/{residentId}/home-visitations/{visitationId}` |
| [x] | DELETE | `/residents/{residentId}/home-visitations/{visitationId}` |
| [x] | GET | `/residents/{residentId}/process-recordings` |
| [x] | GET | `/residents/{residentId}/process-recordings/{recordingId}` |
| [x] | POST | `/residents/{residentId}/process-recordings` |
| [x] | PUT | `/residents/{residentId}/process-recordings/{recordingId}` |
| [x] | DELETE | `/residents/{residentId}/process-recordings/{recordingId}` |
| [x] | GET | `/residents/{residentId}/education-records` |
| [x] | GET | `/residents/{residentId}/education-records/{recordId}` |
| [x] | POST | `/residents/{residentId}/education-records` |
| [x] | PUT | `/residents/{residentId}/education-records/{recordId}` |
| [x] | DELETE | `/residents/{residentId}/education-records/{recordId}` |
| [x] | GET | `/residents/{residentId}/health-wellbeing-records` |
| [x] | GET | `/residents/{residentId}/health-wellbeing-records/{recordId}` |
| [x] | POST | `/residents/{residentId}/health-wellbeing-records` |
| [x] | PUT | `/residents/{residentId}/health-wellbeing-records/{recordId}` |
| [x] | DELETE | `/residents/{residentId}/health-wellbeing-records/{recordId}` |
| [x] | GET | `/residents/{residentId}/incident-reports` |
| [x] | GET | `/residents/{residentId}/incident-reports/{incidentId}` |
| [x] | POST | `/residents/{residentId}/incident-reports` |
| [x] | PUT | `/residents/{residentId}/incident-reports/{incidentId}` |
| [x] | DELETE | `/residents/{residentId}/incident-reports/{incidentId}` |
| [x] | GET | `/residents/{residentId}/intervention-plans` |
| [x] | GET | `/residents/{residentId}/intervention-plans/{planId}` |
| [x] | POST | `/residents/{residentId}/intervention-plans` |
| [x] | PUT | `/residents/{residentId}/intervention-plans/{planId}` |
| [x] | DELETE | `/residents/{residentId}/intervention-plans/{planId}` |

---

## Safehouses & monthly metrics

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/safehouses` |
| [x] | GET | `/safehouses/{id}` |
| [x] | POST | `/safehouses` |
| [x] | PUT | `/safehouses/{id}` |
| [x] | DELETE | `/safehouses/{id}` |
| [x] | GET | `/safehouses/{safehouseId}/monthly-metrics` |
| [x] | GET | `/safehouses/{safehouseId}/monthly-metrics/{metricId}` |
| [x] | POST | `/safehouses/{safehouseId}/monthly-metrics` |
| [x] | PUT | `/safehouses/{safehouseId}/monthly-metrics/{metricId}` |
| [x] | DELETE | `/safehouses/{safehouseId}/monthly-metrics/{metricId}` |

---

## Partners & assignments

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/partners` |
| [x] | GET | `/partners/{id}` |
| [x] | POST | `/partners` |
| [x] | PUT | `/partners/{id}` |
| [x] | DELETE | `/partners/{id}` |
| [x] | GET | `/partner-assignments` |
| [x] | GET | `/partner-assignments/{id}` |
| [x] | POST | `/partner-assignments` |
| [x] | PUT | `/partner-assignments/{id}` |
| [x] | DELETE | `/partner-assignments/{id}` |

---

## Social & impact snapshots

| Done | Method | Path |
|------|--------|------|
| [x] | GET | `/social-media-posts` |
| [x] | GET | `/social-media-posts/{id}` |
| [x] | POST | `/social-media-posts` |
| [x] | PUT | `/social-media-posts/{id}` |
| [x] | DELETE | `/social-media-posts/{id}` |
| [x] | GET | `/public-impact-snapshots` |
| [x] | GET | `/public-impact-snapshots/{id}` |

---

## Implementation notes

- **POST / PUT / DELETE** (except auth): return **201 / 200 / 204** without persisting changes unless you extend handlers — same as earlier stubs, but routing is complete.
- Ensure Supabase has tables from `schema.sql` (including **`case_conferences`**) and seed data where you expect non-empty **GET** arrays.
- **`public_impact_snapshots.metric_payload_json`** is mapped as **jsonb** in `ApplicationDbContext`.
