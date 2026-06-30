/* ============================================================
   ITHR LMS — shared client: brand config, API client, layout.
   Swap BRAND below + the colors in css/styles.css to rebrand.
   ============================================================ */
const BRAND = {
  name: 'ITHR Technologies',
  legal: 'ITHR Technologies Consulting LLC',
  short: 'ITHR',
  initials: 'IT',
  tagline: 'Certify your future, one skill at a time.',
  domain: 'ITHR360.com',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const qs = (k) => new URLSearchParams(location.search).get(k);
const fmt = (n) => Number(n).toLocaleString('en-US');

const Auth = {
  get token() { return localStorage.getItem('ithr_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('ithr_user')); } catch { return null; } },
  set(token, user) { localStorage.setItem('ithr_token', token); localStorage.setItem('ithr_user', JSON.stringify(user)); },
  clear() { localStorage.removeItem('ithr_token'); localStorage.removeItem('ithr_user'); },
  get isAuthed() { return !!this.token; },
};

async function api(path, { method = 'GET', body, authed = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (authed && Auth.token) headers.Authorization = 'Bearer ' + Auth.token;
  const res = await fetch('/api' + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const ICONS = {
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>',
  crown: '<path d="M3 7l4 5 5-7 5 7 4-5v11H3z"/>',
  shield: '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/>',
  cloud: '<path d="M7 18a4 4 0 010-8 5 5 0 019.6-1A4 4 0 0118 18z"/>',
  code: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  heart: '<path d="M12 20s-7-4.5-9-9a4.5 4.5 0 019-2 4.5 4.5 0 019 2c-2 4.5-9 9-9 9z"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>',
  book: '<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z"/><path d="M18 3v18"/>',
  palette: '<path d="M12 3a9 9 0 100 18c1 0 1.5-1 1-2-.5-1.2.3-2 1.5-2H18a3 3 0 003-3c0-5-4-9-9-9z"/>',
  link: '<path d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
};
function icon(name, size = 24) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.sparkles) + '</svg>';
}

function renderHeader() {
  const el = $('#site-header');
  if (!el) return;
  const authed = Auth.isAuthed;
  const isAdmin = authed && Auth.user && Auth.user.role === 'admin';
  el.innerHTML = `
  <div class="utilbar">
    <div class="container">
      <div class="seg">
        <a href="/index.html" class="active">For Individuals</a>
        <a href="/index.html#business">For Businesses</a>
        <a href="/index.html#partners">For Partners</a>
      </div>
      <div class="right">
        <a href="/verify.html">Verify Credential</a>
        <a href="${authed ? '/dashboard.html' : '/login.html'}">Learner Portal</a>
      </div>
    </div>
  </div>
  <header class="site">
    <div class="container">
      <a class="logo" href="/index.html" aria-label="${BRAND.name}">
        <img class="logo-img" src="/assets/brand/ITHR_Logo_FullColor.svg" alt="${BRAND.name}">
      </a>
      <nav class="main" id="nav">
        <a href="/catalog.html">Certifications</a>
        <a href="/index.html#how">How It Works</a>
        <a href="/index.html#platforms">Platform</a>
        <a href="/index.html#faq">Resources</a>
        <a href="/tutor.html">AI Tutor</a>
        ${isAdmin ? '<a href="/admin.html" style="color:var(--brand-600);font-weight:800">Admin</a>' : ''}
      </nav>
      <div class="header-cta">
        ${authed
          ? `<a class="btn btn-ghost btn-sm" href="/dashboard.html">Dashboard</a>
             <a class="btn btn-primary btn-sm" href="#" id="logout-btn">Sign out</a>`
          : `<a class="btn btn-ghost btn-sm" href="/login.html">Sign in</a>
             <a class="btn btn-primary btn-sm" href="/register.html">Get started</a>`}
        <button class="menu-toggle" id="menu-toggle">☰</button>
      </div>
    </div>
  </header>`;
  const mt = $('#menu-toggle'); if (mt) mt.onclick = () => $('#nav').classList.toggle('open');
  const lo = $('#logout-btn'); if (lo) lo.onclick = (e) => { e.preventDefault(); Auth.clear(); location.href = '/index.html'; };
}

function renderFooter() {
  const el = $('#site-footer');
  if (!el) return;
  const y = new Date().getFullYear();
  el.innerHTML = `
  <footer class="site">
    <div class="container">
      <div class="foot-grid">
        <div class="brand">
          <a class="logo" href="/index.html" aria-label="${BRAND.name}">
            <img class="logo-img" src="/assets/brand/ITHR_Logo_Reverse_OnDark.svg" alt="${BRAND.name}">
          </a>
          <p style="margin-top:14px">${BRAND.legal} delivers role-based AI &amp; Blockchain certifications that turn skills into verifiable, career-ready credentials.</p>
        </div>
        <div>
          <h4>Certifications</h4>
          <a href="/catalog.html">All Programs</a>
          <a href="/catalog.html?level=Beginner">Fundamentals</a>
          <a href="/catalog.html?level=Intermediate">Practitioner</a>
          <a href="/catalog.html?level=Advanced">Expert &amp; Strategist</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="/index.html#how">How It Works</a>
          <a href="/index.html#platforms">Our Platform</a>
          <a href="/index.html#faq">FAQ</a>
          <a href="/verify.html">Verify a Credential</a>
        </div>
        <div>
          <h4>Account</h4>
          <a href="/login.html">Sign in</a>
          <a href="/register.html">Create account</a>
          <a href="/dashboard.html">Learner Dashboard</a>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© ${y} ${BRAND.legal}. All rights reserved.</span>
        <span>${BRAND.domain} · ${BRAND.tagline}</span>
      </div>
    </div>
  </footer>`;
}

function requireAuth() {
  if (!Auth.isAuthed) { location.href = '/login.html?next=' + encodeURIComponent(location.pathname); return false; }
  return true;
}

function injectHead() {
  if (document.getElementById('ithr-favicons')) return;
  const m = document.createElement('div'); m.id = 'ithr-favicons';
  const links = [
    '<link rel="icon" href="/assets/brand/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/favicon-16x16.png">',
    '<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">',
    '<link rel="manifest" href="/assets/brand/site.webmanifest">',
    '<meta name="theme-color" content="#16335E">',
  ].join('');
  document.head.insertAdjacentHTML('beforeend', links);
}
document.addEventListener('DOMContentLoaded', () => { injectHead(); renderHeader(); renderFooter(); });
