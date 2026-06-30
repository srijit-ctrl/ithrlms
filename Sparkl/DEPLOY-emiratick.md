# Deploy Sparkl to www.emiratick.com

Sparkl is a Node/Express app, so it needs a Node host (not a static/file host).
It already includes `render.yaml`, so **Render** is the fastest path. ~15 minutes.

---
## Step 1 — Make Sparkl its own Git repo (on your PC)
Open PowerShell:
```powershell
cd "C:\Users\Srijit Nair\OneDrive\Desktop\CLAUDE\ITHR LMS\Sparkl"
rmdir /s /q .git    # remove the half-created stub (ignore error if absent)
git init
git add -A
git commit -m "Sparkl v1 — standalone kids learning app"
```
Tip: OneDrive + Git can be fussy. If Git misbehaves, move the `Sparkl` folder out of
OneDrive first (e.g. to `C:\dev\Sparkl`) and run the commands there.

## Step 2 — Push to a NEW GitHub repo
Create an empty repo (no README) at github.com — e.g. `srijit-ctrl/sparkl`. Then:
```powershell
git remote add origin https://github.com/srijit-ctrl/sparkl.git
git branch -M main
git push -u origin main
```

## Step 3 — Create the Render service
1. render.com → **New +** → **Web Service** → connect the `sparkl` repo.
2. Render auto-detects `render.yaml`. Confirm: Build `npm install`, Start `npm start`.
3. Create. First deploy takes a few minutes. You'll get `https://sparkl-xxxx.onrender.com`.
4. (Optional, for live AI tutoring) Service → **Environment** → add
   `ANTHROPIC_API_KEY = <your key>`. Without it, Sparky runs in friendly demo mode.

## Step 4 — Add the custom domain in Render
Service → **Settings** → **Custom Domains** → add **both**:
- `www.emiratick.com`
- `emiratick.com`   (so the bare domain redirects to www)

Render will then SHOW you the exact DNS records to create. They look like:
- `www`  →  **CNAME**  →  `sparkl-xxxx.onrender.com`
- `emiratick.com` (apex)  →  **A record** to the IP Render lists (or an ALIAS/ANAME if your DNS supports it)

⚠️ Use the values **Render displays for your service** — don't copy a guessed IP.

## Step 5 — Create the DNS records at your registrar
Wherever emiratick.com's DNS is managed (GoDaddy, etc.) → DNS settings → add the records
from Step 4. Save. Propagation is usually minutes (up to a few hours).

When Render shows the domains as **Verified**, https://www.emiratick.com is live with a
free auto SSL certificate. 🎉

---
### Notes
- Free Render plan sleeps after inactivity (first hit after idle is slow). Upgrade to a
  paid instance if you want it always-on.
- To rename the product later: `BRAND` in `public/js/app.js`, colours in
  `public/css/styles.css`, and the two SVGs in `public/assets/`.
