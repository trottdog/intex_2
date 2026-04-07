import { useMemo, useState } from 'react'
import { useSession } from '../../app/session'
import type { Resident, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  AppLink,
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  SectionHeader,
  SkeletonTable,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText, asText } from '../../utils/helpers'
import { filterResidentsForSessionUser } from '../../utils/sessionFilters'

export function CaseloadPage() {
  const { user } = useSession()
  const residents = useApiResource<Resident[]>('/residents', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [safehouseFilter, setSafehouseFilter] = useState('All')
  const residentsScoped = useMemo(() => {
    if (!user) return residents.data
    return filterResidentsForSessionUser(user, residents.data)
  }, [user, residents.data])
  const categories = Array.from(new Set(residentsScoped.map((r) => r.caseCategory)))
  const safehouseOptions = safehouses.data.filter((s) =>
    residentsScoped.some((r) => r.safehouseId === s.safehouseId),
  )
  const normalizedSearch = asLowerText(search)
  const filteredResidents = residentsScoped.filter((resident) => {
    const matchesSearch =
      asLowerText(resident.caseControlNo).includes(normalizedSearch) ||
      asLowerText(resident.assignedSocialWorker).includes(normalizedSearch) ||
      asLowerText(resident.caseCategory).includes(normalizedSearch)
    const matchesRisk = riskFilter === 'All' || resident.currentRiskLevel === riskFilter
    const matchesStatus = statusFilter === 'All' || resident.caseStatus === statusFilter
    const matchesCategory = categoryFilter === 'All' || resident.caseCategory === categoryFilter
    const matchesSafehouse = safehouseFilter === 'All' || String(resident.safehouseId) === safehouseFilter
    return matchesSearch && matchesRisk && matchesStatus && matchesCategory && matchesSafehouse
  })

  return (
    <PageSection title="Caseload inventory" description="The core list view for resident care management.">
      <SectionHeader title="Current residents" description="Search and filter by status, risk, category, or safehouse." />
      <Surface
        title="Caseload"
        subtitle="Highly scannable and calm, even with sensitive data."
        actions={
          <StatusPill tone={residents.source === 'live' ? 'success' : 'warning'}>
            {residents.source === 'live' ? 'Live data' : 'Fallback data'}
          </StatusPill>
        }
      >
        <FilterToolbar>
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Case number, worker, or category" />
          </label>
          <label>
            Case status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Reintegration</option>
              <option>Reunification</option>
              <option>Closed</option>
            </select>
          </label>
          <label>
            Risk level
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Moderate</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Case category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="All">All</option>
              {categories.map((cat) => <option key={cat}>{cat}</option>)}
            </select>
          </label>
          <label>
            Safehouse
            <select value={safehouseFilter} onChange={(event) => setSafehouseFilter(event.target.value)}>
              <option value="All">All</option>
              {safehouseOptions.map((s) => (
                <option key={s.safehouseId} value={String(s.safehouseId)}>{s.name}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {residents.isLoading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : null}
        {residents.error ? (
          <ErrorState title="Using prepared resident fallback" description={residents.error} />
        ) : null}
        {filteredResidents.length === 0 ? (
          <EmptyState title="No matching residents" description="Adjust the search or risk filter to find a different caseload slice." />
        ) : (
        <DataTable
          columns={['Case no.', 'Status', 'Category', 'Worker', 'Risk', 'Open']}
          rows={filteredResidents.map((resident) => [
            asText(resident.caseControlNo, '—'),
            asText(resident.caseStatus, '—'),
            asText(resident.caseCategory, '—'),
            asText(resident.assignedSocialWorker, '—'),
            <StatusPill tone={resident.currentRiskLevel === 'High' ? 'danger' : resident.currentRiskLevel === 'Moderate' ? 'warning' : 'success'}>
              {resident.currentRiskLevel}
            </StatusPill>,
            <AppLink to={`/app/admin/residents/${resident.residentId}`}>Open resident</AppLink>,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}
