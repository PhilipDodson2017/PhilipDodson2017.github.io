import { useCallback, useEffect, useRef, useState } from 'react'
import { sendChat } from './chat.js'
import './ChatWidget.css'

const GREETING = {
  role: 'assistant',
  content:
    "I'm Philip's warm intro. Ask me anything about his work, projects, or how to get in touch.",
}

// A small "box office" chat widget. It is intentionally self-contained: the
// only integration point is <ChatWidget /> in App.jsx. The backend lives in
// /worker and is called through VITE_CHAT_API_URL (see chat.js).
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // Focus the input when the panel opens; keep the log scrolled to the newest message.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  const submit = useCallback(
    async (e) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || busy) return

      const next = [...messages, { role: 'user', content: text }]
      setMessages(next)
      setInput('')
      setBusy(true)
      setError(null)

      try {
        const reply = await sendChat(next)
        setMessages((m) => [...m, { role: 'assistant', content: reply }])
      } catch (err) {
        setError(err.message)
      } finally {
        setBusy(false)
      }
    },
    [input, busy, messages],
  )

  return (
    <div className="chat-widget">
      <button
        type="button"
        className="chat-widget__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-widget-panel"
      >
        {open ? 'Close' : 'Ask about me'}
      </button>

      {open && (
        <section
          id="chat-widget-panel"
          className="chat-widget__panel"
          aria-label="Ask about Philip"
        >
          <header className="chat-widget__header">
            <p className="chat-widget__eyebrow">Box office</p>
            <h2 className="chat-widget__title">Ask about Philip</h2>
            <p className="chat-widget__sub">A warm intro, on demand.</p>
          </header>

          <div className="chat-widget__messages" ref={listRef} role="log" aria-live="polite">
            {messages.map((m, i) => (
              <p key={i} className={`chat-widget__message chat-widget__message--${m.role}`}>
                {m.content}
              </p>
            ))}
            {busy && <p className="chat-widget__message chat-widget__message--assistant">…</p>}
            {error && <p className="chat-widget__error">{error}</p>}
          </div>

          <form className="chat-widget__form" onSubmit={submit}>
            <input
              ref={inputRef}
              className="chat-widget__input"
              type="text"
              placeholder="Ask a question about me"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              aria-label="Ask a question about me"
            />
            <button type="submit" className="chat-widget__send" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
