import { useMemo, useState } from 'react'
import type { Safehouse } from '../../data/mockData'
import { fetchJson, sendJson, useApiResource } from '../../lib/api'
import { DataTable, EmptyState, ErrorState, FilterToolbar, SkeletonSurface, SkeletonTable, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText, asText } from '../../utils/helpers'

type UserRecord = {
  id: string
  name: string
  email?: string
  role: string
  facilityScope: string
  status: string
  safehouseIds?: number[]
}

const roleApiValues = ['Donor', 'Admin', 'SuperAdmin'] as const

export function UsersPage() {
  const users = useApiResource<UserRecord[]>('/admin/users', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [facilityFilter, setFacilityFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createRole, setCreateRole] = useState<(typeof roleApiValues)[number]>('Admin')
  const [createSafehouses, setCreateSafehouses] = useState<number[]>([])

  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<(typeof roleApiValues)[number]>('Admin')
  const [editStatus, setEditStatus] = useState<'active' | 'locked'>('active')
  const [editSafehouses, setEditSafehouses] = useState<number[]>([])

  const roleOptions = useMemo(
    () => Array.from(new Set(users.data.map((user) => asText(user.role, 'Unassigned').trim() || 'Unassigned'))).sort(),
    [users.data],
  )
  const facilityOptions = useMemo(
    () => Array.from(new Set(users.data.map((user) => asText(user.facilityScope, 'Unassigned').trim() || 'Unassigned'))).sort(),
    [users.data],
  )
  const normalizedSearch = asLowerText(search)
  const filteredUsers = users.data.filter((user) => {
    const userRole = asText(user.role, 'Unassigned').trim() || 'Unassigned'
    const userFacility = asText(user.facilityScope, 'Unassigned').trim() || 'Unassigned'
    const matchesSearch =
      asLowerText(user.name).includes(normalizedSearch) ||
      asLowerText(user.email).includes(normalizedSearch)
    const matchesRole = roleFilter === 'All' || userRole === roleFilter
    const matchesFacility = facilityFilter === 'All' || userFacility === facilityFilter
    return matchesSearch && matchesRole && matchesFacility
  })

  function toggleCreateSafehouse(id: number) {
    setCreateSafehouses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleEditSafehouse(id: number) {
    setEditSafehouses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function submitCreate() {
    setFormError(null)
    setFormSuccess(null)
    setBusy(true)
    try {
      const email = createEmail.trim()
      const fullName = createName.trim()
      const role = createRole
      const safehouseIds = createRole === 'Admin' ? createSafehouses : []

      try {
        await sendJson<UserRecord>('/admin/users', 'POST', {
          email,
          password: createPassword,
          fullName,
          role,
          safehouseIds,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (!message.includes('failed to fetch')) {
          throw error
        }

        // If the network drops after write, verify by checking whether the new account exists.
        const latestUsers = await fetchJson<UserRecord[]>('/admin/users')
        const createdUser = latestUsers.find((user) => asLowerText(user.email) === asLowerText(email))
        if (!createdUser) {
          throw error
        }
      }

      setFormSuccess(`Account created successfully for ${email}.`)
      setCreateEmail('')
      setCreatePassword('')
      setShowCreatePassword(false)
      setCreateName('')
      setCreateRole('Admin')
      setCreateSafehouses([])
      setShowForm(false)
      users.reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not create user')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(user: UserRecord) {
    setEditingId(user.id)
    setEditName(user.name)
    setEditRole(
      roleApiValues.includes(user.role as (typeof roleApiValues)[number])
        ? (user.role as (typeof roleApiValues)[number])
        : 'Admin',
    )
    setEditStatus(user.status === 'locked' ? 'locked' : 'active')
    const ids = user.safehouseIds?.length ? [...user.safehouseIds] : []
    setEditSafehouses(ids)
    setFormError(null)
  }

  async function submitEdit() {
    if (!editingId) return
    setFormError(null)
    setBusy(true)
    try {
      await sendJson<UserRecord>(`/admin/users/${editingId}`, 'PUT', {
        fullName: editName.trim(),
        role: editRole,
        status: editStatus,
        safehouseIds: editRole === 'Admin' ? editSafehouses : [],
      })
      setEditingId(null)
      users.reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not update user')
    } finally {
      setBusy(false)
    }
  }

  async function removeUser(id: string) {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return
    setFormError(null)
    setBusy(true)
    try {
      await sendJson(`/admin/users/${id}`, 'DELETE', undefined)
      setEditingId(null)
      users.reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not delete user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageSection title="Users" description="Create, update, lock, or remove accounts (super-admin only).">
      {showForm ? (
        <Surface
          title="Add user"
          subtitle="New accounts receive the role and (for admins) safehouse assignments you choose."
          actions={
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowForm(false)
                setFormError(null)
              }}
            >
              Cancel
            </button>
          }
        >
          {formError && !editingId ? <p style={{ color: '#b00020', marginBottom: '0.75rem' }}>{formError}</p> : null}
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              void submitCreate()
            }}
          >
            <label className="full-span">
              Email (login)
              <input
                required
                type="email"
                autoComplete="off"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
              />
            </label>
            <label className="full-span">
              Temporary password
              <div className="password-input-row">
                <input
                  required
                  type={showCreatePassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCreatePassword((value) => !value)}
                  aria-label={showCreatePassword ? 'Hide temporary password' : 'Show temporary password'}
                  aria-pressed={showCreatePassword}
                >
                  {showCreatePassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>
            <label className="full-span">
              Display name
              <input value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </label>
            <label>
              Role
              <select value={createRole} onChange={(e) => setCreateRole(e.target.value as (typeof roleApiValues)[number])}>
                {roleApiValues.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {createRole === 'Admin' ? (
              <div className="full-span">
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Safehouse access</p>
                {safehouses.isLoading ? (
                  <SkeletonTable rows={2} cols={1} />
                ) : (
                  <div className="stack-list">
                    {safehouses.data.map((sh) => (
                      <label key={sh.safehouseId} className="stack-row">
                        <input
                          type="checkbox"
                          checked={createSafehouses.includes(sh.safehouseId)}
                          onChange={() => toggleCreateSafehouse(sh.safehouseId)}
                        />
                        <span>
                          {sh.name} <small>(id {sh.safehouseId})</small>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <button className="primary-button full-span" type="submit" disabled={busy}>
              Create user
            </button>
          </form>
        </Surface>
      ) : null}

      {editingId ? (
        <Surface
          title="Edit user"
          actions={
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditingId(null)
                setFormError(null)
              }}
            >
              Cancel
            </button>
          }
        >
          {formError ? <p style={{ color: '#b00020', marginBottom: '0.75rem' }}>{formError}</p> : null}
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault()
              void submitEdit()
            }}
          >
            <label className="full-span">
              Display name
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </label>
            <label>
              Role
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as (typeof roleApiValues)[number])}>
                {roleApiValues.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Account status
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'active' | 'locked')}>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
              </select>
            </label>
            {editRole === 'Admin' ? (
              <div className="full-span">
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Safehouse access</p>
                {safehouses.isLoading ? (
                  <SkeletonTable rows={2} cols={1} />
                ) : (
                  <div className="stack-list">
                    {safehouses.data.map((sh) => (
                      <label key={sh.safehouseId} className="stack-row">
                        <input
                          type="checkbox"
                          checked={editSafehouses.includes(sh.safehouseId)}
                          onChange={() => toggleEditSafehouse(sh.safehouseId)}
                        />
                        <span>
                          {sh.name} <small>(id {sh.safehouseId})</small>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <button className="primary-button full-span" type="submit" disabled={busy}>
              Save changes
            </button>
          </form>
        </Surface>
      ) : null}

      {users.isLoading ? (
        <SkeletonSurface title="User directory">
          <SkeletonTable rows={4} cols={6} />
        </SkeletonSurface>
      ) : (
        <Surface
          title="User directory"
          actions={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusPill tone={users.source === 'live' ? 'success' : 'warning'}>
                {users.source === 'live' ? 'Live data' : 'Offline / error'}
              </StatusPill>
              <button
                type="button"
                className="primary-button"
                disabled={Boolean(editingId)}
                onClick={() => {
                  setShowForm(true)
                  setFormError(null)
                }}
              >
                + Add user
              </button>
            </div>
          }
        >
          {formSuccess ? <p style={{ color: '#1b5e20', marginBottom: '0.75rem' }}>{formSuccess}</p> : null}
          {users.error ? <ErrorState title="Could not load users" description={users.error} /> : null}
          <FilterToolbar>
            <label>
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
              />
            </label>
            <label>
              Role
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="All">All roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Facility
              <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)}>
                <option value="All">All facilities</option>
                {facilityOptions.map((facility) => (
                  <option key={facility} value={facility}>
                    {facility}
                  </option>
                ))}
              </select>
            </label>
          </FilterToolbar>
          {users.data.length === 0 && !users.error ? (
            <EmptyState title="No users loaded" description="Sign in as super-admin and ensure the API returns /admin/users." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="No matching users" description="Adjust the search, role, or facility filters to view users." />
          ) : (
            <DataTable
              columns={['Name', 'Email', 'Role', 'Facility scope', 'Status', 'Actions']}
              rows={filteredUsers.map((u) => [
                asText(u.name, '—'),
                asText(u.email, '—'),
                asText(u.role, '—'),
                asText(u.facilityScope, '—'),
                <StatusPill tone={asLowerText(u.status) === 'active' ? 'success' : 'warning'}>
                  {u.status}
                </StatusPill>,
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => startEdit(u)}>
                    Edit
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void removeUser(u.id)}>
                    Delete
                  </button>
                </div>,
              ])}
            />
          )}
        </Surface>
      )}
    </PageSection>
  )
}
