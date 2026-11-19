// Talks to the chat API (chat-api/, a Vercel Function). VITE_CHAT_API_URL is baked
// in at build time; production sets it in .github/workflows/deploy.yml.
// With no value it defaults to /api/chat, which GitHub Pages does not serve.
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
