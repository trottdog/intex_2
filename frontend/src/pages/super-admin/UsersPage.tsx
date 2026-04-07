import { useEffect, useMemo, useState } from 'react'
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

type SuccessFeedback = {
  kind: 'create' | 'edit' | 'delete'
  message: string
}

function sameNumberLists(left: number[] | undefined, right: number[]) {
  const normalizedLeft = [...(left ?? [])].sort((a, b) => a - b)
  const normalizedRight = [...right].sort((a, b) => a - b)

  if (normalizedLeft.length !== normalizedRight.length) {
    return false
  }

  return normalizedLeft.every((value, index) => value === normalizedRight[index])
}

function editWasApplied(
  user: UserRecord,
  originalUser: UserRecord,
  expected: {
    fullName: string
    role: (typeof roleApiValues)[number]
    status: 'active' | 'locked'
    safehouseIds: number[]
  },
) {
  const expectedName = expected.fullName.trim() || asText(originalUser.email, originalUser.name).trim()
  const actualName = asText(user.name, '').trim()
  const actualRole = asText(user.role, '').trim()
  const actualStatus = asLowerText(user.status)
  const actualSafehouseIds = user.safehouseIds ?? []

  return (
    user.id === originalUser.id &&
    actualName === expectedName &&
    actualRole === expected.role &&
    (expected.status === 'locked' ? actualStatus === 'locked' : actualStatus !== 'locked') &&
    sameNumberLists(actualSafehouseIds, expected.role === 'Admin' ? expected.safehouseIds : [])
  )
}

async function fetchUsersWithRetry(retries = 3, delayMs = 200): Promise<UserRecord[]> {
  let lastError: unknown

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fetchJson<UserRecord[]>('/admin/users')
    } catch (error) {
      lastError = error
      if (attempt < retries - 1) {
        await new Promise((resolve) => window.setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Could not reach the API.')
}

const feedbackStyles: Record<SuccessFeedback['kind'], { color: string; backgroundColor: string; borderColor: string }> = {
  create: {
    color: '#1b5e20',
    backgroundColor: '#e8f5e9',
    borderColor: '#81c784',
  },
  edit: {
    color: '#0d47a1',
    backgroundColor: '#e3f2fd',
    borderColor: '#90caf9',
  },
  delete: {
    color: '#b71c1c',
    backgroundColor: '#ffebee',
    borderColor: '#ef9a9a',
  },
}

function SuccessIcon({ kind }: { kind: SuccessFeedback['kind'] }) {
  if (kind === 'delete') {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.2 2.2 4.8-4.8" />
    </svg>
  )
}

export function UsersPage() {
  const users = useApiResource<UserRecord[]>('/admin/users', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [facilityFilter, setFacilityFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<SuccessFeedback | null>(null)

  useEffect(() => {
    if (!formSuccess) return
    const timeoutId = window.setTimeout(() => setFormSuccess(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [formSuccess])

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
        const latestUsers = await fetchUsersWithRetry()
        const createdUser = latestUsers.find((user) => asLowerText(user.email) === asLowerText(email))
        if (!createdUser) {
          throw error
        }
      }

      setFormSuccess({ kind: 'create', message: `Account created successfully for ${email}.` })
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
    setEditingUser(user)
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
    if (!editingId || !editingUser) return
    setFormError(null)
    setBusy(true)
    try {
      const fullName = editName.trim()
      const safehouseIds = editRole === 'Admin' ? editSafehouses : []

      await sendJson<UserRecord>(`/admin/users/${editingId}`, 'PUT', {
        fullName,
        role: editRole,
        status: editStatus,
        safehouseIds,
      })
      setEditingId(null)
      setEditingUser(null)
      setFormSuccess({ kind: 'edit', message: `User updated successfully${fullName ? `: ${fullName}` : '.'}` })
      users.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ''

      if (message.includes('failed to fetch')) {
        try {
          const latestUsers = await fetchUsersWithRetry()
          const updatedUser = latestUsers.find((user) => user.id === editingUser.id)

          if (
            updatedUser &&
            editWasApplied(updatedUser, editingUser, {
              fullName,
              role: editRole,
              status: editStatus,
              safehouseIds,
            })
          ) {
            setEditingId(null)
            setEditingUser(null)
            setFormSuccess({ kind: 'edit', message: `User updated successfully${fullName ? `: ${fullName}` : '.'}` })
            users.reload()
            return
          }
        } catch {
          /* fall through to a clear update error below */
        }

        setFormError('Could not update user. Please try again.')
        return
      }

      setFormError(error instanceof Error ? error.message : 'Could not update user')
    } finally {
      setBusy(false)
    }
  }

  async function removeUser(id: string, userName?: string, userEmail?: string) {
    const targetUser = (userName ?? '').trim() || (userEmail ?? '').trim()
    const confirmMessage = targetUser
      ? `Permanently delete ${targetUser}? This cannot be undone.`
      : 'Permanently delete this user? This cannot be undone.'

    if (!window.confirm(confirmMessage)) return
    setFormError(null)
    setBusy(true)
    try {
      await sendJson(`/admin/users/${id}`, 'DELETE', undefined)
      setEditingId(null)
      setEditingUser(null)
      setFormSuccess({ kind: 'delete', message: 'User deleted successfully.' })
      users.reload()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not delete user')
    } finally {
      setBusy(false)
    }
  }

  const activeFeedbackStyle = formSuccess ? feedbackStyles[formSuccess.kind] : null

  return (
    <PageSection title="Users" description="Create, update, lock, or remove accounts (super-admin only).">
      {formSuccess && activeFeedbackStyle ? (
        <div
          style={{
            color: activeFeedbackStyle.color,
            backgroundColor: activeFeedbackStyle.backgroundColor,
            border: `1px solid ${activeFeedbackStyle.borderColor}`,
            borderRadius: '0.8rem',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600,
          }}
          role="status"
          aria-live="polite"
        >
          <SuccessIcon kind={formSuccess.kind} />
          <span>{formSuccess.message}</span>
        </div>
      ) : null}

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
                setEditingUser(null)
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
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => void removeUser(u.id, u.name, u.email)}
                  >
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
