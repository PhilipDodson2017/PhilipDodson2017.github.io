// Vercel Function: POST /api/chat, served at https://philip-chat-api.vercel.app/api/chat
//
// Holds the OpenRouter key so the static site (GitHub Pages) never ships it to the browser.
// Every check that can reject a request runs BEFORE the paid OpenRouter call:
//   1. Origin must be on the allowlist          -> 403   (stops other sites using visitors' browsers)
//   2. Content-Type must be application/json    -> 415   (forces browsers through the CORS preflight)
//   3. Per-IP rate limit                        -> 429   (Vercel Firewall rule, see ../README.md;
//                                                         it runs before this code is invoked)
//
// Secrets and settings (Vercel project -> Settings -> Environment Variables):
//   OPENROUTER_API_KEY  required, type Sensitive
//   OPENROUTER_MODEL    optional, overrides DEFAULT_MODEL

const PERSONA = `You are Philip Dodson's warm intro, a small assistant on his portfolio site. Answer questions about Philip's work, projects and how to reach him. Be concise (2-4 sentences), warm and specific. If you don't know, say so and point to LinkedIn or GitHub. Never invent facts.

Philip Dodson is a Senior Backend Python Engineer. He builds Python services and web tools. Projects: Square Timer (a sequential task timer at squaretimer.com), Story Matrix (a Claude Code skill for interview prep), Alternative Frontends (a Google start page where you choose how to search). Links: LinkedIn https://www.linkedin.com/in/philip-dodson-473159267/ and GitHub https://github.com/PhilipDodson2017.`

const DEFAULT_MODEL = 'deepseek/deepseek-v4.1-flash-1017'

// Exact matches only. A suffix or unanchored regex check would also accept
// lookalikes such as https://evilphilipdodson.dev.
const PRODUCTION_ORIGINS = ['https://philipdodson.dev', 'https://www.philipdodson.dev']
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

// VERCEL_ENV is 'production' on the live deployment, 'preview' on branch builds,
// 'development' under `vercel dev`, and unset in plain Node (tests).
export function allowedOrigins(env = process.env) {
  return new Set(
    env.VERCEL_ENV === 'production' ? PRODUCTION_ORIGINS : [...PRODUCTION_ORIGINS, ...DEV_ORIGINS],
  )
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

// Rejections for a disallowed origin carry no Access-Control-Allow-Origin header,
// so a browser on that origin cannot read them either.
function text(status, message, extraHeaders = {}) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Origin', ...extraHeaders },
  })
}

function isAllowed(origin) {
  return origin !== null && allowedOrigins().has(origin)
}

// CORS preflight. Browsers send this before a cross-origin JSON POST.
export function OPTIONS(request) {
  const origin = request.headers.get('Origin')
  if (!isAllowed(origin)) return text(403, 'Origin not allowed')
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(request) {
  // Fix 1: reject foreign origins server-side. Browsers set Origin and page
  // scripts cannot change it; a missing Origin (curl, server-to-server) is rejected too.
  const origin = request.headers.get('Origin')
  if (!isAllowed(origin)) return text(403, 'Origin not allowed')
  const cors = corsHeaders(origin)

  // Fix 2: only JSON. A text/plain POST skips the preflight, and request.json()
  // would parse it anyway, so it must be refused before parsing.
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase()
  if (type !== 'application/json') {
    return text(415, 'Content-Type must be application/json', cors)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return text(400, 'Bad JSON', cors)
  }

  // Keep only the last 12 turns and only role/content; never trust extra fields.
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
        .slice(-12)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }))
    : []

  if (!messages.length) return text(400, 'No messages', cors)

  const key = process.env.OPENROUTER_API_KEY
  if (!key) return text(500, 'Server is missing OPENROUTER_API_KEY', cors)

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://philipdodson.dev',
      'X-Title': 'Philip Dodson portfolio chat',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [{ role: 'system', content: PERSONA }, ...messages],
      max_tokens: 300,
      temperature: 0.4,
    }),
  })

  if (!upstream.ok) return text(502, `Upstream error ${upstream.status}`, cors)

  const data = await upstream.json()
  const reply = data?.choices?.[0]?.message?.content ?? 'Sorry, I could not answer that.'

  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
