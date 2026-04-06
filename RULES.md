# INTEX FRONTEND RULES — REVISED

## Purpose
This document is the authoritative ruleset for the Vite + React frontend. It aligns the frontend with the current INTEX product plan, frontend architecture blueprint, comprehensive feature list, and course requirements.

This frontend exists to support the requirements and expectations described in:
- IS 401 — Project Management and Systems Design
- IS 413 — Enterprise Application Development
- IS 414 — Security
- IS 455 — Machine Learning

The frontend must always be built in a way that supports those requirements directly while staying realistic about backend readiness and demo priorities.

---

## 1. Required Tech Stack

### Core Frontend Stack
- Framework: React
- Build tool: Vite
- Language: TypeScript only
- Styling: a consistent system-based styling approach across the app
- Routing: client-side routing for public and authenticated experiences
- State management: simple, maintainable patterns only; avoid unnecessary complexity

### Deployment Architecture
- Frontend hosting: Azure
- Backend API hosting: Azure-hosted .NET 10 API
- Operational database: PostgreSQL
- Machine learning service: backend-mediated ML integration only

### Integration Model
The frontend must never talk directly to the database.
The frontend should communicate through the approved application API boundary.

Preferred pattern:
- Frontend → Azure-hosted .NET backend API → PostgreSQL / identity / ML service

The frontend must not bypass backend security boundaries unless explicitly approved.
The frontend must not access Supabase directly.
The frontend should assume a controller-based REST API, not a BFF or GraphQL layer.

---

## 2. Frontend Mission

The frontend must do these things well:
1. Present a modern, credible, mission-driven public nonprofit website
2. Provide secure authenticated experiences for donor, staff, admin, and super-admin users
3. Support efficient operational workflows for sensitive resident and donation data
4. Surface analytics and machine learning outputs in a clear, useful, non-gimmicky way
5. Meet accessibility, responsiveness, and security expectations required by INTEX
6. Support a polished, convincing final demo

---

## 3. Non-Negotiable Frontend Principles

### Rule 1: TypeScript only
- All components, hooks, utilities, pages, and API clients must use TypeScript
- Avoid `any` wherever possible
- Shared interfaces and types must be centralized when reused

### Rule 2: Frontend is not the source of truth for business logic
- Business rules, permissions, validation enforcement, and data integrity live in the backend
- Frontend may provide UX-level validation, but backend validation is mandatory

### Rule 3: Sensitive data must be minimized in the UI
- Only show data necessary for the current user and task
- Never overexpose resident-sensitive fields
- Restrict sensitive views based on authenticated role and backend authorization

### Rule 4: UI must prioritize clarity over cleverness
- This app serves a serious nonprofit workflow
- Layouts must be calm, readable, organized, and fast to understand
- Avoid clutter, novelty patterns, decorative complexity, and AI-slop dashboards

### Rule 5: Build for judges and real users
- The app must demo well
- Important workflows must be obvious and polished
- The frontend must visually communicate credibility, safety, professionalism, and impact

### Rule 6: Prefer product quality over raw feature count
- If forced to choose between more features and better UI/UX, choose better UI/UX
- The highest-visibility screens must receive the most polish

---

## 4. Supported User Roles

The frontend should be planned around these user contexts:
- Public visitor
- Donor user
- Staff user
- Admin user
- Super Admin user

### Role intent
- **Public**: non-authenticated, narrative and trust-building experience
- **Donor**: authenticated, personal giving visibility and donor-specific impact
- **Staff**: operational case-management and workflow user
- **Admin**: operational management user with create, update, and limited delete authority where allowed
- **Super Admin**: cross-facility governance, access control, reporting, and oversight

### Important security rule
Frontend role checks are for navigation and UX clarity only.
They must never be treated as the true security boundary.
Real authorization must be enforced by the backend.

---

## 5. Frontend Feature Scope

The frontend must support all required views and flows tied to project requirements, while recognizing that some backend route families are more ready for reads than for writes.

### Public Experience
Must include:
- Landing page
- Public impact dashboard
- Programs page if included in the chosen public IA
- About page if included in the chosen public IA
- Login page
- Privacy policy page
- Cookie consent experience
- Public donation flow

### Authenticated Shared Experience
Must include:
- Session-aware entry / role-based redirect
- Shared account/profile area
- Forbidden / unauthorized state

### Donor Experience
Must include:
- Donor overview/dashboard
- Donation or giving history
- Donation detail with allocation context where supported
- Impact of giving view
- Profile/account area
- Authenticated donate-again flow if implemented

### Admin / Staff Experience
Must include:
- Admin dashboard
- Donors / supporters management
- Contributions / donation operations
- Caseload inventory
- Resident profile / case workspace
- Process recording workflows
- Home visitation workflows
- Case conference workflows
- Reports and analytics views
- Safehouse visibility

### Additional Operational Modules
May include based on time and backend readiness:
- Education records
- Health and wellbeing records
- Incident reports
- Intervention plans
- Partners
- Outreach / social analytics
- Public impact snapshot administration

### Super Admin Experience
Should include, at minimum as planned surfaces:
- Global dashboard
- Facilities view
- Users
- Roles and permissions
- Access policies
- Global reports
- Audit / oversight surfaces

### Machine Learning UX
The frontend must have a meaningful place for ML-driven outputs such as:
- predictions
- risk scores
- donor insights
- explanatory summaries
- feature importance or decision-support indicators

ML must appear as a useful product feature inside a real workflow, not as a disconnected notebook result.

---

## 6. MVP and Phase Boundaries

### MVP priorities
The MVP should prioritize:
- Public site
- Public impact dashboard using live public aggregate data
- Login
- Privacy policy
- Cookie consent
- Donation flow
- Donor portal basics
- Admin dashboard
- Caseload inventory
- Resident detail with core nested workflows:
  - process recordings
  - home visitations
  - case conferences
- Donors / supporters
- Contributions with allocations and in-kind visibility where supported
- Safehouses with monthly metrics visibility
- Reports hub
- Route guards and role-aware layouts
- One meaningful ML integration

### Phase 2 priorities
Phase 2 may include:
- Deeper super-admin governance workflows
- Full partner-management editing depth
- Richer outreach analytics
- Additional resident nested modules beyond MVP depth
- Advanced audit tooling
- Multiple ML integrations
- Rich export/report formatting

### ML scope rule
For frontend scope, one excellent ML workflow is enough for MVP.
Additional ML pipelines may exist for IS 455, but they are not required to all become equally deep frontend features.

---

## 7. Readiness and CRUD Rules

The frontend must stay aligned with backend reality.

### Read-heavy planning rule
Where the backend already provides meaningful list/detail endpoints, the frontend should treat those surfaces as real, polished product areas.

### Mutation realism rule
Where create/update/delete endpoints are incomplete, stub-like, or delayed:
- the frontend may still plan the UX surface
- but implementation effort should be calibrated realistically
- the team should not overinvest in polished CRUD flows that the backend cannot support reliably

### Practical CRUD strategy
- Prioritize polished real read flows first
- Prioritize a small number of real create/update workflows that can be demonstrated end-to-end
- Use clearly limited or phased write support for secondary modules if backend readiness lags
- Never imply that destructive or sensitive operations work if they do not actually work

### Destructive action rule
Delete actions must require explicit confirmation.
Sensitive edits should provide clear intent and feedback.

---

## 8. Information Architecture Rules

The frontend must be organized around clear user experiences.

### Public navigation should prioritize
- Home
- Impact
- Programs if included
- About if included
- Donate
- Login
- Privacy

### Donor navigation should prioritize
- Overview
- Giving history
- Impact of giving
- Profile/account

### Admin / Staff navigation should prioritize
- Dashboard
- Caseload
- Residents
- Process Recordings
- Home Visitations
- Case Conferences
- Donors
- Contributions
- Safehouses
- Reports
- Outreach if included
- Partners if included

### Super Admin navigation should prioritize
- Global Dashboard
- Facilities
- Users
- Roles & Permissions
- Access Policies
- Global Reports
- Audit

### Layout expectations
- One shared public layout
- One shared authenticated app layout
- Specialized donor, admin, and super-admin layout shells where useful
- Common page header pattern
- Common filter and table pattern
- Common card and metrics pattern
- Common empty-state and error-state pattern

---

## 9. Public vs Donor Impact Rules

These surfaces must not be treated as the same thing.

### Public impact
- aggregated
- anonymized
- trust-building
- mission-facing
- appropriate for non-authenticated users

### Donor impact
- scoped to the donor experience
- more personal and contribution-aware
- may reference donation history, allocations, and giving context
- should feel reassuring and transparent, not operational

The frontend should avoid duplicating the same exact dashboard for both audiences.

---

## 10. Page Rules

### Public pages
Public pages must:
- feel modern and credible
- communicate mission clearly
- provide strong calls to action
- avoid exposing sensitive internal information
- load cleanly on desktop and mobile

### Authenticated pages
Authenticated pages must:
- clearly indicate user context
- support task-based workflows
- prioritize scanability and speed
- present tables, filters, and forms in a clean structured way
- handle loading, empty, success, validation, auth, and error states gracefully

### Dashboard pages
Dashboards must:
- highlight the most meaningful metrics first
- avoid visual clutter
- use charts only when they improve comprehension
- clearly separate operational metrics, impact metrics, and ML insights

### Form pages
Forms must:
- validate inputs clearly
- use sectioning for long forms
- preserve progress where reasonable
- make destructive actions obvious and confirmable
- support serious admin workflows without confusion

---

## 11. Component Rules

### Component design
- Build small reusable components
- Separate page-level orchestration from reusable UI pieces
- Prefer composition over duplication

### Required reusable UI patterns
- Page shell
- Page header
- Section header
- Metric card
- Data table
- Mobile-friendly list/table alternative
- Filter bar
- Search input
- Form field components
- Status badge
- Empty state
- Inline error state
- Full-page error state
- Loading state / skeleton
- Confirmation dialog or modal
- Drawer where appropriate

### Component behavior
- Components must be predictable and accessible
- Props must be typed
- Avoid giant multi-purpose components
- Reuse patterns consistently across modules

---

## 12. State Management Rules

- Keep state management as simple as possible
- Local state for local UI behavior
- Shared state only where needed
- Server data should be handled through a clear API data-fetching pattern
- Do not scatter fetch logic randomly across the codebase
- Centralize API access and request handling

Preferred approach:
- typed API client layer
- feature-oriented hooks for data fetching and mutation
- one clear query-key pattern
- one clear error-handling pattern
- one consistent form pattern

---

## 13. API Integration Rules

### General API rules
- All frontend requests must go through a typed API client layer
- Never hardcode secrets in the frontend
- Never hardcode production URLs throughout components
- Use environment variables for base URLs and environment configuration
- Align route usage with the backend’s current route families
- **Public impact snapshots:** `GET /public-impact-snapshots` returns the EF entity (e.g. `summaryText`, `isPublished`) — not the mock-only fields `residentsServed` / `reintegrationRate`. Normalize in one place (`lib/impactSnapshots.ts`) so tables do not assume a single JSON shape

### Authentication integration
- Frontend must support secure login/logout flow
- Frontend must respect session/auth state (including a loading state while `/auth/me` is checked)
- Protected routes must block unauthorized users
- UI role checks are for UX only, not true security
- Real authorization must be enforced by the backend
- The backend uses ASP.NET Core Identity with an HTTP-only cookie (`Intex.Auth`). The frontend must call `/auth/login`, `/auth/me`, and `/auth/logout` using `fetch` with `credentials: 'include'` so the cookie is sent on same-site or configured cross-origin requests
- In local development, the Vite dev server should proxy `/api` to the API origin so auth requests share the correct host/port behavior; do not embed API passwords or User Secrets in the frontend bundle
- API role names `SuperAdmin`, `Admin`, and `Donor` map to the UI’s `super-admin`, `admin`, and `donor` experiences; `/auth/me` may return `supporterId` (donor linkage) and `safehouseIds` (staff scope) for display and routing context

### Error handling
Every API interaction must account for:
- loading state
- success state
- empty state
- validation error state
- auth error state
- server failure state

### Data mutation rules
For create/update/delete flows:
- confirm destructive actions
- show success or failure feedback
- update visible state consistently
- never silently fail

---

## 14. Security Rules

These are mandatory and must stay aligned with IS 414.

### Frontend security behavior
- Frontend must only use HTTPS endpoints in production
- Frontend must work correctly behind HTTP → HTTPS redirect behavior
- Frontend must respect authenticated and role-protected routes
- Frontend must not expose secrets, keys, or credentials
- Frontend must integrate privacy policy and cookie consent clearly
- Frontend must support secure login UX with strong password expectations
- Frontend must clearly separate public and protected experiences

### Cookie and privacy rules
- Privacy policy must be accessible from the public site footer at minimum
- Cookie consent must be visible and understandable
- If cookie consent is functional, UI must reflect actual behavior honestly
- Do not misrepresent privacy or consent behavior in the UI

### CSP-aware frontend rules
Because CSP headers are required:
- avoid frontend patterns that depend on unsafe-inline scripts
- avoid unnecessary third-party scripts
- minimize third-party assets unless required
- all external asset dependencies must be intentional and documented

### Input safety rules
- Treat all user-entered content as untrusted
- Do not render unsanitized HTML unless there is an approved safe path
- Avoid dangerous rendering patterns
- Encode and safely display data received from APIs

### Destructive action rules
- Delete actions must require confirmation
- Sensitive edits should provide clear intent and feedback

---

## 15. Accessibility Rules

Accessibility is mandatory.
The frontend must be built to support at least a 90 Lighthouse accessibility score on every major page family.

### Required accessibility behaviors
- semantic HTML first
- keyboard-accessible navigation and controls
- visible focus states
- sufficient color contrast
- accessible form labels
- descriptive button text
- proper heading hierarchy
- alt text for meaningful images
- charts and dashboards must not rely on color alone
- tables must remain usable on smaller screens

### Accessibility mindset
Accessibility is not a finishing step.
It must be designed into every page and reusable component from the beginning.

---

## 16. Responsive Design Rules

The frontend must work well on both desktop and mobile.

### Responsive expectations
- no page should break on small screens
- navigation must adapt cleanly
- tables should remain usable on smaller screens
- forms must remain readable and completable on mobile
- dashboard cards and sections must stack cleanly
- spacing and typography must remain calm and readable
- long forms should become single-column on mobile

### Design priority
Primary working context is desktop operational use, but all pages must still function appropriately on mobile because responsiveness is an explicit project requirement.

---

## 17. Design System Rules

### Visual direction
The design should feel:
- trustworthy
- calm
- modern
- mission-driven
- professional
- not corporate-cold
- not cluttered

### UI expectations
- consistent spacing scale
- consistent typography hierarchy
- consistent card styling
- consistent button hierarchy
- consistent status colors and badge patterns
- restrained use of color
- charts that are clean and purposeful

### Avoid
- AI-slop looking dashboards
- overdesigned layouts
- excessive gradients or visual noise
- mismatched page patterns
- too many competing calls to action
- card mosaics with weak hierarchy

---

## 18. Folder and Architecture Rules

The frontend should be organized for clarity and maintainability.

Recommended structure:
- app/
- routes/
- layouts/
- pages/
- features/
- components/
- hooks/
- api/
- auth/
- permissions/
- types/
- utils/
- styles/

### Architecture expectations
- feature-driven where appropriate
- shared UI separated from feature-specific logic
- route definitions centralized
- API client separated from UI
- page files should compose features, not hold all logic inline
- nested backend route families may be represented by separate API modules where needed

### Current repository layout (frontend)

The Vite app lives under `frontend/src/`. As of this revision, it aligns with the intent above as follows:

| Area | Location |
|------|----------|
| Session / role mapping (`/auth/me` → UI roles) | `app/session.tsx` |
| Auth API (`fetch` + `credentials: 'include'`) | `lib/authApi.ts` |
| Shared API fetch (`fetchJson`, `useApiResource`, `credentials: 'include'`) | `lib/api.ts` |
| Impact snapshot API vs mock row shape (reports / outreach) | `lib/impactSnapshots.ts`, `types/publicImpactSnapshot.ts` |
| Reusable UI (tables, layout primitives) | `components/` |
| Mock CSV-backed data for demos | `data/mockData.ts` |
| Client routing and pages | `App.tsx` (route table and page components; further split into `pages/` is optional tech debt) |

---

## 19. Data Display Rules

### Resident and case data
- prioritize readability and discretion
- use sectioning for long detail views
- highlight the most actionable case information first
- keep highly sensitive notes carefully controlled
- do not overload list views with sensitive detail

### Donor and contribution data
- emphasize trends, history, allocations, and impact
- make contribution relationships understandable
- support filtering and search cleanly
- use one consistent naming approach across the app

### Naming rule for donation domain
Use **Contributions** as the umbrella operational term when referring collectively to:
- monetary donations
- in-kind contributions
- time contributions
- skills contributions
- social advocacy contributions

The UI may still use **Donation** where specifically referring to an individual donation record or donor-facing giving context.

### Analytics data
- show only metrics that help decision-making
- do not overload charts
- summarize key takeaways visually where possible

### ML data
- predictions must include context
- risk outputs should not appear magical or unexplained
- where possible, pair predictions with reason indicators or feature importance summaries
- include recommended next steps where appropriate

---

## 20. Machine Learning Integration Rules

The frontend must support ML as part of a full pipeline, not as an isolated add-on.

### Frontend ML requirements
- provide a meaningful place to view model outputs
- show model results in support of a business decision
- make outputs understandable to non-technical users
- support prediction workflows or dashboard-based insight workflows
- distinguish clearly between prediction and explanation when appropriate

### Good examples
- donor churn risk shown in donor-related admin views
- resident risk or readiness shown in resident workflows
- outreach recommendation or performance insight shown in outreach dashboards

### Not acceptable
- a hidden ML result with no workflow connection
- a notebook screenshot presented as the product
- unexplained model scores with no actionability
- multiple shallow AI widgets that weaken clarity

### MVP ML rule
A single excellent ML integration is better than multiple shallow ones.
For MVP, prioritize one strong workflow such as:
- donor churn insight, or
- resident risk / readiness insight

---

## 21. Frontend Quality Standards

Before a feature is considered done, it must satisfy all of the following where applicable:
- typed with TypeScript
- connected to real or realistic API data
- handles loading, error, and empty states
- responsive on desktop and mobile
- accessible by default
- aligned with layout and component patterns
- secure in behavior
- visually consistent with the rest of the app
- honest about what is actually functional

---

## 22. Demo Readiness Rules

Because the project is judged partly through demo and presentation, the frontend must prioritize demo clarity.

### Demo-critical expectations
- home page looks polished
- public impact dashboard looks intentional and trustworthy
- login flow works cleanly
- admin dashboard visibly communicates value quickly
- caseload inventory and resident workflow are easy to follow
- donors / contributions workflow is understandable
- protected routes clearly work
- one meaningful ML integration is easy to explain

### Demo priorities if time is limited
1. landing page
2. public impact dashboard
3. login and auth flow
4. admin dashboard
5. caseload inventory and resident workflow
6. donors and contributions workflow
7. reports / analytics
8. ML feature display

### Demo narrative alignment
The frontend should support this story:
1. this is who we are
2. this is what we do
3. this is the system
4. this is the control center
5. this is the core workflow
6. this connects funding to impact
7. this makes us smarter

---

## 23. Definition of Done for Frontend Work

A frontend task is not done unless:
- the UI is implemented
- the interaction works
- the API integration works or is correctly mocked for the current phase
- the state handling is reliable
- the role visibility is correct
- the design matches system patterns
- the page works on desktop and mobile
- accessibility basics are satisfied
- no obvious security rule is violated
- the feature does not conflict with the current architecture blueprint or agreed feature scope

---

## 24. Final Decision Rule

When making frontend decisions, always choose the option that best supports:
1. clarity for the user
2. security for sensitive data
3. alignment with IS 413 requirements
4. compliance with IS 414 requirements
5. meaningful ML integration from IS 455
6. consistency with the frontend blueprint and comprehensive feature list
7. a polished, convincing final demo

If a frontend decision improves aesthetics but weakens security, accessibility, responsiveness, workflow clarity, or required functionality, it is the wrong decision.

