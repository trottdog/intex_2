export function TestimonialSpotlightCard({
  quote,
  attribution,
}: {
  quote: string
  attribution: string
}) {
  return (
    <article className="spotlight-card spotlight-testimonial-card">
      <div className="testimonial-mark" aria-hidden="true">“</div>
      <blockquote>
        <p>{quote}</p>
      </blockquote>
      <cite>{attribution}</cite>
    </article>
  )
}
