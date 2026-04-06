# ASP.NET Identity: migrations and demo accounts

## Apply database schema (Identity + staff assignments)

Identity tables (`AspNetUsers`, `AspNetRoles`, …) and `staff_safehouse_assignments` are created by EF Core migrations.

**Local / direct Postgres (port 5432 recommended for DDL):**

```bash
cd backend/intex/intex
dotnet ef database update --configuration Release
```

On **Supabase**, run migrations against the **direct** connection (not the transaction pooler on port 6543) so DDL succeeds. Alternatively, apply the DDL in [../../schema.sql](../../schema.sql); Identity tables are easiest to create via `dotnet ef database update`.

If `DefaultConnection` uses the **transaction pooler (port 6543)**, the API **skips Identity startup seed** at runtime (EF writes are unreliable through that endpoint). Switch to direct Postgres (port **5432**) temporarily to seed, or run [identity-seed.sql](./identity-seed.sql) in the SQL Editor after users exist (repairs roles and `staff_safehouse_assignments`; see [../../SEED-DATA.md](../../SEED-DATA.md)).

In **Development**, `Auth:BootstrapPasswords` (see `appsettings.Development.json`) resets passwords for **existing** demo users (super admin, staff emails `shNN.staffM@…`, donors in the Donor role) to match `Auth:Seed:*Password` in User Secrets—so logins work even when full seed is skipped. Set `Auth:BootstrapPasswords` to `false` if you do not want that behavior.

## Configure seed passwords (do not commit real passwords)

Set User Secrets from the API project directory:

```bash
cd backend/intex/intex
dotnet user-secrets set "Auth:Seed:SuperAdminPassword" "YourStrongPass1"
dotnet user-secrets set "Auth:Seed:StaffPassword" "YourStrongPass2"
dotnet user-secrets set "Auth:Seed:DonorPassword" "YourStrongPass3"
```

Passwords must satisfy Identity options: at least 8 characters, upper, lower, and digit. A special character is **not** required (`RequireNonAlphanumeric` is off for demo passwords like `Lighthouse1`).

Optional overrides:

- `Auth:Seed:SuperAdminEmail` (default `julie.hernando@lighthouse.intex`)
- `Auth:Seed:SuperAdminUserName` (default `julie.hernando`)
- `Auth:Seed:SuperAdminFullName` (default `Julie Hernando`)
- `Auth:Seed:DonorCount` (default `20`) — first N unique supporter emails from the database

Toggle startup seed and migrations in `appsettings` / environment:

- `Auth:Seed:Enabled` — default `true` in Development
- `Database:ApplyMigrations` — default `true` in Development

## Who gets seeded

| Role        | Count | Login identifier |
|------------|-------|-------------------|
| SuperAdmin | 1     | Email `julie.hernando@lighthouse.intex` (configurable) |
| Admin      | 2 × each safehouse in DB (up to first 9 by id) | UserName `sh01_staff1`, email `sh01.staff1@lighthouse.intex`, etc. |
| Donor      | Up to `DonorCount` | UserName `donor_{supporterId}`, email = supporter email from `supporters` |

## API endpoints

- `POST /auth/login` — JSON `{ "email", "password" }`; sets cookie `Intex.Auth` (use `credentials: 'include'` from the Vite app).
- `GET /auth/me` — **AllowAnonymous**; returns `{ authenticated: false }` if no cookie, otherwise authenticated user with roles, `supporterId` (donors), `safehouseIds` (admins).
- `POST /auth/logout` — requires an authenticated user; clears cookie.
- `POST /auth/register` — placeholder response (registration not enabled).

## CORS

The API allows credentialed requests from `http://localhost:5173` and `http://localhost:3000`. Add production origins when deploying.
