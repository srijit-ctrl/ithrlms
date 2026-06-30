/**
 * ITHR Technologies Consulting LLC — Learning Management System
 * Course catalog: AI & Blockchain certification programs.
 *
 * Naming convention: "ITHR Certified <Subject> (<Tier>)"
 * Tiers: Fundamentals (awareness) | Practitioner (applied) | Specialist (niche)
 *        | Expert / Strategist (advanced).
 *
 * All descriptions are original ITHR content.
 */

const CATEGORIES = [
  { slug: 'ai-essentials',        name: 'AI Essentials',         icon: 'sparkles',   blurb: 'Foundational AI literacy for every professional and role.' },
  { slug: 'ai-business',          name: 'AI for Business',       icon: 'briefcase',  blurb: 'Apply AI across functions — PM, sales, marketing, HR, finance and more.' },
  { slug: 'ai-executive',        name: 'AI for Executives',     icon: 'crown',      blurb: 'Strategy, governance and leadership for the AI-driven enterprise.' },
  { slug: 'ai-security',          name: 'AI Security',           icon: 'shield',     blurb: 'Secure AI systems, defend against threats and prove compliance.' },
  { slug: 'ai-cloud',             name: 'AI Cloud',              icon: 'cloud',      blurb: 'Architect and run AI workloads on modern cloud platforms.' },
  { slug: 'ai-development',       name: 'AI Development',        icon: 'code',       blurb: 'Build, ship and engineer real AI applications and agents.' },
  { slug: 'ai-specialization',    name: 'AI Specialization',     icon: 'target',     blurb: 'Vertical and role-specific AI specialties across industries.' },
  { slug: 'ai-healthcare',        name: 'AI Healthcare',         icon: 'heart',      blurb: 'AI for clinicians, administrators and the healthcare ecosystem.' },
  { slug: 'ai-data-robotics',     name: 'AI Data & Robotics',    icon: 'cpu',        blurb: 'Data, analytics, robotics and quantum-ready AI skills.' },
  { slug: 'ai-learning-education', name: 'AI Learning & Education', icon: 'book',    blurb: 'Bring AI into teaching, training and learning design.' },
  { slug: 'ai-design-creative',   name: 'AI Design & Creative',  icon: 'palette',    blurb: 'Creative AI for design, video, audio, games and UX.' },
  { slug: 'blockchain-bitcoin',   name: 'Blockchain & Bitcoin',  icon: 'link',       blurb: 'Blockchain, Bitcoin and Web3 fundamentals through practitioner depth.' },
];

// Tier metadata used for default duration / price / exam shape.
const TIER = {
  Fundamentals: { hours: 16, price: 199,  questions: 40, passPct: 70, durationMin: 60 },
  Practitioner: { hours: 40, price: 499,  questions: 60, passPct: 70, durationMin: 90 },
  Specialist:   { hours: 32, price: 449,  questions: 50, passPct: 72, durationMin: 75 },
  Expert:       { hours: 60, price: 799,  questions: 70, passPct: 75, durationMin: 120 },
  Strategist:   { hours: 64, price: 899,  questions: 70, passPct: 75, durationMin: 120 },
};

/**
 * Raw course definitions: [subject, tier, category, shortDescription]
 * The full "ITHR Certified ..." name is composed at build time.
 */
const RAW = [
  // ---- AI Essentials ----
  ['AI Foundation', 'Fundamentals', 'ai-essentials', 'Core concepts of artificial intelligence, machine learning and responsible use for any beginner.'],
  ['AI Executive Fundamentals', 'Fundamentals', 'ai-essentials', 'A leadership-level primer on what AI can and cannot do for an organization.'],
  ['AI Prompting Fundamentals', 'Fundamentals', 'ai-essentials', 'Write clear, effective prompts and get reliable results from generative AI tools.'],
  ['AI for Everyone', 'Fundamentals', 'ai-essentials', 'Plain-language AI literacy for non-technical learners across every walk of work and life.'],

  // ---- AI for Business ----
  ['AI Agile Project Management Fundamentals', 'Fundamentals', 'ai-business', 'Blend AI assistants into agile delivery, planning and team rituals.'],
  ['AI Project Management Office Practitioner', 'Practitioner', 'ai-business', 'Run an AI-augmented PMO with smarter forecasting, reporting and governance.'],
  ['AI Real Estate Practitioner', 'Practitioner', 'ai-business', 'Apply AI to valuation, listings, lead handling and market analysis in real estate.'],
  ['AI Project Management Practitioner', 'Practitioner', 'ai-business', 'Use AI to plan, track and de-risk projects end to end.'],
  ['AI Program Director Practitioner', 'Practitioner', 'ai-business', 'Lead multi-project programs with AI-driven portfolio insight and reporting.'],
  ['AI Construction Practitioner', 'Practitioner', 'ai-business', 'Bring AI to estimating, scheduling, safety and site operations in construction.'],
  ['AI Legal Agent Specialist', 'Specialist', 'ai-business', 'Build and supervise AI agents for legal research, drafting and review.'],
  ['AI Finance Agent Specialist', 'Specialist', 'ai-business', 'Deploy AI agents for finance workflows, analysis and controls.'],
  ['AI Chief AI Officer Practitioner', 'Practitioner', 'ai-business', 'Stand up an enterprise AI function — strategy, operating model and value delivery.'],
  ['AI Supply Chain Practitioner', 'Practitioner', 'ai-business', 'Optimize demand, inventory and logistics with applied AI.'],
  ['AI Ethics Fundamentals', 'Fundamentals', 'ai-business', 'Recognize and navigate fairness, bias, privacy and accountability in AI.'],
  ['AI Project Manager Fundamentals', 'Fundamentals', 'ai-business', 'A starter path for managers adopting AI in day-to-day delivery.'],
  ['AI Marketing Practitioner', 'Practitioner', 'ai-business', 'Drive campaigns, content and analytics with generative and predictive AI.'],
  ['AI Sales Practitioner', 'Practitioner', 'ai-business', 'Accelerate prospecting, outreach and forecasting with AI tooling.'],
  ['AI Customer Service Practitioner', 'Practitioner', 'ai-business', 'Design AI-assisted support, chat and knowledge experiences customers love.'],
  ['AI Writer Practitioner', 'Practitioner', 'ai-business', 'Produce high-quality content at scale while keeping a human editorial standard.'],
  ['AI Product Manager Fundamentals', 'Fundamentals', 'ai-business', 'Discover, scope and ship AI-powered products that solve real problems.'],
  ['AI Human Resources Practitioner', 'Practitioner', 'ai-business', 'Apply AI across hiring, onboarding, engagement and people analytics — responsibly.'],
  ['AI Finance Practitioner', 'Practitioner', 'ai-business', 'Use AI for FP&A, reporting, risk and finance automation.'],
  ['AI Legal Practitioner', 'Practitioner', 'ai-business', 'Apply AI to contracts, research and compliance with professional rigor.'],
  ['AI Researcher Practitioner', 'Practitioner', 'ai-business', 'Run faster, better-cited research workflows with AI assistance.'],

  // ---- AI for Executives ----
  ['AI Chief AI Officer Strategist', 'Strategist', 'ai-executive', 'Define enterprise AI vision, governance and investment as a C-level leader.'],
  ['AI Executive Strategy', 'Strategist', 'ai-executive', 'Translate AI capability into board-ready strategy and measurable outcomes.'],
  ['AI Governance & Risk for Executives', 'Expert', 'ai-executive', 'Lead responsible AI — policy, risk frameworks and regulatory readiness.'],

  // ---- AI Security ----
  ['AI Security Practitioner', 'Practitioner', 'ai-security', 'Secure AI/ML systems against modern threats across the model lifecycle.'],
  ['AI Security Expert', 'Expert', 'ai-security', 'Advanced defense for AI systems — red teaming, hardening and detection.'],
  ['AI Security Strategist', 'Strategist', 'ai-security', 'Build an enterprise AI security program, strategy and operating model.'],
  ['AI Security Compliance Practitioner', 'Practitioner', 'ai-security', 'Map AI systems to ISO/IEC 42001, NIST AI RMF and emerging regulation.'],
  ['AI Network Practitioner', 'Practitioner', 'ai-security', 'Apply AI to network monitoring, anomaly detection and response.'],
  ['AI Ethical Hacker Practitioner', 'Practitioner', 'ai-security', 'Test AI-enabled systems through ethical hacking and adversarial techniques.'],
  ['AI Risk & Assurance Practitioner', 'Practitioner', 'ai-security', 'Deliver coordinated assurance over AI controls, audits and risk.'],

  // ---- AI Cloud ----
  ['AI Cloud Practitioner', 'Practitioner', 'ai-cloud', 'Deploy and operate AI workloads on leading cloud platforms.'],
  ['AI Architect Practitioner', 'Practitioner', 'ai-cloud', 'Design scalable, cost-aware AI architectures end to end.'],

  // ---- AI Development ----
  ['AI Context Engineering Practitioner', 'Practitioner', 'ai-development', 'Engineer retrieval, memory and context pipelines for reliable LLM apps.'],
  ['AI Vibe Coding Practitioner', 'Practitioner', 'ai-development', 'Build software fast with AI pair-programming and agentic coding workflows.'],
  ['AI Prompting Practitioner', 'Practitioner', 'ai-development', 'Master advanced prompting, evaluation and prompt-ops for production.'],
  ['AI Developer Practitioner', 'Practitioner', 'ai-development', 'Build applications on LLMs and APIs with solid engineering practices.'],
  ['AI Engineer Practitioner', 'Practitioner', 'ai-development', 'Train, fine-tune and ship ML systems into production reliably.'],

  // ---- AI Specialization ----
  ['AI Microsoft 365 Copilot Marketing Specialist', 'Specialist', 'ai-specialization', 'Drive marketing outcomes with Microsoft 365 Copilot day to day.'],
  ['AI Microsoft 365 Copilot HR Specialist', 'Specialist', 'ai-specialization', 'Apply Microsoft 365 Copilot across the HR workflow.'],
  ['AI Agent Specialist', 'Specialist', 'ai-specialization', 'Design, build and govern autonomous and assistive AI agents.'],
  ['AI Sustainability Practitioner', 'Practitioner', 'ai-specialization', 'Use AI to measure, report and improve sustainability and ESG.'],
  ['AI Government Fundamentals', 'Fundamentals', 'ai-specialization', 'AI literacy and use cases for the public sector.'],
  ['AI Policy Maker Practitioner', 'Practitioner', 'ai-specialization', 'Shape sound AI policy, standards and public-sector adoption.'],
  ['AI Mining Practitioner', 'Practitioner', 'ai-specialization', 'Apply AI to exploration, operations and safety in mining.'],
  ['AI Telecommunications Practitioner', 'Practitioner', 'ai-specialization', 'Bring AI to network operations, service and customer experience in telecom.'],
  ['AI Coordinated Assurance Specialist', 'Specialist', 'ai-specialization', 'Coordinate assurance over AI across the three lines of defense.'],

  // ---- AI Healthcare ----
  ['AI Pharma Practitioner', 'Practitioner', 'ai-healthcare', 'Apply AI across drug discovery, trials and pharma operations.'],
  ['AI Healthcare Administrator Practitioner', 'Practitioner', 'ai-healthcare', 'Use AI to improve scheduling, revenue cycle and operations in healthcare.'],
  ['AI Medical Assistant Practitioner', 'Practitioner', 'ai-healthcare', 'Support clinical and admin tasks with AI tools — safely and accurately.'],
  ['AI Healthcare Fundamentals', 'Fundamentals', 'ai-healthcare', 'Foundational AI concepts and use cases for healthcare professionals.'],
  ['AI Doctor Practitioner', 'Practitioner', 'ai-healthcare', 'Augment diagnosis, documentation and decision support with AI.'],
  ['AI Nurse Practitioner', 'Practitioner', 'ai-healthcare', 'Apply AI to nursing workflows, documentation and patient care.'],

  // ---- AI Data & Robotics ----
  ['AI Data Agent Specialist', 'Specialist', 'ai-data-robotics', 'Build AI agents that query, transform and reason over data.'],
  ['AI Quality Assurance Practitioner', 'Practitioner', 'ai-data-robotics', 'Test AI systems and use AI to accelerate QA and test automation.'],
  ['AI Business Intelligence Practitioner', 'Practitioner', 'ai-data-robotics', 'Turn data into decisions with AI-powered analytics and dashboards.'],
  ['AI Data Practitioner', 'Practitioner', 'ai-data-robotics', 'Apply AI/ML across the data lifecycle from ingestion to insight.'],
  ['AI Robotics Practitioner', 'Practitioner', 'ai-data-robotics', 'Program and integrate AI-driven robotics and automation.'],
  ['AI Quantum Practitioner', 'Practitioner', 'ai-data-robotics', 'Explore quantum computing concepts and quantum-AI intersections.'],

  // ---- AI Learning & Education ----
  ['AI Educator Practitioner', 'Practitioner', 'ai-learning-education', 'Integrate AI into curriculum, instruction and assessment, ethically.'],
  ['AI Learning & Development Practitioner', 'Practitioner', 'ai-learning-education', 'Design AI-enhanced corporate training and learning programs.'],

  // ---- AI Design & Creative ----
  ['AI Video Practitioner', 'Practitioner', 'ai-design-creative', 'Create and edit video with generative AI workflows.'],
  ['AI Game Design Practitioner', 'Practitioner', 'ai-design-creative', 'Use AI across game design, assets and prototyping.'],
  ['AI Audio Practitioner', 'Practitioner', 'ai-design-creative', 'Produce music, voice and sound design with AI tools.'],
  ['AI Game Design Agent Specialist', 'Specialist', 'ai-design-creative', 'Build AI agents and systems for game design and live ops.'],
  ['AI UX Designer Practitioner', 'Practitioner', 'ai-design-creative', 'Apply AI to research, design and testing across the UX process.'],
  ['AI Design Practitioner', 'Practitioner', 'ai-design-creative', 'Use generative AI across visual and graphic design workflows.'],

  // ---- Blockchain & Bitcoin ----
  ['Bitcoin for Everyone', 'Fundamentals', 'blockchain-bitcoin', 'A clear introduction to Bitcoin, wallets and how it works.'],
  ['Bitcoin Executive Fundamentals', 'Fundamentals', 'blockchain-bitcoin', 'What leaders need to know about Bitcoin and digital assets.'],
  ['Bitcoin Developer Practitioner', 'Practitioner', 'blockchain-bitcoin', 'Build applications on Bitcoin and the Lightning Network.'],
  ['Blockchain Developer Practitioner', 'Practitioner', 'blockchain-bitcoin', 'Develop smart contracts and decentralized apps on modern chains.'],
  ['Blockchain Executive Fundamentals', 'Fundamentals', 'blockchain-bitcoin', 'A strategy-level overview of blockchain and Web3 for decision makers.'],
  ['Bitcoin Security Practitioner', 'Practitioner', 'blockchain-bitcoin', 'Secure keys, wallets and Bitcoin infrastructure against real threats.'],
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Generate a reasonable module outline from the subject + tier.
function buildModules(subject, tier) {
  const base = [
    `Foundations & key concepts of ${subject.replace(/^AI /, 'AI in this domain')}`,
    'Core tools, platforms and the current AI landscape',
    'Hands-on workflows and applied techniques',
    'Responsible, ethical and secure use',
  ];
  const advanced = [
    'Architecture, scaling and integration',
    'Evaluation, measurement and continuous improvement',
    'Governance, risk and compliance',
    'Capstone project and exam preparation',
  ];
  const set = tier === 'Fundamentals' ? base.concat(['Real-world case studies', 'Exam preparation'])
    : base.concat(advanced);
  return set.map((title, i) => ({ order: i + 1, title }));
}

function buildSkills(subject) {
  return [
    'Apply AI tools to real tasks confidently',
    `Solve domain problems with ${subject}`,
    'Evaluate outputs for quality, bias and risk',
    'Communicate AI value to stakeholders',
    'Operate within ethical and compliance guardrails',
  ];
}

const COURSES = RAW.map(([subject, tier, category, shortDesc], idx) => {
  const t = TIER[tier];
  const name = `ITHR Certified ${subject} (${tier})`;
  return {
    id: idx + 1,
    name,
    subject,
    slug: slugify(`${subject}-${tier}`),
    category,
    tier,
    level: tier === 'Fundamentals' ? 'Beginner'
      : tier === 'Practitioner' || tier === 'Specialist' ? 'Intermediate' : 'Advanced',
    shortDescription: shortDesc,
    longDescription:
      `${shortDesc} This ITHR Technologies Consulting LLC program blends concise lessons, hands-on labs and real scenarios so you can apply ${subject} from day one. You'll finish ready to sit the proctored ITHR certification exam and earn a verifiable digital credential.`,
    durationHours: t.hours,
    priceUsd: t.price,
    exam: { questions: t.questions, passPercent: t.passPct, durationMinutes: t.durationMin, format: 'Online, AI-proctored — multiple choice, scenarios and practical items' },
    modules: buildModules(subject, tier),
    skills: buildSkills(subject),
    rating: Number((4.5 + ((idx * 7) % 5) / 10).toFixed(1)), // 4.5–4.9, deterministic
    learners: 800 + ((idx * 137) % 9000),
  };
});

module.exports = { CATEGORIES, COURSES, TIER };
