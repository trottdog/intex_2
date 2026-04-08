import { useMemo, useState } from 'react'
import type { ImpactMetricsPublic, PublicDonationSummary, Safehouse } from '../../data/mockData'
import { useApiResource } from '../../lib/api'
import { EmptyState, ErrorState } from '../../components/ui'
import { SkeletonStatCard } from '../../components/ui'
import { AppLink } from '../../components/ui'
import { ImpactStatCard } from '../../components/ImpactStatCard'
import { SupportBar } from '../../components/SupportBar'
import { SafehouseCard } from '../../components/SafehouseCard'
import { asFiniteNumber, asText, formatDonationTypeLabel, normalizeSupportKey } from '../../utils/helpers'
import { impactCurrency, emptyImpactMetrics, emptyDonationSummary, IMPACT_SUPPORT_COLORS, IMPACT_SUPPORT_TOOLTIPS } from '../../utils/constants'
import { siteImages } from '../../siteImages'

export function ImpactPage() {
  const metrics = useApiResource<ImpactMetricsPublic>('/public/impact', emptyImpactMetrics, { sessionCacheImpact: true })
  const safehouses = useApiResource<Safehouse[]>('/public/impact/safehouses', [], { sessionCacheImpact: true })
  const donationSummary = useApiResource<PublicDonationSummary>(
    '/public/impact/donation-summary',
    emptyDonationSummary,
    { sessionCacheImpact: true },
  )
  const [selectedMacroRegion, setSelectedMacroRegion] = useState<'Luzon' | 'Visayas' | 'Mindanao'>('Luzon')
  const loading = metrics.isLoading || safehouses.isLoading || donationSummary.isLoading

  const summaryRows = donationSummary.data.summaries ?? []
  const totalSummaryCount = summaryRows.reduce((sum, row) => sum + asFiniteNumber(row.count), 0)
  const totalSummaryAmount = summaryRows.reduce((sum, row) => sum + asFiniteNumber(row.amount), 0)

  const mixEntries = summaryRows
    .map((row, index) => {
      const count = asFiniteNumber(row.count)
      const label = formatDonationTypeLabel(row.donationType)
      const key = normalizeSupportKey(asText(row.donationType))
      return {
        key: `${key}-${index}`,
        label,
        count,
        color: IMPACT_SUPPORT_COLORS[key] ?? '#9ca3af',
        emphasized: key === 'monetary',
        tooltip: IMPACT_SUPPORT_TOOLTIPS[key],
      }
    })
    .filter((row) => row.count > 0)

  const timeCount = mixEntries
    .filter((e) => /time|hour|volunteer/i.test(e.label))
    .reduce((s, e) => s + e.count, 0)
  const inKindCount = mixEntries
    .filter((e) => /in.kind/i.test(e.label))
    .reduce((s, e) => s + e.count, 0)

  const safehousesByMacroRegion = useMemo(() => {
    const byRegion = {
      Luzon: [] as Safehouse[],
      Visayas: [] as Safehouse[],
      Mindanao: [] as Safehouse[],
      Other: [] as Safehouse[],
    }
    for (const house of safehouses.data) {
      const regionName = asText(house.region)
      if (/luzon|ncr|metro manila|manila|cagayan valley|ilocos|cordillera|calabarzon|mimaropa|bicol/i.test(regionName)) {
        byRegion.Luzon.push(house)
      } else if (/visayas|cebu|iloilo|bohol|negros|samar|leyte/i.test(regionName)) {
        byRegion.Visayas.push(house)
      } else if (/mindanao|davao|zamboanga|caraga|soccsksargen|bangsamoro/i.test(regionName)) {
        byRegion.Mindanao.push(house)
      } else {
        byRegion.Other.push(house)
      }
    }
    return byRegion
  }, [safehouses.data])

  const housesInSelectedRegion = safehousesByMacroRegion[selectedMacroRegion]

  const statIcons = {
    heart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    currency: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-4a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4H8" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
    people: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  }

  return (
    <div className="public-page impact-page">
      <section className="impact-hero">
        <div className="impact-hero-oval" aria-label="Impact hero">
          <img className="impact-hero-image" src={siteImages.impactHero} alt="Children holding hands at the beach" />
          <div className="impact-hero-overlay">
            <h1>Our Impact</h1>
            <p>Real outcomes for residents and safehouses across the Philippines</p>
          </div>
        </div>
      </section>

      {!loading && metrics.error ? (
        <ErrorState className="error-state--plain" title="Could not reach the API" description={metrics.error} />
      ) : null}

      <section className="impact-stats-grid">
        {loading ? (
          <>{Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}</>
        ) : (
          <>
            <ImpactStatCard
              icon={statIcons.heart}
              value={asFiniteNumber(metrics.data.donationCount).toLocaleString()}
              label="Donations"
            />
            <ImpactStatCard
              icon={statIcons.currency}
              value={impactCurrency.format(metrics.data.totalDonationAmount)}
              label="Total raised"
            />
            <ImpactStatCard
              icon={statIcons.people}
              value={asFiniteNumber(metrics.data.residentCount).toLocaleString()}
              label="Residents served"
            />
            <ImpactStatCard
              icon={statIcons.home}
              value={asFiniteNumber(metrics.data.safehouseCount).toLocaleString()}
              label="Safehouses"
            />
          </>
        )}
      </section>

      {!loading && (
        <section className="impact-section">
          <h2 className="impact-section-title">How Support Is Used</h2>
          <p className="impact-section-subtitle">Every contribution makes a difference — here is how support breaks down.</p>

          {mixEntries.length === 0 ? (
            <EmptyState title="No donations yet" description="Donation data will appear once available." />
          ) : (
            <div className="impact-support-card">
              <div className="support-bars">
                {mixEntries.map((entry) => (
                  <SupportBar
                    key={entry.key}
                    label={entry.label}
                    count={entry.count}
                    total={totalSummaryCount}
                    color={entry.color}
                    emphasized={entry.emphasized}
                    tooltip={entry.tooltip}
                  />
                ))}
              </div>
              <div className="support-total">
                <span className="support-total-label">Total monetary impact</span>
                <strong className="support-total-value">{impactCurrency.format(totalSummaryAmount)}</strong>
              </div>
            </div>
          )}
        </section>
      )}

      {!loading && (totalSummaryAmount > 0 || inKindCount > 0 || timeCount > 0) && (
        <section className="impact-translation">
          <h2 className="impact-section-title">What This Means</h2>
          <div className="impact-translation-grid">
            {totalSummaryAmount > 0 && (
              <div className="impact-translation-card">
                <strong>{impactCurrency.format(totalSummaryAmount)} raised</strong>
                <p>supports {asFiniteNumber(metrics.data.safehouseCount)} safehouse{metrics.data.safehouseCount !== 1 ? 's' : ''} across the Philippines</p>
              </div>
            )}
            {inKindCount > 0 && (
              <div className="impact-translation-card">
                <strong>{inKindCount} in-kind donations</strong>
                <p>essential supplies delivered to residents</p>
              </div>
            )}
            {timeCount > 0 && (
              <div className="impact-translation-card">
                <strong>{timeCount * 2} hours</strong>
                <p>of mentorship and care sessions</p>
              </div>
            )}
          </div>
        </section>
      )}

      {!loading && (
        <section className="impact-section">
          <h2 className="impact-section-title">Safehouses by Region</h2>
          <p className="impact-section-subtitle">Select a region to view safehouse details and capacity.</p>

          {safehouses.data.length === 0 ? (
            <EmptyState title="No safehouses" description="Safehouse data will appear once available." />
          ) : (
            <>
              <div className="impact-region-toolbar">
                <label className="impact-region-field">
                  <span className="impact-region-label">Region</span>
                  <select
                    className="impact-region-select"
                    value={selectedMacroRegion}
                    onChange={(e) => setSelectedMacroRegion(e.target.value as 'Luzon' | 'Visayas' | 'Mindanao')}
                    aria-label="Filter safehouses by macro-region"
                  >
                    <option value="Luzon">Luzon</option>
                    <option value="Visayas">Visayas</option>
                    <option value="Mindanao">Mindanao</option>
                  </select>
                </label>
              </div>

              <div className="safehouse-grid">
                {housesInSelectedRegion.length === 0 ? (
                  <EmptyState
                    title={`No safehouses in ${selectedMacroRegion}`}
                    description="Try another region, or facilities may be listed under other regional groupings."
                  />
                ) : (
                  housesInSelectedRegion.map((safehouse) => (
                    <SafehouseCard key={safehouse.safehouseId} safehouse={safehouse} />
                  ))
                )}
              </div>
            </>
          )}
        </section>
      )}

      <section className="impact-closing">
        <blockquote>
          "I found sisters, safety, and people who believed I could dream again."
        </blockquote>
        <div className="impact-closing-links">
          <AppLink to="/donate" className="impact-closing-cta">Get involved</AppLink>
        </div>
      </section>
    </div>
  )
}
