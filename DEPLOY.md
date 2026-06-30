# Deploying the ITHR LMS

This guide takes the platform from "runs on my laptop" to a live URL anyone can reach. Recommended host: **Render** (fastest path; free tier to trial, ~$7/mo always-on). The app is a Node server, so it needs a host that runs Node — not plain static web hosting.

---

## What you'll end up with

- A public URL like `https://ithr-lms.onrender.com` (free, automatic), and optionally
- Your own subdomain `https://learn.ithr360.com` pointing at it (recommended).

---

## Prerequisites (one-time)

1. A **GitHub account** (free) — Render deploys from a Git repo.
2. A **Render account** (free) — sign up at render.com with GitHub.
3. (Optional, for the live AI tutor) an **Anthropic API key** from console.anthropic.com.
4. (Optional, for the custom domain) access to your **ithr360.com DNS** settings.

---

## Step 1 — Put the code on GitHub

From the project folder (`ITHR LMS`):

```bash
git init
git add .
git commit -m "ITHR LMS initial deploy"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<your-org>/ithr-lms.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `.env`, and the local `server/data.json`, so no secrets or local data are pushed.

## Step 2 — Create the service on Render (Blueprint)

The repo includes `render.yaml`, so Render configures everything automatically:

1. In Render: **New +** → **Blueprint**.
2. Select your `ithr-lms` repo. Render reads `render.yaml` and shows the plan: a web service + a 1 GB persistent disk mounted at `/var/data`.
3. It will prompt for the two secret values it won't auto-generate:
   - **ADMIN_PASSWORD** — your admin login password.
   - **ANTHROPIC_API_KEY** — paste your key for live tutoring, or leave blank to run the demo tutor.
4. Click **Apply**. Render runs `npm install`, starts the app, and waits for the health check at `/api/health` to go green.

First deploy takes ~2–4 minutes. When it's live you'll see a URL like `https://ithr-lms.onrender.com`.

> No `render.yaml`? You can instead do **New +** → **Web Service**, set Build = `npm install`, Start = `npm start`, Health check path = `/api/health`, add a disk mounted at `/var/data`, and add the env vars from the table below by hand.

## Step 3 — Confirm it works

- Visit the URL → the homepage loads.
- `https://<your-url>/api/health` → returns `{"status":"ok", ...}`.
- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → the **Admin** link appears.
- Open a course → **Ask your AI Tutor**. The badge shows "Live · anthropic" if your key is set, otherwise "Demo mode".

## Step 4 — Point your own domain (optional)

1. In Render → your service → **Settings → Custom Domains** → add `learn.ithr360.com`.
2. Render shows a target host. In your ithr360.com DNS, add a **CNAME** record:
   - Name/Host: `learn`
   - Value/Target: the hostname Render gives you (e.g. `ithr-lms.onrender.com`)
3. Save. DNS can take a few minutes to a few hours. Render issues the HTTPS certificate automatically once it resolves.

Your platform is then live at `https://learn.ithr360.com`.

---

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs login tokens. `render.yaml` auto-generates a strong value. |
| `ADMIN_EMAIL` | Yes | Seeded admin login (default `admin@ithr360.com`). |
| `ADMIN_PASSWORD` | Yes | Admin password — set in the dashboard, keep secret. |
| `DATA_DIR` | Yes (host) | Folder for `data.json`. Set to the disk mount `/var/data` so data survives restarts. |
| `ANTHROPIC_API_KEY` | No | Enables the live AI tutor (Anthropic). Omit for demo mode. |
| `ANTHROPIC_MODEL` | No | Override model (default `claude-sonnet-4-6`). |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | No | OpenAI fallback if no Anthropic key. |
| `PORT` | No | Render sets this automatically. |

## Important: data persistence

The platform stores everything (users, enrollments, certificates, courses, questions) in a single JSON file. On a host, container filesystems are wiped on every redeploy/restart **unless** the data lives on a persistent disk. The included `render.yaml` mounts a 1 GB disk at `/var/data` and sets `DATA_DIR=/var/data`, so your data survives. If you deploy without that disk, data will reset on each restart.

For a real public launch with many concurrent users, plan to migrate this JSON store to a managed database (e.g. Render Postgres). That's the recommended next hardening step — ask and I'll do the migration.

## Other hosts

The same app runs anywhere that runs Node 18+. On a VPS (DigitalOcean/Hetzner/Lightsail): clone the repo, `npm install`, set the env vars, run `npm start` behind a process manager (`pm2`) and a reverse proxy (Caddy/Nginx) for HTTPS. Railway and Fly.io work similarly to Render — build `npm install`, start `npm start`, set the env vars, attach a volume for `DATA_DIR`.

---
© ITHR Technologies Consulting LLC.
