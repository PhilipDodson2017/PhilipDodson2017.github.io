// Run: npm --prefix chat-api test   (no dependencies; Node 20+)
//
// OpenRouter is replaced by a fake fetch so each test can assert whether a
// request would have cost money ("upstream called").
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { POST, OPTIONS } from '../api/chat.js'

const URL = 'https://philip-chat-api.vercel.app/api/chat'
const SITE = 'https://philipdodson.dev'
const realFetch = globalThis.fetch
let upstream // { calls, lastBody, lastHeaders, status }

beforeEach(() => {
  upstream = { calls: 0, lastBody: null, lastHeaders: null, status: 200 }
  globalThis.fetch = async (_url, init) => {
    upstream.calls++
    upstream.lastBody = JSON.parse(init.body)
    upstream.lastHeaders = init.headers
    return new Response(JSON.stringify({ choices: [{ message: { content: 'hi' } }] }), {
      status: upstream.status,
    })
  }
  process.env.OPENROUTER_API_KEY = 'test-key'
  delete process.env.OPENROUTER_MODEL
  delete process.env.VERCEL_ENV
})

afterEach(() => {
  globalThis.fetch = realFetch
})

function post({ origin = SITE, type = 'application/json', body } = {}) {
  const headers = {}
  if (origin) headers.Origin = origin
  if (type) headers['Content-Type'] = type
  return POST(
    new Request(URL, {
      method: 'POST',
      headers,
      body: body ?? JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    }),
  )
}

// Fix 1: Origin allowlist, enforced before any upstream call

test('allowed origin + JSON reaches OpenRouter and returns the reply', async () => {
  const res = await post()
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), SITE)
  assert.deepEqual(await res.json(), { reply: 'hi' })
  assert.equal(upstream.calls, 1)
})

test('www origin is allowed', async () => {
  const res = await post({ origin: 'https://www.philipdodson.dev' })
  assert.equal(res.status, 200)
})

test('foreign origin + text/plain (the no-preflight attack) is 403, upstream not called', async () => {
  const res = await post({ origin: 'https://evil.example', type: 'text/plain' })
  assert.equal(res.status, 403)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null)
  assert.equal(upstream.calls, 0)
})

test('foreign origin + JSON is 403, upstream not called', async () => {
  const res = await post({ origin: 'https://evil.example' })
  assert.equal(res.status, 403)
  assert.equal(upstream.calls, 0)
})

test('lookalike origin is 403 (exact match, not suffix)', async () => {
  const res = await post({ origin: 'https://evilphilipdodson.dev' })
  assert.equal(res.status, 403)
  assert.equal(upstream.calls, 0)
})

test('missing Origin (curl, scripts) is 403, upstream not called', async () => {
  const res = await post({ origin: null })
  assert.equal(res.status, 403)
  assert.equal(upstream.calls, 0)
})

test('localhost is allowed outside production', async () => {
  const res = await post({ origin: 'http://localhost:5173' })
  assert.equal(res.status, 200)
})

test('localhost is 403 in production', async () => {
  process.env.VERCEL_ENV = 'production'
  const res = await post({ origin: 'http://localhost:5173' })
  assert.equal(res.status, 403)
  assert.equal(upstream.calls, 0)
})

test('preflight from allowed origin is 204 with CORS headers', async () => {
  const res = OPTIONS(new Request(URL, { method: 'OPTIONS', headers: { Origin: SITE } }))
  assert.equal(res.status, 204)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), SITE)
  assert.equal(res.headers.get('Access-Control-Allow-Headers'), 'Content-Type')
  assert.equal(res.headers.get('Vary'), 'Origin')
})

test('preflight from foreign origin is 403 with no CORS headers', async () => {
  const res = OPTIONS(
    new Request(URL, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }),
  )
  assert.equal(res.status, 403)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null)
})

// Fix 2: JSON only

test('allowed origin + text/plain is 415, upstream not called', async () => {
  const res = await post({ type: 'text/plain' })
  assert.equal(res.status, 415)
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), SITE) // so the widget can read the error
  assert.equal(upstream.calls, 0)
})

test('allowed origin + form encoding is 415, upstream not called', async () => {
  const res = await post({ type: 'application/x-www-form-urlencoded' })
  assert.equal(res.status, 415)
  assert.equal(upstream.calls, 0)
})

test('missing Content-Type is 415, upstream not called', async () => {
  const res = await post({ type: null })
  assert.equal(res.status, 415)
  assert.equal(upstream.calls, 0)
})

test('application/json with charset parameter is accepted', async () => {
  const res = await post({ type: 'application/json; charset=utf-8' })
  assert.equal(res.status, 200)
})

// Behaviour carried over from the Cloudflare Worker

test('bad JSON is 400, upstream not called', async () => {
  const res = await post({ body: '{not json' })
  assert.equal(res.status, 400)
  assert.equal(upstream.calls, 0)
})

test('no user/assistant messages is 400, upstream not called', async () => {
  const res = await post({ body: JSON.stringify({ messages: [{ role: 'system', content: 'x' }] }) })
  assert.equal(res.status, 400)
  assert.equal(upstream.calls, 0)
})

test('missing key is 500, upstream not called', async () => {
  delete process.env.OPENROUTER_API_KEY
  const res = await post()
  assert.equal(res.status, 500)
  assert.equal(upstream.calls, 0)
})

test('upstream failure is 502', async () => {
  upstream.status = 429
  const res = await post()
  assert.equal(res.status, 502)
})

test('upstream request: persona first, default model, caps, bearer key', async () => {
  await post()
  const b = upstream.lastBody
  assert.equal(b.messages[0].role, 'system')
  assert.match(b.messages[0].content, /Philip Dodson/)
  assert.equal(b.model, 'deepseek/deepseek-v4.1-flash-1017')
  assert.equal(b.max_tokens, 300)
  assert.equal(upstream.lastHeaders.Authorization, 'Bearer test-key')
})

test('OPENROUTER_MODEL overrides the default model', async () => {
  process.env.OPENROUTER_MODEL = 'some/other-model'
  await post()
  assert.equal(upstream.lastBody.model, 'some/other-model')
})

test('history is trimmed to the last 12 turns and 2,000 chars each', async () => {
  const long = Array.from({ length: 20 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user',
    content: `${i}:` + 'x'.repeat(5000),
  }))
  await post({ body: JSON.stringify({ messages: long }) })
  const sent = upstream.lastBody.messages.slice(1) // drop persona
  assert.equal(sent.length, 12)
  assert.ok(sent[0].content.startsWith('8:'))
  assert.ok(sent.every((m) => m.content.length === 2000))
})
