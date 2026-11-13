# Portfolio chat worker

A single-file Cloudflare Worker that powers the "Ask about me" box on
[philipdodson.dev](https://philipdodson.dev). It keeps the LLM key server-side
so the static React site never exposes it.

## Why a worker?

The site is static (GitHub Pages). A browser cannot call an LLM API without
shipping the key, so the widget posts to this worker, and the worker calls the
model.

## Deploy

```bash
cd worker
npm install -g wrangler        # once
npx wrangler login             # once
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler deploy
```

`wrangler deploy` prints the worker URL (e.g.
`https://philip-chat.<account>.workers.dev`). Set that as `VITE_CHAT_API_URL`
for the site build — locally in `.env.production`, and in the GitHub Actions
workflow env for production. Then merge the site PR.

## Contract

`POST /api/chat` with:

```json
{ "messages": [{ "role": "user", "content": "What does Philip build?" }] }
```

Returns:

```json
{ "reply": "..." }
```

CORS allows `https://philipdodson.dev`, `https://www.philipdodson.dev` and
`http://localhost:5173`.

## Editing the persona

The system prompt lives in `PERSONA` at the top of `chat.js`. Update it when
the portfolio content changes (or better: generate it from `src/data/films.js`).
