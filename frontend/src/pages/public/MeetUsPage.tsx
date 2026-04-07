import { directorPhotos } from '../../siteImages'

const bios: Record<string, string> = {
  'Julie Hernando': 'Guides Beacon’s mission, care vision, and long-term partnerships with steady stewardship, practical leadership, and a deep commitment to protecting children with dignity and consistency.',
  'Lance Platt': 'Supports governance and strategy with a practical focus on stewardship, accountability, and durable decision-making that strengthens Beacon’s long-term care and organizational direction.',
  'Candace Kunze': 'Stewards board operations and communication with clarity, continuity, and care.',
  'Kalli Kamauoha-Wilson': 'Brings mission-aligned leadership centered on child advocacy and sustainable support.',
  'Russell J. Osguthorpe': 'Offers values-based guidance that strengthens Beacon’s long-term educational vision.',
  'Apple Lanman': 'Supports mission-centered growth through service, community care, and thoughtful counsel.',
  'Steven Shraedel': 'Provides practical leadership support grounded in stewardship and durable organizational care.',
}

export function MeetUsPage() {
  const featured = directorPhotos.slice(0, 2)
  const remaining = directorPhotos.slice(2)

  return (
    <div className="public-page meet-us-page">
      <section className="meet-us-intro">
        <span className="eyebrow">MEET US</span>
        <h1>The people guiding Beacon</h1>
        <p>
          Beacon’s leadership brings steady stewardship, compassionate care, and long-term commitment to protecting
          children and supporting recovery.
        </p>
      </section>

      <section className="meet-us-featured">
        {featured.map((person) => (
          <article key={person.name} className="meet-us-featured-card">
            <div className="meet-us-featured-photo">
              <img
                src={person.src}
                alt={person.name}
                loading="lazy"
                style={person.objectPosition ? { objectPosition: person.objectPosition } : undefined}
              />
            </div>
            <div className="meet-us-featured-body">
              <span className="meet-us-card-label">Featured leadership</span>
              <h2>{person.name}</h2>
              <p className="meet-us-role">{person.title ?? 'Board leadership'}</p>
              <p className="meet-us-bio meet-us-bio-featured">{bios[person.name]}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="meet-us-grid-section">
        <div className="organization-section-heading">
          <span className="eyebrow">BOARD AND ADVISORS</span>
          <h2>People serving across Beacon</h2>
          <p>Board members and advisors helping steward continuity, accountability, and mission-centered growth.</p>
        </div>
        <div className="meet-us-grid">
          {remaining.map((person) => (
            <article key={person.name} className="meet-us-card">
              <div className="meet-us-card-photo">
                <img
                  src={person.src}
                  alt={person.name}
                  loading="lazy"
                  style={person.objectPosition ? { objectPosition: person.objectPosition } : undefined}
                />
              </div>
              <div className="meet-us-card-body">
                <h3>{person.name}</h3>
                <p className="meet-us-role">{person.title ?? 'Board leadership'}</p>
                <p className="meet-us-bio meet-us-bio-grid">{bios[person.name]}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
