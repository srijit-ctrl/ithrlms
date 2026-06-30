/**
 * Pluggable LLM client for the ITHR AI Tutor (non-streaming + streaming).
 *
 * Provider chosen from environment (no secrets in code):
 *   ANTHROPIC_API_KEY -> Anthropic Claude (default)
 *   OPENAI_API_KEY    -> OpenAI (fallback)
 *   (neither)         -> built-in DEMO tutor so the UI works offline
 * Model overrides: ANTHROPIC_MODEL, OPENAI_MODEL. Uses global fetch (Node 18+).
 */
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function activeProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'demo';
}

// ---------- non-streaming ----------
async function chat({ systemPrompt, messages }) {
  const provider = activeProvider();
  try {
    if (provider === 'anthropic') return { provider, reply: await anthropic(systemPrompt, messages) };
    if (provider === 'openai') return { provider, reply: await openai(systemPrompt, messages) };
  } catch (err) {
    return { provider: 'demo', reply: demo(systemPrompt, messages, '(Live model error: ' + err.message + ' — showing demo response.)') };
  }
  return { provider: 'demo', reply: demo(systemPrompt, messages) };
}

async function anthropic(systemPrompt, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1024, system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }], messages: norm(messages) }),
  });
  if (!res.ok) throw new Error('Anthropic ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('').trim() || '(empty response)';
}

async function openai(systemPrompt, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model: OPENAI_MODEL, max_tokens: 1024, messages: [{ role: 'system', content: systemPrompt }, ...norm(messages)] }),
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (((data.choices || [])[0] || {}).message || {}).content?.trim() || '(empty response)';
}

const norm = (messages) => messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

// ---------- streaming ----------
// onDelta(textChunk) is called as text arrives. Returns { provider }.
async function chatStream({ systemPrompt, messages, onDelta }) {
  const provider = activeProvider();
  try {
    if (provider === 'anthropic') { await anthropicStream(systemPrompt, messages, onDelta); return { provider }; }
    if (provider === 'openai') { await openaiStream(systemPrompt, messages, onDelta); return { provider }; }
  } catch (err) {
    await demoStream(systemPrompt, messages, onDelta, '(Live model error: ' + err.message + ' — showing demo response.)');
    return { provider: 'demo' };
  }
  await demoStream(systemPrompt, messages, onDelta);
  return { provider: 'demo' };
}

// Minimal SSE line parser over a fetch response body (web ReadableStream).
async function readSSE(body, onEvent) {
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      try { onEvent(JSON.parse(payload)); } catch {}
    }
  }
}

async function anthropicStream(systemPrompt, messages, onDelta) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1024, system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }], stream: true, messages: norm(messages) }),
  });
  if (!res.ok || !res.body) throw new Error('Anthropic ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 200));
  await readSSE(res.body, (evt) => {
    if (evt.type === 'content_block_delta' && evt.delta && typeof evt.delta.text === 'string') onDelta(evt.delta.text);
  });
}

async function openaiStream(systemPrompt, messages, onDelta) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({ model: OPENAI_MODEL, max_tokens: 1024, stream: true, messages: [{ role: 'system', content: systemPrompt }, ...norm(messages)] }),
  });
  if (!res.ok || !res.body) throw new Error('OpenAI ' + res.status + ': ' + (await res.text().catch(() => '')).slice(0, 200));
  await readSSE(res.body, (evt) => {
    const d = (((evt.choices || [])[0] || {}).delta || {}).content;
    if (typeof d === 'string') onDelta(d);
  });
}

// ---------- demo tutor (works with no key) ----------
function demo(systemPrompt, messages, note) {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  const text = (last && last.content || '').trim();
  const lower = text.toLowerCase();
  const tutor = (systemPrompt.match(/You are ([^,]+),/) || [])[1] || 'your tutor';
  const course = (systemPrompt.match(/course "([^"]+)"/) || [])[1] || 'this course';
  const prefix = note ? note + '\n\n' : '';
  let body;
  if (!text) body = `Hi! I'm ${tutor}. Tell me what you'd like to work on in ${course}, and we'll take it step by step.`;
  else if (/^(hi|hello|hey|salut|hola|namaste|ciao)/i.test(lower)) body = `Hello, and welcome! I'm ${tutor}, here to help you with ${course}. What would you like to start with?`;
  else if (lower.includes('quiz') || lower.includes('test me')) body = `Love that you want to practice. Quick check: in your own words, what is the single most important idea you have learned in ${course} so far, and where might you use it? Take a guess — I'll build on whatever you say.`;
  else if (lower.includes('hint')) body = `Let's not jump to the answer. Here's a nudge: think about which concept from the syllabus this connects to. What's your first instinct? I'll guide from there.`;
  else if (lower.includes("don't understand") || lower.includes('confused') || lower.includes('lost')) body = `No problem at all — that just means we've found the spot worth slowing down on. Tell me the part that feels fuzzy and I'll re-explain it a different way, with a simple example.`;
  else body = `Great question. To pitch this right: how familiar are you with this part of ${course} already — new to it, or have you seen it before? Then I'll explain clearly, show a quick example, and connect it to a real situation.`;
  return prefix + body + '\n\n_(Demo tutor — set ANTHROPIC_API_KEY for full live tutoring.)_';
}

async function demoStream(systemPrompt, messages, onDelta, note) {
  const full = demo(systemPrompt, messages, note);
  const parts = full.split(/(\s+)/); // keep whitespace
  for (const p of parts) { onDelta(p); await new Promise((r) => setTimeout(r, 12)); }
}

module.exports = { chat, chatStream, activeProvider };
