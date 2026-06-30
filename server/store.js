/**
 * Zero-dependency JSON-file data store for the ITHR LMS.
 * Persists everything to server/data.json.
 *
 * Courses & questions are SEEDED from data/catalog.js on first run, then
 * become fully editable through the admin panel. Chosen over a native
 * SQLite driver so the project installs and runs anywhere with only Node.
 */
const fs = require('fs');
const path = require('path');
const { CATEGORIES, COURSES } = require('./data/catalog');
const { generateForCourse } = require('./data/questions');
let JOB_SEED = [];
try { JOB_SEED = require('./data/jobs.seed'); } catch {}
// Authored course content: legacy content.json (if present) merged with any
// per-course files in data/content/*.json (per-course files take precedence).
let CONTENT = {};
try { CONTENT = { ...require('./data/content.json') }; } catch {}
try {
  const dir = path.join(__dirname, 'data', 'content');
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json')) continue;
    try { CONTENT[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { console.error('content load failed for', f, e.message); }
  }
} catch {}

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_PATH = path.join(DATA_DIR, 'data.json');

const DEFAULT = {
  seq: { users: 0, enrollments: 0, certificates: 0, courses: 0, questions: 0, attempts: 0, jobs: 0, applications: 0 },
  users: [],
  enrollments: [],
  certificates: [],
  courses: [],
  questions: [],
  attempts: [],
  jobs: [],
  applications: [],
};

let data;
function load() {
  try {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    for (const k of Object.keys(DEFAULT)) if (data[k] === undefined) data[k] = DEFAULT[k];
    for (const k of Object.keys(DEFAULT.seq)) if (data.seq[k] === undefined) data.seq[k] = 0;
  } catch {
    data = JSON.parse(JSON.stringify(DEFAULT));
  }
  if (data.courses.length === 0) seedCatalog();
  save();
}
function save() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}
function nextId(table) { data.seq[table] += 1; return data.seq[table]; }

function seedCatalog() {
  data.courses = COURSES.map((c) => ({ ...c }));
  data.seq.courses = COURSES.reduce((m, c) => Math.max(m, c.id), 0);
  data.questions = [];
  for (const c of data.courses) {
    for (const q of generateForCourse(c)) {
      data.questions.push({ id: nextId('questions'), courseId: c.id, ...q });
    }
  }
}

// Apply authored lesson content + real question banks for courses defined in
// content.json. Idempotent: only updates a course when its contentVersion
// differs, so it upgrades existing live data without wiping users/enrollments.
function applyContent() {
  let changed = false;
  for (const [slug, entry] of Object.entries(CONTENT)) {
    const course = data.courses.find((c) => c.slug === slug);
    if (!course) continue;
    if (course.contentVersion === entry.version) continue;
    if (Array.isArray(entry.modules) && entry.modules.length) {
      course.modules = entry.modules.map((m, i) => ({ order: m.order || i + 1, ...m }));
    }
    if (Array.isArray(entry.questions) && entry.questions.length) {
      data.questions = data.questions.filter((q) => q.courseId !== course.id);
      for (const q of entry.questions) {
        data.questions.push({ id: nextId('questions'), courseId: course.id, ...q });
      }
    }
    course.contentVersion = entry.version;
    course.hasContent = true;
    changed = true;
  }
  if (changed) save();
}

load();
applyContent();
seedJobs();


function jslug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function seedJobs() {
  if ((data.jobs || []).length > 0) return;
  for (const j of JOB_SEED) {
    const id = nextId('jobs');
    data.jobs.push({ id, slug: jslug(j.title) + '-' + id, postedAt: new Date().toISOString(), status: 'open', ...j });
  }
  save();
}

const api = {
  raw: () => data,
  save,
  categories: () => CATEGORIES,

  findUserByEmail(email) { return data.users.find((u) => u.email === email.toLowerCase()); },
  findUserById(id) { return data.users.find((u) => u.id === id); },
  createUser({ name, email, passwordHash, role = 'learner' }) {
    const user = { id: nextId('users'), name, email: email.toLowerCase(), passwordHash, role, createdAt: new Date().toISOString() };
    data.users.push(user); save(); return user;
  },

  listCourses() { return data.courses; },
  findCourseById(id) { return data.courses.find((c) => c.id === id); },
  findCourseBySlug(slug) { return data.courses.find((c) => c.slug === slug); },
  createCourse(course) {
    const id = nextId('courses');
    const full = { id, learners: 0, rating: 4.7, ...course };
    data.courses.push(full); save(); return full;
  },
  updateCourse(id, patch) {
    const c = api.findCourseById(id);
    if (!c) return null;
    Object.assign(c, patch, { id });
    save(); return c;
  },
  deleteCourse(id) {
    data.courses = data.courses.filter((c) => c.id !== id);
    data.questions = data.questions.filter((q) => q.courseId !== id);
    save();
  },

  listQuestions(courseId) { return data.questions.filter((q) => q.courseId === courseId); },
  findQuestionById(id) { return data.questions.find((q) => q.id === id); },
  createQuestion(courseId, q) {
    const question = { id: nextId('questions'), courseId, ...q };
    data.questions.push(question); save(); return question;
  },
  updateQuestion(id, patch) {
    const q = api.findQuestionById(id);
    if (!q) return null;
    Object.assign(q, patch, { id });
    save(); return q;
  },
  deleteQuestion(id) { data.questions = data.questions.filter((q) => q.id !== id); save(); },

  listEnrollments(userId) { return data.enrollments.filter((e) => e.userId === userId); },
  findEnrollment(userId, courseId) { return data.enrollments.find((e) => e.userId === userId && e.courseId === courseId); },
  createEnrollment(userId, courseId) {
    const e = { id: nextId('enrollments'), userId, courseId, progressPct: 0, completedModules: [], status: 'in_progress', enrolledAt: new Date().toISOString(), completedAt: null };
    data.enrollments.push(e); save(); return e;
  },
  updateEnrollment() { save(); },

  listAttempts(userId, courseId) { return data.attempts.filter((a) => a.userId === userId && a.courseId === courseId); },
  createAttempt(attempt) {
    const a = { id: nextId('attempts'), ...attempt, takenAt: new Date().toISOString() };
    data.attempts.push(a); save(); return a;
  },

  listCertificates(userId) { return data.certificates.filter((c) => c.userId === userId); },
  findCertificate(userId, courseId) { return data.certificates.find((c) => c.userId === userId && c.courseId === courseId); },
  findCertificateById(credentialId) { return data.certificates.find((c) => c.credentialId === credentialId); },
  createCertificate(userId, courseId, credentialId) {
    const cert = { id: nextId('certificates'), userId, courseId, credentialId, issuedAt: new Date().toISOString() };
    data.certificates.push(cert); save(); return cert;
  },

  // ---- jobs ----
  listJobs(filter = {}) {
    let list = data.jobs.slice();
    if (filter.openOnly) list = list.filter((j) => j.status === 'open');
    if (filter.q) { const n = filter.q.toLowerCase(); list = list.filter((j) => (j.title + ' ' + j.summary + ' ' + j.department + ' ' + j.employer).toLowerCase().includes(n)); }
    if (filter.type) list = list.filter((j) => j.type === filter.type);
    if (filter.workMode) list = list.filter((j) => j.workMode === filter.workMode);
    if (filter.department) list = list.filter((j) => j.department === filter.department);
    return list.sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));
  },
  findJobById(id) { return data.jobs.find((j) => j.id === id); },
  findJobBySlug(slug) { return data.jobs.find((j) => j.slug === slug); },
  createJob(job) {
    const id = nextId('jobs');
    const full = { id, slug: jslug(job.title || ('job-' + id)) + '-' + id, postedAt: new Date().toISOString(), status: job.status || 'open', ...job };
    data.jobs.push(full); save(); return full;
  },
  updateJob(id, patch) {
    const j = api.findJobById(id);
    if (!j) return null;
    Object.assign(j, patch, { id, slug: j.slug });
    save(); return j;
  },
  deleteJob(id) {
    data.jobs = data.jobs.filter((j) => j.id !== id);
    data.applications = data.applications.filter((a) => a.jobId !== id);
    save();
  },

  // ---- applications ----
  listApplications(jobId) {
    return data.applications.filter((a) => jobId == null || a.jobId === jobId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  },
  createApplication(app) {
    const a = { id: nextId('applications'), createdAt: new Date().toISOString(), ...app };
    data.applications.push(a); save(); return a;
  },
};

module.exports = api;
