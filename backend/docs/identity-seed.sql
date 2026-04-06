-- Identity repair seed (Postgres / Supabase SQL Editor)
-- Run AFTER "AspNetUsers" rows exist for demo accounts (from EF seed on port 5432, or manual).
-- Idempotent: safe to run more than once.
--
-- Does NOT set password hashes — use the API once with Auth:BootstrapPasswords + user secrets,
-- or IdentityDevSeeder on a direct (non-pooler) connection.

-- ---------------------------------------------------------------------------
-- Roles (Donor, Admin, SuperAdmin) — matches intex.Data.IntexRoles
-- ---------------------------------------------------------------------------
INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
SELECT gen_random_uuid()::text, 'Donor', 'DONOR', gen_random_uuid()::text
WHERE NOT EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'DONOR');

INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
SELECT gen_random_uuid()::text, 'Admin', 'ADMIN', gen_random_uuid()::text
WHERE NOT EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'ADMIN');

INSERT INTO "AspNetRoles" ("Id", "Name", "NormalizedName", "ConcurrencyStamp")
SELECT gen_random_uuid()::text, 'SuperAdmin', 'SUPERADMIN', gen_random_uuid()::text
WHERE NOT EXISTS (SELECT 1 FROM "AspNetRoles" WHERE "NormalizedName" = 'SUPERADMIN');

-- ---------------------------------------------------------------------------
-- SuperAdmin → julie.hernando@lighthouse.intex
-- ---------------------------------------------------------------------------
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
SELECT u."Id", r."Id"
FROM "AspNetUsers" u
CROSS JOIN "AspNetRoles" r
WHERE r."NormalizedName" = 'SUPERADMIN'
  AND lower(u."Email") = 'julie.hernando@lighthouse.intex'
  AND NOT EXISTS (
    SELECT 1 FROM "AspNetUserRoles" ur
    WHERE ur."UserId" = u."Id" AND ur."RoleId" = r."Id"
  );

-- ---------------------------------------------------------------------------
-- Admin → staff emails shNN.staff{1|2}@lighthouse.intex
-- ---------------------------------------------------------------------------
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
SELECT u."Id", r."Id"
FROM "AspNetUsers" u
CROSS JOIN "AspNetRoles" r
WHERE r."NormalizedName" = 'ADMIN'
  AND u."Email" ~* '^sh[0-9]{2}\.staff[12]@lighthouse\.intex$'
  AND NOT EXISTS (
    SELECT 1 FROM "AspNetUserRoles" ur
    WHERE ur."UserId" = u."Id" AND ur."RoleId" = r."Id"
  );

-- ---------------------------------------------------------------------------
-- Donor → usernames donor_{supporterId}
-- ---------------------------------------------------------------------------
INSERT INTO "AspNetUserRoles" ("UserId", "RoleId")
SELECT u."Id", r."Id"
FROM "AspNetUsers" u
CROSS JOIN "AspNetRoles" r
WHERE r."NormalizedName" = 'DONOR'
  AND u."UserName" ~ '^donor_[0-9]+$'
  AND NOT EXISTS (
    SELECT 1 FROM "AspNetUserRoles" ur
    WHERE ur."UserId" = u."Id" AND ur."RoleId" = r."Id"
  );

-- ---------------------------------------------------------------------------
-- staff_safehouse_assignments: staff user ↔ safehouse id from email prefix shNN
-- Requires table staff_safehouse_assignments (see schema.sql or identity-ddl-supabase.sql)
-- ---------------------------------------------------------------------------
INSERT INTO staff_safehouse_assignments (user_id, safehouse_id)
SELECT u."Id", CAST(substring(lower(u."Email") FROM '^sh([0-9]{2})') AS integer) AS safehouse_id
FROM "AspNetUsers" u
WHERE u."Email" ~* '^sh[0-9]{2}\.staff[12]@lighthouse\.intex$'
  AND substring(lower(u."Email") FROM '^sh([0-9]{2})') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM staff_safehouse_assignments a
    WHERE a.user_id = u."Id"
      AND a.safehouse_id = CAST(substring(lower(u."Email") FROM '^sh([0-9]{2})') AS integer)
  );
