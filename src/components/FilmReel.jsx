export default function FilmReel({ films, index, onSelect }) {
  return (
    <nav className="reel" aria-label="Choose a film">
      <ol className="reel__strip">
        {films.map((f, i) => (
          <li key={f.id}>
            <button
              className={`reel__frame${i === index ? ' is-active' : ''}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => onSelect(i)}
            >
              {f.poster ? (
                <img src={f.poster} alt="" />
              ) : (
                <span className="reel__titleframe">{f.title}</span>
              )}
              <span className="reel__label">{f.short}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
