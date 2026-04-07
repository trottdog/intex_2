export function ProgramSpotlightCard({
  title,
  description,
  image,
}: {
  title: string
  description: string
  image: string
}) {
  return (
    <article className="spotlight-card spotlight-program-card">
      <div className="spotlight-image-wrap">
        <img src={image} alt={title} loading="lazy" />
      </div>
      <div className="spotlight-card-body">
        <span className="eyebrow">Program</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  )
}
