import { useState } from 'react'
import type { Donation } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import {
  AppLink,
  DataTable,
  EmptyState,
  ErrorState,
  FilterToolbar,
  SkeletonTable,
  StatusPill,
  Surface,
} from '../../components/ui'
import { PageSection } from '../../components/PageSection'
import { asLowerText, asText, formatAmount } from '../../utils/helpers'

export function ContributionsPage() {
  const donations = useApiResource<Donation[]>('/donations', [])
  const [campaignFilter, setCampaignFilter] = useState('All campaigns')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const campaignOptions = Array.from(new Set(donations.data.map((donation) => asText(donation?.campaignName).trim()))).filter(Boolean)
  const normalizedSearch = asLowerText(search)
  const filteredDonations = donations.data.filter((donation) => {
    const matchesCampaign =
      campaignFilter === 'All campaigns' || asText(donation?.campaignName).trim() === campaignFilter
    const q = normalizedSearch
    const matchesSearch =
      asLowerText(donation?.campaignName).includes(q) ||
      asLowerText(donation?.channelSource).includes(q) ||
      asLowerText(donation?.donationType).includes(q)
    return matchesCampaign && matchesSearch
  })

  return (
    <PageSection title="Contributions" description="Record, view, and manage all donation activity — monetary, in-kind, time, skills, and social media.">
      {showForm ? (
        <Surface title="Record donation" subtitle="Log a new contribution against a supporter profile." actions={
          <button className="secondary-button" onClick={() => { setShowForm(false); setFormSubmitted(false) }}>Cancel</button>
        }>
          {formSubmitted ? (
            <div className="success-panel"><h3>Donation recorded</h3><p>The contribution has been saved. In production this would POST to <code>/donations</code>.</p></div>
          ) : (
            <form className="form-grid" onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true) }}>
              <label className="full-span">Supporter name / ID<input required placeholder="e.g. Maria dela Cruz or supporter ID" /></label>
              <label>
                Donation type
                <select defaultValue="Monetary">
                  <option>Monetary</option>
                  <option>In-kind</option>
                  <option>Volunteer time</option>
                  <option>Skills</option>
                  <option>Social media</option>
                </select>
              </label>
              <label>Amount (PHP)<input type="number" min="0" placeholder="0" /></label>
              <label className="full-span">Campaign<input placeholder="e.g. Spring Stability Fund" /></label>
              <label>Date<input type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
              <label>
                Program area
                <select defaultValue="Caring"><option>Caring</option><option>Healing</option><option>Teaching</option></select>
              </label>
              <button className="primary-button full-span" type="submit">Save donation</button>
            </form>
          )}
        </Surface>
      ) : null}

      <Surface
        title="Donations"
        subtitle="All recorded contributions — monetary, in-kind, time, skills, and social media."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusPill tone={donations.source === 'live' ? 'success' : 'warning'}>
              {donations.source === 'live' ? 'Live data' : 'Fallback data'}
            </StatusPill>
            <button className="primary-button" onClick={() => { setShowForm(true); setFormSubmitted(false) }}>+ Record donation</button>
          </div>
        }
      >
        <FilterToolbar>
          <label>
            Search contributions
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Campaign, source, or type" />
          </label>
          <label>
            Campaign
            <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)}>
              <option>All campaigns</option>
              {campaignOptions.map((campaign) => (
                <option key={campaign}>{campaign}</option>
              ))}
            </select>
          </label>
        </FilterToolbar>
        {donations.isLoading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : null}
        {donations.error ? (
          <ErrorState title="Using prepared contribution fallback" description={donations.error} />
        ) : null}
        {filteredDonations.length === 0 ? (
          <EmptyState title="No matching contributions" description="Try another campaign or broaden the search." />
        ) : (
        <DataTable
          columns={['Date', 'Campaign', 'Type', 'Amount', 'Detail']}
          rows={filteredDonations.map((donation) => [
            asText(donation.donationDate, '—'),
            asText(donation.campaignName, '—'),
            asText(donation.donationType, '—'),
            formatAmount(donation.amount),
            <AppLink to={`/app/admin/contributions/${donation.donationId}`}>Open detail</AppLink>,
          ])}
        />
        )}
      </Surface>
    </PageSection>
  )
}
