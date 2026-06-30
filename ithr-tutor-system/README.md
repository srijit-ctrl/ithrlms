# ITHR Technologies Consulting LLC — AI Tutor System

A **reusable, configurable system** for spinning up a course-specific AI tutor for any program on the ITHR training portal. One tutor is bound to one course. You create a new tutor purely by supplying a **Course Profile**; the master template, language policy, and guardrails are shared and never rewritten per course.

```
Course Profile ─┐
Master Prompt  ─┼──►  fill {{PLACEHOLDERS}}  ──►  deploy-ready system prompt  ──►  any LLM
Languages      ─┤
Guardrails     ─┘
```

## What's in this package

| File | Purpose |
|---|---|
| `master-system-prompt.md` | The master instruction template with `{{PLACEHOLDERS}}` |
| `course-profile.schema.json` | JSON Schema defining every field of a Course Profile |
| `languages.md` | The 70+ supported languages and the language-handling rules |
| `guardrails.md` | Standalone guardrails specification |
| `examples/ai-supply-chain/` | A fully instantiated, deploy-ready worked example |
| ↳ `profile.json` | Filled-in AI Supply Chain Practitioner profile |
| ↳ `system-prompt.md` | Master prompt with that profile injected (paste-and-run) |
| ↳ `practice-questions.md` | 16-item concept-check bank covering all 8 domains |
| ↳ `sample-dialogue.md` | A live session showing a hint and a mid-chat language switch |

## Design principles

- **Course-bound.** Each tutor teaches exactly one course; its scope is the syllabus in the profile.
- **Warm & Socratic.** Encouraging, patient personality; hints before answers; scaffolds and worked examples; formative checks; detects confusion and slows down.
- **Multilingual.** Auto-detects the learner's language, replies in kind, switches on request, preserves technical terms.
- **Guardrailed.** Stays on-topic, never fabricates, never hands over exam answers, professional tone, escalates to a human instructor.
- **Provider-agnostic.** The composed prompt drops into any capable chat model.

## 4-step deploy guide

**Step 1 — Author a Course Profile.**
Copy `examples/ai-supply-chain/profile.json` to a new file and edit the fields to match your course. The required fields and allowed values are defined in `course-profile.schema.json`. (Tip: validate with any JSON-Schema validator, e.g. `ajv validate -s course-profile.schema.json -d your-profile.json`.)

**Step 2 — Inject the profile into the master prompt.**
Open `master-system-prompt.md` and replace every `{{PLACEHOLDER}}` with the matching value from your profile (lists become bullet lines). The placeholder→field map is listed at the bottom of that file. The result is a single deploy-ready system prompt — see `examples/ai-supply-chain/system-prompt.md` for what a finished one looks like.

**Step 3 — Wire it to a model.**
Send the composed text as the **system** prompt and stream the learner's turns as user/assistant messages. Any capable chat model works. (In the ITHR LMS this is automated: `server/tutor/` builds the profile from the catalog and `POST /api/tutor/chat` calls the active provider — Anthropic by default, OpenAI fallback, or an offline demo tutor.)

**Step 4 — Smoke-test before launch.**
Run the checks in `examples/ai-supply-chain/sample-dialogue.md`: greet in two languages, ask for a hint (confirm it nudges before answering), trigger a formative quiz, and request an out-of-scope topic (confirm a kind redirect). Confirm an escalation path resolves to a real human contact.

---
© ITHR Technologies Consulting LLC.
