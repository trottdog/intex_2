export function LeaderSpotlightCard({
  image,
  name,
  title,
  focus,
}: {
  image: string
  name: string
  title: string
  focus: string
}) {
  return (
    <article className="spotlight-card spotlight-leader-card">
      <div className="leader-photo-wrap">
        <img src={image} alt={name} loading="lazy" />
      </div>
      <div className="spotlight-card-body">
        <h3>{name}</h3>
        <p className="leader-title">{title}</p>
        <p>{focus}</p>
      </div>
    </article>
  )
}
