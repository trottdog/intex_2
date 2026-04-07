import { useMemo, useState } from 'react'
import { useApiResource } from '../../lib/api'
import { DataTable, EmptyState, FilterToolbar, SkeletonSurface, SkeletonTable, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText, asText } from '../../utils/helpers'

type UserRecord = { name: string; email?: string; role: string; facilityScope: string; status: string }

export function UsersPage() {
  const users = useApiResource<UserRecord[]>('/admin/users', [])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [facilityFilter, setFacilityFilter] = useState('All')
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

  return (
    <PageSection title="Users" description="User management with role and facility scope.">
      {users.isLoading ? (
        <SkeletonSurface title="User directory"><SkeletonTable rows={4} cols={4} /></SkeletonSurface>
      ) : (
        <Surface title="User directory">
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
                {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label>
              Facility
              <select value={facilityFilter} onChange={(event) => setFacilityFilter(event.target.value)}>
                <option value="All">All facilities</option>
                {facilityOptions.map((facility) => <option key={facility} value={facility}>{facility}</option>)}
              </select>
            </label>
          </FilterToolbar>
          {users.data.length === 0 ? (
            <EmptyState title="No users loaded" description="User data will appear once the API provides it." />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="No matching users" description="Adjust the search, role, or facility filters to view users." />
          ) : (
            <DataTable
              columns={['Name', 'Email', 'Role', 'Facility scope', 'Status']}
              rows={filteredUsers.map((u) => [
                asText(u.name, '—'),
                asText(u.email, '—'),
                asText(u.role, '—'),
                asText(u.facilityScope, '—'),
                <StatusPill tone={asLowerText(u.status) === 'active' ? 'success' : 'warning'}>{u.status}</StatusPill>,
              ])}
            />
          )}
        </Surface>
      )}
    </PageSection>
  )
}
