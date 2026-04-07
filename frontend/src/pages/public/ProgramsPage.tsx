import { siteImages } from '../../siteImages'

export function ProgramsPage() {
  const pillars: Array<{ title: string; body: string; img: string }> = [
    {
      title: 'Caring',
      body: 'Stabilization, basic needs, and safehouse support for immediate safety and recovery.',
      img: siteImages.programCaring,
    },
    {
      title: 'Healing',
      body: 'Counseling, case conferences, and structured follow-up for long-term recovery.',
      img: siteImages.programHealing,
    },
    {
      title: 'Teaching',
      body: 'Education, readiness, and life-skills support that connects progress to reintegration.',
      img: siteImages.programTeaching,
    },
  ]

  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">Programs</span>
        <h1>Organize care around caring, healing, and teaching.</h1>
        <p>Programs should make it obvious how safehouse care, counseling, education, and reintegration support fit together.</p>
      </section>
      <section className="programs-pillars">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="program-pillar-card">
            <div className="program-pillar-visual">
              <img src={pillar.img} alt="" />
            </div>
            <h2>{pillar.title}</h2>
            <p>{pillar.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
