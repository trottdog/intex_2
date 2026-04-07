# Lighthouse Beacon — Setup & Login Credentials

## 0. Quick start (backend + frontend)

From the repo root, open **two terminals**.

**Terminal A (API):**

```bash
cd backend/intex/intex
dotnet run
```

Expected API URL: **http://localhost:4000**

**Terminal B (frontend):**

```bash
cd frontend
npm install
npm run dev
```

Expected frontend URL: **http://localhost:5173**

Quick health check (optional): open **http://localhost:4000/auth/me** and confirm you get JSON (for example `{ "authenticated": false }` when not logged in).

If the API fails at startup with `ConnectionStrings:DefaultConnection is missing or empty`, set your DB connection first (for example via `.env` or `dotnet user-secrets`) and restart.

## 1. Database

**If your Supabase (or local Postgres) database is already up to date** with the Beacon schema and Identity tables, you do **not** need to re-apply SQL. Use this section only when creating a new database or verifying drift.

| Artifact | Purpose |
|----------|---------|
| `schema.sql` (repo root) | Full PostgreSQL DDL: domain tables plus ASP.NET Identity (`AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, …). Reference or apply in the SQL editor when bootstrapping a fresh DB. |
| `backend/docs/identity-ddl-supabase.sql` | Optional: creates `staff_safehouse_assignments` if that table is missing (matches the EF migration). |
| `backend/docs/identity-seed.sql` | Idempotent SQL: Identity **roles**, **role links**, and **staff_safehouse_assignments** (when users already exist). |
| `SEED-DATA.md` (repo root) | Full seed reference: CSV location, EF seeder steps, passwords, pooler vs direct Postgres. |
| `RULES.md` (repo root) | Authoritative frontend rules (stack, auth, API, folders); keep docs and code aligned with this. |

**Staff sign-in:** facility users must have the Identity role **`Admin`** (see `AspNetUserRoles` → `AspNetRoles.Name` = `Admin`) and, for scoped UI, rows in **`staff_safehouse_assignments`** as needed. If `/auth/me` returns **no `Admin`/`Donor`/`SuperAdmin` role**, the frontend treats the session as unscoped until Identity is fixed.

**Connection string:** The API can use Supabase’s **transaction pooler** (port **6543**) for normal queries. Full EF migrations and Identity **seeding** are most reliable on a **direct** Postgres URL (port **5432**). In Development, **password bootstrap** can still sync demo passwords when `Auth:BootstrapPasswords` is true (see `appsettings.Development.json`).

## 2. Configure seed passwords (API)

From the **API project directory**:

```bash
cd backend/intex/intex
dotnet user-secrets set "Auth:Seed:SuperAdminPassword" "LighthouseAdmin01"
dotnet user-secrets set "Auth:Seed:StaffPassword"      "LighthouseStaff01"
dotnet user-secrets set "Auth:Seed:DonorPassword"      "LighthouseDonor01"
```

Set these to the same values you use in the credential tables below, then restart the API once so bootstrap can align hashes if enabled.

## 3. Run the API

Always run from **`backend/intex/intex`** (running `dotnet run` from the repo root will fail with “no project”):

```bash
cd backend/intex/intex
dotnet run
```

The API listens on **http://localhost:4000** in Development (see `Properties/launchSettings.json`), which matches the Vite dev proxy.

**Port already in use (`address already in use` on 4000):** only one process may bind to that port. Stop the other terminal, or on Windows end the process, e.g. `taskkill /IM intex.exe /F`, or find the PID with `netstat -ano | findstr :4000` and `taskkill /PID <pid> /F`.

## 4. Run the frontend (separate terminal)

The React app does **not** start with `dotnet run`. In another shell:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. In development, API calls go to **`/api/...`** and Vite proxies them to **http://localhost:4000** (see `frontend/vite.config.ts`), **unless** `VITE_API_BASE_URL` is set (see below).

**Use the deployed Azure API from localhost**

1. Create **`frontend/.env.development.local`** (gitignored) — loaded only for **`npm run dev`**, so production **`npm run build`** does not embed this URL:

   ```bash
   VITE_API_BASE_URL=https://intex-gtgzecb5avarh7gg.centralus-01.azurewebsites.net
   ```

   No trailing slash. Restart **`npm run dev`** after changing env vars. (A committed template is optional; see `frontend/.env.example`.)

2. The Azure app must run with **`Auth:Cookie:CrossSite`** enabled so the `Beacon.Auth` cookie can be set on cross-origin requests from `http://localhost:5173` (`SameSite=None; Secure`). The repo includes **`appsettings.Production.json`** with `"Auth:Cookie:CrossSite": true` — ensure **`ASPNETCORE_ENVIRONMENT=Production`** on App Service (or set the same flag via Application Settings: `Auth__Cookie__CrossSite=true`).

3. CORS on the API already allows `http://localhost:5173` with credentials (`Program.cs`).

To switch back to a **local** API, delete or edit **`frontend/.env.development.local`** (remove `VITE_API_BASE_URL`, or set it to `http://localhost:4000`).

**Production static site (e.g. https://beacon.trottdog.com)**

- If the live site calls **`http://localhost:4000`**, the browser will block it with **Private Network Access** / “loopback” errors. That is not fixed by CORS headers on the API; the **production bundle must use your public API URL**.
- **`frontend/.env.production`** (committed) sets `VITE_API_BASE_URL` to the Azure API. After changing it, run **`npm run build`** and redeploy the static site.
- **`Program.cs`** must list your frontend origin with **`AllowCredentials`** (e.g. `https://beacon.trottdog.com` and `https://www.beacon.trottdog.com`). Redeploy the API after CORS changes.

**Frontend auth (aligned with `RULES.md`):**

- Session: `frontend/src/app/session.tsx` — calls `GET /auth/me` with credentials; maps Identity roles (`SuperAdmin`, `Admin`, `Donor`) to UI roles **case-insensitively**.
- API helpers: `frontend/src/lib/authApi.ts` and `frontend/src/lib/api.ts` use **`credentials: 'include'`** so the `Beacon.Auth` cookie is sent.
- **Staff scope:** `/auth/me` returns **`safehouseIds`** for `Admin` users; admin/caseload views filter mock or live lists by that scope where implemented.

## 5. Login credentials

Passwords must match **how users were created**: SQL hashes vs. `dotnet user-secrets` vs. the EF seeder. If login returns **400** with “Invalid email or password”, the stored hash does not match the password you typed (or the account is locked after too many failures).

### SuperAdmin

| Field    | Value                                |
|----------|--------------------------------------|
| Email    | `admin@admin.com`    |
| Password | `123456789012Qw`                  |
| Role     | SuperAdmin                           |

### Staff / Admin (2 per safehouse, up to 9 safehouses)

| Field    | Value (example for safehouse 1, slot 1)  |
|----------|------------------------------------------|
| Email    | `sh01.staff1@lighthouse.intex`           |
| Password | `LighthouseStaff01`                      |
| Role     | Admin                                    |

Pattern: `sh{NN}.staff{1|2}@lighthouse.intex` where NN = safehouse id zero-padded to 2 digits.

Full list of staff emails:

| Safehouse | Staff 1                          | Staff 2                          |
|-----------|----------------------------------|----------------------------------|
| 1         | `sh01.staff1@lighthouse.intex`   | `sh01.staff2@lighthouse.intex`   |
| 2         | `sh02.staff1@lighthouse.intex`   | `sh02.staff2@lighthouse.intex`   |
| 3         | `sh03.staff1@lighthouse.intex`   | `sh03.staff2@lighthouse.intex`   |
| 4         | `sh04.staff1@lighthouse.intex`   | `sh04.staff2@lighthouse.intex`   |
| 5         | `sh05.staff1@lighthouse.intex`   | `sh05.staff2@lighthouse.intex`   |
| 6         | `sh06.staff1@lighthouse.intex`   | `sh06.staff2@lighthouse.intex`   |
| 7         | `sh07.staff1@lighthouse.intex`   | `sh07.staff2@lighthouse.intex`   |
| 8         | `sh08.staff1@lighthouse.intex`   | `sh08.staff2@lighthouse.intex`   |
| 9         | `sh09.staff1@lighthouse.intex`   | `sh09.staff2@lighthouse.intex`   |

All staff accounts use password: `LighthouseStaff01`

### Donors (first 20 supporters with emails)

| Field    | Value                                             |
|----------|---------------------------------------------------|
| Email    | The supporter's email from the `supporters` table |
| Password | `LighthouseDonor01`                               |
| Role     | Donor                                             |

Username pattern: `donor_{supporterId}`

## 6. API endpoints

| Method | Path             | Description                                          |
|--------|------------------|------------------------------------------------------|
| POST   | `/auth/login`    | `{ "email": "...", "password": "..." }` — sets cookie |
| GET    | `/auth/me`       | AllowAnonymous — `{ authenticated: false }` or user + roles, supporterId, safehouseIds |
| POST   | `/auth/logout`   | Clears auth cookie                                   |

Login from the frontend requires `credentials: 'include'` on fetch calls.

## 7. Quick test (API on port 4000)

```bash
# Login as SuperAdmin
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"julie.hernando@lighthouse.intex","password":"LighthouseAdmin01"}' \
  -c cookies.txt

# Check session
curl http://localhost:4000/auth/me -b cookies.txt
```
