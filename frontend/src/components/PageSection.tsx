import type { ReactNode } from 'react'

export function PageSection({
  title,
  description,
  showEyebrow = true,
  children,
}: {
  title: string
  description?: string
  showEyebrow?: boolean
  children: ReactNode
}) {
  return (
    <section className="app-page">
      <header className="page-header">
        <div>
          {showEyebrow ? <span className="eyebrow">Beacon workspace</span> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="page-stack">{children}</div>
    </section>
  )
}
