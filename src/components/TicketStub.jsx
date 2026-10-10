export default function TicketStub({ film, index, count }) {
  return (
    <article className="ticket" aria-labelledby="ticket-title">
      <div className="ticket__main">
        <p className="ticket__meta">
          Screen 1 · Reel {index + 1} of {count}
        </p>
        <h2 id="ticket-title" className="ticket__title">
          {film.kind === 'title' ? 'About me' : film.title}
        </h2>
        <p className="ticket__blurb">{film.blurb}</p>

        {film.features && (
          <ul className="ticket__features">
            {film.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}

        {film.tags && (
          <ul className="ticket__tags" aria-label="Technologies">
            {film.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}

        <div className="ticket__actions">
          {film.links.map((l) => (
            <a
              key={l.href}
              className={`btn${l.primary ? ' btn--primary' : ''}`}
              href={l.href}
              target="_blank"
              rel="noreferrer"
            >
              {l.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>

      <div className="ticket__stub" aria-hidden="true">
        <span>Admit one</span>
        <span className="ticket__no">No. {String(index + 1).padStart(3, '0')}</span>
      </div>
    </article>
  )
}
