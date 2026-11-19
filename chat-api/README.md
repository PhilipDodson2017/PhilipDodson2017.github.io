# Portfolio chat API

The Vercel Function behind the "Ask about me" widget on
[philipdodson.dev](https://philipdodson.dev). It keeps the OpenRouter key
server-side so the static site (GitHub Pages) never ships it to the browser.

Production URL: `https://philip-chat-api.vercel.app/api/chat`

```
Browser (philipdodson.dev, GitHub Pages)
   │  POST {messages}  (cross-origin, so the CORS rules below apply)
   ▼
Vercel Firewall  ── over 20 POSTs / 10 min from one IP ──▶ 429, function never runs
   ▼
chat-api/api/chat.js
   │  403 unless Origin is philipdodson.dev / www.philipdodson.dev
   │  415 unless Content-Type is application/json
   │  adds persona, trims history, caps max_tokens
   ▼
OpenRouter  ──▶  DeepSeek v4.1 Flash (inference happens here)
```

## Abuse controls

Every control runs before the paid OpenRouter call.

| Control | Where | Stops |
|---|---|---|
| Origin allowlist, exact match (403) | `api/chat.js` | Other websites making their visitors' browsers spend credit |
| `Content-Type: application/json` only (415) | `api/chat.js` | Cross-origin `text/plain` POSTs, which browsers send without a CORS preflight |
| Per-IP rate limit (429) | Vercel Firewall rule (project setting, below) | One machine scripting thousands of calls |
| Monthly credit limit | OpenRouter key settings | Everything else; the only hard ceiling on cost |

`curl` can fake an `Origin` header, which is why the rate limit and the
credit limit exist. CORS only decides which pages may read a response.

`http://localhost:5173` is allowed everywhere except production
(`VERCEL_ENV=production`).

### Rate-limit rule (Vercel Firewall)

The rule is project configuration, not code, so it is recorded here.
Vercel project `philip-chat-api` → Firewall → Configure → New Rule:

| Field | Value |
|---|---|
| Name | `Rate limit chat API` |
| If | Request Path · Equals · `/api/chat` |
| And | Method · Equals · `POST` |
| Then | Rate Limit |
| Strategy | Fixed Window |
| Time Window | `600` s |
| Request Limit | `20` |
| Keys | IP |
| Action | Default (429) |

Then **Review Changes → Publish**. Hobby allows one rate-limit rule per
project; this is it. `OPTIONS` preflights are not counted because they never
reach OpenRouter.

Worst case per IP with this rule: 20 replies / 10 min = 2,880 / day. At
OpenRouter's list price for the default model ($0.15 / M input tokens,
$0.60 / M output tokens) that is about $0.58 / day for typical messages and
$3.17 / day if every request uses the maximum history (12 turns × 2,000
chars, 300 output tokens).

## Settings

Vercel project → Settings → Environment Variables:

| Name | Required | Notes |
|---|---|---|
| `OPENROUTER_API_KEY` | yes | Type **Sensitive**, Production environment |
| `OPENROUTER_MODEL` | no | Overrides the default `deepseek/deepseek-v4.1-flash-1017` |

## Deploy

The Vercel project is linked to this repo with **Root Directory `chat-api`**,
so pushes deploy it automatically: `master` → production, other branches →
protected previews. `vercel.json` skips the build when nothing under
`chat-api/` changed.

The site picks the URL up from `VITE_CHAT_API_URL` in
`.github/workflows/deploy.yml`.

## Test

```bash
npm --prefix chat-api test
```

21 tests, no dependencies. OpenRouter is replaced by a fake `fetch`, so each
test asserts whether a request would have cost money.

## Local development

Run the API with `npx vercel dev` inside `chat-api/` (serves
`http://localhost:3000/api/chat`), then put
`VITE_CHAT_API_URL=http://localhost:3000/api/chat` in the site's
`.env.development.local` and run `npm run dev` at the repo root.

## Contract

`POST /api/chat`, `Content-Type: application/json`:

```json
{ "messages": [{ "role": "user", "content": "What does Philip build?" }] }
```

Returns `{ "reply": "..." }`. Only `user`/`assistant` roles are kept, the
last 12 turns, 2,000 characters each.

## Editing the persona

The system prompt is `PERSONA` at the top of `api/chat.js`. Update it when the
portfolio content in `src/data/films.js` changes.
