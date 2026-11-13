// Talks to the chatbot backend. VITE_CHAT_API_URL is baked in at build time, so
// set it in .env.production (or the GitHub Actions env) to the deployed worker URL.
// With no value it defaults to /api/chat, which only works when a proxy is present.
const API_URL = import.meta.env.VITE_CHAT_API_URL || '/api/chat'

export async function sendChat(messages) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(
      `The box office is closed (${res.status}).${detail ? ` ${detail}` : ''}`,
    )
  }

  const data = await res.json()
  return data.reply
}
