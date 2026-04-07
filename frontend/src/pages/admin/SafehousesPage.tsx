import { useMemo, useState } from 'react'
import { useSession } from '../../app/session'
import type { Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { AppLink, DataTable, ErrorState, FilterToolbar, SkeletonTable, StatusPill, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText } from '../../utils/helpers'
import { filterSafehousesForSessionUser } from '../../utils/sessionFilters'

export function SafehousesPage() {
  const { user } = useSession()
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [regionFilter, setRegionFilter] = useState('All regions')
  const [nameSearch, setNameSearch] = useState('')
  const scoped = useMemo(() => {
    if (!user) return safehouses.data
    return filterSafehousesForSessionUser(user, safehouses.data)
  }, [user, safehouses.data])
  const regions = Array.from(new Set(scoped.map((safehouse) => safehouse.region)))
  const normalizedNameSearch = asLowerText(nameSearch)
  const filteredSafehouses = scoped.filter((safehouse) => {
    const matchesFilter = regionFilter === 'All regions' ? true : safehouse.region === regionFilter
    const matchesSearch = normalizedNameSearch.length === 0 || asLowerText(safehouse.name).includes(normalizedNameSearch)
    return matchesFilter && matchesSearch
  })

  return (
    <PageSection title="Safehouses" description="Facility status and metrics should feel operational, not ornamental.">
      <Surface
        title="Facilities"
        subtitle="Open a safehouse to inspect occupancy and monthly metrics."
        actions={
          <StatusPill tone={safehouses.source === 'live' ? 'success' : 'warning'}>
            {safehouses.source === 'live' ? 'Live data' : 'Fallback data'}
          </StatusPill>
        }
      >
        <FilterToolbar>
          <label>
            Search by name
            <input
              value={nameSearch}
              onChange={(event) => setNameSearch(event.target.value)}
              placeholder="Type a safehouse name"
            />
          </label>
          <label>
            Region
            <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
              <option>All regions</option>
              {regions.map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {safehouses.isLoading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : null}
        {safehouses.error ? (
          <ErrorState title="Using prepared safehouse fallback" description={safehouses.error} />
        ) : null}
        <DataTable
          columns={['Name', 'Region', 'Status', 'Occupancy', 'Detail']}
          rows={filteredSafehouses.map((safehouse) => [
            safehouse.name,
            safehouse.region,
            <StatusPill tone="success">{safehouse.status}</StatusPill>,
            `${safehouse.currentOccupancy}/${safehouse.capacityGirls}`,
            <AppLink to={`/app/admin/safehouses/${safehouse.safehouseId}`}>Open</AppLink>,
          ])}
        />
      </Surface>
    </PageSection>
  )
}
