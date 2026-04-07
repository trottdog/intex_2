import type { ReactNode } from 'react'

export function ImpactStatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <article className="impact-stat-card">
      <span className="impact-stat-icon">{icon}</span>
      <strong className="impact-stat-value">{value}</strong>
      <span className="impact-stat-label">{label}</span>
    </article>
  )
}
