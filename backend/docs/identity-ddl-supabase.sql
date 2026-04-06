-- Optional reference: staff/safehouse scope (matches EF migration).
-- Prefer: `dotnet ef database update` from backend/intex/intex (use direct Postgres port 5432 for DDL on Supabase).
-- ASP.NET Identity tables (AspNetUsers, AspNetRoles, …) are created only by EF migrations — do not hand-author unless required.

CREATE TABLE IF NOT EXISTS staff_safehouse_assignments (
    id              BIGSERIAL PRIMARY KEY,
    user_id         TEXT NOT NULL,
    safehouse_id    BIGINT NOT NULL REFERENCES safehouses (safehouse_id) ON DELETE CASCADE,
    UNIQUE (user_id, safehouse_id)
);

CREATE INDEX IF NOT EXISTS ix_staff_safehouse_assignments_safehouse
    ON staff_safehouse_assignments (safehouse_id);
