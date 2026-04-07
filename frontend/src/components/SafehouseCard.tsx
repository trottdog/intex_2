import type { Safehouse } from '../data/mockData'
import { asFiniteNumber } from '../utils/helpers'

export function SafehouseCard({ safehouse }: { safehouse: Safehouse }) {
  const occupancy = asFiniteNumber(safehouse.currentOccupancy)
  const capacity = Math.max(1, asFiniteNumber(safehouse.capacityGirls))
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100))
  const isActive = /active|open/i.test(safehouse.status)
  const isFull = isActive && pct >= 95

  return (
    <article className="safehouse-card">
      <div className="safehouse-card-header">
        <div>
          <strong className="safehouse-card-name">{safehouse.name}</strong>
          <p className="safehouse-card-location">{safehouse.city}, {safehouse.region}</p>
        </div>
        <div className="safehouse-card-badges">
          {isActive && !isFull && <span className="safehouse-badge safehouse-badge--active">Active</span>}
          {isFull && <span className="safehouse-badge safehouse-badge--full">Full house</span>}
          {!isActive && <span className="safehouse-badge safehouse-badge--neutral">{safehouse.status}</span>}
        </div>
      </div>
      <div className="safehouse-card-capacity">
        <div className="safehouse-capacity-bar">
          <span className="safehouse-capacity-fill" style={{ width: `${pct}%` }} data-level={pct >= 90 ? 'high' : pct >= 50 ? 'mid' : 'low'} />
        </div>
        <span className="safehouse-capacity-text">{occupancy}/{capacity}</span>
      </div>
    </article>
  )
}
