# INTEX — Seed data reference

Use this when you need to **re-seed**, **repair Identity**, or **reload demo credentials** after resetting the database.

## 1. Domain data (CSV / schema)

| Location | Contents |
|----------|----------|
| `backend/lighthouse_csv_v7/*.csv` | Safehouses, supporters, residents, donations, allocations, etc. — source for the relational model and `schema.sql`. |
| `schema.sql` (repo root) | **DDL only** (no `INSERT`). Apply in Supabase or Postgres to create tables. |

Import CSVs with your preferred loader (Supabase import, `COPY`, or a one-off script). The backend **Identity** users are **not** defined in these CSVs; they come from the API seeder or SQL below.

## 2. Identity users (recommended: API seeder)

The real source of truth for demo logins is **`IdentityDevSeeder`** in `backend/intex/intex/Data/IdentityDevSeeder.cs`. It creates:

| Role | Who |
|------|-----|
| **SuperAdmin** | `julie.hernando@lighthouse.intex` (username `julie.hernando`) |
| **Admin** | For each safehouse id in the DB (up to 9): `sh01_staff1` / `sh01.staff1@lighthouse.intex`, … `sh09_staff2` / `sh09.staff2@…` |
| **Donor** | Up to `Auth:Seed:DonorCount` (default 20) supporters that have a non-empty email — username `donor_{supporterId}` |

**Passwords** come from User Secrets (not committed):

```bash
cd backend/intex/intex
dotnet user-secrets set "Auth:Seed:SuperAdminPassword" "LighthouseAdmin01"
dotnet user-secrets set "Auth:Seed:StaffPassword"      "LighthouseStaff01"
dotnet user-secrets set "Auth:Seed:DonorPassword"      "LighthouseDonor01"
```

**Re-run the full EF seed**

1. Point `ConnectionStrings:DefaultConnection` at **direct Postgres** (Supabase host `db.*.supabase.co`, port **5432**, user `postgres`). The **transaction pooler (port 6543)** skips startup seed — see API logs.
2. Ensure `Auth:Seed:Enabled` is `true` (default in Development — `appsettings.Development.json`).
3. From `backend/intex/intex`, run: `dotnet run`

On success, the API logs show users created or updated. In Development, **`Auth:BootstrapPasswords`** can still sync passwords for existing demo accounts if full seed was skipped earlier.

## 3. Identity repair (SQL only — pooler / partial reset)

If users **exist** but **roles** or **`staff_safehouse_assignments`** are missing, run in the **Supabase SQL Editor**:

**`backend/docs/identity-seed.sql`**

That script inserts the three `AspNetRoles`, links **SuperAdmin** / **Admin** / **Donor** by email and username pattern, and fills `staff_safehouse_assignments` for staff emails `shNN.staffM@lighthouse.intex`.

It does **not** create users or password hashes. For passwords, either:

- Switch to port **5432** and restart the API once (with user secrets set), or  
- Rely on **`IdentityPasswordBootstrapper`** in Development when `Auth:BootstrapPasswords` is true.

## 4. Quick credential table (same as SETUP.md)

| Account | Password (typical demo) |
|---------|-------------------------|
| `julie.hernando@lighthouse.intex` | `LighthouseAdmin01` |
| `shNN.staffM@lighthouse.intex` | `LighthouseStaff01` |
| Supporter emails (donor accounts) | `LighthouseDonor01` |

Usernames: staff `shNN_staffM`, donors `donor_{supporterId}`.

## 5. Frontend alignment

- **Rules:** project-wide frontend expectations are in **`RULES.md`** (repo root).
- **Auth and session:** `frontend/src/app/session.tsx`, `frontend/src/lib/authApi.ts`.
- **Seed / repair SQL:** `backend/docs/identity-seed.sql` (roles and `staff_safehouse_assignments` when users already exist).

## 6. More detail

See **`backend/docs/identity-and-seed.md`** for migrations, CORS, and endpoint behavior.
