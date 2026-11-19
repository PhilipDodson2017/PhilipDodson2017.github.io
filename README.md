# Philip Dodson · Now Showing

Source for **[philipdodson.dev](https://philipdodson.dev)**: a portfolio styled as a movie theater, seen from your seat. Projects play on the screen; details are on the ticket.

Built with [Vite](https://vite.dev) + [React](https://react.dev).

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build    # production build in dist/
```

## Project layout

| Path | What it is |
|---|---|
| `src/data/films.js` | **All content** (projects, blurbs, links). Edit this to change what's showing. |
| `src/components/` | Marquee, Theater (screen + curtains + audience), TicketStub, FilmReel |
| `src/components/ChatWidget/` | Floating "Ask about me" box-office chat widget |
| `src/index.css` | All styles, including the responsive layouts (monitors → phones) |
| `public/` | Copied as-is into the site: posters, favicon, share card, `CNAME` |
| `social-card/card.html` | Template used to render `public/social-card.png` |
| `chat-api/` | Vercel Function backend for the chat widget (holds the LLM key) |

## Chatbot

The "Ask about me" widget is a static React component (`ChatWidget`) that posts
to a Vercel Function in `chat-api/`, deployed as its own Vercel project
(`philip-chat-api`). The function keeps the LLM key server-side, injects the
persona, and rejects foreign origins and non-JSON requests before calling the
model; a Vercel Firewall rule rate-limits it per IP. The site build gets the
URL from `VITE_CHAT_API_URL` in `.github/workflows/deploy.yml`. See
`chat-api/README.md`.

## Deploying

Merging a pull request into `master` deploys the site. The GitHub Actions workflow
(`.github/workflows/deploy.yml`) installs dependencies, lints, builds, and publishes
`dist/` to GitHub Pages. Pull requests run the same lint and build as a check
before merge.

---

© Philip Dodson. All rights reserved.
