# ITHR Technologies — AI & Blockchain Certification LMS

A full-stack Learning Management System for **ITHR Technologies Consulting LLC**, delivering role-based AI and Blockchain certifications. Inspired by the structure of leading certification portals, with original ITHR branding, content, and a complete 78-program catalog rebranded as **"ITHR Certified ___"**.

## What's inside

- **Public portal** — homepage, full catalog with search/filter, 12 role-based tracks, course detail pages.
- **Accounts** — register / sign-in (JWT auth, bcrypt-hashed passwords). Admin role supported.
- **Learning** — enroll in courses, mark modules complete, track progress.
- **Real exams** — each course has a question bank; learners take a scored, randomized multiple-choice exam with an answer review.
- **Credentials** — a verifiable credential is issued automatically when a learner **passes the exam**, plus a public verification portal.
- **Admin panel** (`/admin.html`) — create, edit and delete courses in the UI, and manage each course's exam question bank (add/edit/delete questions, set the correct answer).
- **Learner dashboard** — enrollments, progress, and earned credentials.

### Admin access

A default admin account is seeded on first boot:

```
email:    admin@ithr360.com
password: admin12345
```

Override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars. Sign in and the **Admin** link appears in the header.

## Tech stack

- **Backend:** Node.js + Express, SQLite (`better-sqlite3`), JWT, bcrypt.
- **Frontend:** vanilla HTML/CSS/JS (no build step), themeable via CSS variables.

## Run it

```bash
cd "ITHR LMS"
npm install
npm run seed      # loads categories + 78 courses (auto-runs on first start too)
npm start         # http://localhost:3000
```

Then open http://localhost:3000

## Project structure

```
ITHR LMS/
├─ package.json
├─ server/
│  ├─ server.js        Express API + static serving + auth
│  ├─ db.js            SQLite schema
│  ├─ seed.js          Loads the catalog into the DB
│  └─ data/catalog.js  All 78 ITHR-branded programs across 12 tracks
└─ public/
   ├─ index.html       Homepage / portal
   ├─ catalog.html     All certifications (search + filter)
   ├─ category.html    Single track
   ├─ course.html      Course detail + enroll + module progress
   ├─ login.html / register.html
   ├─ dashboard.html   Learner portal
   ├─ verify.html      Public credential verification
   ├─ css/styles.css   Design system (all brand colors here)
   └─ js/app.js, cards.js
```

## Rebranding

- **Colors:** edit the `:root` variables at the top of `public/css/styles.css`.
- **Name / logo / tagline:** edit the `BRAND` object at the top of `public/js/app.js`.
- **Courses:** edit `server/data/catalog.js`, then `npm run seed`.

## API quick reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/categories` | – | Tracks + course counts |
| GET | `/api/courses` | – | List/filter (`category`, `level`, `q`) |
| GET | `/api/courses/:slug` | – | Course detail |
| GET | `/api/stats` | – | Catalog stats |
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Sign in |
| GET | `/api/enrollments` | ✓ | My enrollments |
| POST | `/api/enrollments` | ✓ | Enroll |
| POST | `/api/enrollments/:courseId/progress` | ✓ | Toggle module / issue credential |
| GET | `/api/certificates` | ✓ | My credentials |
| GET | `/api/verify/:credentialId` | – | Public verification |

---

© ITHR Technologies Consulting LLC. Built as an internal LMS scaffold.

## AI Tutor agents

A reusable, course-specific AI tutor system lives in `server/tutor/`:

- **Warm, patient, Socratic** tutoring bound to a single course's syllabus, concepts and assessment.
- **73 languages** with auto-detection, mid-conversation switching, and preserved technical terms (`server/tutor/languages.js`).
- **Guardrails**: stays on-topic, no fabrication, teaches (never hands over exam answers), professional/age-appropriate, escalates to a human instructor.
- **Pluggable LLM** (`server/tutor/llm.js`): `ANTHROPIC_API_KEY` (default) → `OPENAI_API_KEY` (fallback) → built-in **demo tutor** when no key is set. Override models with `ANTHROPIC_MODEL` / `OPENAI_MODEL`.

Spin up a tutor for any course by supplying a **Course Profile** — auto-derived from the catalog via `buildProfileFromCourse()`. Full design, schema, language list, guardrails and a sample sit in **`AI-Tutor-System-Design.md`**.

Endpoints: `GET /api/courses/:slug/tutor` (config) and `POST /api/tutor/chat` (live chat). UI at **`/tutor.html`** (also linked from the header nav and each course page).

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start   # full live tutoring
npm start                                 # demo tutor, no key required
```
