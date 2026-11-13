// Cloudflare Worker: POST /api/chat
// Holds the LLM key so the static site never ships it to the browser.
//
// Deploy:  cd worker && npx wrangler deploy
// Secret:  npx wrangler secret put OPENROUTER_API_KEY
// The worker URL goes into the site's VITE_CHAT_API_URL at build time.

const PERSONA = `You are Philip Dodson's warm intro, a small assistant on his portfolio site. Answer questions about Philip's work, projects and how to reach him. Be concise (2-4 sentences), warm and specific. If you don't know, say so and point to LinkedIn or GitHub. Never invent facts.

Philip Dodson is a Senior Backend Python Engineer. He builds Python services and web tools. Projects: Square Timer (a sequential task timer at squaretimer.com), Story Matrix (a Claude Code skill for interview prep), Alternative Frontends (a Google start page where you choose how to search). Links: LinkedIn https://www.linkedin.com/in/philip-dodson-473159267/ and GitHub https://github.com/PhilipDodson2017.`

const ALLOWED_ORIGINS = new Set([
  'https://philipdodson.dev',
  'https://www.philipdodson.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://philipdodson.dev'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(origin),
      })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response('Bad JSON', { status: 400, headers: corsHeaders(origin) })
    }

    // Keep only the last 12 turns and only role/content — never trust extra fields.
    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
          .slice(-12)
          .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
      : []

    if (!messages.length) {
      return new Response('No messages', { status: 400, headers: corsHeaders(origin) })
    }

    if (!env.OPENROUTER_API_KEY) {
      return new Response('Worker is missing OPENROUTER_API_KEY', {
        status: 500,
        headers: corsHeaders(origin),
      })
    }

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://philipdodson.dev',
        'X-Title': 'Philip Dodson portfolio chat',
      },
      body: JSON.stringify({
        model: env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash-1017',
        messages: [{ role: 'system', content: PERSONA }, ...messages],
        max_tokens: 300,
        temperature: 0.4,
      }),
    })

    if (!upstream.ok) {
      return new Response(`Upstream error ${upstream.status}`, {
        status: 502,
        headers: corsHeaders(origin),
      })
    }

    const data = await upstream.json()
    const reply =
      data?.choices?.[0]?.message?.content ?? 'Sorry, I could not answer that.'

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    })
  },
}
