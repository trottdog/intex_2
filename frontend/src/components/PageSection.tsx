import type { ReactNode } from 'react'

export function PageSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="app-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Beacon workspace</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <div className="page-stack">{children}</div>
    </section>
  )
}
