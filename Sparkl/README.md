# ✨ Sparkl — *Find your spark*

A playful, AI-powered learning world for curious kids (ages 10–18). Children read a
colourful lesson, play a friendly quiz, and chat with **Sparky**, an AI study buddy
that explains anything their way — and teaches by guiding, not by handing over answers.

This is a **standalone product** — its own brand, codebase and deploy. It shares nothing
with any other project and can live on its own domain.

## What's inside
- **Landing** (`/`) — hero, level picker (age bands), subjects & lessons, "how it works", a "for grown-ups" safety note.
- **Lesson page** (`/topic/:id`) — objectives, illustrated lesson, key points, worked example, an interactive **quiz** (graded with explanations), and the **Sparky** chat (streaming, plus browser voice in/out).
- **API** — `/api/curriculum`, `/api/track`, `/api/topic/:id`, `/api/topic/:id/check`, `/api/buddy/stream`, `/api/health`.
- **AI buddy** — pluggable LLM (Anthropic → OpenAI → built-in demo). No key needed to demo.

## Run locally
```bash
npm install
npm start            # http://localhost:3000
```
The app works with **no API key** (Sparky runs in friendly demo mode). For full live
tutoring, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`).

## Content
All lessons live in `server/data/curriculum.json` as
`curricula → bands → tracks (subject) → topics`. A topic with `"hasContent": true`
carries `objectives`, `body[]`, `keyPoints[]`, `example`, `summary`, and a `quiz[]`
(`text`, `options[]`, `correctIndex`, `explanation`). Add a topic by filling those fields.

Currently live: **English – Parts of Speech** and **Mathematics – Understanding Fractions**
(Cambridge-aligned, ages 10–12). Everything is original content.

## Rename / rebrand
- Product name & copy: `BRAND` object at the top of `public/js/app.js`.
- Colours: `:root` in `public/css/styles.css`.
- Logo & mascot: replace `public/assets/logo.svg` and `public/assets/mascot.svg`.

## Deploy (Render)
1. Put this folder in its own Git repo and push.
2. Render → **New Web Service** → connect the repo (the included `render.yaml` works as a Blueprint).
3. Add `ANTHROPIC_API_KEY` in the service's Environment when you want live tutoring.
4. Point your kids-brand domain at the Render service (CNAME) under **Custom Domains**.

Build: `npm install` · Start: `npm start` · Node ≥ 18.
