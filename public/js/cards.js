/* Shared course-card + catalog rendering used by catalog & category pages. */
function stars(rating) {
  const full = Math.round(rating);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
function levelTag(level) {
  const cls = level === 'Beginner' ? 'tag-beginner' : level === 'Advanced' ? 'tag-advanced' : 'tag-intermediate';
  return `<span class="tag ${cls}">${esc(level)}</span>`;
}
const CAT_NAMES = {};
function courseCard(c) {
  return `
  <a class="course-card" href="/course.html?slug=${encodeURIComponent(c.slug)}">
    <div class="top">
      <span class="tier">${esc(c.tier)}</span>
      <span class="cat-name">${esc(CAT_NAMES[c.category] || c.category)}</span>
    </div>
    <div class="body">
      <h3>${esc(c.name)}</h3>
      <p class="desc">${esc(c.shortDescription)}</p>
      <div class="meta">
        <span>${icon('clock',15)} ${c.durationHours}h</span>
        <span>${levelTag(c.level)}</span>
      </div>
      <div class="foot">
        <span class="price">$${c.priceUsd}</span>
        <span class="stars">${stars(c.rating)} <span class="muted" style="font-size:12px">${c.rating}</span></span>
      </div>
    </div>
  </a>`;
}
async function loadCategoryNames() {
  if (Object.keys(CAT_NAMES).length) return;
  const cats = await api('/categories');
  cats.forEach((c) => { CAT_NAMES[c.slug] = c.name; });
}
