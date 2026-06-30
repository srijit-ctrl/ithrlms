/**
 * Starter question-bank generator for the ITHR LMS.
 * Produces a small set of functional, original multiple-choice questions
 * per course so exams work out of the box. Admins can add/edit/remove
 * questions in the admin panel afterward.
 *
 * Each question: { text, options: [4], correctIndex, explanation }
 */

const TIER_FOCUS = {
  Fundamentals: 1, // awareness
  Practitioner: 2, // applied
  Specialist: 2,
  Expert: 3,       // advanced
  Strategist: 3,
};

function tierQuestion(tier) {
  const map = {
    Fundamentals: {
      text: "What is the primary goal of a 'Fundamentals' tier certification?",
      options: [
        'Build foundational awareness and literacy of the topic',
        'Architect large-scale production systems',
        'Lead enterprise governance and strategy',
        'Perform advanced adversarial testing',
      ],
      correctIndex: 0,
      explanation: 'Fundamentals programs build core awareness and literacy for any learner.',
    },
    Practitioner: {
      text: "A 'Practitioner' tier certification is designed mainly to help you:",
      options: [
        'Apply skills to real, hands-on work in a role',
        'Only memorize definitions and history',
        'Set board-level corporate strategy',
        'Avoid using any tools',
      ],
      correctIndex: 0,
      explanation: 'Practitioner programs focus on applied, job-ready skills.',
    },
    Specialist: {
      text: "A 'Specialist' certification is best described as:",
      options: [
        'Focused depth in a specific niche or platform',
        'A general beginner overview',
        'A non-technical executive primer',
        'Unrelated to any particular domain',
      ],
      correctIndex: 0,
      explanation: 'Specialist programs go deep on a focused niche or platform.',
    },
    Expert: {
      text: "An 'Expert' tier certification typically requires:",
      options: [
        'Advanced, hands-on mastery of the subject',
        'No prior experience at all',
        'Only watching introductory videos',
        'Avoiding practical application',
      ],
      correctIndex: 0,
      explanation: 'Expert programs assume and assess advanced, applied mastery.',
    },
    Strategist: {
      text: "A 'Strategist' tier certification emphasizes:",
      options: [
        'Leadership, strategy and governance at scale',
        'Entry-level tool basics',
        'Single-task manual work',
        'Ignoring organizational impact',
      ],
      correctIndex: 0,
      explanation: 'Strategist programs target leadership, strategy and governance.',
    },
  };
  return map[tier] || map.Practitioner;
}

const CATEGORY_QUESTION = {
  'ai-essentials': {
    text: 'Which statement about modern AI is most accurate?',
    options: [
      'AI systems can make mistakes and outputs should be reviewed',
      'AI is always correct and never needs checking',
      'AI fully understands meaning like a human does',
      'AI cannot be used by non-technical people',
    ],
    correctIndex: 0,
    explanation: 'AI outputs can be wrong or biased and should always be validated.',
  },
  'ai-security': {
    text: 'Which is a recognized risk specific to AI/ML systems?',
    options: [
      'Prompt injection and data poisoning',
      'Only physical theft of servers',
      'There are no AI-specific risks',
      'Slow internet connections',
    ],
    correctIndex: 0,
    explanation: 'Prompt injection and data poisoning are AI-specific threat classes.',
  },
  'ai-development': {
    text: 'What does an LLM "context window" refer to?',
    options: [
      'The amount of text the model can consider at once',
      'A graphical user interface element',
      'The speed of the GPU',
      'A type of database index',
    ],
    correctIndex: 0,
    explanation: 'The context window is the span of tokens a model can attend to.',
  },
  'blockchain-bitcoin': {
    text: 'A blockchain is best described as:',
    options: [
      'A distributed, append-only ledger of transactions',
      'A single private spreadsheet',
      'A centralized bank database',
      'A type of web browser',
    ],
    correctIndex: 0,
    explanation: 'Blockchains are distributed, tamper-evident, append-only ledgers.',
  },
};

const DEFAULT_CATEGORY_Q = {
  text: 'When applying AI in a professional domain, the best practice is to:',
  options: [
    'Validate results and keep a human in the loop',
    'Trust every output without review',
    'Hide all use of AI from stakeholders',
    'Never measure outcomes',
  ],
  correctIndex: 0,
  explanation: 'Human oversight and validation are essential when applying AI at work.',
};

const COMMON = [
  {
    text: 'What does the abbreviation "AI" stand for?',
    options: ['Artificial Intelligence', 'Automated Internet', 'Applied Information', 'Advanced Interface'],
    correctIndex: 0,
    explanation: 'AI stands for Artificial Intelligence.',
  },
  {
    text: 'A well-structured prompt for a generative AI tool usually includes:',
    options: [
      'Context, a clear task, and the desired output format',
      'Only a single vague word',
      'As much irrelevant detail as possible',
      'No instructions at all',
    ],
    correctIndex: 0,
    explanation: 'Effective prompts provide context, a clear task, and the desired format.',
  },
  {
    text: 'Before using sensitive or personal data with an AI tool, you should:',
    options: [
      'Ensure consent/compliance and minimize what you expose',
      'Paste everything regardless of policy',
      'Assume privacy rules never apply',
      'Share it publicly first',
    ],
    correctIndex: 0,
    explanation: 'Handling sensitive data requires consent, compliance and data minimization.',
  },
  {
    text: 'Which is the most responsible way to treat an AI-generated answer?',
    options: [
      'Verify it against reliable sources before relying on it',
      'Publish it immediately without checks',
      'Assume it is always factual',
      'Never question the output',
    ],
    correctIndex: 0,
    explanation: 'AI outputs should be verified before being relied upon.',
  },
];

/**
 * Generate a starter bank for a course (catalog object).
 * Returns an array of question objects (without ids).
 */
function generateForCourse(course) {
  const bank = [];
  bank.push(tierQuestion(course.tier));
  bank.push(CATEGORY_QUESTION[course.category] || DEFAULT_CATEGORY_Q);
  bank.push(...COMMON);
  // A course-specific framing question.
  bank.push({
    text: `The "${course.name}" program is primarily intended to help learners:`,
    options: [
      course.shortDescription,
      'Avoid learning anything practical',
      'Replace all human judgment entirely',
      'Work without any ethical considerations',
    ],
    correctIndex: 0,
    explanation: 'The correct option reflects the stated goal of this certification.',
  });
  return bank;
}

module.exports = { generateForCourse, TIER_FOCUS };
