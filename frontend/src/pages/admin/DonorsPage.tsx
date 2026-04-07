import { useState } from 'react'
import type { Supporter } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  emptyMlPredictionFeed,
  formatMlScore,
  formatMlTimestamp,
  getMlSignalLabel,
  getMlSignalTone,
  summarizeMlMetrics,
  type MlPredictionFeed,
} from '../../lib/ml'
import {
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  SkeletonTable,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { NAME_INPUT_PATTERN, NAME_INPUT_TITLE } from '../../utils/formValidation'
import { asLowerText, asRecord, asText } from '../../utils/helpers'

export function DonorsPage() {
  const supporters = useApiResource<Supporter[]>('/supporters', [])
  const donorRiskFeed = useApiResource<MlPredictionFeed>(
    '/ml/pipelines/donor_retention/predictions?limit=8',
    emptyMlPredictionFeed('donor_retention'),
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const normalizedSearch = asLowerText(search)
  const filteredSupporters = supporters.data.filter((supporter) => {
    const matchesSearch =
      asLowerText(supporter.displayName).includes(normalizedSearch) ||
      asLowerText(supporter.supporterType).includes(normalizedSearch) ||
      asLowerText(supporter.region).includes(normalizedSearch)
    const matchesStatus = statusFilter === 'All' || supporter.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <PageSection title="Donors and supporters" description="View, create, and manage supporter profiles by type and status.">
      {showForm ? (
        <Surface title="Add supporter" subtitle="Record a new supporter profile." actions={
          <button className="secondary-button" onClick={() => { setShowForm(false); setFormSubmitted(false) }}>Cancel</button>
        }>
          {formSubmitted ? (
            <div className="success-panel"><h3>Supporter added</h3><p>The new supporter profile has been recorded. In production this would POST to <code>/supporters</code>.</p></div>
          ) : (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                const form = event.currentTarget
                if (!form.checkValidity()) {
                  form.reportValidity()
                  return
                }
                setFormSubmitted(true)
              }}
            >
              <label className="full-span">
                Full name / organization
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  pattern={NAME_INPUT_PATTERN}
                  title={NAME_INPUT_TITLE}
                  placeholder="e.g. Maria dela Cruz"
                />
              </label>
              <label>
                Supporter type
                <select defaultValue="Monetary donor">
                  <option>Monetary donor</option>
                  <option>Volunteer</option>
                  <option>Skills contributor</option>
                  <option>In-kind donor</option>
                  <option>Social media advocate</option>
                </select>
              </label>
              <label>
                Status
                <select defaultValue="Active"><option>Active</option><option>Inactive</option></select>
              </label>
              <label className="full-span">Email<input type="email" maxLength={254} placeholder="email@example.com" /></label>
              <label className="full-span">Region / location<input minLength={2} maxLength={120} placeholder="e.g. Metro Manila" /></label>
              <button className="primary-button full-span" type="submit">Save supporter</button>
            </form>
          )}
        </Surface>
      ) : null}

      <Surface
        title="Supporter directory"
        subtitle="All registered supporters — monetary donors, volunteers, and skills contributors."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusPill tone={supporters.source === 'live' ? 'success' : 'warning'}>
              {supporters.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
            <button className="primary-button" onClick={() => { setShowForm(true); setFormSubmitted(false) }}>+ Add supporter</button>
          </div>
        }
      >
        <FilterToolbar>
          <label>
            Search supporters
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, type, or region" />
          </label>
          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>At risk</option>
            </select>
          </label>
        </FilterToolbar>
        {supporters.isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : null}
        {supporters.error ? (
          <ErrorState title="Using prepared supporter fallback" description={supporters.error} />
        ) : null}
        {filteredSupporters.length === 0 ? (
          <EmptyState title="No matching supporters" description="Try another status or broaden the search." />
        ) : (
        <DataTable
          columns={['Name', 'Type', 'Region', 'Status', 'Channel']}
          rows={filteredSupporters.map((supporter) => [
            asText(supporter.displayName, '—'),
            asText(supporter.supporterType, '—'),
            asText(supporter.region, '—'),
            <StatusPill tone={supporter.status === 'At risk' ? 'warning' : 'success'}>{supporter.status}</StatusPill>,
            asText(supporter.acquisitionChannel, '—'),
          ])}
        />
        )}
      </Surface>
      <Surface
        title="Retention watchlist"
        subtitle={
          donorRiskFeed.data.trainedAt
            ? `${summarizeMlMetrics(donorRiskFeed.data.metrics)}. Refreshed ${formatMlTimestamp(donorRiskFeed.data.trainedAt)}.`
            : 'Nightly donor-retention retraining publishes the latest supporter watchlist here.'
        }
      >
        {donorRiskFeed.isLoading ? (
          <SkeletonTable rows={5} cols={4} />
        ) : donorRiskFeed.error ? (
          <ErrorState title="Could not load retention watchlist" description={donorRiskFeed.error} />
        ) : donorRiskFeed.data.predictions.length === 0 ? (
          <EmptyState title="No retention watchlist yet" description="Run the nightly ML refresh to publish supporter lapse-risk predictions." />
        ) : (
          <DataTable
            columns={['Supporter', 'Recommendation', 'Signal', 'Score']}
            rows={donorRiskFeed.data.predictions.map((prediction) => {
              const context = asRecord(prediction.context)
              return [
                asText(prediction.entityLabel, prediction.entityKey),
                asText(context.recommended_action, 'Queue a stewardship touchpoint.'),
                <StatusPill tone={getMlSignalTone('donor_retention', prediction.predictionScore)}>
                  {getMlSignalLabel('donor_retention', prediction.predictionScore)}
                </StatusPill>,
                formatMlScore(prediction.predictionScore),
              ]
            })}
          />
        )}
      </Surface>
    </PageSection>
  )
}
