export default function Marquee({ person }) {
  return (
    <header className="marquee">
      <div className="marquee__board">
        <p className="marquee__eyebrow">Now showing</p>
        <h1 className="marquee__name">{person.name}</h1>
        <p className="marquee__role">{person.role}</p>
      </div>
    </header>
  )
}
