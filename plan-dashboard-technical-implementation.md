# Dashboard Technical Implementation Plan

## Purpose

This plan defines the dashboards that should exist in the platform, what each dashboard must communicate, how the dashboards should interact with one another, and how to implement them technically.

It is based on the broader product direction of turning the platform into a **decision-support system**, not just a CRUD app or analytics portal. The dashboards should help users answer:

- What changed?
- What matters now?
- What needs attention?
- What should I do next?

This plan aligns with the quality pivot direction in the uploaded project plan. fileciteturn0file0

---

## 1. Dashboard Architecture Principles

Every dashboard should include four layers:

1. **Summary KPIs**
   - Fast understanding of current state
   - Totals, counts, rates, recent changes

2. **Trend / movement**
   - How the state is changing over time
   - Upward or downward direction
   - Short-term vs long-term view where useful

3. **Exceptions / attention items**
   - Outliers
   - High-risk entities
   - Stale, incomplete, or concerning records

4. **Actions / drilldowns**
   - Clear next click
   - Links into the workflow where the user can respond

### Global design rules

- No dashboard should only display charts without suggesting what matters.
- Every visual should answer a concrete business question.
- Public dashboards must use anonymized, aggregated data only.
- Internal dashboards may use sensitive data, but only under role-based access control.
- Dashboards should progressively drill down:
  - Executive overview -> list view -> detail page -> action form

---

## 2. Dashboard Inventory

The platform should have **six primary dashboards** and **one shared cross-dashboard layer**.

### Primary dashboards

1. **Public Impact Dashboard**
2. **Admin / Operations Dashboard**
3. **Donor Intelligence Dashboard**
4. **Resident / Caseload Dashboard**
5. **Care Activity Dashboard**
6. **Outreach & Social Performance Dashboard**

### Shared cross-dashboard layer

7. **Action Center**
   - Not a standalone isolated page only
   - A shared service and UI pattern embedded in multiple internal dashboards

---

## 3. Dashboard Definitions

## 3.1 Public Impact Dashboard

### Audience
- Public visitors
- Prospective donors
- Existing donors
- Judges / stakeholders during demo

### Purpose
Communicate trust, mission, and measurable impact without exposing sensitive resident information.

### Must convey
- What the organization does
- Where donations go
- What outcomes are improving
- Why the nonprofit is trustworthy
- What action the visitor should take next

### Key components
- Total donations over time
- Donation allocation by program area or safehouse
- High-level impact metrics
- Trend lines of outcomes over time
- Narrative impact highlights
- Calls to action:
  - Donate
  - Learn more
  - Sign in

### Required metrics
- Total donations this month / quarter / year
- Number of people served
- Program distribution of funds
- Change in key support/outcome indicators
- Campaign or initiative highlights

### Data rules
- Aggregated only
- No names
- No case details
- No small-sample slices that could identify individuals

### Outbound interactions
- Donate flow
- Login page
- Optional filtered views of public impact by date range or program area

### Inbound dependencies
- Donations
- Allocation records
- Approved public-facing impact metrics
- Pre-aggregated outcomes data

---

## 3.2 Admin / Operations Dashboard

### Audience
- SuperAdmin
- Admin
- Program leadership

### Purpose
Act as the primary command center for the organization.

### Must convey
- What needs attention now
- Whether operations are improving or degrading
- Where risk is concentrated
- Which workflows are overdue or stalled
- What area the user should open next

### Key components
- KPI summary row
- Action Center
- Donation trend summary
- Resident risk/progress summary
- Upcoming case conferences / follow-ups
- Safehouse comparison snapshot
- Data quality / stale-record alerts

### Required metrics
- Active residents
- Open follow-up items
- Upcoming case conferences
- Donations this week / month
- At-risk donors count
- Residents needing review
- Incomplete or stale care records
- Safehouse health indicators

### Outbound interactions
- Donor dashboard
- Resident dashboard
- Care activity dashboard
- Reports pages
- Specific detail pages from action cards

### Inbound dependencies
- Donor scoring service
- Resident scoring service
- Visitations / case conferences
- Process recordings
- Donation facts
- Data quality checks

---

## 3.3 Donor Intelligence Dashboard

### Audience
- Fundraising staff
- Admin
- Leadership

### Purpose
Turn donor data into fundraising decisions.

### Must convey
- Which donors are most valuable
- Which donors are at risk of lapsing
- Which donors may be ready for upgrade / outreach
- Which campaigns and channels produce strong results
- What next outreach action should be considered

### Key components
- Donor portfolio KPIs
- Churn risk distribution
- Upgrade potential distribution
- Top donors and high-priority donors
- Recency / frequency / donation trend charts
- Allocation and impact linkage
- Campaign/channel performance summary

### Required metrics
- Donors added over time
- Active vs lapsed donors
- Recurring vs one-time donors
- Average gift
- Lifetime value
- Churn risk score / tier
- Upgrade likelihood score / tier
- Campaign attribution
- Conversion source

### Outbound interactions
- Donor list page
- Donor profile
- Outreach task creation
- Reports / campaign analytics
- Public impact linkage where appropriate

### Inbound dependencies
- Supporter table
- Donation table
- Campaign or referral source data
- Allocation data
- ML scoring outputs

---

## 3.4 Resident / Caseload Dashboard

### Audience
- Case workers
- Social workers
- Admin
- Leadership with permission

### Purpose
Provide a prioritized view of resident wellbeing, progress, and attention needs.

### Must convey
- Who needs attention now
- Which residents are improving, stalled, or regressing
- Where there are missing records
- Which safehouses or caseload segments show unusual patterns
- Where staff should drill in next

### Key components
- Caseload summary KPIs
- Residents needing attention
- Risk trend chart
- Progress / readiness summary
- Safehouse breakdown
- Missing or stale recording alerts
- Priority resident list

### Required metrics
- Active residents
- Residents needing review
- Average progress score
- Risk distribution
- Reintegration readiness distribution
- Missing process recording count
- Recent home visitation coverage
- Safehouse-level trend comparison

### Outbound interactions
- Resident list
- Resident profile
- Process recording page
- Home visitation page
- Case conference detail
- Care activity dashboard

### Inbound dependencies
- Resident master data
- Process recordings
- Home visitations
- Case conferences
- Reintegration indicators
- Risk / readiness scoring services

---

## 3.5 Care Activity Dashboard

### Audience
- Case workers
- Program managers
- Admin

### Purpose
Summarize care workflow activity and show whether follow-through is happening.

### Must convey
- Volume and cadence of care actions
- Follow-up completion status
- Escalations or unresolved concerns
- Where the care process is breaking down
- Which care workflows need immediate review

### Key components
- Process recording trends
- Home visitation trends
- Case conference schedule and completion
- Open concern / follow-up counts
- Resident concern themes
- Overdue action items

### Required metrics
- Process recordings completed per week
- Home visitations completed / missed
- Case conferences completed / upcoming
- Open follow-up items
- Overdue follow-up items
- Escalated concerns
- Concern theme frequencies

### Outbound interactions
- Resident profile
- Individual process recording timeline
- Home visitation detail
- Case conference task workflow
- Admin dashboard

### Inbound dependencies
- Process recordings
- Home visitations
- Case conference records
- Follow-up tasks
- Optional NLP tagging or thematic classification if implemented

---

## 3.6 Outreach & Social Performance Dashboard

### Audience
- Marketing staff
- Fundraising staff
- Admin
- Leadership

### Purpose
Measure whether outreach activity actually converts into donations and awareness that matters.

### Must convey
- What content performs best
- Which channels convert attention into donations
- Which posts had high engagement but weak conversion
- Which campaigns should be repeated or reconsidered
- What timing or content patterns appear effective

### Key components
- Channel performance KPIs
- Post engagement vs conversion plots
- Campaign funnel summary
- Top converting posts
- High-engagement / low-conversion exceptions
- Timing and content type analysis

### Required metrics
- Impressions, clicks, engagement
- Donor conversions from referral links
- Donation amount by source/channel
- Conversion rate by channel
- Conversion rate by content type
- Time/day performance patterns
- Campaign ROI proxies

### Outbound interactions
- Donor dashboard
- Campaign detail view
- Public impact dashboard for approved highlights
- Admin dashboard

### Inbound dependencies
- Social post data
- Referral / tracking data
- Donation source attribution
- Campaign metadata
- Optional ML conversion model

---

## 3.7 Action Center

### Audience
- Internal users only

### Purpose
Provide a prioritized list of attention items across domains.

### Why it matters
This is the system’s most important differentiator. It turns separate dashboards into one operating model.

### Types of action cards
- Donor likely to lapse
- Donor likely ready for upgrade
- Resident risk increased
- Resident missing recent care update
- Safehouse trend deteriorated
- Case conference follow-up overdue
- Social campaign underperforming
- High-performing outreach opportunity identified

### Required card fields
- Action type
- Severity / priority
- Short explanation
- Timestamp
- Entity reference
- Recommended next step
- Click target

### Where it appears
- Admin dashboard
- Donor dashboard
- Resident dashboard
- Optional smaller widget on care dashboard

### Technical note
The Action Center should be implemented as a **shared service**, not hardcoded separately into each page.

---

## 4. How Dashboards Interact With Each Other

The dashboards should not behave like isolated report tabs. They should operate as a connected flow.

## 4.1 Interaction model

### Layer 1: Overview dashboards
- Public Impact Dashboard
- Admin Dashboard
- Donor Dashboard
- Resident Dashboard
- Care Activity Dashboard
- Outreach Dashboard

### Layer 2: Investigative list/detail pages
- Donor list and donor profile
- Resident list and resident profile
- Process recording timeline
- Home visitation detail
- Campaign detail
- Safehouse detail

### Layer 3: Action workflows
- Create note
- Schedule follow-up
- Log visitation
- Open case conference item
- Review resident
- Review donor outreach priority

## 4.2 Cross-dashboard navigation rules

### From Admin Dashboard
The admin user should be able to jump into:
- donor issues
- resident issues
- care workflow issues
- outreach issues

### From Donor Dashboard
The user should be able to move into:
- donor profile
- campaign performance
- allocation / impact context
- action items for outreach

### From Resident Dashboard
The user should be able to move into:
- resident profile
- process recordings
- visitations
- case conferences
- readiness review

### From Outreach Dashboard
The user should be able to move into:
- campaign details
- top converting donor segments
- public impact summaries
- donor acquisition insights

### From Care Dashboard
The user should be able to move into:
- resident details
- overdue follow-up records
- case conference workflows
- escalation workflows

## 4.3 Shared filters

Dashboards should share consistent filtering patterns where applicable:

- Date range
- Safehouse / program area
- Campaign / channel
- Donor segment
- Resident status
- Risk tier
- Attention-needed status

### Filter behavior
- Global filters should be lightweight and role-safe
- Internal dashboards can optionally preserve filter state in query params
- Clicking from one dashboard to another should pass the relevant filter context

Example:
- Clicking a safehouse concern from the Admin Dashboard opens the Resident Dashboard filtered to that safehouse and attention-needed residents.

---

## 5. Technical Data Architecture

## 5.1 Recommended backend shape

Use a layered architecture:

### Source tables
Core operational entities:
- Supporters
- Donations
- DonationAllocations
- Residents
- Safehouses
- ProcessRecordings
- HomeVisitations
- CaseConferences
- FollowUpTasks
- SocialPosts
- ReferralSources / CampaignTracking

### Derived reporting tables or views
Create read-optimized structures:
- `fact_donations`
- `fact_resident_activity`
- `fact_care_workflows`
- `fact_social_performance`
- `dim_date`
- `dim_safehouse`
- `dim_campaign`
- `dim_donor_segment`

### Scoring / insight tables
- `donor_scores`
- `resident_scores`
- `campaign_scores`
- `action_center_items`

### API view models
Expose dashboard-specific DTOs instead of returning raw relational data:
- `AdminDashboardDto`
- `DonorDashboardDto`
- `ResidentDashboardDto`
- `CareDashboardDto`
- `OutreachDashboardDto`
- `PublicImpactDashboardDto`

---

## 5.2 Read model strategy

Do not build dashboards by joining many large tables live in the frontend.

Instead:

- Aggregate on the backend
- Precompute common dashboard summaries
- Use materialized views or scheduled rollups if needed
- Return one API payload per dashboard

### Benefits
- Faster page loads
- Cleaner frontend code
- Easier permission handling
- Easier caching
- More stable chart rendering

---

## 5.3 Suggested API endpoints

### Public
- `GET /api/public/dashboard/impact`
- `GET /api/public/dashboard/impact/trends`
- `GET /api/public/dashboard/impact/allocation`

### Internal
- `GET /api/admin/dashboard`
- `GET /api/donors/dashboard`
- `GET /api/residents/dashboard`
- `GET /api/care/dashboard`
- `GET /api/outreach/dashboard`
- `GET /api/action-center`

### Detail / drilldown
- `GET /api/donors/{id}`
- `GET /api/residents/{id}`
- `GET /api/residents/{id}/timeline`
- `GET /api/campaigns/{id}`
- `GET /api/safehouses/{id}/summary`

### Filters
Endpoints should accept query params such as:
- `startDate`
- `endDate`
- `safehouseId`
- `campaignId`
- `riskTier`
- `segment`
- `attentionOnly=true`

---

## 5.4 DTO example pattern

```csharp
public class AdminDashboardDto
{
    public AdminKpiDto Kpis { get; set; }
    public List<ActionCenterItemDto> ActionItems { get; set; }
    public DonationTrendDto DonationTrend { get; set; }
    public ResidentSummaryDto ResidentSummary { get; set; }
    public List<SafehouseHealthDto> SafehouseHealth { get; set; }
    public List<UpcomingTaskDto> UpcomingTasks { get; set; }
    public DataQualitySummaryDto DataQuality { get; set; }
}
```

---

## 6. Role-Based Access and Privacy

Dashboard visibility should be role-aware.

## 6.1 Public users
Can access:
- Public Impact Dashboard
- Landing page
- Donate flows
- Public reports only

Cannot access:
- Any resident detail
- Any donor detail
- Any internal operations data

## 6.2 Donor / supporter role
Can access:
- Their own donor profile if applicable
- Public impact dashboard
- Donor-specific giving history if implemented

Cannot access:
- Other donors
- Resident data
- Internal care workflows

## 6.3 Staff / admin roles
Can access dashboards based on role:
- Fundraising roles -> donor dashboard, outreach dashboard
- Care roles -> resident dashboard, care dashboard
- SuperAdmin / Admin -> all internal dashboards

## 6.4 Privacy implementation rules
- Public API must query only approved aggregated views
- Internal APIs must enforce row-level or role-level restrictions
- Dashboard cards must not expose sensitive text in places where a broader role can see them
- Explanations in action cards should be concise and safe

Example:
- Good: “Resident risk increased based on recent indicators”
- Avoid: detailed trauma-specific content in summary cards

---

## 7. Frontend Implementation Plan

## 7.1 Dashboard component architecture

Use reusable dashboard building blocks:

- `KpiRow`
- `TrendChartCard`
- `DistributionCard`
- `ActionCenterPanel`
- `AttentionList`
- `ComparisonTable`
- `FilterBar`
- `NarrativeInsightCard`
- `DrilldownLinkCard`

### Page pattern
Each dashboard page should follow this order:

1. Header and filter bar
2. KPI row
3. Primary insight section
4. Action / exception section
5. Supporting charts
6. Drilldown tables / lists

---

## 7.2 State management

Recommended approach:
- React Query or equivalent for server-state fetching
- URL query params for sharable filters
- Per-dashboard hooks:
  - `useAdminDashboard`
  - `useDonorDashboard`
  - `useResidentDashboard`
  - `useCareDashboard`
  - `useOutreachDashboard`

### Why
- Better caching
- Cleaner loading/error states
- Easier data refresh after actions
- Predictable query key handling

---

## 7.3 Loading and error states

Each dashboard needs:
- skeleton loading state
- empty state
- partial failure fallback
- permission denied state

### Example
If social conversion data is unavailable, the Outreach Dashboard should still render engagement summaries and show a clear notice about missing attribution data.

---

## 7.4 Charting guidelines

Charts must be readable and decision-oriented.

Use:
- line charts for trends
- bar charts for comparisons
- stacked bars for allocations
- scatterplots for engagement vs conversion
- tables for prioritized lists

Avoid:
- too many chart types on one screen
- decorative visuals without operational value
- dense legends or hard-to-scan color encodings

---

## 8. Backend Implementation Plan

## Phase 1: Core dashboard contracts
Build the DTOs and placeholder endpoints for:
- Public Impact Dashboard
- Admin Dashboard
- Donor Dashboard
- Resident Dashboard
- Care Dashboard
- Outreach Dashboard
- Action Center

### Deliverable
Frontend can render all dashboard shells from stable API contracts.

---

## Phase 2: Aggregation layer
Implement backend query services:
- `PublicImpactDashboardService`
- `AdminDashboardService`
- `DonorDashboardService`
- `ResidentDashboardService`
- `CareDashboardService`
- `OutreachDashboardService`
- `ActionCenterService`

Each service should:
- read from source tables or reporting views
- apply role-safe filters
- map results into DTOs
- avoid frontend needing multiple round trips

---

## Phase 3: Reporting views and summaries
Create optimized database views or materialized summaries for:
- donation trends
- donor segmentation summaries
- resident activity summaries
- care workflow summaries
- outreach conversion summaries

### Deliverable
Dashboards can load quickly with stable aggregation queries.

---

## Phase 4: Action Center engine
Implement rules-based generation first.

### Suggested first rule set
- donor has not given within expected interval
- donor gift amount trend declining
- resident missing recent care record
- resident risk score exceeds threshold
- case conference follow-up overdue
- safehouse metrics moved negatively beyond threshold
- campaign engagement high but donations low

### Technical design
- scheduled background job creates or updates `action_center_items`
- each item stores:
  - source type
  - entity id
  - severity
  - summary
  - recommended action
  - created date
  - resolved status

### Deliverable
Admin dashboard and role dashboards gain a strong prioritized action layer.

---

## Phase 5: ML integration
After rules-based alerts are stable, integrate ML outputs.

### Donor model
Write to:
- `donor_scores`

Fields:
- `supporter_id`
- `churn_risk_score`
- `churn_risk_tier`
- `upgrade_score`
- `scored_at`

### Resident model
Write to:
- `resident_scores`

Fields:
- `resident_id`
- `attention_score`
- `risk_tier`
- `readiness_score`
- `scored_at`

### Dashboard usage
- Donor Dashboard uses churn risk and upgrade signals
- Resident Dashboard uses attention and readiness signals
- Action Center uses score thresholds to generate items

---

## 9. Recommended Database Objects

## Tables / views to add if missing
- `action_center_items`
- `donor_scores`
- `resident_scores`
- `vw_public_impact_summary`
- `vw_admin_dashboard_summary`
- `vw_donor_dashboard_summary`
- `vw_resident_dashboard_summary`
- `vw_care_dashboard_summary`
- `vw_outreach_dashboard_summary`

## Example: `action_center_items`
Suggested columns:
- `id`
- `action_type`
- `entity_type`
- `entity_id`
- `severity`
- `title`
- `summary`
- `recommended_action`
- `assigned_role`
- `safehouse_id` nullable
- `campaign_id` nullable
- `status`
- `created_at`
- `resolved_at`

---

## 10. Interaction Flows

## 10.1 Admin to resident investigation flow
1. Admin dashboard shows “Residents needing attention: 8”
2. User clicks card
3. Resident dashboard opens filtered to `attentionOnly=true`
4. User selects resident
5. Resident profile opens
6. User opens process recordings or visitation history
7. User logs action or schedules follow-up

## 10.2 Admin to donor retention flow
1. Admin dashboard shows “High-risk donors: 14”
2. User clicks card
3. Donor dashboard opens filtered to `riskTier=High`
4. User selects donor
5. Donor profile shows trend and impact context
6. User creates outreach note / follow-up task

## 10.3 Outreach to fundraising flow
1. Outreach dashboard shows a campaign with high engagement but weak conversion
2. User clicks campaign
3. Campaign detail page opens
4. User reviews timing/content breakdown
5. User compares with donor conversion data
6. Team adjusts outreach strategy

## 10.4 Public trust flow
1. Public visitor opens landing page
2. Visitor clicks Impact
3. Public Impact Dashboard shows high-level results
4. Visitor sees allocation and outcomes summary
5. Visitor clicks Donate or Learn More

---

## 11. Delivery Roadmap

## Sprint 1
- Define dashboard DTOs
- Build dashboard routes and shells
- Implement static or mock data
- Build reusable UI components

## Sprint 2
- Implement Public Impact Dashboard and Admin Dashboard
- Build initial aggregation queries
- Add shared filters and URL state
- Create role-aware routing

## Sprint 3
- Implement Donor Dashboard and Resident Dashboard
- Add drilldown flows to donor and resident detail pages
- Add data-quality and stale-record indicators

## Sprint 4
- Implement Care Dashboard and Outreach Dashboard
- Add campaign and workflow drilldowns
- Add reporting views for performance

## Sprint 5
- Implement Action Center rules engine
- Embed Action Center into admin, donor, and resident dashboards
- Add severity logic and action routing

## Sprint 6
- Integrate ML scoring
- Add donor and resident prediction outputs
- Tune explanations and thresholds
- Improve dashboard performance and demo polish

---

## 12. Acceptance Criteria

A dashboard implementation is complete when:

### Functional
- The page loads with real data
- Filters work
- Role restrictions are enforced
- Clicking priority items leads to a meaningful next page

### Product quality
- The user can identify what matters within 5 to 10 seconds
- The dashboard highlights exceptions, not just totals
- The visuals support action, not decoration

### Technical
- Data is returned from a stable DTO
- The dashboard is not dependent on many frontend joins
- Queries perform acceptably
- Loading, empty, and error states exist

### Privacy
- Public pages expose only approved aggregate data
- Sensitive summaries are safe for the intended role
- No dashboard leaks detail through labels or hover text

---

## 13. Recommended Priority Order

If time is limited, build in this order:

1. **Admin Dashboard**
2. **Action Center**
3. **Resident Dashboard**
4. **Donor Dashboard**
5. **Public Impact Dashboard**
6. **Outreach Dashboard**
7. **Care Dashboard**

### Why this order
- Admin + Action Center creates the strongest differentiator
- Resident and donor dashboards cover the most important mission and fundraising workflows
- Public impact supports trust and presentation quality
- Outreach and care dashboards deepen the system once core decision support is working

---

## 14. Final Technical Recommendation

The dashboards should be implemented as a **connected decision-support system** with:

- shared metrics definitions
- role-aware aggregated APIs
- reusable UI dashboard components
- shared filter conventions
- Action Center as a cross-dashboard service
- phased integration of rules first, then ML

That approach will make the platform feel coherent, scalable, and meaningfully more advanced than a set of disconnected pages or charts.

