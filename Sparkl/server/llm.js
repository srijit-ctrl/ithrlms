/**
 * Pluggable LLM client for Sparkl's study buddy "Sparky" (streaming + non-streaming).
 *   ANTHROPIC_API_KEY -> Anthropic Claude (default)
 *   OPENAI_API_KEY    -> OpenAI (fallback)
 *   (neither)         -> built-in DEMO buddy so the app works offline
 * Uses global fetch (Node 18+). No secrets in code.
 */
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function activeProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'demo';
}

const norm = (messages) => messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

async function chatStream({ systemPrompt, messages, onDelta }) {
  const provider = activeProvider();
  try {
    if (provider === 'anthropic') { await anthropicStream(systemPrompt, messages, onDelta); return { provider }; }
    if (provider === 'openai') { await openaiStream(systemPrompt, messages, onDelta); return { provider }; }
  } catch (err) {
    await demoStream(systemPrompt, messages, onDelta, '(Live buddy hiccup: ' + err.message + ' — showing a friendly demo reply.)');
    return { provider: 'demo' };
  }
  await demoStream(systemPrompt, messages, onDelta);
  return { provider: 'demo' };
}

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

function demo(systemPrompt, messages, note) {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  const text = (last && last.content || '').trim();
  const lower = text.toLowerCase();
  const topic = (systemPrompt.match(/lesson "([^"]+)"/) || [])[1] || 'this lesson';
  const prefix = note ? note + '\n\n' : '';
  let body;
  if (!text) body = `Hi there! I'm Sparky ✨ Ask me anything about ${topic} and we'll figure it out together!`;
  else if (/^(hi|hello|hey|yo|hiya)/i.test(lower)) body = `Hey, superstar! I'm Sparky. Want me to explain a tricky bit of ${topic}, or shall I give you a fun question to try?`;
  else if (lower.includes('quiz') || lower.includes('test me') || lower.includes('question')) body = `Ooh, I love a challenge! Here's one: in your own words, what's the BIG idea in ${topic}? Have a go — there are no wrong tries with me, only steps closer!`;
  else if (lower.includes('hint')) body = `No peeking at the answer yet! 🙈 Tiny hint: think about what we just learned in ${topic}. What's your first guess?`;
  else if (lower.includes("don't understand") || lower.includes('confused') || lower.includes('stuck') || lower.includes('lost')) body = `Totally okay — that just means we found the exciting part to slow down on! Tell me which bit feels fuzzy and I'll explain it a brand-new way, with a simple example.`;
  else body = `Great question! Let's break ${topic} into bite-size pieces. First, tell me: have you seen this before, or is it brand new to you? Then I'll explain it nice and clearly with an example you can picture.`;
  return prefix + body + '\n\n_(Demo buddy — add an AI key to unlock full live tutoring.)_';
}

async function demoStream(systemPrompt, messages, onDelta, note) {
  const full = demo(systemPrompt, messages, note);
  const parts = full.split(/(\s+)/);
  for (const p of parts) { onDelta(p); await new Promise((r) => setTimeout(r, 12)); }
}

module.exports = { chatStream, activeProvider };
