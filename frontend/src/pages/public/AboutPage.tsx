import { siteImages, directorPhotos } from '../../siteImages'

export function AboutPage() {
  return (
    <div className="public-page">
      <section className="page-hero compact">
        <span className="eyebrow">About Beacon</span>
        <h1>Safety, healing, and empowerment — one child at a time.</h1>
        <p>Beacon provides residential care, professional rehabilitation, and family reintegration for child survivors of trafficking and abuse in the Philippines.</p>
      </section>
      <section className="feature-band">
        <div>
          <h2>Safe haven</h2>
          <p>Two residential shelters offering safe, stable homes for female survivors ages 8 to 18.</p>
        </div>
        <div>
          <h2>Rehabilitation</h2>
          <p>Counseling, medical care, individualized education, and daily support for every child in our care.</p>
        </div>
        <div>
          <h2>Reintegration</h2>
          <p>Coordinating with the DSWD to reunite children with birth, foster, or adoptive families through guided transition.</p>
        </div>
      </section>
      <section className="about-mission-section">
        <div className="about-mission-image-wrap">
          <img src={siteImages.featureMl} alt="Resident celebrating freedom on the beach" loading="lazy" />
        </div>
        <div className="about-mission-body">
          <span className="about-mission-eyebrow">Get to know Us</span>
          <blockquote className="about-mission-quote">
            Beacon is a 501c3 organization created to meet the needs of children-survivors of sexual abuse
            and sex trafficking in the Philippines by providing a safe haven and professional rehabilitation
            services so children can successfully reintegrate back into family life and society.
          </blockquote>
          <p>
            There is a great need for residential shelters in the Philippines for children who are trapped
            in abuse or who are sexually trafficked. Beacon has stepped up to fill the need for female
            survivors between the ages of 8 to 18.
          </p>
          <p>
            Beacon operates two residential-style shelters, each caring for up to 20 children. Children
            are rescued by the local police department or anti-trafficking agents who refer them through
            the Department of Social Welfare and Development (DSWD). Our social workers assist each child
            in transitioning safely into their new environment.
          </p>
          <p>
            Once in the home, children receive counseling, medical services, daily needs, and an
            individualized education. Partners of Beacon work toward justice for each child and coordinate
            with the DSWD to find suitable families—whether birth, foster, or adoptive—providing family
            counseling to support every transition.
          </p>
        </div>
      </section>
      <section className="testimonials-section">
        <h2 className="testimonials-heading">In their own words</h2>
        <p className="testimonials-lede">Hear from the young women whose lives have been changed by Beacon.</p>
        <div className="testimonials-grid">
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>Beacon was the light in my life during the times when I wanted to give up. It was an answered prayer for me that I could go to a safe place like Beacon Sanctuary.</p>
              <p>One thing I love about Beacon is how we are able to love one another, be a support system, and let love prevail in our lives.</p>
            </blockquote>
            <cite>— Resident, age 16</cite>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>Beacon for me is a family. The staff helped me understand myself and my life circumstances. They helped me find answers to my questions and they gave me the love and attention I never had from my own family.</p>
              <p>I will never forget the time when I was at my lowest and the Mamas and the management gave me comfort and told me that all of my sufferings had purpose. During that time I found relief and hope. I'm also grateful that we got to celebrate our birthdays there — it made us feel seen and loved.</p>
            </blockquote>
            <cite>— Resident, age 15</cite>
          </article>
          <article className="testimonial-card">
            <div className="testimonial-quote-icon" aria-hidden="true">"</div>
            <blockquote>
              <p>One thing I will always remember from my stay is how we, residents, created such a beautiful connection. Sometimes we had misunderstandings or conflicts, but we learned to forgive, understand our imperfections, and most of all, love our sisters.</p>
              <p>We built a long-term support system that checks on each other even after leaving the shelter.</p>
            </blockquote>
            <cite>— Resident, age 15</cite>
          </article>
        </div>
      </section>
      <section className="directors-section">
        <h2 className="directors-heading">Leadership</h2>
        <p className="directors-lede">People guiding Beacon and the Beacon platform partnership.</p>
        <div className="director-grid">
          {directorPhotos.map((person) => (
            <article key={person.src} className="director-card">
              <div className="director-photo-wrap">
                <img src={person.src} alt={person.name} loading="lazy" />
              </div>
              <h3>{person.name}</h3>
              {person.title ? <p className="director-title">{person.title}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
