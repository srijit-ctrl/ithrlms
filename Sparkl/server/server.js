/**
 * Sparkl — a playful AI learning world for curious kids (ages 10–18).
 * Zero database: curriculum content lives in data/curriculum.json.
 * Static site + a small JSON API + an SSE endpoint for the "Sparky" study buddy.
 */
const path = require('path');
const express = require('express');
const llm = require('./llm');

let DATA = { curricula: [], bands: [], tracks: [] };
try { DATA = require('./data/curriculum.json'); } catch (e) { console.error('curriculum load failed:', e.message); }

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());

// ---------- helpers ----------
const allTopics = () => DATA.tracks.flatMap((t) => (t.topics || []).map((tp) => ({ ...tp, _track: t })));
function findTopic(id) { return allTopics().find((t) => t.id === id); }
function topicStub(t) { return { id: t.id, title: t.title, hasContent: !!t.hasContent }; }
function trackView(t) {
  const topics = t.topics || [];
  return {
    curriculum: t.curriculum, band: t.band, subject: t.subject, icon: t.icon || 'star',
    total: topics.length, withContent: topics.filter((x) => x.hasContent).length,
    topics: topics.map(topicStub),
  };
}

// ---------- API ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok', app: 'Sparkl', buddy: llm.activeProvider(),
    curricula: DATA.curricula.length, tracks: DATA.tracks.length,
    topics: allTopics().length, topicsWithContent: allTopics().filter((t) => t.hasContent).length,
    time: new Date().toISOString(),
  });
});

app.get('/api/curriculum', (req, res) => {
  const subjectsByBand = {};
  for (const t of DATA.tracks) {
    const key = t.curriculum + '|' + t.band;
    (subjectsByBand[key] = subjectsByBand[key] || []).push(trackView(t));
  }
  res.json({
    curricula: DATA.curricula,
    bands: DATA.bands,
    subjectsByBand,
  });
});

app.get('/api/track', (req, res) => {
  const { curriculum, band, subject } = req.query;
  const t = DATA.tracks.find((x) => x.curriculum === curriculum && x.band === band && x.subject === subject);
  if (!t) return res.status(404).json({ error: 'Track not found' });
  res.json(trackView(t));
});

app.get('/api/topic/:id', (req, res) => {
  const t = findTopic(req.params.id);
  if (!t) return res.status(404).json({ error: 'Topic not found' });
  if (!t.hasContent) return res.json({ id: t.id, title: t.title, hasContent: false, subject: t._track.subject, band: t._track.band });
  // strip answer keys from quiz before sending to the browser
  const quiz = (t.quiz || []).map((q, i) => ({ index: i, text: q.text, options: q.options }));
  res.json({
    id: t.id, title: t.title, hasContent: true,
    subject: t._track.subject, band: t._track.band, curriculum: t._track.curriculum, icon: t._track.icon || 'star',
    objectives: t.objectives || [], body: t.body || [], keyPoints: t.keyPoints || [],
    example: t.example || '', summary: t.summary || '', quiz,
  });
});

app.post('/api/topic/:id/check', (req, res) => {
  const t = findTopic(req.params.id);
  if (!t || !t.hasContent) return res.status(404).json({ error: 'Topic not found' });
  const answers = (req.body && req.body.answers) || [];
  const quiz = t.quiz || [];
  const results = quiz.map((q, i) => {
    const chosen = answers[i];
    const correct = chosen === q.correctIndex;
    return { index: i, chosen, correctIndex: q.correctIndex, correct, explanation: q.explanation || '' };
  });
  const score = results.filter((r) => r.correct).length;
  res.json({ score, total: quiz.length, pct: quiz.length ? Math.round((score / quiz.length) * 100) : 0, results });
});

// ---------- Sparky study buddy (SSE streaming) ----------
function buildBuddyPrompt(topic) {
  const lines = [];
  lines.push('You are Sparky, a warm, upbeat AI study buddy on Sparkl, a learning app for children.');
  lines.push('You are helping with the lesson "' + (topic ? topic.title : 'this lesson') + '"' + (topic && topic._track ? ' (' + topic._track.subject + ', ' + topic._track.band + ' years old).' : '.'));
  lines.push('');
  lines.push('How you behave:');
  lines.push('- Be friendly, encouraging and patient. Celebrate effort, never make a child feel silly.');
  lines.push('- Use simple, clear language suitable for the age. Short sentences. One idea at a time.');
  lines.push('- Teach by guiding: ask a small question, give a hint, then reveal — do not just dump answers.');
  lines.push('- Use everyday examples (food, games, animals, sport) to make ideas concrete.');
  lines.push('- Keep replies short (2–5 sentences). A friendly emoji now and then is fine.');
  lines.push('- Stay strictly on safe, school-appropriate topics. If asked something unsafe or off-topic, gently steer back to learning and suggest telling a trusted adult.');
  if (topic && topic.hasContent) {
    lines.push('');
    lines.push('LESSON MATERIAL you can rely on:');
    (topic.body || []).forEach((p) => lines.push('- ' + p));
    if (topic.keyPoints && topic.keyPoints.length) lines.push('Key points: ' + topic.keyPoints.join('; '));
    if (topic.example) lines.push('Worked example: ' + topic.example);
  }
  return lines.join('\n');
}

app.post('/api/buddy/stream', async (req, res) => {
  const { topicId, messages } = req.body || {};
  const topic = topicId ? findTopic(topicId) : null;
  const systemPrompt = buildBuddyPrompt(topic);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (obj) => res.write('data: ' + JSON.stringify(obj) + '\n\n');
  try {
    const { provider } = await llm.chatStream({
      systemPrompt,
      messages: Array.isArray(messages) ? messages : [],
      onDelta: (text) => send({ delta: text }),
    });
    send({ done: true, provider });
  } catch (err) {
    send({ delta: '\n\n(Oops, Sparky tripped over a wire: ' + err.message + ')' });
    send({ done: true, provider: 'error' });
  }
  res.end();
});

// ---------- static ----------
app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/topic/:id', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'topic.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => {
  console.log('✨ Sparkl running on http://localhost:' + PORT + '  (buddy: ' + llm.activeProvider() + ')');
});
