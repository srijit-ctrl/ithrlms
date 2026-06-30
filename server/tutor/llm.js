/**
 * Pluggable LLM client for the ITHR AI Tutor.
 *
 * Provider is chosen from environment — no secrets are ever hardcoded:
 *   ANTHROPIC_API_KEY  -> Anthropic Claude  (default provider)
 *   OPENAI_API_KEY     -> OpenAI (fallback if no Anthropic key)
 *   (neither set)      -> built-in DEMO tutor so the UI works offline
 *
 * Optional model overrides: ANTHROPIC_MODEL, OPENAI_MODEL.
 * Node 18+ global fetch is used (no extra dependencies).
 */
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function activeProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'demo';
}

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
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    }),
  });
  if (!res.ok) throw new Error('Anthropic ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('').trim() || '(empty response)';
}

async function openai(systemPrompt, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error('OpenAI ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return (((data.choices || [])[0] || {}).message || {}).content?.trim() || '(empty response)';
}

/**
 * DEMO tutor — deterministic, warm, on-persona replies so the chat works
 * with no API key. It never fabricates course facts; it guides and invites
 * the next step, mirroring the configured pedagogy. Replace by setting a key.
 */
function demo(systemPrompt, messages, note) {
  const last = [...messages].reverse().find((m) => m.role === 'user');
  const text = (last && last.content || '').trim();
  const lower = text.toLowerCase();
  const tutor = (systemPrompt.match(/You are ([^,]+),/) || [])[1] || 'your tutor';
  const course = (systemPrompt.match(/course "([^"]+)"/) || [])[1] || 'this course';
  const prefix = note ? note + '\n\n' : '';

  let body;
  if (!text) {
    body = `Hi! I'm ${tutor}. Tell me what you'd like to work on in ${course}, and we'll take it step by step.`;
  } else if (/^(hi|hello|hey|salut|hola|namaste|ciao|你好|مرحبا)/i.test(lower)) {
    body = `Hello, and welcome! I'm ${tutor}, here to help you with ${course}. What topic would you like to start with — or shall I suggest one?`;
  } else if (lower.includes('quiz') || lower.includes('test me')) {
    body = `Love that you want to practice — that's how it sticks. Here's a quick one to check understanding:\n\n• In your own words, what's the single most important idea you've learned in ${course} so far, and where might you use it?\n\nTake a guess — there's no wrong answer here, and I'll build on whatever you say.`;
  } else if (lower.includes('hint')) {
    body = `Sure — let's not jump straight to the answer. Here's a nudge: think about what the question is really asking, and which concept from the syllabus it connects to. What's your first instinct? I'll guide from there.`;
  } else if (lower.includes("don't understand") || lower.includes('confused') || lower.includes('lost')) {
    body = `No problem at all — that just means we've found the spot worth slowing down on. Let's rewind one step: tell me the part that still feels fuzzy, and I'll re-explain it a different way, with a simple example. You're doing fine.`;
  } else {
    body = `Great question. Let me make sure I pitch this right: how familiar are you with this part of ${course} already — totally new, or have you seen it before?\n\nOnce I know that, I'll explain it clearly, show a quick worked example, and connect it to a real situation you'd actually meet. Want to give your current understanding a try first?`;
  }
  return prefix + body + '\n\n_(Demo tutor — set ANTHROPIC_API_KEY for full live tutoring.)_';
}

module.exports = { chat, activeProvider };
