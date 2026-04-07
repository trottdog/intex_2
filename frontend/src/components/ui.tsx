import type { ReactNode } from 'react'

export function AppLink({
  to,
  children,
  className,
}: {
  to: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }

        event.preventDefault()
        window.history.pushState({}, '', to)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
    >
      {children}
    </a>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </article>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-action">{action}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function LoadingState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="loading-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function Skeleton({ width, height, radius }: { width?: string; height?: string; radius?: string }) {
  return (
    <span
      className="skeleton-pulse"
      style={{ display: 'block', width: width ?? '100%', height: height ?? '1rem', borderRadius: radius ?? '6px' }}
    />
  )
}

export function SkeletonStatCard() {
  return (
    <article className="stat-card">
      <Skeleton width="60%" height="0.75rem" />
      <Skeleton width="40%" height="1.85rem" radius="8px" />
    </article>
  )
}

export function SkeletonTable({ rows = 3, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton width="70%" height="0.7rem" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><Skeleton width={`${50 + Math.round(Math.random() * 40)}%`} height="0.85rem" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonSurface({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <section className="surface">
      <div className="surface-header">
        <div>
          {title ? <h3>{title}</h3> : <Skeleton width="50%" height="1rem" />}
          <Skeleton width="70%" height="0.7rem" />
        </div>
      </div>
      {children ?? <SkeletonTable />}
    </section>
  )
}

export function SkeletonStackRows({ count = 3 }: { count?: number }) {
  return (
    <div className="stack-list">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stack-row" key={i}>
          <div>
            <Skeleton width="45%" height="0.85rem" />
            <Skeleton width="80%" height="0.7rem" />
          </div>
          <div className="align-right">
            <Skeleton width="60px" height="1.4rem" radius="99px" />
            <Skeleton width="90px" height="0.7rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="error-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function FilterToolbar({
  children,
}: {
  children: ReactNode
}) {
  return <div className="filter-toolbar">{children}</div>
}

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; to?: string }>
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb-item">
          {item.to ? <AppLink to={item.to}>{item.label}</AppLink> : <span>{item.label}</span>}
          {index < items.length - 1 ? <span className="breadcrumb-separator">/</span> : null}
        </span>
      ))}
    </nav>
  )
}

export function Surface({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="surface">
      <div className="surface-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="surface-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function StatusPill({
  tone,
  children,
}: {
  tone?: 'default' | 'success' | 'warning' | 'danger'
  children: ReactNode
}) {
  return <span className={`status-pill ${tone ?? 'default'}`}>{children}</span>
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
