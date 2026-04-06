# INTEX Frontend Architecture and UX Blueprint

## 1. Final Product Understanding
INTEX is a serious nonprofit web application with two connected experiences: a public-facing website that builds trust and support, and a protected operations platform that helps staff manage sensitive case data, donor activity, facility operations, reporting, and ML-assisted decision support.

It serves four user contexts:
- Public visitors who need to understand the mission, see impact, and donate
- Donor users who need transparency into their giving and its outcomes
- Admin/staff users who need a calm, efficient local-facility operations workspace
- Super admins who need cross-facility oversight, governance, and permission control

The frontend is successful when:
- the public side feels credible, modern, and mission-driven
- the admin side feels like a real professional system, not a school prototype
- workflows are easy to understand and easy to demo
- dashboards surface the right information without clutter
- donor, resident, and operational stories connect clearly
- ML appears as a meaningful product capability inside real workflows

Backend and API alignment constraints that must remain fixed:
- no `/api` prefix
- public impact routes are under `/public/*`
- auth routes are under `/auth/*`
- root route families must align to the current .NET 10 controller structure:
  - `supporters`
  - `donations`
  - `safehouses`
  - `partners`
  - `partner-assignments`
  - `social-media-posts`
  - `public-impact-snapshots`
  - `residents`
  - nested resident and donation child resources
- donation child resources currently include:
  - `donations/{donationId}/allocations`
  - `donations/{donationId}/in-kind-items`
- resident child resources currently include:
  - `case-conferences`
  - `home-visitations`
  - `process-recordings`
  - `education-records`
  - `health-wellbeing-records`
  - `incident-reports`
  - `intervention-plans`
- safehouse child resources currently include:
  - `safehouses/{safehouseId}/monthly-metrics`
- public impact endpoints now return real aggregate and summary data from Postgres, so the public dashboard should be planned as a first-class live-data surface rather than a placeholder
- the backend currently exposes many GET list/detail routes backed by EF entities, while most mutation endpoints remain stub-like; the frontend plan should reflect that read surfaces are more ready than write flows
- frontend must treat backend authorization as the real security boundary
- frontend must not access Supabase directly
- frontend should assume a .NET 10 controller-based REST API, not a BFF or GraphQL layer

## 2. Final Information Architecture by Role

### Public
- **Top-level navigation:** Home, Impact, Programs, About, Donate, Login
- **Subpages and purpose:**
  - Home: mission, credibility, and top conversion entry
  - Impact: aggregated public outcomes and donation relevance from live `/public/*` endpoints
  - Programs: explain service areas and how support helps
  - About: organization story, trust signals, model, and vision
  - Donate: public donation flow
  - Login: authenticated entry point
  - Privacy Policy: legal/compliance visibility
  - Cookie Preferences: transparent consent management

### Donor
- **Top-level navigation:** Overview, Giving History, Impact of Giving, Profile
- **Subpages and purpose:**
  - Overview: donor home, recent giving summary, key next actions
  - Giving History: personal donation history and filters
  - Donation Detail: one donation with allocation and impact context
  - Impact of Giving: donor-friendly explanation of what giving supports
  - Donate Again: authenticated giving entry if enabled
  - Profile: contact and donor preferences
  - Account/Security: session and identity support

### Admin/Staff
- **Top-level navigation:** Dashboard, Caseload, Residents, Recordings, Visits, Conferences, Donors, Contributions, Safehouses, Partners, Reports, Outreach
- **Subpages and purpose:**
  - Dashboard: operational command center
  - Caseload: resident inventory and filtering
  - Resident Detail: central case workspace
  - Process Recordings: counseling documentation
  - Home Visitations: visit logging and follow-up
  - Case Conferences: upcoming and historical case conferences
  - Donors: supporter management
  - Contributions: donation operations, allocations, in-kind tracking
  - Safehouses: facility status and monthly metrics
  - Partners: partner tracking and partner-assignment visibility
  - Reports: operational, impact, and program reporting
  - Outreach: social media and published impact snapshot visibility

### Super Admin
- **Top-level navigation:** Global Dashboard, Facilities, Users, Roles & Permissions, Access Policies, Global Reports, Audit
- **Subpages and purpose:**
  - Global Dashboard: org-wide performance and oversight
  - Facilities: cross-facility visibility and administration
  - Users: user directory and access assignment
  - Roles & Permissions: permission structure and assignment
  - Access Policies: facility access rules and elevated permissions
  - Global Reports: comparison and trend reporting across facilities
  - Audit: sensitive changes and oversight review

## 3. Full Page Inventory

| Route | User Role | Page Purpose | Main UI Sections | Primary Actions | Required States |
|---|---|---|---|---|---|
| `/` | Public | Introduce org and convert support | Hero, trust proof, programs, impact preview, CTA footer | Donate, learn more, login | loading, image fallback |
| `/impact` | Public | Public impact transparency | KPI band, donation summary, safehouse summaries, impact narrative | Explore metrics, donate | loading, empty, error |
| `/programs` | Public | Explain service areas | Program sections, outcomes, supporting visuals | Donate, contact | loading, error |
| `/about` | Public | Establish credibility | Story, mission, model, trust cues | Donate, login | loading, error |
| `/donate` | Public/Donor | Donation flow | donation form, donor info, summary, trust messaging | Submit donation | loading, validation error, success, server error |
| `/login` | Public | User authentication | login form, password guidance, support links | Sign in | loading, validation error, auth error, success |
| `/privacy` | Public | Privacy disclosure | policy sections, contact, update date | Open cookie settings | loading |
| `/cookies` | Public | Consent management | categories, descriptions, controls | Save preferences | loading, success |
| `/app` | Authenticated | Role-based redirect/entry | session resolver, route resolver | Continue | loading, unauthorized |
| `/app/account` | Authenticated | Shared account page | profile summary, preferences, session info | Edit, logout | loading, error, success |
| `/app/account/security` | Authenticated | Security/session support | session details, sign-out controls, auth help | Sign out | loading, error, success |
| `/app/forbidden` | Authenticated | Access denied state | explanation, next steps | Go back, go home | static |
| `/app/donor` | Donor | Donor dashboard | summary metrics, recent activity, impact snippet | View history, donate again | loading, empty, error |
| `/app/donor/history` | Donor | Donation history list | filters, table/list, totals | Filter, open detail | loading, empty, error |
| `/app/donor/history/:donationId` | Donor | Donation detail | donation summary, allocations, in-kind items, impact context | Return, print/share if needed | loading, error, unauthorized |
| `/app/donor/impact` | Donor | Giving impact | aggregate outcomes, explanations, timeline/context | Explore, donate again | loading, empty, error |
| `/app/donor/profile` | Donor | Self-service profile | contact form, preferences, account summary | Save updates | loading, validation error, success, server error |
| `/app/donor/donate` | Donor | Authenticated donation flow | donation form, saved donor data, summary | Submit donation | loading, validation error, success, server error |
| `/app/admin` | Admin/Staff | Local facility dashboard | KPI row, alert panel, recent activity, quick links, ML summaries | Drill in, open task | loading, empty, error |
| `/app/admin/caseload` | Admin/Staff | Resident inventory | search, filters, resident table/list, quick stats | Open resident, create resident | loading, empty, error |
| `/app/admin/residents/:residentId` | Admin/Staff | Resident workspace | summary header, status ribbon, tabs, action panel | Edit, update status, open submodule | loading, error, unauthorized, success |
| `/app/admin/residents/:residentId/process-recordings` | Admin/Staff | Counseling records | timeline/list, filters, entry composer | Create/edit record | loading, empty, error, success |
| `/app/admin/residents/:residentId/home-visitations` | Admin/Staff | Visit workflow | visit history, follow-ups, safety flags | Log visit, update follow-up | loading, empty, error, success |
| `/app/admin/residents/:residentId/case-conferences` | Admin/Staff | Conference tracking | upcoming section, history table, decisions/next steps | Add/update conference | loading, empty, error, success |
| `/app/admin/residents/:residentId/education-records` | Admin/Staff | Education tracking | records list, progress snapshots | Add/update record | loading, empty, error |
| `/app/admin/residents/:residentId/health-wellbeing-records` | Admin/Staff | Health tracking | record list, score summaries, trends | Add/update record | loading, empty, error |
| `/app/admin/residents/:residentId/incident-reports` | Admin/Staff | Incident workflow | incident list, severity/status indicators | Add/update incident | loading, empty, error |
| `/app/admin/residents/:residentId/intervention-plans` | Admin/Staff | Plan management | active plans, due dates, statuses | Add/update plan | loading, empty, error |
| `/app/admin/donors` | Admin/Staff | Supporter management | search/filter, supporter table, segments | Create/edit supporter | loading, empty, error, success |
| `/app/admin/contributions` | Admin/Staff | Donation operations | donation table, allocation summary, in-kind preview | Create/edit donation, open detail | loading, empty, error |
| `/app/admin/contributions/:donationId` | Admin/Staff | Donation detail | donation metadata, allocations, in-kind items | Edit, add allocation/item | loading, error, success |
| `/app/admin/safehouses` | Admin/Staff | Facility records | safehouse list/cards, status, occupancy | Open safehouse | loading, empty, error |
| `/app/admin/safehouses/:safehouseId` | Admin/Staff | Facility detail | facility summary, monthly metrics, notes | Edit if allowed, inspect metrics | loading, error |
| `/app/admin/partners` | Admin/Staff | Partner relationships | partner table, type/status filters, assignment summary | Create/edit partner, inspect assignment | loading, empty, error |
| `/app/admin/reports` | Admin/Staff | Reporting hub | filters, summary modules, report sections | Change filters, export/print if supported | loading, empty, error |
| `/app/admin/outreach` | Admin/Staff | Outreach analytics | campaign filters, post table, engagement metrics, impact snapshot panels | Inspect trends | loading, empty, error |
| `/app/super-admin` | Super Admin | Global dashboard | global KPI row, facility comparison, access alerts | Drill in | loading, empty, error |
| `/app/super-admin/facilities` | Super Admin | Facility oversight | facility table, health/status indicators | Edit/open facility | loading, empty, error |
| `/app/super-admin/users` | Super Admin | User directory | user table, role chips, facility scope columns | Create/invite/edit user | loading, empty, error, success |
| `/app/super-admin/roles` | Super Admin | Permission assignment | role templates, assignment table, matrix/detail panel | Assign/revoke role | loading, empty, error, success |
| `/app/super-admin/access-policies` | Super Admin | Scope rules | policy list, facility rules, elevated access controls | Update policy | loading, empty, error, success |
| `/app/super-admin/reports` | Super Admin | Cross-facility reporting | filters, comparisons, summary dashboards | Drill down/export | loading, empty, error |
| `/app/super-admin/audit` | Super Admin | Trust and monitoring | audit feed, filters, action detail | Filter, inspect | loading, empty, error |

## 4. Route Map

### Public Routes — `PublicLayout`
- `/`
- `/impact`
- `/programs`
- `/about`
- `/donate`
- `/login`
- `/privacy`
- `/cookies`

### Authenticated Shared Routes — `AppLayout`
- `/app`
- `/app/account`
- `/app/account/security`
- `/app/forbidden`

### Donor Routes — `DonorLayout`
- `/app/donor`
- `/app/donor/history`
- `/app/donor/history/:donationId`
- `/app/donor/impact`
- `/app/donor/profile`
- `/app/donor/donate`

### Admin Routes — `AdminLayout`
- `/app/admin`
- `/app/admin/caseload`
- `/app/admin/residents/:residentId`
- `/app/admin/residents/:residentId/process-recordings`
- `/app/admin/residents/:residentId/home-visitations`
- `/app/admin/residents/:residentId/case-conferences`
- `/app/admin/residents/:residentId/education-records`
- `/app/admin/residents/:residentId/health-wellbeing-records`
- `/app/admin/residents/:residentId/incident-reports`
- `/app/admin/residents/:residentId/intervention-plans`
- `/app/admin/donors`
- `/app/admin/contributions`
- `/app/admin/contributions/:donationId`
- `/app/admin/safehouses`
- `/app/admin/safehouses/:safehouseId`
- `/app/admin/partners`
- `/app/admin/reports`
- `/app/admin/outreach`

### Super Admin Routes — `SuperAdminLayout`
- `/app/super-admin`
- `/app/super-admin/facilities`
- `/app/super-admin/users`
- `/app/super-admin/roles`
- `/app/super-admin/access-policies`
- `/app/super-admin/reports`
- `/app/super-admin/audit`

## 5. Layout Strategy

### Public Layout
- Top nav with strong brand presence, minimal links, and prominent `Donate` and `Login`
- Footer with privacy, cookies, and trust/compliance links
- Home page uses a full-bleed hero
- Secondary public pages use a restrained hero/header band
- Filters appear only where useful, especially on `/impact`
- Because `/public/impact`, `/public/impact/safehouses`, and `/public/impact/donation-summary` are live aggregate endpoints, the impact page should feel like a polished data story, not static marketing content
- Mobile uses a slide-in nav drawer and sticky donate CTA

### Authenticated Admin/Staff Layout
- Left sidebar is the main navigation
- Top bar includes current facility context, alerts, and account menu
- Breadcrumbs appear on deeper pages
- Each page header includes title, supporting context, and right-aligned primary actions
- Filters live directly below the page header on list, analytics, and reporting pages
- Mobile collapses sidebar into a drawer and uses sticky or overflow action patterns

### Donor Layout
- Simpler shell than admin
- Prefer top navigation or a light side nav with `Overview`, `History`, `Impact`, and `Profile`
- Tone is more personal and trust-focused, less operational
- Page headers should feel clear and calm, not dashboard-heavy
- Donation detail pages should visibly incorporate allocations and in-kind items because those route families are now real backend resources
- Mobile uses a compact drawer or tab-style nav

### Super Admin Layout
- Same visual family as admin for consistency
- Persistent global scope context in header
- Sidebar emphasizes governance, users, facilities, and reports
- Filters are especially important at the top of list and report pages
- Dangerous actions should be visually separated and require explicit confirmation

### Shared Layout Rules
- Primary actions belong at the top-right of the page header on desktop
- Filters belong below the page header, above the data surface
- Secondary actions live in row menus, section actions, or detail side panels
- All layouts should maintain consistent spacing, page width discipline, and heading hierarchy

## 6. UX Strategy by Module

### Public Site
- Priorities: trust, clarity, story, conversion
- Layout: fewer sections, stronger hierarchy, real visual anchor
- Avoid: generic SaaS cards, heavy corporate language, too many stats at once

### Impact Dashboard
- Priorities: transparency, readability, donation relevance
- Layout: KPI strip sourced from `/public/impact`, donation-type summary section sourced from `/public/impact/donation-summary`, and safehouse summary section sourced from `/public/impact/safehouses`
- Avoid: clutter, chart noise, public-facing operational detail
- Important update: the impact dashboard can now be planned around concrete aggregate metrics rather than mocked-only storytelling

### Donor Portal
- Priorities: reassurance, transparency, easy repeat giving
- Layout: summary first, history second, impact context third
- Donation detail should show allocations and in-kind items together because the backend exposes both resource families
- Avoid: admin-style density, confusing financial language, unclear allocation logic

### Admin Dashboard
- Priorities: actionability, clarity, urgency management
- Layout: top actionable metrics, alerts/recent activity, then secondary trends
- Avoid: card mosaics, repeated numbers, weak hierarchy

### Caseload Inventory
- Priorities: fast scanning, filtering, discretion
- Layout: strong search/filter bar, structured resident table/list, clear status fields
- Avoid: exposing too much sensitive data in the list, too many columns, weak filters

### Resident Detail
- Priorities: structure, calm, clear next actions
- Layout: summary header, important info first, tabs for submodules, right-side action/context panel
- Because multiple resident subresources now have working GET list/detail endpoints, each subtab should be treated as a real data surface, not a placeholder
- Avoid: giant unstructured forms, buried critical status, inconsistent tabs

### Process Recordings
- Priorities: chronological clarity, quick entry, narrative discipline
- Layout: timeline/list with structured entry drawer or panel
- Avoid: messy freeform note UX, unclear save states

### Home Visitations
- Priorities: follow-up visibility, safety emphasis, visit chronology
- Layout: history table plus pending follow-up section
- Avoid: burying safety concerns or mixing too many unrelated tasks

### Case Conferences
- Priorities: distinction between upcoming and historical conferences, clear decisions and next steps
- Layout: split or tabbed view for upcoming vs history
- Important update: because the backend now auto-verifies `case_conferences` table creation at startup when possible, this module can remain in MVP confidently
- Avoid: treating conferences as an undifferentiated activity log

### Donor/Contributions
- Priorities: clear connection between donor, donation, allocation, and impact
- Layout: separate supporter management from contribution operations, but keep them cross-linked
- Important update: contributions detail should explicitly support nested allocations and in-kind tables as first-class panels
- Avoid: merging everything into one overloaded view

### Safehouses
- Priorities: facility readability, occupancy and status clarity, monthly metrics visibility
- Layout: list + detail with monthly metrics panel and trend-ready summary area
- Important update: because `safehouses/{safehouseId}/monthly-metrics` now exposes list/detail plus CRUD-style stub routes, the safehouse detail page should be treated as a more substantial feature surface
- Avoid: overcomplicated maps or visualizations that do not improve decisions

### Partners
- Priorities: relationship visibility, status clarity, quick maintenance
- Layout: simple searchable table and light detail/edit flow
- Important update: because `partner-assignments` is now a real route family with list/detail and CRUD-style stubs, partner pages should include assignment visibility rather than showing partners in isolation
- Avoid: overbuilding if data is thin

### Reports/Analytics
- Priorities: decision support, filter discipline, accomplishment-report alignment
- Layout: filters first, summary callouts second, charts/tables below
- `public-impact-snapshots` should be treated as an internal reporting input, not only a public-site concern
- Avoid: BI-style dumps with no storytelling or priority structure

### Outreach/Social Media Analytics
- Priorities: post performance, campaign usefulness, donation attribution insight
- Layout: post/campaign table, summary metrics, recommendation area, and published snapshot context where useful
- Important update: because `social-media-posts` now exposes list/detail plus CRUD-style stubs, outreach can be planned as a true internal module rather than optional decoration
- Avoid: vanity social metrics with no operational meaning

### Super Admin Permissions
- Priorities: scope transparency, low-error governance, consequence awareness
- Layout: user list + detail panel/page for assignments and scope
- Avoid: hidden inheritance, ambiguous saves, bulk destructive changes without review

### ML Insight Areas
- Priorities: actionability, interpretation, context, caution
- Layout: embedded in relevant modules, never standalone for its own sake
- Avoid: “AI says so” widgets, unexplained scores, overclaiming certainty

## 7. Component System Plan

### UI Primitives
- Button
- IconButton
- TextInput
- SearchInput
- Select
- MultiSelect
- Checkbox
- RadioGroup
- Textarea
- DateInput
- Toggle
- Tabs
- Accordion
- Dialog
- Drawer
- Tooltip
- Badge
- Spinner
- Skeleton
- Toast primitive

### Shared Application Components
- `PageShell`
- `PageHeader`
- `SectionHeader`
- `MetricCard`
- `StatGrid`
- `DataTable`
- `MobileListTable`
- `FilterBar`
- `FilterChipGroup`
- `SearchToolbar`
- `FormSection`
- `TwoColumnFormLayout`
- `DetailSummaryPanel`
- `TimelineList`
- `EmptyState`
- `InlineErrorState`
- `FullPageErrorState`
- `ConfirmationDialog`
- `PermissionGuard`
- `ChartPanel`
- `AlertBanner`
- `ToastManager`

### Feature-Specific Components
- `ResidentHeader`
- `ResidentRiskPanel`
- `ProcessRecordingComposer`
- `VisitFollowUpPanel`
- `ConferenceNextStepsCard`
- `DonationAllocationTable`
- `InKindItemsTable`
- `SupporterSegmentBadge`
- `SafehouseMetricsPanel`
- `PartnerStatusRow`
- `PartnerAssignmentTable`
- `ImpactSummaryBand`
- `ImpactSafehouseGrid`
- `PermissionMatrix`
- `FacilityScopeSwitcher`
- `MlInsightCard`

### Pattern Recommendations
- Page shell: one shared shell system per layout family
- Section header: title, supporting description, optional action slot
- Metric cards: reserved for important KPIs only
- Stat grids: compact, consistent, limited in count
- Tables: one shared table system with row actions and sortable columns
- Filter bars: consistent placement and reset behavior
- Search: one shared interaction pattern
- Tabs: use heavily for resident detail and multi-surface detail pages
- Accordions: use sparingly for mobile density and policy content
- Form layouts: sectioned, readable, 1-column mobile and 2-column desktop
- Modals/drawers: dialogs for confirmations, drawers for record entry/edit
- Status badges: one semantic badge system across the app
- Toasts/alerts: toast for transient success, inline/banner alerts for warnings and failures
- Loading skeletons: should mirror final layout shape
- Empty states: should always suggest a next action
- Error states: should be human-readable and retryable
- Confirmation dialogs: required for delete and other destructive actions
- Permission guards: hide or disable actions with explanatory messaging
- Chart wrappers: include title, summary, legend, and state handling

## 8. Frontend Module / Folder Architecture

```text
src/
  app/
    providers/
    router/
    config/
    bootstrap/
  routes/
    public-routes.tsx
    app-routes.tsx
    donor-routes.tsx
    admin-routes.tsx
    super-admin-routes.tsx
    guards/
  layouts/
    PublicLayout.tsx
    AppLayout.tsx
    DonorLayout.tsx
    AdminLayout.tsx
    SuperAdminLayout.tsx
  pages/
    public/
    donor/
    admin/
    super-admin/
    shared/
  features/
    auth/
    public/
    impact/
    donors/
    donations/
    caseload/
    residents/
    process-recordings/
    home-visitations/
    case-conferences/
    education-records/
    health-records/
    incident-reports/
    intervention-plans/
    safehouses/
    partners/
    partner-assignments/
    reports/
    outreach/
    ml/
    super-admin/
  components/
    ui/
    app/
  hooks/
    shared/
  api/
    client/
    auth/
    public/
    supporters/
    donations/
    donation-allocations/
    in-kind-items/
    residents/
    safehouses/
    safehouse-monthly-metrics/
    partners/
    partner-assignments/
    social-media-posts/
    public-impact-snapshots/
    types/
  auth/
    session/
    guards/
    roles/
  permissions/
    policy-map.ts
    permission-helpers.ts
  types/
    domain/
    api/
    ui/
  utils/
    formatting/
    dates/
    urls/
    errors/
  styles/
    tokens.css
    globals.css
    charts.css
```

Practical decisions:
- Keep route definitions centralized
- Keep feature logic inside feature folders
- Keep shared UI separate from shared app-specific components
- Organize API clients by backend route family
- Split nested route families into separate API modules where they represent distinct data surfaces
- Page files should orchestrate features, not hold all logic inline

## 9. Data Fetching and State Strategy
- Auth state: small centralized session provider/store for current user, role, facility scope, and auth status
- Server state: TanStack Query
- Local UI state: `useState` or reducer for view-local interactions only
- Form state: React Hook Form plus typed validation schema
- Table/filter state: prefer URL search params for list/reporting pages
- Error handling: parse backend Problem Details into consistent UI states
- Mutation flows: default to pessimistic updates for sensitive records
- Cache invalidation: invalidate list/detail query pairs after successful mutation
- Prefetching: prefetch likely detail views from lists where helpful
- Optimistic updates: only for low-risk local preferences or reversible UI changes, not sensitive case/donation data

Updated backend-readiness implications:
- The frontend can rely more confidently on real list/detail fetches for public impact, supporters, residents, partner assignments, safehouse monthly metrics, social posts, and public impact snapshots
- Create/update/delete UX should still be planned, but implemented carefully because many mutation endpoints remain placeholders
- For MVP demos, prioritize polished read-heavy flows where the API is already meaningfully backed by EF and Postgres

Team realism guidance:
- one typed `apiClient`
- one query key pattern
- one form pattern
- one error parsing strategy
- avoid introducing a heavy global state library unless clearly necessary

## 10. Role and Permission UX Strategy
- Public experience should feel open, simple, and narrative-driven
- Donor experience should feel personal, transparent, and scoped to “my giving”
- Admin experience should feel operational, structured, and facility-aware
- Super admin experience should feel governance-focused, cross-facility, and high-trust

Super-admin user and permission management should work like this:
- user directory shows role, status, and facility scope
- selecting a user opens a detail panel or page showing:
  - assigned role
  - facility access
  - permission groups
  - elevated access warnings where relevant
- dangerous changes require explicit confirmation language
- if backend endpoints are still pending, these pages remain first-class planned surfaces and explicit backend dependencies

Frontend role checks:
- are for navigation and UX clarity
- should hide or disable inaccessible areas
- should never be treated as real security enforcement

## 11. Accessibility and Responsiveness Plan
- Use semantic landmarks: header, nav, main, aside, footer
- Enforce heading hierarchy in page templates
- Ensure every interactive control is keyboard reachable
- Define visible focus states in tokens from the start
- Tables on mobile should convert to stacked cards or expandable rows
- Long forms on mobile should be sectioned and single-column
- Sticky save bars may be used for long mobile forms when needed
- Charts must not rely on color alone and should include summaries and labels
- Accessibility target: 90+ Lighthouse on every major page family
- Accessibility should be built into the component system first, not patched later

## 12. Dashboard Strategy

### Public Impact Dashboard
- Show: donation count, total donation amount, resident count, safehouse count, donation-type summaries, safehouse summaries
- Emphasize: mission impact and credibility
- Do not show: internal operational clutter or identifiable data
- Keep it clean: a small number of meaningful metrics and a few well-chosen visualizations

### Donor Dashboard
- Show: giving summary, recent donations, allocation context, personal impact view
- Emphasize: relevance to the donor
- Do not show: unrelated admin metrics
- Keep it clean: personal clarity first, organization context second

### Admin Dashboard
- Show: active residents, recent donations, upcoming conferences, overdue follow-ups, unresolved concerns
- Emphasize: action and operational awareness
- Do not show: too many passive or duplicate metrics
- Keep it clean: top row for action, middle for activity, lower for trends

### Super Admin Dashboard
- Show: cross-facility comparisons, access/admin alerts, org-wide performance trends, risk concentrations
- Emphasize: governance and organization-wide visibility
- Do not show: local-only clutter with no aggregate value
- Keep it clean: not just a bigger admin dashboard

## 13. ML Integration Plan
Best modules for ML integration:
- Donor/supporter workflows for donor churn
- Resident detail and admin dashboard for resident risk or reintegration readiness
- Outreach analytics for content recommendations and performance insight

Recommended initial ML choice:
- One excellent ML integration is enough for a strong demo
- Best candidates:
  - resident risk, or
  - donor churn

UI placement:
- donor churn inside donor/supporter detail and donor-related admin views
- resident risk inside resident summary and dashboard alerting
- reintegration readiness inside intervention planning and resident progress areas
- outreach recommendations inside outreach analytics summaries

Required interpretation aids:
- clear label such as `Risk`, `Likelihood`, or `Readiness`
- short explanation of why
- top contributing factors
- recommended action or next step
- freshness timestamp or model version context
- caution messaging where appropriate

Predictive vs explanatory distinction:
- predictive = forecast, probability, risk, likelihood
- explanatory = drivers, important factors, observed relationships
- never label both vaguely as “AI insight”

## 14. MVP vs Phase 2

### MVP
- Public site
- Impact dashboard using live `/public/*` data
- Login
- Privacy policy
- Cookie consent
- Donation flow
- Donor portal basics
- Admin dashboard
- Caseload inventory
- Resident detail with core nested modules:
  - process recordings
  - home visitations
  - case conferences
- Donors/supporters
- Contributions with allocations and in-kind items
- Safehouses with monthly metrics visibility
- Reports hub
- Outreach read surfaces if time supports them
- One meaningful ML integration
- Route guards and role-aware layouts

### Phase 2
- Super-admin governance depth if backend readiness lags
- Full partner-management and assignment editing depth
- Richer outreach analytics and public impact snapshot tooling
- Additional resident nested modules if needed beyond MVP depth
- More advanced export/report formatting
- Multiple additional ML integrations
- Audit and monitoring refinement

## 15. Frontend Build Order
1. App foundation: routing, layouts, design tokens, auth/session, API client, query/form setup
2. Public experience: home, impact, privacy, cookies, login, donate
3. Shared authenticated shell and role-aware guards
4. Admin dashboard and caseload inventory
5. Resident detail shell and core nested workflows
6. Donor/supporter and contribution modules
7. Donor portal
8. Safehouses and reports
9. Outreach and partner visibility surfaces
10. Super-admin governance surfaces
11. ML integration surfaces
12. Accessibility, responsiveness, and demo polish pass

## 16. Risks and Watchouts
- Architecture risk: building too many bespoke components instead of one coherent system
- UX risk: admin surfaces becoming cluttered and card-heavy
- Security risk: frontend implying access it does not truly control or surfacing too much sensitive data in list views
- Dependency risk: backend super-admin endpoints and full auth middleware may lag
- Backend mismatch risk: route structure is clear, but `UseAuthentication()` and strong role annotations are still not visible in current backend files
- Mutation-readiness risk: many list/detail endpoints are now real, but several create/update/delete endpoints remain stub-like and should not drive overly ambitious frontend CRUD polish too early
- Reporting risk: reports can turn into shallow charts unless tied to decisions and accomplishment-report logic
- ML risk: unexplained scores will weaken both product quality and IS 455 alignment
- Scope risk: spreading polish evenly across all modules instead of prioritizing the most visible and important flows

## 17. Execution Priorities (Critical for Success)
The frontend should be executed based on perceived product quality, not raw feature count.

Success prioritization should optimize for:
- UI/UX quality
- workflow clarity
- perceived completeness
- strength of demo narrative

### Tier 1: Must Be Excellent
- **Public Landing Page**
  - First impression of the system
  - Must feel credible, modern, calm, and mission-driven
  - Must tell a clear story and drive users toward `Donate` or `Login`

- **Public Impact Dashboard**
  - Must clearly communicate outcomes, impact, and donation relevance
  - Should feel simple, confident, and trustworthy
  - Must avoid clutter, chart overload, and irrelevant internal metrics

- **Admin Dashboard**
  - Must feel like a real operational command center
  - Should emphasize key metrics, alerts, recent activity, and next actions
  - Must immediately communicate usefulness and completeness

- **Caseload Inventory and Resident Detail**
  - This is the core product area and deserves the most UX attention
  - Caseload must be highly scannable and filterable
  - Resident detail must be structured, calm, tabbed cleanly, and surface the most important case information first

- **Donor / Contributions View**
  - Must clearly connect donor, donation, allocation, and impact
  - Should feel organized, understandable, and operationally useful
  - This is a strong “business value” story in the demo and cannot feel secondary

### Tier 2: Must Work Well
- Process recordings
- Home visitations
- Case conferences
- Reports page
- Safehouses view

These areas should be:
- functional
- consistent with the design system
- clean and reliable

They do not need the same polish depth as Tier 1 if time becomes constrained.

### Tier 3: If Time Allows
- Partners module
- Outreach analytics depth
- Super-admin UI depth
- Advanced ML displays
- Audit and governance refinements

These should never come at the expense of Tier 1 quality.

### ML Execution Priority
- Only one excellent ML integration is required for a strong frontend story
- Best choices:
  - resident risk, or
  - donor churn
- That ML surface must include:
  - a clear label
  - a concise explanation of why
  - an obvious action or recommendation
- A single high-quality ML workflow is better than multiple shallow AI widgets

### Demo Narrative Alignment
The frontend should support this exact demo flow:
1. Public site: “this is who we are”
2. Public impact dashboard: “this is what we do”
3. Login: “this is the system”
4. Admin dashboard: “this is the control center”
5. Resident detail: “this is the core workflow”
6. Donor/contributions: “this connects funding to impact”
7. ML insight: “this makes us smarter”

If implementation tradeoffs appear, they should be resolved in favor of making this narrative smooth, polished, and believable.

### Final Rule
- If forced to choose between more features and better UI/UX, choose better UI/UX
- Judges will not inspect every module deeply, but they will immediately notice quality, clarity, and polish on the highest-visibility screens

## Assumptions
- The backend route alignment described above is canonical for frontend planning
- The backend will be extended to fully support auth, authorization, and super-admin capabilities without changing route style
- The frontend remains TypeScript-only and communicates only with the Azure-hosted .NET 10 backend
