import { useRef } from 'react'

// [left position in %, size] for each silhouette in the row in front of you.
const HEADS = [
  [3, 58], [11, 66], [19, 54], [28, 70], [36, 60], [45, 64],
  [54, 56], [62, 72], [71, 58], [79, 66], [88, 54], [96, 62],
]

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TitleCard({ film }) {
  return (
    <div className="titlecard">
      <p className="titlecard__small">A</p>
      <p className="titlecard__name">{film.title}</p>
      <p className="titlecard__small">Production</p>
      <p className="titlecard__role">{film.tagline}</p>
      <p className="titlecard__hint">Use ← → or swipe to change the reel</p>
    </div>
  )
}

export default function Theater({ film, index, count, onPrev, onNext }) {
  // Swipe support: remember where the pointer went down, compare on release.
  const startX = useRef(null)
  const onPointerDown = (e) => {
    startX.current = e.clientX
  }
  const onPointerUp = (e) => {
    if (startX.current == null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > 50) (dx < 0 ? onNext : onPrev)()
  }

  return (
    <section className="auditorium" aria-roledescription="carousel" aria-label="Portfolio projects">
      <div className="valance" aria-hidden="true" />
      <div className="curtain curtain--left" aria-hidden="true" />
      <div className="curtain curtain--right" aria-hidden="true" />

      <div className="stage">
        <button className="nav" onClick={onPrev} aria-label="Previous film">
          <Chevron dir="left" />
        </button>

        <div className="screen-wrap">
          <div
            className="screen"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}: ${film.title}`}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (startX.current = null)}
          >
            {/* Changing the key makes React mount a fresh element, which replays the CSS animations */}
            <div className="screen__picture" key={`pic-${film.id}`}>
              {film.kind === 'title' ? (
                <TitleCard film={film} />
              ) : (
                <img src={film.poster} alt={film.posterAlt} draggable="false" />
              )}
            </div>
            <div className="screen__leader" key={`leader-${index}`} aria-hidden="true">
              <span className="leader-2">2</span>
              <span className="leader-1">1</span>
            </div>
            <div className="screen__grain" aria-hidden="true" />
            <div className="screen__vignette" aria-hidden="true" />
          </div>
          <div className="beam" aria-hidden="true" />
        </div>

        <button className="nav" onClick={onNext} aria-label="Next film">
          <Chevron dir="right" />
        </button>
      </div>

      <div className="audience" aria-hidden="true">
        {HEADS.map(([left, size]) => (
          <span key={left} className="head" style={{ left: `${left}%`, '--s': size }} />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        Now showing: {film.title}
      </p>
    </section>
  )
}
