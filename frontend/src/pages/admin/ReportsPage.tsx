import { useState } from 'react'
import type { Donation, PublicImpactSnapshot, Resident, Safehouse } from '../../data/mockData'
import { sendJson, useApiResource } from '../../lib/api'
import {
  IMPACT_SNAPSHOT_COLUMNS_API,
  IMPACT_SNAPSHOT_COLUMNS_MOCK,
  impactSnapshotTableRow,
  impactSnapshotsUseMockColumns,
} from '../../lib/impactSnapshots'
import { DataTable, EmptyState, ErrorState, SkeletonStatCard, SkeletonSurface, SkeletonTable, StatCard, Surface } from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asFiniteNumber, asText, formatAmount } from '../../utils/helpers'

type DonationTrend = { id: number; month: string; amount: number; donors: number }
type ReintegrationStat = { id: number; quarter: string; placed: number; successAt90d: number; rate: string }
type AccomplishmentRow = { id: number; service: string; beneficiaries: number; sessions: number; outcomes: string }
type OutcomeMetric = { metric: string; currentValue: string; change: string; notes: string }

function DonationTrendsEditor({
  resource,
}: {
  resource: ReturnType<typeof useApiResource<DonationTrend[]>>
}) {
  const { data, isLoading, error, reload } = resource
  const [month, setMonth] = useState('')
  const [amount, setAmount] = useState('')
  const [donors, setDonors] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ month: '', amount: '', donors: '' })
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function addRow() {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson<DonationTrend>('/reports/donation-trends', 'POST', {
        month: month.trim(),
        amount: Number(amount) || 0,
        donors: Math.max(0, Math.floor(Number(donors) || 0)),
      })
      setMonth('')
      setAmount('')
      setDonors('')
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(id: number) {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/donation-trends/${id}`, 'PUT', {
        month: draft.month.trim(),
        amount: Number(draft.amount) || 0,
        donors: Math.max(0, Math.floor(Number(draft.donors) || 0)),
      })
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function removeRow(id: number) {
    if (!window.confirm('Delete this donation trend row?')) return
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/donation-trends/${id}`, 'DELETE', undefined)
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={4} cols={4} />
  }

  return (
    <>
      {error ? <ErrorState title="Could not load trends" description={error} /> : null}
      {localError ? <p style={{ color: '#b00020', marginBottom: '0.75rem' }}>{localError}</p> : null}
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <label>
          Month label
          <input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="e.g. Jan 2026" />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          Unique donors
          <input value={donors} onChange={(e) => setDonors(e.target.value)} inputMode="numeric" />
        </label>
        <div style={{ alignSelf: 'end' }}>
          <button type="button" className="primary-button" disabled={busy} onClick={() => void addRow()}>
            Add row
          </button>
        </div>
      </div>
      {data.length === 0 && !error ? (
        <EmptyState title="No trend rows yet" description="Add months and totals above, or load data from the API." />
      ) : data.length > 0 ? (
        <DataTable
          columns={['Month', 'Total donated', 'Unique donors', 'Actions']}
          rows={data.map((row) => {
            const editing = editingId === row.id
            return [
              editing ? (
                <input
                  value={draft.month}
                  onChange={(e) => setDraft((d) => ({ ...d, month: e.target.value }))}
                />
              ) : (
                asText(row.month)
              ),
              editing ? (
                <input
                  value={draft.amount}
                  onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                  inputMode="decimal"
                />
              ) : (
                formatAmount(row.amount)
              ),
              editing ? (
                <input
                  value={draft.donors}
                  onChange={(e) => setDraft((d) => ({ ...d, donors: e.target.value }))}
                  inputMode="numeric"
                />
              ) : (
                String(asFiniteNumber(row.donors))
              ),
              editing ? (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="primary-button" disabled={busy} onClick={() => void saveEdit(row.id)}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(row.id)
                      setDraft({
                        month: row.month,
                        amount: String(row.amount),
                        donors: String(row.donors),
                      })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void removeRow(row.id)}>
                    Delete
                  </button>
                </div>
              ),
            ]
          })}
        />
      ) : null}
    </>
  )
}

function AccomplishmentsEditor({
  resource,
}: {
  resource: ReturnType<typeof useApiResource<AccomplishmentRow[]>>
}) {
  const { data, isLoading, error, reload } = resource
  const [service, setService] = useState('')
  const [beneficiaries, setBeneficiaries] = useState('')
  const [sessions, setSessions] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ service: '', beneficiaries: '', sessions: '', outcomes: '' })
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function addRow() {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson('/reports/accomplishments', 'POST', {
        service: service.trim(),
        beneficiaries: Math.max(0, Math.floor(Number(beneficiaries) || 0)),
        sessions: Math.max(0, Math.floor(Number(sessions) || 0)),
        outcomes: outcomes.trim(),
      })
      setService('')
      setBeneficiaries('')
      setSessions('')
      setOutcomes('')
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(id: number) {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/accomplishments/${id}`, 'PUT', {
        service: draft.service.trim(),
        beneficiaries: Math.max(0, Math.floor(Number(draft.beneficiaries) || 0)),
        sessions: Math.max(0, Math.floor(Number(draft.sessions) || 0)),
        outcomes: draft.outcomes.trim(),
      })
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function removeRow(id: number) {
    if (!window.confirm('Delete this accomplishment row?')) return
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/accomplishments/${id}`, 'DELETE', undefined)
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={3} cols={5} />
  }

  return (
    <>
      {error ? <ErrorState title="Could not load accomplishments" description={error} /> : null}
      {localError ? <p style={{ color: '#b00020', marginBottom: '0.75rem' }}>{localError}</p> : null}
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <label className="full-span">
          Service area
          <input value={service} onChange={(e) => setService(e.target.value)} placeholder="e.g. Counseling" />
        </label>
        <label>
          Beneficiaries
          <input value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Sessions
          <input value={sessions} onChange={(e) => setSessions(e.target.value)} inputMode="numeric" />
        </label>
        <label className="full-span">
          Key outcomes
          <input value={outcomes} onChange={(e) => setOutcomes(e.target.value)} />
        </label>
        <div className="full-span">
          <button type="button" className="primary-button" disabled={busy} onClick={() => void addRow()}>
            Add row
          </button>
        </div>
      </div>
      {data.length === 0 && !error ? (
        <EmptyState title="No accomplishment rows yet" description="Add service outcomes above for the annual report." />
      ) : data.length > 0 ? (
        <DataTable
          columns={['Service area', 'Beneficiaries', 'Sessions', 'Outcomes', 'Actions']}
          rows={data.map((row) => {
            const editing = editingId === row.id
            return [
              editing ? (
                <input
                  value={draft.service}
                  onChange={(e) => setDraft((d) => ({ ...d, service: e.target.value }))}
                />
              ) : (
                row.service
              ),
              editing ? (
                <input
                  value={draft.beneficiaries}
                  onChange={(e) => setDraft((d) => ({ ...d, beneficiaries: e.target.value }))}
                  inputMode="numeric"
                />
              ) : (
                String(row.beneficiaries)
              ),
              editing ? (
                <input
                  value={draft.sessions}
                  onChange={(e) => setDraft((d) => ({ ...d, sessions: e.target.value }))}
                  inputMode="numeric"
                />
              ) : (
                String(row.sessions)
              ),
              editing ? (
                <input
                  value={draft.outcomes}
                  onChange={(e) => setDraft((d) => ({ ...d, outcomes: e.target.value }))}
                />
              ) : (
                row.outcomes
              ),
              editing ? (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="primary-button" disabled={busy} onClick={() => void saveEdit(row.id)}>
                    Save
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(row.id)
                      setDraft({
                        service: row.service,
                        beneficiaries: String(row.beneficiaries),
                        sessions: String(row.sessions),
                        outcomes: row.outcomes,
                      })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void removeRow(row.id)}>
                    Delete
                  </button>
                </div>
              ),
            ]
          })}
        />
      ) : null}
    </>
  )
}

function ReintegrationEditor({
  resource,
}: {
  resource: ReturnType<typeof useApiResource<ReintegrationStat[]>>
}) {
  const { data, isLoading, error, reload } = resource
  const [quarter, setQuarter] = useState('')
  const [placed, setPlaced] = useState('')
  const [successAt90d, setSuccessAt90d] = useState('')
  const [rate, setRate] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ quarter: '', placed: '', successAt90d: '', rate: '' })
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function addRow() {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson('/reports/reintegration', 'POST', {
        quarter: quarter.trim(),
        placed: Math.max(0, Math.floor(Number(placed) || 0)),
        successAt90d: Math.max(0, Math.floor(Number(successAt90d) || 0)),
        rate: rate.trim(),
      })
      setQuarter('')
      setPlaced('')
      setSuccessAt90d('')
      setRate('')
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function saveEdit(id: number) {
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/reintegration/${id}`, 'PUT', {
        quarter: draft.quarter.trim(),
        placed: Math.max(0, Math.floor(Number(draft.placed) || 0)),
        successAt90d: Math.max(0, Math.floor(Number(draft.successAt90d) || 0)),
        rate: draft.rate.trim(),
      })
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function removeRow(id: number) {
    if (!window.confirm('Delete this reintegration row?')) return
    setLocalError(null)
    setBusy(true)
    try {
      await sendJson(`/reports/reintegration/${id}`, 'DELETE', undefined)
      setEditingId(null)
      reload()
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  if (isLoading) {
    return <SkeletonTable rows={3} cols={5} />
  }

  return (
    <>
      {error ? <ErrorState title="Could not load reintegration stats" description={error} /> : null}
      {localError ? <p style={{ color: '#b00020', marginBottom: '0.75rem' }}>{localError}</p> : null}
      <div className="form-grid" style={{ marginBottom: '1rem' }}>
        <label>
          Quarter
          <input value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="e.g. Q1 2026" />
        </label>
        <label>
          Placements
          <input value={placed} onChange={(e) => setPlaced(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Stable at 90 days
          <input value={successAt90d} onChange={(e) => setSuccessAt90d(e.target.value)} inputMode="numeric" />
        </label>
        <label>
          Success rate
          <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 82%" />
        </label>
        <div style={{ alignSelf: 'end' }}>
          <button type="button" className="primary-button" disabled={busy} onClick={() => void addRow()}>
            Add row
          </button>
        </div>
      </div>
      {data.length === 0 && !error ? (
        <EmptyState title="No reintegration rows yet" description="Add quarterly placement and stability metrics above." />
      ) : data.length > 0 ? (
        <DataTable
          columns={['Quarter', 'Placements', 'Stable at 90 days', 'Success rate', 'Actions']}
          rows={data.map((row) => {
            const editing = editingId === row.id
            return [
              editing ? (
                <input
                  value={draft.quarter}
                  onChange={(e) => setDraft((d) => ({ ...d, quarter: e.target.value }))}
                />
              ) : (
                row.quarter
              ),
              editing ? (
                <input
                  value={draft.placed}
                  onChange={(e) => setDraft((d) => ({ ...d, placed: e.target.value }))}
                  inputMode="numeric"
                />
              ) : (
                String(row.placed)
              ),
              editing ? (
                <input
                  value={draft.successAt90d}
                  onChange={(e) => setDraft((d) => ({ ...d, successAt90d: e.target.value }))}
                  inputMode="numeric"
                />
              ) : (
                String(row.successAt90d)
              ),
              editing ? (
                <input
                  value={draft.rate}
                  onChange={(e) => setDraft((d) => ({ ...d, rate: e.target.value }))}
                />
              ) : (
                row.rate
              ),
              editing ? (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button type="button" className="primary-button" disabled={busy} onClick={() => void saveEdit(row.id)}>
                    Save
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={busy}
                    onClick={() => {
                      setEditingId(row.id)
                      setDraft({
                        quarter: row.quarter,
                        placed: String(row.placed),
                        successAt90d: String(row.successAt90d),
                        rate: row.rate,
                      })
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="secondary-button" disabled={busy} onClick={() => void removeRow(row.id)}>
                    Delete
                  </button>
                </div>
              ),
            ]
          })}
        />
      ) : null}
    </>
  )
}

export function ReportsPage() {
  const impactSnapshots = useApiResource<PublicImpactSnapshot[]>('/public-impact-snapshots', [])
  const donations = useApiResource<Donation[]>('/donations', [])
  const safehouses = useApiResource<Safehouse[]>('/safehouses', [])
  const residents = useApiResource<Resident[]>('/residents', [])
  const donationTrends = useApiResource<DonationTrend[]>('/reports/donation-trends', [])
  const reintegrationStats = useApiResource<ReintegrationStat[]>('/reports/reintegration', [])
  const accomplishments = useApiResource<AccomplishmentRow[]>('/reports/accomplishments', [])
  const outcomeMetrics = useApiResource<OutcomeMetric[]>('/reports/outcome-metrics', [])

  const useMockStyleSnapshotColumns = impactSnapshotsUseMockColumns(impactSnapshots.data)
  const snapshotColumns = useMockStyleSnapshotColumns
    ? [...IMPACT_SNAPSHOT_COLUMNS_MOCK]
    : [...IMPACT_SNAPSHOT_COLUMNS_API]

  const anyLoading = impactSnapshots.isLoading || donations.isLoading || safehouses.isLoading || residents.isLoading

  return (
    <PageSection title="Reports and analytics" description="Aggregated insights and trends for decision-making. Edit report tables below (saved to the database).">
      {anyLoading ? (
        <>
          <div className="stat-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</div>
          <SkeletonSurface title="Donation trends"><SkeletonTable rows={4} cols={3} /></SkeletonSurface>
          <SkeletonSurface title="Annual Accomplishment Report"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          <div className="two-column-grid">
            <SkeletonSurface title="Safehouse performance"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
            <SkeletonSurface title="Reintegration rates"><SkeletonTable rows={3} cols={4} /></SkeletonSurface>
          </div>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total donations" value={formatAmount(donations.data.reduce((s, d) => s + asFiniteNumber(d.amount), 0))} />
            <StatCard label="Total donors" value={String(new Set(donations.data.map((d) => d.supporterId)).size)} />
            <StatCard label="Active residents" value={String(residents.data.filter((r) => r.caseStatus === 'Active').length)} />
            <StatCard label="Published snapshots" value={String(impactSnapshots.data.length)} />
          </div>

          <Surface title="Donation trends" subtitle="Create, edit, or delete rows shown on internal reports (stored in report_donation_trends).">
            <DonationTrendsEditor resource={donationTrends} />
          </Surface>

          <Surface title="Annual Accomplishment Report — Services" subtitle="CRUD for service-level accomplishment metrics.">
            <AccomplishmentsEditor resource={accomplishments} />
          </Surface>

          <div className="two-column-grid">
            <Surface title="Safehouse performance">
              {safehouses.data.length === 0 ? (
                <EmptyState title="No safehouse data" description="Safehouse performance data will appear once loaded." />
              ) : (
                <DataTable
                  columns={['Safehouse', 'Occupancy', 'Region', 'Status']}
                  rows={safehouses.data.map((sh) => [sh.name, `${sh.currentOccupancy}/${sh.capacityGirls}`, sh.region, sh.status])}
                />
              )}
            </Surface>

            <Surface title="Reintegration success rates" subtitle="Edit quarterly reintegration metrics (stored in report_reintegration_stats).">
              <ReintegrationEditor resource={reintegrationStats} />
            </Surface>
          </div>

          <Surface title="Resident outcome metrics">
            {outcomeMetrics.isLoading ? (
              <SkeletonTable rows={4} cols={4} />
            ) : outcomeMetrics.data.length === 0 ? (
              <EmptyState title="No outcome data" description="Outcome metrics will appear once the API provides them." />
            ) : (
              <DataTable
                columns={['Metric', 'Current value', 'Change vs. last quarter', 'Notes']}
                rows={outcomeMetrics.data.map((row) => [row.metric, row.currentValue, row.change, row.notes])}
              />
            )}
          </Surface>

          <Surface title="Published impact snapshots">
            {impactSnapshots.data.length === 0 ? (
              <EmptyState title="No snapshots" description="Published impact snapshots will appear once available." />
            ) : (
              <DataTable
                columns={[...snapshotColumns]}
                rows={impactSnapshots.data.map((snapshot) => [...impactSnapshotTableRow(snapshot)])}
              />
            )}
          </Surface>
        </>
      )}
    </PageSection>
  )
}
