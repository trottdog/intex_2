# Auth and security

## Authentication flow (React + Azure-hosted .NET + Supabase Postgres)

1. User signs in via **`POST api/auth/login`** (or Identity scaffold endpoints).
2. **ASP.NET Identity** validates credentials (`UserManager` / `SignInManager` or custom handler issuing **JWT**).
3. Server returns a **JWT** (stored in memory or `sessionStorage`—understand XSS risk) **or** sets an **httpOnly** secure cookie. **Pick one** approach for the whole project; document it for React (`fetch` / axios interceptors, CORS, credentials).
4. React includes credentials on each request: `Authorization: Bearer <token>` **or** cookies automatically on same-site requests.
5. Middleware validates token or cookie and builds `ClaimsPrincipal` with roles.
6. **`[Authorize]`** on controllers/actions enforces RBAC. **`[AllowAnonymous]`** marks endpoints that **non-authenticated** users may call (e.g. public impact pages, login).

**Important:** **Supabase** hosts the database only. **Identity** lives in .NET. The React app does **not** need `supabase-js` for login unless you deliberately add Supabase Auth (would duplicate Identity—avoid for this project).

## Roles (simplified)

Use **two** authenticated roles unless your team truly needs more:

| Role | Use |
|------|-----|
| **Admin** | Staff: all sensitive **CUD** on residents, case conferences, visits, process recordings, incidents, donations (as designed), allocations, safehouses, partners, internal analytics. |
| **Donor** | Authenticated supporter: **own** supporter profile, **own donation history and impact** (via Identity → `supporters` link). **No** resident PII or case-management endpoints unless the assignment explicitly allows (default: **deny** all `residents` / child case routes). |

**Anonymous** is **not** a role. It means the user has **no** authenticated Identity principal. Public marketing/impact pages use **`[AllowAnonymous]`** on specific read-only, aggregated routes (see `api-architecture.md`).

**Staff:** Add a third role only if the rubric or your team splits “super admin” vs “caseworker.” Otherwise keep **Admin** as the single staff role.

Map Identity roles to JWT **`role`** claims if using bearer tokens.

## Donor ↔ supporter linkage (grading requirement)

Donor users must see **their own** historical donations and impact. The root **`schema.sql`** adds **`supporters.identity_user_id`** and **`supporters.can_login`** via **`ALTER TABLE`** (not in the v7 CSV export). After login, resolve **`supporter_id`** from the current Identity user id in the **service** layer; use that for all donor-scoped donation queries. Do not accept arbitrary `supporterId` from the client on “my donations” endpoints without verifying it matches the linked row.

## Endpoint access matrix (baseline)

| Resource / operation | Anonymous | Donor | Admin |
|----------------------|-----------|-------|-------|
| `GET api/public/impact*`, other curated public reads | ✓ (`AllowAnonymous`) | ✓ | ✓ |
| Login, register (if enabled) | ✓ | ✓ | ✓ |
| `supporters` read **own** (linked to Identity) | ✗ | ✓ | ✓ |
| `supporters` admin list / CUD | ✗ | ✗ | ✓ |
| `donations` read/create **own** (via linked supporter) | ✗ | ✓ (scoped) | ✓ |
| `donations` org-wide CUD / allocations | ✗ | ✗ | ✓ |
| `residents`, `case_conferences`, visits, process recordings, incidents, etc. | ✗ | ✗ | ✓ |
| Internal `social_media_posts` / detailed analytics | ✗ | ✗ | ✓ |

Encode rules with **`[Authorize(Roles = "Admin")]`**, **`[Authorize(Roles = "Donor,Admin")]`** where appropriate, or named **`[Authorize(Policy = "...")]`**.

## Controller vs service authorization

- **Controller**: authentication + role / policy gate.
- **Service**: **row-level** rules—e.g. Donor may only load supporter id **S** if `supporters.identity_user_id == currentUserId`; Admins bypass as needed.

## Password rules (Identity `PasswordOptions`)

Configure password policy to **exactly match** the values and requirements specified in your **course / lab instructions**. Do **not** rely on generic or AI-suggested minimum lengths or complexity rules unless they are the same as the class rubric.

Passwords are stored **hashed** (Identity default).

## HTTPS and secrets

- Enforce **HTTPS** in production; **HSTS** where appropriate. On **Azure App Service**, enable **HTTPS Only** and rely on the `*.azurewebsites.net` certificate (or bind a custom domain + managed cert if required).
- **JWT signing key**, **PostgreSQL connection string** (Supabase), and other secrets belong in **Azure App Service → Configuration → Application settings** (slot settings for staging if you use slots) or **Key Vault references**—**never** committed in git.
- Local dev may use **user secrets** or `.env` excluded from source control; production values are **only** on Azure (or your CI variables that inject settings at deploy time).

## React-related hardening

- **CORS**: allow specific React origins (**production**: your Azure Static Web Apps / App Service / custom domain URL; **development**: `https://localhost:5173` or your dev port); with credentials, **do not** use `AllowAnyOrigin()`. After each Azure frontend deploy, confirm the API CORS policy still lists the correct origin(s).
- **Cookies**: if used for auth, configure **SameSite**, **Secure**, **httpOnly**; consider anti-forgery for cookie-based mutating requests.
- **JWT in header**: CSRF is less of an issue; **XSS** is the main threat—avoid putting tokens in places scripts can read if possible.
- **Rate limiting** (optional): protect `login` from brute force.

## Database user

Use a Postgres user with **least privilege** required for the app (not superuser) in production.

## Logging

Log authentication failures and authorization denials at appropriate levels; **never** log passwords, refresh tokens, or full JWTs.
