/**
 * ITHR Technologies Consulting LLC — LMS API + static server.
 * Courses, questions, users, enrollments, attempts and certificates live
 * in store.js (JSON). Courses/questions are seeded from data/catalog.js.
 */
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('./store');
const tutor = require('./tutor/tutor');
const { LANGUAGES } = require('./tutor/languages');
const llm = require('./tutor/llm');
const tts = require('./tutor/tts');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ithr-lms-dev-secret-change-me';
const app = express();
app.use(express.json());

// ---------- seed a default admin on first boot ----------
(function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@ithr360.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  let admin = store.findUserByEmail(email);
  if (!admin) {
    admin = store.createUser({ name: 'ITHR Admin', email, passwordHash: bcrypt.hashSync(password, 10), role: 'admin' });
    console.log('Seeded admin account: ' + email + ' / ' + password + '  (set ADMIN_EMAIL / ADMIN_PASSWORD to change)');
  } else if (admin.role !== 'admin') {
    admin.role = 'admin'; store.save();
  }
})();

// ---------- middleware ----------
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired session' }); }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function publicCourse(c) {
  return {
    id: c.id, name: c.name, slug: c.slug, category: c.category, tier: c.tier, level: c.level,
    shortDescription: c.shortDescription, longDescription: c.longDescription,
    durationHours: c.durationHours, priceUsd: c.priceUsd, exam: c.exam,
    modules: c.modules, skills: c.skills, rating: c.rating, learners: c.learners,
    hasContent: !!c.hasContent,
  };
}
function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

// ---------- catalog endpoints ----------
app.get('/api/categories', (req, res) => {
  const counts = {};
  for (const c of store.listCourses()) counts[c.category] = (counts[c.category] || 0) + 1;
  res.json(store.categories().map((c) => ({ ...c, courseCount: counts[c.slug] || 0 })));
});

app.get('/api/courses', (req, res) => {
  const { category, level, q } = req.query;
  let list = store.listCourses();
  if (category) list = list.filter((c) => c.category === category);
  if (level) list = list.filter((c) => c.level === level);
  if (q) {
    const n = q.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(n) || (c.shortDescription || '').toLowerCase().includes(n));
  }
  res.json(list.map(publicCourse));
});

app.get('/api/courses/:slug', (req, res) => {
  const c = store.findCourseBySlug(req.params.slug);
  if (!c) return res.status(404).json({ error: 'Course not found' });
  const out = publicCourse(c);
  out.questionCount = store.listQuestions(c.id).length;
  res.json(out);
});

app.get('/api/stats', (req, res) => {
  const courses = store.listCourses();
  res.json({
    courses: courses.length,
    categories: store.categories().length,
    learners: courses.reduce((s, c) => s + (c.learners || 0), 0),
    credentials: store.raw().certificates.length,
  });
});

// ---------- auth ----------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (store.findUserByEmail(email)) return res.status(409).json({ error: 'An account with that email already exists' });
  const user = store.createUser({ name, email, passwordHash: bcrypt.hashSync(password, 10) });
  const claims = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: jwt.sign(claims, JWT_SECRET, { expiresIn: '7d' }), user: claims });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = store.findUserByEmail(email || '');
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash))
    return res.status(401).json({ error: 'Invalid email or password' });
  const claims = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.json({ token: jwt.sign(claims, JWT_SECRET, { expiresIn: '7d' }), user: claims });
});

app.get('/api/me', auth, (req, res) => res.json(req.user));

// ---------- enrollment & module progress ----------
app.get('/api/enrollments', auth, (req, res) => {
  const rows = store.listEnrollments(req.user.id).sort((a, b) => (b.enrolledAt || '').localeCompare(a.enrolledAt || ''));
  res.json(rows.map((e) => {
    const c = store.findCourseById(e.courseId) || {};
    return {
      id: e.id, courseId: e.courseId, name: c.name, slug: c.slug, category: c.category, tier: c.tier,
      level: c.level, durationHours: c.durationHours, totalModules: (c.modules || []).length,
      completedModules: e.completedModules, progressPct: e.progressPct, status: e.status,
      examPassed: !!store.findCertificate(req.user.id, e.courseId),
      enrolledAt: e.enrolledAt, completedAt: e.completedAt,
    };
  }));
});

app.post('/api/enrollments', auth, (req, res) => {
  const courseId = Number((req.body || {}).courseId);
  if (!store.findCourseById(courseId)) return res.status(404).json({ error: 'Course not found' });
  const existing = store.findEnrollment(req.user.id, courseId);
  if (existing) return res.json({ enrollment: existing, already: true });
  res.json({ enrollment: store.createEnrollment(req.user.id, courseId) });
});

app.post('/api/enrollments/:courseId/progress', auth, (req, res) => {
  const courseId = Number(req.params.courseId);
  const { moduleOrder } = req.body || {};
  const e = store.findEnrollment(req.user.id, courseId);
  if (!e) return res.status(404).json({ error: 'Not enrolled in this course' });
  const course = store.findCourseById(courseId);
  const total = (course.modules || []).length || 1;
  const set = new Set(e.completedModules);
  if (set.has(moduleOrder)) set.delete(moduleOrder); else set.add(moduleOrder);
  e.completedModules = [...set].sort((a, b) => a - b);
  e.progressPct = Math.round((e.completedModules.length / total) * 100);
  const certified = !!store.findCertificate(req.user.id, courseId);
  e.status = certified ? 'completed' : (e.progressPct >= 100 ? 'ready_for_exam' : 'in_progress');
  store.updateEnrollment();
  res.json({ progressPct: e.progressPct, completedModules: e.completedModules, status: e.status });
});

// ---------- exam engine ----------
function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const EXAM_SIZE = 10;

app.get('/api/courses/:slug/exam', auth, (req, res) => {
  const course = store.findCourseBySlug(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (!store.findEnrollment(req.user.id, course.id)) return res.status(403).json({ error: 'Enroll in this course before taking the exam' });
  const bank = store.listQuestions(course.id);
  if (bank.length === 0) return res.status(400).json({ error: 'This course has no exam questions yet' });
  const picked = shuffle(bank).slice(0, Math.min(EXAM_SIZE, bank.length));
  res.json({
    courseId: course.id, courseName: course.name, slug: course.slug,
    passPercent: (course.exam && course.exam.passPercent) || 70,
    durationMinutes: (course.exam && course.exam.durationMinutes) || 30,
    questions: picked.map((q) => ({ id: q.id, text: q.text, options: q.options })),
  });
});

app.post('/api/courses/:slug/exam/submit', auth, (req, res) => {
  const course = store.findCourseBySlug(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const enrollment = store.findEnrollment(req.user.id, course.id);
  if (!enrollment) return res.status(403).json({ error: 'Not enrolled' });
  const answers = (req.body || {}).answers || {};
  const ids = Object.keys(answers).map(Number);
  if (ids.length === 0) return res.status(400).json({ error: 'No answers submitted' });

  let correct = 0; const review = [];
  for (const id of ids) {
    const q = store.findQuestionById(id);
    if (!q || q.courseId !== course.id) continue;
    const chosen = Number(answers[id]);
    const ok = chosen === q.correctIndex;
    if (ok) correct++;
    review.push({ questionId: id, yourAnswer: chosen, correctIndex: q.correctIndex, correct: ok });
  }
  const total = review.length || 1;
  const score = Math.round((correct / total) * 100);
  const passPercent = (course.exam && course.exam.passPercent) || 70;
  const passed = score >= passPercent;

  store.createAttempt({ userId: req.user.id, courseId: course.id, score, correct, total, passed });

  let credential = null;
  if (passed) {
    const have = store.findCertificate(req.user.id, course.id);
    if (have) credential = have.credentialId;
    else {
      credential = 'ITHR-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + course.id;
      store.createCertificate(req.user.id, course.id, credential);
    }
    enrollment.status = 'completed';
    enrollment.completedAt = new Date().toISOString();
    store.updateEnrollment();
  }
  res.json({ score, correct, total, passed, passPercent, credential, review });
});

app.get('/api/courses/:slug/attempts', auth, (req, res) => {
  const course = store.findCourseBySlug(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(store.listAttempts(req.user.id, course.id).sort((a, b) => (b.takenAt || '').localeCompare(a.takenAt || '')));
});

// ---------- certificates ----------
app.get('/api/certificates', auth, (req, res) => {
  const rows = store.listCertificates(req.user.id).sort((a, b) => (b.issuedAt || '').localeCompare(a.issuedAt || ''));
  res.json(rows.map((r) => {
    const c = store.findCourseById(r.courseId) || {};
    return { credentialId: r.credentialId, courseName: c.name, courseSlug: c.slug, tier: c.tier, issuedAt: r.issuedAt };
  }));
});

app.get('/api/verify/:credentialId', (req, res) => {
  const cert = store.findCertificateById(req.params.credentialId);
  if (!cert) return res.status(404).json({ valid: false, error: 'Credential not found' });
  const course = store.findCourseById(cert.courseId) || {};
  const user = store.findUserById(cert.userId) || {};
  res.json({
    valid: true, credentialId: cert.credentialId, learnerName: user.name,
    courseName: course.name, tier: course.tier, issuedAt: cert.issuedAt,
    issuer: 'ITHR Technologies Consulting LLC',
  });
});

// ---------- ADMIN: course + question management ----------
function normalizeCoursePayload(b) {
  const name = (b.name || '').trim();
  const tier = b.tier || 'Practitioner';
  const level = b.level || (tier === 'Fundamentals' ? 'Beginner' : ['Expert', 'Strategist'].includes(tier) ? 'Advanced' : 'Intermediate');
  const modules = (Array.isArray(b.modules) ? b.modules : String(b.modules || '').split('\n'))
    .map((m, i) => typeof m === 'string' ? { order: i + 1, title: m.trim() } : { order: i + 1, title: (m.title || '').trim() })
    .filter((m) => m.title);
  const skills = (Array.isArray(b.skills) ? b.skills : String(b.skills || '').split('\n')).map((s) => s.trim()).filter(Boolean);
  return {
    name,
    slug: b.slug ? slugify(b.slug) : slugify(name),
    category: b.category,
    tier, level,
    shortDescription: (b.shortDescription || '').trim(),
    longDescription: (b.longDescription || '').trim(),
    durationHours: Number(b.durationHours) || 24,
    priceUsd: Number(b.priceUsd) || 299,
    exam: {
      questions: Number(b.examQuestions) || 10,
      passPercent: Number(b.passPercent) || 70,
      durationMinutes: Number(b.examMinutes) || 30,
      format: b.examFormat || 'Online, AI-proctored — multiple choice',
    },
    modules, skills,
  };
}

app.get('/api/admin/courses', auth, requireAdmin, (req, res) => {
  res.json(store.listCourses().map((c) => ({ ...c, questionCount: store.listQuestions(c.id).length })));
});

app.post('/api/admin/courses', auth, requireAdmin, (req, res) => {
  const payload = normalizeCoursePayload(req.body || {});
  if (!payload.name) return res.status(400).json({ error: 'Name is required' });
  if (!store.categories().some((c) => c.slug === payload.category)) return res.status(400).json({ error: 'Valid category is required' });
  if (store.findCourseBySlug(payload.slug)) return res.status(409).json({ error: 'A course with that slug already exists' });
  res.json(store.createCourse(payload));
});

app.put('/api/admin/courses/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findCourseById(id)) return res.status(404).json({ error: 'Course not found' });
  const payload = normalizeCoursePayload(req.body || {});
  const clash = store.findCourseBySlug(payload.slug);
  if (clash && clash.id !== id) return res.status(409).json({ error: 'Another course already uses that slug' });
  res.json(store.updateCourse(id, payload));
});

app.delete('/api/admin/courses/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findCourseById(id)) return res.status(404).json({ error: 'Course not found' });
  store.deleteCourse(id);
  res.json({ ok: true });
});

app.get('/api/admin/courses/:id/questions', auth, requireAdmin, (req, res) => {
  res.json(store.listQuestions(Number(req.params.id)));
});
app.post('/api/admin/courses/:id/questions', auth, requireAdmin, (req, res) => {
  const courseId = Number(req.params.id);
  if (!store.findCourseById(courseId)) return res.status(404).json({ error: 'Course not found' });
  const { text, options, correctIndex, explanation } = req.body || {};
  if (!text || !Array.isArray(options) || options.length < 2) return res.status(400).json({ error: 'Question text and at least 2 options are required' });
  if (correctIndex == null || correctIndex < 0 || correctIndex >= options.length) return res.status(400).json({ error: 'Valid correct answer index is required' });
  res.json(store.createQuestion(courseId, { text: text.trim(), options: options.map((o) => String(o).trim()), correctIndex: Number(correctIndex), explanation: (explanation || '').trim() }));
});
app.put('/api/admin/questions/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findQuestionById(id)) return res.status(404).json({ error: 'Question not found' });
  const { text, options, correctIndex, explanation } = req.body || {};
  res.json(store.updateQuestion(id, { text: text.trim(), options: options.map((o) => String(o).trim()), correctIndex: Number(correctIndex), explanation: (explanation || '').trim() }));
});
app.delete('/api/admin/questions/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findQuestionById(id)) return res.status(404).json({ error: 'Question not found' });
  store.deleteQuestion(id);
  res.json({ ok: true });
});

// ---------- AI TUTOR ----------
function categoryName(slug) {
  const c = store.categories().find((x) => x.slug === slug);
  return c ? c.name : slug;
}

// Tutor config for a course: profile + composed system prompt + languages + greeting.
app.get('/api/courses/:slug/tutor', auth, (req, res) => {
  const course = store.findCourseBySlug(req.params.slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const profile = tutor.buildProfileFromCourse(course, categoryName(course.category));
  res.json({
    profile,
    systemPrompt: tutor.buildSystemPrompt(profile),
    greeting: tutor.buildGreeting(profile),
    languages: LANGUAGES,
    llm: { provider: llm.activeProvider() },
    tts: { provider: tts.ttsProvider() },
  });
});

// Live tutor chat. Composes the course system prompt server-side, then calls
// the active LLM provider (or the demo tutor when no API key is configured).
app.post('/api/tutor/chat', auth, async (req, res) => {
  const { slug, messages, language } = req.body || {};
  const course = store.findCourseBySlug(slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages[] is required' });

  const profile = tutor.buildProfileFromCourse(course, categoryName(course.category));
  let systemPrompt = tutor.buildSystemPrompt(profile);
  if (language) systemPrompt += `\n\n== ACTIVE LANGUAGE ==\nThe learner has selected language code "${language}". Reply in that language unless they clearly write in another; if they switch, follow them.`;

  const clean = messages.slice(-20)
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  try {
    const { reply, provider } = await llm.chat({ systemPrompt, messages: clean });
    res.json({ reply, provider, tutorName: profile.tutorName });
  } catch (err) {
    res.status(500).json({ error: 'Tutor is unavailable right now: ' + err.message });
  }
});

// ---------- health check (for host uptime probes) ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', courses: store.listCourses().length, llm: llm.activeProvider(), tts: tts.ttsProvider(), time: new Date().toISOString() });
});

// Streaming tutor chat: writes the reply token-by-token for an instant feel.
app.post('/api/tutor/chat/stream', auth, async (req, res) => {
  const { slug, messages, language } = req.body || {};
  const course = store.findCourseBySlug(slug);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'messages[] is required' });
  const profile = tutor.buildProfileFromCourse(course, categoryName(course.category));
  let systemPrompt = tutor.buildSystemPrompt(profile);
  if (language) systemPrompt += `\n\n== ACTIVE LANGUAGE ==\nThe learner selected language code "${language}". Reply in that language unless they clearly switch.`;
  const clean = messages.slice(-20)
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Tutor-Name', profile.tutorName);
  res.setHeader('X-Tutor-Provider', llm.activeProvider());
  try {
    await llm.chatStream({ systemPrompt, messages: clean, onDelta: (t) => { try { res.write(t); } catch {} } });
  } catch (e) {
    try { res.write('\n\n[tutor unavailable: ' + e.message + ']'); } catch {}
  }
  res.end();
});

// ---------- static frontend ----------
// ---------- ITHR Recruit: job board ----------
function publicJob(j) {
  return { id: j.id, slug: j.slug, title: j.title, department: j.department, employer: j.employer,
    location: j.location, type: j.type, workMode: j.workMode, summary: j.summary,
    description: j.description, requirements: j.requirements || [], certs: j.certs || [],
    postedAt: j.postedAt, status: j.status };
}
function normalizeJob(b) {
  const arr = (v) => Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean)
    : String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
  return {
    title: (b.title || '').trim(), department: (b.department || '').trim(), employer: (b.employer || 'ITHR Technologies').trim(),
    location: (b.location || '').trim(), type: b.type || 'Full-time', workMode: b.workMode || 'Remote',
    summary: (b.summary || '').trim(), description: (b.description || '').trim(),
    requirements: arr(b.requirements), certs: arr(b.certs), status: b.status === 'closed' ? 'closed' : 'open',
  };
}

app.get('/api/jobs', (req, res) => {
  const { q, type, workMode, department } = req.query;
  res.json(store.listJobs({ openOnly: true, q, type, workMode, department }).map(publicJob));
});
app.get('/api/jobs/:slug', (req, res) => {
  const j = store.findJobBySlug(req.params.slug);
  if (!j || j.status !== 'open') return res.status(404).json({ error: 'Job not found' });
  res.json(publicJob(j));
});
app.post('/api/jobs/:slug/apply', (req, res) => {
  const j = store.findJobBySlug(req.params.slug);
  if (!j || j.status !== 'open') return res.status(404).json({ error: 'Job not found or closed' });
  const { name, email, message, linkedin, credentialId } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email' });
  let credentialVerified = false, credentialCourse = null;
  if (credentialId) {
    const cert = store.findCertificateById(String(credentialId).trim());
    if (cert) { credentialVerified = true; const c = store.findCourseById(cert.courseId); credentialCourse = c ? c.name : null; }
  }
  store.createApplication({
    jobId: j.id, jobTitle: j.title, name: String(name).trim(), email: String(email).trim().toLowerCase(),
    message: String(message || '').slice(0, 4000), linkedin: String(linkedin || '').trim(),
    credentialId: credentialId ? String(credentialId).trim() : null, credentialVerified, credentialCourse,
  });
  res.json({ ok: true, credentialVerified, credentialCourse });
});

// admin
app.get('/api/admin/jobs', auth, requireAdmin, (req, res) => {
  res.json(store.listJobs().map((j) => ({ ...publicJob(j), applicationCount: store.listApplications(j.id).length })));
});
app.post('/api/admin/jobs', auth, requireAdmin, (req, res) => {
  const payload = normalizeJob(req.body || {});
  if (!payload.title) return res.status(400).json({ error: 'Title is required' });
  res.json(store.createJob(payload));
});
app.put('/api/admin/jobs/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findJobById(id)) return res.status(404).json({ error: 'Job not found' });
  res.json(store.updateJob(id, normalizeJob(req.body || {})));
});
app.delete('/api/admin/jobs/:id', auth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!store.findJobById(id)) return res.status(404).json({ error: 'Job not found' });
  store.deleteJob(id); res.json({ ok: true });
});
app.get('/api/admin/jobs/:id/applications', auth, requireAdmin, (req, res) => {
  res.json(store.listApplications(Number(req.params.id)));
});
app.get('/api/admin/applications', auth, requireAdmin, (req, res) => {
  res.json(store.listApplications(null));
});

// Premium text-to-speech (returns audio when a provider key is set; 501 otherwise so the UI uses the browser voice).
app.post('/api/tts', auth, async (req, res) => {
  const { text } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
  if (tts.ttsProvider() === 'none') return res.status(501).json({ error: 'No premium TTS provider configured' });
  const out = await tts.synthesize({ text });
  if (!out) return res.status(502).json({ error: 'TTS generation failed' });
  res.setHeader('Content-Type', out.contentType);
  res.setHeader('Cache-Control', 'no-store');
  res.send(out.buffer);
});

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// Host-based routing: each ITHR subdomain serves its own app from one deploy.
function hostLanding(host) {
  host = String(host || '').toLowerCase();
  if (host.startsWith('apps.')) return 'apps.html';
  if (host.startsWith('recruit.')) return 'recruit.html';
  if (host.startsWith('verify.')) return 'verify.html';
  return 'index.html'; // learn.ithr.tech, apex, and onrender.com -> LMS
}
app.use(express.static(PUBLIC_DIR, { index: false }));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(PUBLIC_DIR, hostLanding(req.hostname || req.headers.host)));
});

app.listen(PORT, () => console.log('ITHR LMS running at http://localhost:' + PORT));
