// Photos: when a headshot is ready, drop it in src/assets/team/ and add
//   import jamiePhoto from '../assets/team/jamie.jpg'
// then set `photo: jamiePhoto` on that person. Until then the card shows a
// tinted placeholder with their initial.
//
// IMPORTANT: the `bio` lines below are placeholders written from each job
// title only. Replace them with a line each person has approved.
const TEAM = [
    {
      name: 'Jamie',
      title: 'Co-founder & CEO',
      bio: 'Leads company strategy and product direction at CVIQ.',
      linkedin: 'https://www.linkedin.com/in/jamiemoorearthur',
      photo: null,
      tint: ['#dbeafe', '#eff6ff', '#1d4ed8'],
    },
    {
      name: 'Seyi',
      title: 'CTO',
      bio: 'Leads the technical architecture and backend systems behind CVIQ.',
      linkedin: 'https://www.linkedin.com/in/oluwaseyi-bello-2653a2215',
      photo: null,
      tint: ['#dcfce7', '#f0fdf4', '#15803d'],
    },
    {
      name: 'Divine',
      title: 'Head of Marketing',
      bio: 'Leads marketing and growth, bringing CVIQ to job seekers.',
      linkedin: 'https://www.linkedin.com/in/divine-winner-kangolo-b87a84183',
      photo: null,
      tint: ['#fef3c7', '#fffbeb', '#b45309'],
    },
    {
      name: 'Rochelle',
      title: 'Head of Front-End Engineering',
      bio: 'Leads front-end engineering and the web experience users see.',
      linkedin: 'https://www.linkedin.com/in/rochellesmith2003',
      photo: null,
      tint: ['#fce7f3', '#fdf2f8', '#be185d'],
    },
    {
      name: 'Sade',
      title: 'Lead Design Engineer',
      bio: 'Leads design engineering, turning the product vision into polished interfaces.',
      linkedin: 'https://www.linkedin.com/in/sade-s-aa4aa32a2',
      photo: null,
      tint: ['#e0e7ff', '#eef2ff', '#4338ca'],
    },
  ]
  
  export default function TeamSection() {
    return (
      <section className="b-section b-team reveal" id="team">
        <div className="b-section-head">
          <div className="b-label">Our team</div>
          <h2 className="b-h2">The people<br />building it.</h2>
          <p className="b-section-sub">A small team focused on making CV reviews genuinely useful.</p>
        </div>
  
        <div className="b-team-grid">
          {TEAM.map((p) => (
            <article key={p.name} className="b-team-card">
              <div
                className="b-team-photo"
                style={{ '--tint-a': p.tint[0], '--tint-b': p.tint[1], '--tint-ink': p.tint[2] }}
              >
                {p.photo ? (
                  <img src={p.photo} alt={`${p.name}, ${p.title}`} loading="lazy" />
                ) : (
                  <span className="b-team-initial" aria-hidden="true">{p.name.charAt(0)}</span>
                )}
              </div>
  
              <div className="b-team-body">
                <div className="b-team-role">{p.title}</div>
                <h3 className="b-team-name">{p.name}</h3>
                <p className="b-team-bio">{p.bio}</p>
                <a
                  className="b-team-linkedin"
                  href={p.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.name} on LinkedIn (opens in a new tab)`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }