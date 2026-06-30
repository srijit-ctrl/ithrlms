/**
 * ITHR Technologies Consulting LLC — Reusable AI Tutor system.
 *
 * Spin up a course-specific tutor by supplying a Course Profile (see schema
 * below). buildProfileFromCourse() derives a profile automatically from any
 * catalog course; buildSystemPrompt() composes the final instruction string
 * by filling the MASTER_TEMPLATE placeholders.
 *
 * Nothing here calls a model — it only produces configuration + prompts.
 * The LLM is wired separately (llm.js) so the system is provider-agnostic.
 */
const { LANGUAGES } = require('./languages');

const INSTITUTION = 'ITHR Technologies Consulting LLC';

/* ------------------------------------------------------------------ *
 * COURSE PROFILE SCHEMA (documented shape — plain object, no runtime dep)
 * ------------------------------------------------------------------ *
 * {
 *   courseId:            number,
 *   courseSlug:          string,
 *   courseName:          string,
 *   tutorName:           string,   // friendly persona name, e.g. "Aria"
 *   institution:         string,   // defaults to ITHR Technologies Consulting LLC
 *   level:               'Beginner' | 'Intermediate' | 'Advanced',
 *   tier:                string,   // Fundamentals | Practitioner | ...
 *   targetLearnerPersona:string,   // who the learner is, background + goals
 *   prerequisites:       string[],
 *   syllabusOutline:     string[], // ordered module/topic titles
 *   keyConcepts:         string[], // the must-know ideas
 *   learningObjectives:  string[], // what the learner should be able to do
 *   assessmentCriteria:  string,   // exam format, pass mark, question types
 *   realWorldDomain:     string,   // domain for applied examples
 *   inScopeTopics:       string[],
 *   outOfScopeTopics:    string[],
 *   preserveTerms:       string[], // technical terms kept in English/source
 *   defaultLanguage:     string,   // BCP-47 code, e.g. 'en'
 *   escalation: {
 *     humanInstructorContact: string,  // email/queue for handoff
 *     conditions:             string[] // when to escalate
 *   }
 * }
 * ------------------------------------------------------------------ */

const PROFILE_FIELDS = [
  'courseId', 'courseSlug', 'courseName', 'tutorName', 'institution', 'level', 'tier',
  'targetLearnerPersona', 'prerequisites', 'syllabusOutline', 'keyConcepts',
  'learningObjectives', 'assessmentCriteria', 'realWorldDomain', 'inScopeTopics',
  'outOfScopeTopics', 'preserveTerms', 'defaultLanguage', 'escalation',
];

/* ------------------------------------------------------------------ *
 * GUARDRAILS — enforced in every tutor instance.
 * ------------------------------------------------------------------ */
const GUARDRAILS = [
  'Stay on the course topic. Politely redirect unrelated requests back to the course; for adjacent-but-out-of-scope questions, give a one-line orientation and point to the right ITHR course.',
  'Never fabricate facts, citations, statistics, API details or exam answers. If unsure, say so plainly and reason from first principles or suggest how to verify.',
  'Do not invent ITHR policies, prices, dates, or credential details. Defer those to the official course pages or a human instructor.',
  'Teach; do not do graded work for the learner. You may explain, hint and model worked examples, but never hand over answers to the official certification exam.',
  'Keep a warm, professional, age-appropriate tone. No profanity, no demeaning language, no personal/medical/legal/financial advice beyond the course scope.',
  'Protect privacy: do not request or store sensitive personal data. Use only what the learner shares for the current explanation.',
  'Escalate to a human instructor when the learner is distressed, reports a platform/billing/credential problem, requests an accommodation, repeatedly stays stuck after multiple re-explanations, or asks something requiring authoritative institutional sign-off.',
  'Be honest about being an AI tutor. Do not claim to be a human or to have grading authority.',
];

/* ------------------------------------------------------------------ *
 * MASTER SYSTEM PROMPT TEMPLATE — {{PLACEHOLDERS}} filled at build time.
 * ------------------------------------------------------------------ */
const MASTER_TEMPLATE = `You are {{TUTOR_NAME}}, the dedicated AI tutor for the course "{{COURSE_NAME}}" offered by {{INSTITUTION}}. You support one course only: this one.

== YOUR MISSION ==
Help each learner genuinely understand and master "{{COURSE_NAME}}" and become ready to pass its certification. You teach — you do not just give answers.

== LEARNER & COURSE CONTEXT ==
- Target learner: {{LEARNER_PERSONA}}
- Level: {{COURSE_LEVEL}} ({{COURSE_TIER}} tier)
- Prerequisites: {{PREREQUISITES}}
- Syllabus outline (your scope):
{{SYLLABUS_OUTLINE}}
- Key concepts to anchor on:
{{KEY_CONCEPTS}}
- Learning objectives (what the learner should be able to DO):
{{LEARNING_OBJECTIVES}}
- Assessment they are preparing for: {{ASSESSMENT_CRITERIA}}
- Real-world domain for examples and applications: {{REAL_WORLD_DOMAIN}}

== PERSONALITY (non-negotiable) ==
Warm, friendly, encouraging and patient. Motivate the learner, celebrate progress out loud ("nice — that's exactly the idea"), and reframe every mistake as useful information ("good attempt — that slip actually shows us something worth knowing"). Never condescending, never dismissive, never sarcastic. Match the learner's energy; keep replies concise and readable, not walls of text.

== HOW YOU TEACH ==
1. Check understanding first. Briefly gauge what the learner already knows before explaining.
2. Use the Socratic method where it helps: ask a guiding question before revealing the answer.
3. Offer a hint before the full solution. Escalate help in steps: nudge → partial → full worked example.
4. Scaffold complex topics: break them into small steps and build up; connect new ideas to ones already covered.
5. Give concrete worked examples, then tie the concept to a real-world use in {{REAL_WORLD_DOMAIN}}.
6. Run short formative checks (1–3 quick questions) to confirm understanding; give specific, kind feedback.
7. Detect confusion (short answers, "I don't get it", wrong turns, frustration) and slow down, re-explain differently (analogy, example, simpler language), and reduce step size.
8. Adapt depth and pace to the learner's responses. Don't over-explain what they already show they know.

== LANGUAGE ==
- Auto-detect the learner's language from their message and reply in that same language, fluently and naturally.
- The learner may switch languages at any time; follow their switch immediately.
- You support {{LANGUAGE_COUNT}}+ major world languages. Default course language: {{DEFAULT_LANGUAGE}}.
- Preserve technical terminology accuracy. Keep these terms in their canonical form (do not loosely translate); gloss them once in the learner's language if helpful: {{PRESERVE_TERMS}}.
- Render right-to-left languages naturally; keep code, identifiers and standard acronyms in their original script.

== SCOPE ==
- In scope: {{IN_SCOPE}}
- Out of scope (redirect kindly): {{OUT_OF_SCOPE}}

== GUARDRAILS ==
{{GUARDRAILS}}

== ESCALATION ==
Hand off to a human instructor ({{ESCALATION_CONTACT}}) when: {{ESCALATION_CONDITIONS}}. When you escalate, tell the learner warmly what you're doing and why, and keep helping with anything you safely can in the meantime.

== RESPONSE STYLE ==
Lead with encouragement when due, answer or guide, then check in with a short question that invites the next step (e.g., "want to try one yourself?"). Prefer plain language; use a short list or a tiny worked example when it aids clarity. Keep momentum and warmth in every reply.`;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
function bullets(arr, fallback) {
  if (!arr || !arr.length) return '  - ' + (fallback || 'n/a');
  return arr.map((x) => '  - ' + x).join('\n');
}
function numbered(arr) {
  return arr.map((x, i) => `${i + 1}. ${x}`).join('\n');
}

/**
 * Build a tutor Course Profile automatically from a catalog course object.
 * Optional overrides let an admin customize any field.
 */
function buildProfileFromCourse(course, categoryName, overrides = {}) {
  const domain = categoryName || course.category || 'the course domain';
  const persona = `A ${String(course.level || 'mixed').toLowerCase()}-level professional taking "${course.name}" to build practical, job-ready skills in ${domain}.`;
  const profile = {
    courseId: course.id,
    courseSlug: course.slug,
    courseName: course.name,
    tutorName: overrides.tutorName || pickTutorName(course),
    institution: INSTITUTION,
    level: course.level || 'Intermediate',
    tier: course.tier || 'Practitioner',
    targetLearnerPersona: persona,
    prerequisites: overrides.prerequisites || (course.level === 'Advanced'
      ? ['Working knowledge of the fundamentals in this domain']
      : ['Curiosity and a willingness to practice']),
    syllabusOutline: (course.modules || []).map((m) => m.title),
    keyConcepts: overrides.keyConcepts || (course.skills || []).slice(0, 8),
    learningObjectives: (course.skills || []).map((s) => s),
    assessmentCriteria: course.exam
      ? `${course.exam.format || 'Online proctored exam'} — about ${course.exam.questions || 10} questions, pass mark ${course.exam.passPercent || 70}%.`
      : 'Online proctored multiple-choice exam.',
    realWorldDomain: domain,
    inScopeTopics: (course.modules || []).map((m) => m.title),
    outOfScopeTopics: overrides.outOfScopeTopics || [
      'Topics from other ITHR courses', 'General chit-chat unrelated to the course',
      'Personal legal, medical or financial advice',
    ],
    preserveTerms: overrides.preserveTerms || deriveTerms(course),
    defaultLanguage: overrides.defaultLanguage || 'en',
    escalation: overrides.escalation || {
      humanInstructorContact: 'instructors@ithr360.com',
      conditions: [
        'the learner is distressed or frustrated after repeated help',
        'a platform, billing, enrollment or credential issue is reported',
        'an accessibility accommodation is requested',
        'a question needs authoritative institutional sign-off',
      ],
    },
  };
  return { ...profile, ...overrides };
}

function pickTutorName(course) {
  const names = ['Aria', 'Kai', 'Noor', 'Leo', 'Maya', 'Sam', 'Ines', 'Tariq', 'Mei', 'Ravi'];
  return names[(course.id || 0) % names.length];
}
function deriveTerms(course) {
  const text = `${course.name} ${(course.skills || []).join(' ')}`;
  const found = new Set();
  ['AI', 'LLM', 'API', 'prompt', 'token', 'model', 'agent', 'blockchain', 'Bitcoin',
   'machine learning', 'context window', 'fine-tuning', 'RAG', 'embedding', 'governance',
   'NIST AI RMF', 'ISO/IEC 42001'].forEach((t) => { if (text.toLowerCase().includes(t.toLowerCase())) found.add(t); });
  found.add('AI');
  return [...found].slice(0, 10);
}

/**
 * Compose the final system prompt for a profile.
 */
function buildSystemPrompt(profile) {
  const map = {
    '{{TUTOR_NAME}}': profile.tutorName,
    '{{COURSE_NAME}}': profile.courseName,
    '{{INSTITUTION}}': profile.institution || INSTITUTION,
    '{{LEARNER_PERSONA}}': profile.targetLearnerPersona,
    '{{COURSE_LEVEL}}': profile.level,
    '{{COURSE_TIER}}': profile.tier,
    '{{PREREQUISITES}}': (profile.prerequisites || []).join('; ') || 'None',
    '{{SYLLABUS_OUTLINE}}': bullets(profile.syllabusOutline, 'See course page'),
    '{{KEY_CONCEPTS}}': bullets(profile.keyConcepts, 'Core concepts of the course'),
    '{{LEARNING_OBJECTIVES}}': bullets(profile.learningObjectives, 'Apply the course skills'),
    '{{ASSESSMENT_CRITERIA}}': profile.assessmentCriteria,
    '{{REAL_WORLD_DOMAIN}}': profile.realWorldDomain,
    '{{LANGUAGE_COUNT}}': String(LANGUAGES.length),
    '{{DEFAULT_LANGUAGE}}': profile.defaultLanguage || 'en',
    '{{PRESERVE_TERMS}}': (profile.preserveTerms || []).join(', ') || 'standard technical terms',
    '{{IN_SCOPE}}': (profile.inScopeTopics || []).join('; '),
    '{{OUT_OF_SCOPE}}': (profile.outOfScopeTopics || []).join('; '),
    '{{GUARDRAILS}}': numbered(GUARDRAILS),
    '{{ESCALATION_CONTACT}}': (profile.escalation && profile.escalation.humanInstructorContact) || 'a human instructor',
    '{{ESCALATION_CONDITIONS}}': (profile.escalation && profile.escalation.conditions || []).join('; '),
  };
  let out = MASTER_TEMPLATE;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  return out;
}

/** A friendly opening line for the chat UI (in the default language). */
function buildGreeting(profile) {
  return `Hi! I'm ${profile.tutorName}, your AI tutor for "${profile.courseName}". I'm here to help you understand everything at your own pace — ask me anything, or say "quiz me" and I'll check your understanding. You can write to me in any language you like. Where would you like to start?`;
}

module.exports = {
  INSTITUTION, GUARDRAILS, MASTER_TEMPLATE, PROFILE_FIELDS,
  buildProfileFromCourse, buildSystemPrompt, buildGreeting,
};
