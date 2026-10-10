import { useCallback, useEffect, useState } from 'react'
import { films, person } from './data/films.js'
import Marquee from './components/Marquee.jsx'
import Theater from './components/Theater.jsx'
import TicketStub from './components/TicketStub.jsx'
import FilmReel from './components/FilmReel.jsx'

// Computed once when the module loads, not on every render (keeps render "pure").
const YEAR = new Date().getFullYear()

export default function App() {
  // The one piece of state: which film is on the screen.
  const [index, setIndex] = useState(0)
  const count = films.length

  // Step forward/back, wrapping around the reel.
  const go = useCallback((step) => setIndex((i) => (i + step + count) % count), [count])

  // Arrow keys change the film (unless the user is typing somewhere).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select')) return
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const film = films[index]

  return (
    <div className="cinema">
      <Marquee person={person} />
      <Theater film={film} index={index} count={count} onPrev={() => go(-1)} onNext={() => go(1)} />
      <section className="lobby">
        {/* key={film.id} remounts the ticket so its entrance animation replays */}
        <TicketStub key={film.id} film={film} index={index} count={count} />
        <FilmReel films={films} index={index} onSelect={setIndex} />
      </section>
      <footer className="credits">
        <p>
          © {YEAR} {person.name} · Built with Vite + React ·{' '}
          <a href={person.links.github} target="_blank" rel="noreferrer">GitHub</a> ·{' '}
          <a href={person.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        </p>
      </footer>
    </div>
  )
}
