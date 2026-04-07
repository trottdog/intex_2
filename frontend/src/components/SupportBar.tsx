export function SupportBar({ label, count, total, color, emphasized, tooltip }: { label: string; count: number; total: number; color: string; emphasized?: boolean; tooltip?: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className={`support-bar-row${emphasized ? ' support-bar-row--primary' : ''}`}>
      <div className="support-bar-header">
        <span className="support-bar-label">
          {label}
          {tooltip ? (
            <span className="support-bar-tip" aria-label={tooltip}>
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="7.5" fill="none" stroke="currentColor" strokeWidth="1" /><text x="8" y="12" textAnchor="middle" fontSize="11" fontWeight="600">?</text></svg>
              <span className="support-bar-tip-text">{tooltip}</span>
            </span>
          ) : null}
        </span>
        <span className="support-bar-count">{count.toLocaleString()}</span>
      </div>
      <div className="support-bar-track">
        <span className="support-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
