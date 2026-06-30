/* ============================================================
   Sparkl — shared client: brand, API helper, layout, icons.
   To rename the whole product, change BRAND.name below
   (and swap /assets/logo.svg + /assets/mascot.svg).
   ============================================================ */
const BRAND = {
  name: 'Sparkl',
  tagline: 'Find your spark.',
  mascot: 'Sparky',
  blurb: 'A playful, AI-powered learning world where curious kids explore real school subjects with their buddy Sparky.',
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const qs = (k) => new URLSearchParams(location.search).get(k);

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const ICONS = {
  book: '<path d="M4 5a2 2 0 012-2h12v18H6a2 2 0 01-2-2z"/><path d="M18 3v18"/>',
  calculator: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l-5-9V3"/>',
  star: '<path d="M12 3l2.5 6L21 9.5l-5 4 1.7 6.5L12 16.8 6.3 20 8 13.5l-5-4L9.5 9z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  rocket: '<path d="M5 15c-1 1-2 4-2 4s3-1 4-2M9 13l6-6a5 5 0 015 5l-6 6-5-5z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  speaker: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M16 9a5 5 0 010 6"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
};
function icon(name, size = 24) {
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || ICONS.star) + '</svg>';
}

function renderHeader() {
  const el = $('#site-header'); if (!el) return;
  el.className = 'site-header';
  el.innerHTML = `
    <div class="container">
      <a class="logo" href="/"><img src="/assets/logo.svg" alt="${BRAND.name}"></a>
      <nav class="nav" id="nav">
        <a href="/#explore">Explore</a>
        <a href="/#how">How it works</a>
        <a href="/#grownups">For grown-ups</a>
      </nav>
      <a class="btn btn-primary btn-sm" href="/#explore">Start learning ${icon('spark',16)}</a>
      <button class="menu-toggle" id="mt">☰</button>
    </div>`;
  const mt = $('#mt'); if (mt) mt.onclick = () => $('#nav').classList.toggle('open');
}

function renderFooter() {
  const el = $('#site-footer'); if (!el) return;
  el.className = 'site-footer';
  el.innerHTML = `
    <div class="container">
      <div class="foot-grid">
        <div>
          <a class="logo" href="/"><img src="/assets/logo.svg" style="filter:brightness(0) invert(1)" alt="${BRAND.name}"></a>
          <p style="color:#c9c3ec;margin-top:12px;max-width:42ch">${BRAND.blurb}</p>
        </div>
        <div>
          <h4>Explore</h4>
          <a href="/#explore">All subjects</a>
          <a href="/#how">How it works</a>
          <a href="/#grownups">For grown-ups</a>
        </div>
        <div>
          <h4>About</h4>
          <a href="/#grownups">Safety &amp; privacy</a>
          <a href="/#grownups">Curriculum</a>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© ${new Date().getFullYear()} ${BRAND.name}. Made for curious minds.</span>
        <span>${BRAND.tagline}</span>
      </div>
    </div>`;
}

function injectHead() {
  if (document.getElementById('skl-head')) return;
  const d = document.createElement('div'); d.id = 'skl-head';
  document.head.insertAdjacentHTML('beforeend',
    '<link rel="icon" href="/assets/favicon.svg">' +
    '<meta name="theme-color" content="#211A4A">');
}
document.addEventListener('DOMContentLoaded', () => { injectHead(); renderHeader(); renderFooter(); });
