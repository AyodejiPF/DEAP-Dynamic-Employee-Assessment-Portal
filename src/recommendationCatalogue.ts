export type RecommendationTrack = 'product' | 'uiux' | 'analytics'

export interface RecommendationFeature {
  title: string
  description: string
  track: RecommendationTrack
  category: string
  priority?: string
  sourceHint?: string
}

interface ProductFeatureDraft {
  title: string
  description: string
  sourceHint?: string
}

interface ProductFeatureGroupDraft {
  priority: string
  theme: string
  purpose: string
  items: ProductFeatureDraft[]
}

export const recommendationSources = [
  { label: 'D2L Performance+', url: 'https://www.d2l.com/brightspace/performance/' },
  { label: 'Moodle Workplace', url: 'https://moodle.com/us/products/workplace/features/' },
  { label: 'Canvas New Analytics', url: 'https://www.ncl.ac.uk/learning-and-teaching/digital-technologies/canvas/canvas-new-analytics/' },
  { label: 'UW item analysis', url: 'https://www.washington.edu/assessment/scanning-scoring/scoring/reports/item-analysis/' },
  { label: 'Perplexity Sonar API', url: 'https://docs.perplexity.ai/api-reference/sonar-post' },
  { label: 'GoodData accessibility', url: 'https://www.gooddata.ai/docs/cloud/create-dashboards/accessibility/' },
  { label: 'ArcGIS dashboard accessibility', url: 'https://doc.arcgis.com/en/dashboards/latest/reference/accessibility-best-practices.htm' },
  { label: 'WCAG contrast', url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html' },
]

export const enterpriseRoadmap: ProductFeatureGroupDraft[] = [
  {
    priority: 'Priority 1',
    theme: 'Reliability, Trust, and Control',
    purpose: 'Make Staffiq dependable for live employees, admins, compliance evidence, and executive review.',
    items: [
      {
        title: 'Server-Authoritative Assessment State',
        description:
          'Move test availability, session progress, responses, and completion status into the shared server state so the admin console becomes the source of truth. This prevents browser-local drift and makes employee portals reflect approved test changes immediately.',
        sourceHint: 'LMS report and access-control patterns',
      },
      {
        title: 'Real Authentication and Password Reset',
        description:
          'Replace demo-style credentials with production identity controls, account recovery, account disabling, and safer admin-only enforcement. This gives Staffiq a path toward secure staff onboarding and reduced password support.',
        sourceHint: 'Enterprise LMS user management',
      },
      {
        title: 'Role-Based Route Guards',
        description:
          'Protect admin routes, exports, AI endpoints, question banks, analytics, and settings with role checks instead of hiding buttons only in the UI. This makes permissions meaningful and keeps restricted features restricted.',
        sourceHint: 'Access control and dashboard sharing',
      },
      {
        title: 'Immutable Attempt Ledger',
        description:
          'Record each response, reveal event, timeout, score calculation, nullification, and final submission as an audit event. Admins can exclude attempts from analytics without erasing the historical truth.',
        sourceHint: 'Assessment auditability',
      },
      {
        title: 'Attempt Recovery Timeline',
        description:
          'Show autosaves, reconnects, resumes, timeouts, answer reveals, and final submissions for every attempt. This helps admins distinguish real learning issues from network, device, or browser problems.',
        sourceHint: 'Reliability monitoring',
      },
      {
        title: 'Device and Session Control',
        description:
          'Let admins view active devices, limit simultaneous sessions, and revoke suspicious sessions. This reduces accidental duplicate attempts and supports exam integrity without heavy proctoring.',
        sourceHint: 'Secure assessment operations',
      },
      {
        title: 'Backup and Restore Console',
        description:
          'Provide scheduled backups for users, tests, question banks, attempts, and analytics, plus restore points for accidental imports or bulk edits. Staffiq should recover from operational mistakes without losing learning records.',
        sourceHint: 'Enterprise resilience',
      },
      {
        title: 'Admin Activity Export',
        description:
          'Export a governance log covering launches, availability changes, archive actions, permission edits, question-bank changes, AI queries, and nullified attempts. This supports leadership oversight and compliance reviews.',
        sourceHint: 'Report scheduling and audit trails',
      },
      {
        title: 'Uptime and Error Monitoring',
        description:
          'Surface failed saves, failed cloud sync, blank test screens, function errors, and AI call failures as visible health signals. Admins should know there is a problem before employees report missing tests.',
        sourceHint: 'Operational monitoring',
      },
      {
        title: 'Safe Deployment Checklist',
        description:
          'Turn every release into a repeatable quality gate with build checks, smoke tests, function checks, Firestore rule checks, and live browser verification. This reduces release risk as Staffiq grows.',
        sourceHint: 'Production deployment discipline',
      },
    ],
  },
  {
    priority: 'Priority 2',
    theme: 'Assessment Quality and Integrity',
    purpose: 'Improve fairness, item strength, question-bank balance, and defensible scoring.',
    items: [
      {
        title: 'Adaptive Difficulty Engine',
        description:
          'Adjust question difficulty during a test based on recent performance while respecting the assessment blueprint. Strong learners can receive deeper challenge and struggling learners can receive more diagnostic coverage.',
        sourceHint: 'Assessment personalization',
      },
      {
        title: 'Question Exposure Caps',
        description:
          'Set exposure limits so the same questions are not shown too often across users or cohorts. This protects fairness, reduces memorisation risk, and keeps large banks active.',
        sourceHint: 'Question randomisation fairness',
      },
      {
        title: 'Item Calibration Dashboard',
        description:
          'Track item difficulty, discrimination, point-biserial-style correlation, response time, reveal rate, and hint dependence. Admins can identify reliable, confusing, too easy, or too hard questions.',
        sourceHint: 'UW item analysis',
      },
      {
        title: 'Distractor Analysis',
        description:
          'Measure how often each wrong option is selected and by which performance group. Strong distractors reveal misconceptions, while distractors chosen by high performers can signal ambiguity.',
        sourceHint: 'Assessment item analysis',
      },
      {
        title: 'Question Retirement Queue',
        description:
          'Queue questions for review when they are overexposed, confusing, too easy, too hard, or statistically weak. Admins can approve, edit, archive, or replace items without deleting historical attempt data.',
        sourceHint: 'Question-bank quality management',
      },
      {
        title: 'Competency Blueprint Editor',
        description:
          'Let admins define how many questions should come from each competency, topic, difficulty, and question type. This keeps tests balanced and prevents random draws from under-testing important domains.',
        sourceHint: 'Assessment blueprinting',
      },
      {
        title: 'Test Versioning',
        description:
          'Create immutable versions whenever a launched test changes. Employees take the version that was live when assigned, while admins can compare performance across versions.',
        sourceHint: 'Assessment governance',
      },
      {
        title: 'Standard-Setting Workflow',
        description:
          'Configure pass marks by role, difficulty, cohort, or certification purpose. This makes pass thresholds more defensible than a single generic percentage.',
        sourceHint: 'Professional certification practice',
      },
      {
        title: 'Proctor Notes and Incident Flags',
        description:
          'Allow supervisors to attach notes for connectivity problems, observed issues, or approved accommodations. Notes can appear in analytics while remaining separate from scoring.',
        sourceHint: 'Assessment incident management',
      },
      {
        title: 'Secure Question Delivery API',
        description:
          'Deliver only the current question and required answer options to the browser. This protects question banks and reduces the chance of hidden answers being inspected client-side.',
        sourceHint: 'Secure assessment delivery',
      },
    ],
  },
  {
    priority: 'Priority 3',
    theme: 'Learning Impact and Remediation',
    purpose: 'Turn scores into learning, coaching, certification, and workforce progression.',
    items: [
      {
        title: 'Personalized Study Plans',
        description:
          'Generate study guidance after each attempt using weak topics, missed competencies, reveals, timeouts, and response behaviour. Employees should leave a result page knowing what to study next.',
        sourceHint: 'Learning analytics and remediation',
      },
      {
        title: 'Remediation Assignments',
        description:
          'Let admins assign targeted remedial tasks after failed tests or weak topic patterns. Completion can become a prerequisite for retakes or promotion-readiness review.',
        sourceHint: 'Compliance training workflows',
      },
      {
        title: 'Micro-Lessons by Weak Topic',
        description:
          'Create short learning cards for NDPR, cybercrime law, CRM, NHF, Nigerian real estate due diligence, and other weak areas. This turns test failure into guided learning rather than discouragement.',
        sourceHint: 'Bite-sized learning',
      },
      {
        title: 'Manager Coaching Notes',
        description:
          'Give managers a private coaching note area attached to employee profiles. Notes can track interventions, retake plans, observed improvement, and agreed support actions.',
        sourceHint: 'Workplace learning management',
      },
      {
        title: 'Certification Issuance',
        description:
          'Issue certificates when employees meet defined thresholds across tests, batches, and competencies. Certificates should include scope, date, score, expiry, and verification code.',
        sourceHint: 'Moodle certificates and badges',
      },
      {
        title: 'Retake Rules',
        description:
          'Configure waiting periods, maximum attempts, remediation requirements, and pass marks by test. This supports learning while reducing repeated guessing.',
        sourceHint: 'Assessment policy controls',
      },
      {
        title: 'Learning Paths',
        description:
          'Group tests, lessons, remediation, and certificates into structured paths for new agents, team leaders, compliance officers, and managers. Staffiq becomes a development system, not only a test portal.',
        sourceHint: 'Tailored training pathways',
      },
      {
        title: 'Peer Cohort Comparison',
        description:
          'Show learners how they compare with a cohort without exposing other people private details. This helps motivate improvement while giving managers fairer performance norms.',
        sourceHint: 'Learning analytics comparison',
      },
      {
        title: 'Promotion Readiness Profile',
        description:
          'Combine hard-question score, weighted judgement score, consistency, completion history, and manager notes into a promotion signal. Leadership can make evidence-based decisions.',
        sourceHint: 'Workforce capability evidence',
      },
      {
        title: 'Quarterly Reassessment Scheduler',
        description:
          'Schedule recurring reassessments for compliance, onboarding refreshers, and promotion readiness. The platform can notify employees and managers before windows open.',
        sourceHint: 'Automated compliance training',
      },
    ],
  },
  {
    priority: 'Priority 4',
    theme: 'AI and Decision Intelligence',
    purpose: 'Use analytics and AI to explain risk, recommend action, and support leadership decisions.',
    items: [
      {
        title: 'AI Analytics Executive Brief',
        description:
          'Generate a plain-language executive brief from the current analytics filters, including risks, causes, and recommended actions. Admins move faster from charts to decisions.',
        sourceHint: 'AI-assisted analytics',
      },
      {
        title: 'Chat With Assessment Data',
        description:
          'Provide an admin-only AI chat that can answer questions about users, tests, attempts, question banks, topics, scores, and audit events. Responses should cite internal signals and avoid inventing missing data.',
        sourceHint: 'Perplexity Sonar API',
      },
      {
        title: 'Risk-Priority Recommendations',
        description:
          'Rank employees by intervention priority using completion, score, hint use, reveals, timeouts, and weak topics. The output should say who needs help, why, and what action to take.',
        sourceHint: 'Predictive learner support',
      },
      {
        title: 'Question-Context AI Explanations',
        description:
          'Let admins and learners request explanations for missed questions using the actual stem, options, scoring weights, and competency context. This supports learning without guessing.',
        sourceHint: 'AI feedback with source context',
      },
      {
        title: 'Department Intervention Plans',
        description:
          'Ask AI to generate department-level training plans from weak topics, completion gaps, and risk scores. Managers can see whether problems are individual, team-level, or content-level.',
        sourceHint: 'Decision-intelligence dashboards',
      },
      {
        title: 'Predictive Pass Risk',
        description:
          'Estimate whether assigned or in-progress employees are likely to pass using historical engagement and current attempt signals. This enables support before failure rather than after.',
        sourceHint: 'Predictive analytics',
      },
      {
        title: 'Confidence Scoring',
        description:
          'Let users indicate confidence before submitting answers and compare confidence with correctness. Admins can spot overconfidence, underconfidence, and fragile knowledge.',
        sourceHint: 'Metacognition and learning analytics',
      },
      {
        title: 'Anomaly Detection',
        description:
          'Flag unusual behaviour such as very fast perfect scores, repeated reveal patterns, device changes, or score jumps after many failures. The system should raise a risk signal, not an accusation.',
        sourceHint: 'Pattern recognition',
      },
      {
        title: 'Compliance Evidence Packs',
        description:
          'Generate downloadable evidence packs showing assignment, completion, pass marks, question coverage, remediation, and audit events. This helps HR, regulators, internal audit, and board reporting.',
        sourceHint: 'Compliance reporting',
      },
      {
        title: 'Board-Level Executive Dashboard',
        description:
          'Add an executive view focused on capability risk, compliance readiness, certification progress, department gaps, and trend movement. Leaders should see decisions and exposure, not operational clutter.',
        sourceHint: 'Executive learning analytics',
      },
    ],
  },
  {
    priority: 'Priority 5',
    theme: 'Enterprise Scale',
    purpose: 'Prepare Staffiq for multi-organisation rollout and integration with existing systems.',
    items: [
      {
        title: 'Single Sign-On',
        description:
          'Support Google Workspace, Microsoft Entra ID, or SAML/OIDC so employees can use corporate identities. This reduces password support and makes deactivation safer when staff leave.',
        sourceHint: 'Enterprise identity',
      },
      {
        title: 'HRIS Sync',
        description:
          'Sync employees, departments, supervisors, job roles, and employment status from HR systems. Availability and reporting stay aligned with the real organisation.',
        sourceHint: 'HR platform integration',
      },
      {
        title: 'Bulk User Import and Validation',
        description:
          'Allow CSV/XLSX user imports with validation, duplicate detection, role mapping, and preview before saving. This reduces admin workload when onboarding cohorts.',
        sourceHint: 'Enterprise admin operations',
      },
      {
        title: 'Notification Workflows',
        description:
          'Send email, SMS, WhatsApp, or in-app notifications for launches, expiring tests, missed deadlines, remediation, and certificates. Notifications should be configurable by role and event type.',
        sourceHint: 'Learner engagement workflows',
      },
      {
        title: 'Scheduled Reports',
        description:
          'Let admins schedule reports to themselves, managers, or executives weekly or monthly. Scheduled reporting is a common enterprise LMS expectation and reduces manual dashboard checking.',
        sourceHint: 'Moodle and D2L scheduled reports',
      },
      {
        title: 'SCORM and LTI Support',
        description:
          'Support standard learning packages and integrations so Staffiq can work with universities and corporate LMS ecosystems. This makes adoption easier beside existing platforms.',
        sourceHint: 'LMS interoperability',
      },
      {
        title: 'API Access',
        description:
          'Expose secure APIs for tests, users, results, question banks, analytics, and exports. This unlocks mobile apps, HR integrations, reporting pipelines, and external dashboards.',
        sourceHint: 'Enterprise API readiness',
      },
      {
        title: 'Multi-Tenant Organisations',
        description:
          'Allow separate organisations, divisions, departments, or client companies to use the same platform while keeping data isolated. This supports scaling Staffiq beyond one internal deployment.',
        sourceHint: 'Moodle multi-tenancy',
      },
      {
        title: 'Data Retention Policies',
        description:
          'Let admins define how long attempts, logs, chats, exports, archived tests, and analytics remain available. This supports privacy obligations while preserving useful evidence.',
        sourceHint: 'Privacy and compliance controls',
      },
      {
        title: 'Offline-Friendly Test Mode',
        description:
          'Support temporary offline answering with encrypted local autosave and server reconciliation when connectivity returns. This is especially valuable where network quality affects employees taking tests.',
        sourceHint: 'Mobile and offline LMS access',
      },
    ],
  },
]

export const productFeatureCatalogue: RecommendationFeature[] = enterpriseRoadmap.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    track: 'product' as const,
    category: group.theme,
    priority: group.priority,
  })),
)

export const uiUxFeatureCatalogue: RecommendationFeature[] = [
  {
    title: 'Executive Visual Hierarchy',
    description:
      'Start each admin page with the most important decision, then supporting metrics, then tables. This lets busy admins understand the signal before scanning detailed data.',
    track: 'uiux',
    category: 'Information Architecture',
    sourceHint: 'Dashboard decision design',
  },
  {
    title: 'Dense Desktop Dashboard Mode',
    description:
      'Offer a compact desktop mode with reduced padding, smaller cards, and side-by-side graphs. Laptop users should see more intelligence without unnecessary scrolling.',
    track: 'uiux',
    category: 'Space Efficiency',
    sourceHint: 'GoodData dashboard usability',
  },
  {
    title: 'Mobile-First Test Layout',
    description:
      'Optimise the test screen for one-handed mobile use with large answer targets, sticky progress, and compact question navigation. Employees taking tests on phones need speed and clarity.',
    track: 'uiux',
    category: 'Assessment Experience',
    sourceHint: 'Mobile assessment usability',
  },
  {
    title: 'Glossy 3D Card System',
    description:
      'Use subtle layered shadows, soft highlights, glass surfaces, and controlled depth for cards and panels. The effect should feel premium while preserving strong text contrast.',
    track: 'uiux',
    category: 'Visual System',
    sourceHint: 'Brand polish',
  },
  {
    title: 'Accessible Dark Mode Tokens',
    description:
      'Audit dark-mode tokens for text, borders, surfaces, charts, badges, and disabled states. This prevents dark green-on-dark green problems and keeps content readable.',
    track: 'uiux',
    category: 'Accessibility',
    sourceHint: 'WCAG contrast',
  },
  {
    title: 'Chart-Friendly Colour Palette',
    description:
      'Use categorical chart colours that distinguish pass, fail, partial, risk, activity, and trend lines clearly. Similar greens and yellows should not compete in analytics views.',
    track: 'uiux',
    category: 'Analytics Design',
    sourceHint: 'Accessible dashboard palettes',
  },
  {
    title: 'Sticky Admin Filter Bar',
    description:
      'Keep date, test, department, topic, and user filters visible while scrolling analytics. Admins should be able to refine long dashboards without returning to the top.',
    track: 'uiux',
    category: 'Analytics Design',
    sourceHint: 'Dashboard workflow patterns',
  },
  {
    title: 'Saved Filter Views',
    description:
      'Let admins save filter combinations such as Sales Team 30 Days or Cybercrime Act Hard Questions. Repeated analysis becomes faster and less error-prone.',
    track: 'uiux',
    category: 'Analytics Productivity',
    sourceHint: 'Report workflow design',
  },
  {
    title: 'Empty-State Guidance',
    description:
      'Replace blank charts and tables with clear messages that explain what data is missing and what action creates it. Empty states should teach the next useful action.',
    track: 'uiux',
    category: 'Clarity',
    sourceHint: 'Accessible dashboards',
  },
  {
    title: 'Inline Explain Buttons',
    description:
      'Add small explain affordances beside complex analytics terms such as discrimination index and weighted judgement score. New admins can learn without leaving the dashboard.',
    track: 'uiux',
    category: 'Learning in Context',
    sourceHint: 'Self-service help patterns',
  },
  {
    title: 'Result Review Timeline',
    description:
      'Show results as a learning timeline with correct, wrong, partial, revealed, and timeout markers. Learners can quickly find what they struggled with and what to study.',
    track: 'uiux',
    category: 'Learning Feedback',
    sourceHint: 'Assessment review UX',
  },
  {
    title: 'Progress Rings for Learning Center',
    description:
      'Use compact progress rings for completed lessons, assigned tests, certifications, and weak-topic remediation. This gives progress visibility without using oversized cards.',
    track: 'uiux',
    category: 'Learning Center',
    sourceHint: 'Progress visualization',
  },
  {
    title: 'Persistent Action Rail',
    description:
      'Add a right-side or bottom action rail for launch, archive, export, AI brief, and refresh availability. Repeated admin actions should remain close at hand.',
    track: 'uiux',
    category: 'Admin Productivity',
    sourceHint: 'Power-user dashboard actions',
  },
  {
    title: 'Table Density Controls',
    description:
      'Allow comfortable, compact, and spreadsheet density modes for admin tables. Power users comparing many employees or attempts often need tighter views.',
    track: 'uiux',
    category: 'Admin Productivity',
    sourceHint: 'Data table ergonomics',
  },
  {
    title: 'Keyboard Shortcuts for Admins',
    description:
      'Support shortcuts for search, new test, refresh availability, AI chat, export, and modal close. Heavy admin workflows should become faster for frequent users.',
    track: 'uiux',
    category: 'Power User Experience',
    sourceHint: 'Admin efficiency',
  },
  {
    title: 'Toast Notification Center',
    description:
      'Turn temporary toasts into a persistent notification center for saves, sync failures, launches, archives, exports, and AI errors. Admins can confirm what happened after the toast disappears.',
    track: 'uiux',
    category: 'Reliability Feedback',
    sourceHint: 'Operational trust',
  },
  {
    title: 'Skeleton Loading States',
    description:
      'Use skeleton loaders for charts, tables, question banks, and AI output. Waiting should feel controlled instead of frozen.',
    track: 'uiux',
    category: 'Perceived Performance',
    sourceHint: 'Modern app loading patterns',
  },
  {
    title: 'Modal Stepper for Test Launch',
    description:
      'Break launch into details, question bank, users, dates, scoring, review, and go-live steps. This reduces admin mistakes and clarifies launched versus live status.',
    track: 'uiux',
    category: 'Admin Flow',
    sourceHint: 'Workflow safety',
  },
  {
    title: 'Inline Bulk-Action Preview',
    description:
      'Before bulk actions, show exactly how many tests, users, attempts, or question banks will be affected. Preview builds confidence and prevents accidental large changes.',
    track: 'uiux',
    category: 'Bulk Operations',
    sourceHint: 'Admin safety',
  },
  {
    title: 'Smart Status Badges',
    description:
      'Use consistent badges for Draft, Launched, Live, Scheduled, Expiring, Archived, Completed, Nullified, and Recovery Needed. Status language should match admin mental models everywhere.',
    track: 'uiux',
    category: 'Status Clarity',
    sourceHint: 'Dashboard status design',
  },
  {
    title: 'Printable Result View',
    description:
      'Add a clean print/export view for individual results with score, topic breakdown, question review, and recommended learning. HR and managers can use results in meetings.',
    track: 'uiux',
    category: 'Reporting',
    sourceHint: 'Assessment evidence',
  },
  {
    title: 'Admin Command Palette',
    description:
      'Create a command palette for finding users, tests, question banks, analytics views, settings, and reports. Navigation should be fast for repeat admins.',
    track: 'uiux',
    category: 'Power User Experience',
    sourceHint: 'Modern admin UX',
  },
  {
    title: 'Responsive Chart Summaries',
    description:
      'On mobile, replace complex charts with compact metric summaries and simple bars. This preserves insight when full charts become hard to read on small screens.',
    track: 'uiux',
    category: 'Mobile Analytics',
    sourceHint: 'Accessible dashboard responsive design',
  },
  {
    title: 'Guided First-Run Setup',
    description:
      'Provide a setup checklist for import users, import questions, create test, choose users, go live, and verify employee portal. First-time admins should know exactly what to do.',
    track: 'uiux',
    category: 'Onboarding',
    sourceHint: 'Admin onboarding',
  },
  {
    title: 'Visual Sync Indicator',
    description:
      'Show Saved, Saving, Cloud delayed, and Offline states globally. Admins and learners should trust that changes and answers are not lost.',
    track: 'uiux',
    category: 'Reliability Feedback',
    sourceHint: 'Cloud state transparency',
  },
]

export const analyticsFeatureCatalogue: RecommendationFeature[] = [
  {
    title: 'Unanswered Timeout Rate',
    description:
      'Measure the percentage of questions where the timer expired before the user selected an answer. A high rate suggests time pressure, difficult wording, mobile usability issues, or poor preparation.',
    track: 'analytics',
    category: 'Attempt Behaviour',
    sourceHint: 'Learning engagement analytics',
  },
  {
    title: 'Reveal-Answer Rate',
    description:
      'Measure how often users choose to reveal the answer and lose points. This identifies topics where employees are using Staffiq as a learning tool rather than demonstrating mastery.',
    track: 'analytics',
    category: 'Learning Support',
    sourceHint: 'Assessment support signals',
  },
  {
    title: 'Hint-to-Pass Correlation',
    description:
      'Compare hint usage with final pass outcomes. If hints improve learning without inflating scores too much they are useful; if hint users still fail, remediation needs to be stronger.',
    track: 'analytics',
    category: 'Learning Support',
    sourceHint: 'Learning analytics',
  },
  {
    title: 'Score by Competency',
    description:
      'Break scores down by competency area rather than only by test. This shows whether an employee is weak in compliance, CRM, sales judgement, product knowledge, or legal reasoning.',
    track: 'analytics',
    category: 'Competency Insight',
    sourceHint: 'Canvas and D2L analytics patterns',
  },
  {
    title: 'Score by Difficulty',
    description:
      'Compare Easy, Medium, and Hard performance. A user who passes Easy but drops sharply on Hard may know facts but struggle with judgement and application.',
    track: 'analytics',
    category: 'Assessment Depth',
    sourceHint: 'Assessment quality dashboards',
  },
  {
    title: 'Weighted Judgement Score',
    description:
      'Separate performance on weighted scenario questions from standard questions. This shows whether a user can handle professional nuance rather than only recall.',
    track: 'analytics',
    category: 'Assessment Depth',
    sourceHint: 'Professional judgement scoring',
  },
  {
    title: 'Standard Recall Score',
    description:
      'Measure accuracy on single-answer standard questions. This reveals whether foundational knowledge is secure before judging advanced reasoning.',
    track: 'analytics',
    category: 'Assessment Depth',
    sourceHint: 'Assessment item analysis',
  },
  {
    title: 'Question Exposure Balance',
    description:
      'Measure how evenly questions are shown across users and attempts. This protects fairness and identifies whether randomisation is overusing parts of the bank.',
    track: 'analytics',
    category: 'Question Randomisation',
    sourceHint: 'Fairness analytics',
  },
  {
    title: 'Underused Question Count',
    description:
      'Count questions that have never been shown or sit below exposure targets. Admins can confirm that imported banks are actually being used.',
    track: 'analytics',
    category: 'Question Randomisation',
    sourceHint: 'Bank coverage',
  },
  {
    title: 'Overexposed Question Count',
    description:
      'Count questions shown far more than the bank average. Overexposed items should be deprioritised, reviewed, or retired from high-stakes tests.',
    track: 'analytics',
    category: 'Question Randomisation',
    sourceHint: 'Bank fairness',
  },
  {
    title: 'Distractor Selection Frequency',
    description:
      'Track how often each wrong option is selected. Distractors ignored by everyone may be too obvious, while distractors chosen by strong users may be misleading.',
    track: 'analytics',
    category: 'Item Analysis',
    sourceHint: 'UW item analysis',
  },
  {
    title: 'Question Discrimination Index',
    description:
      'Estimate whether high-scoring users are more likely to answer each question correctly than low-scoring users. Poor discrimination means the item may not separate competence well.',
    track: 'analytics',
    category: 'Item Analysis',
    sourceHint: 'UW item analysis',
  },
  {
    title: 'Item Difficulty Index',
    description:
      'Measure the proportion of users who answer each question correctly. Extremely high or low values can reveal trivial, confusing, or miskeyed questions.',
    track: 'analytics',
    category: 'Item Analysis',
    sourceHint: 'Assessment item analysis',
  },
  {
    title: 'Average Response Time by Topic',
    description:
      'Track how long users take per competency or topic. Slow topics may require clearer training, better explanations, or fewer complex questions per timed attempt.',
    track: 'analytics',
    category: 'Timing Intelligence',
    sourceHint: 'Engagement analytics',
  },
  {
    title: 'Speed Decay During Attempts',
    description:
      'Measure whether users slow down or speed up as the test progresses. This can reveal fatigue, rushing, poor time management, or improving confidence.',
    track: 'analytics',
    category: 'Timing Intelligence',
    sourceHint: 'Attempt behaviour analytics',
  },
  {
    title: 'Late-Start Rate',
    description:
      'Measure how many assigned users start close to the deadline or after reminders. This helps managers identify procrastination and scheduling pressure.',
    track: 'analytics',
    category: 'Assignment Behaviour',
    sourceHint: 'Compliance training reporting',
  },
  {
    title: 'Abandonment Recovery Rate',
    description:
      'Track how many abandoned or interrupted attempts are successfully resumed and completed. This separates technical recovery quality from learner motivation.',
    track: 'analytics',
    category: 'Reliability Analytics',
    sourceHint: 'Attempt recovery',
  },
  {
    title: 'Retry Improvement Delta',
    description:
      'Compare first attempt scores with retake scores. Improvement suggests training impact, while no improvement suggests weak remediation or guessing.',
    track: 'analytics',
    category: 'Learning Impact',
    sourceHint: 'Learning outcome analytics',
  },
  {
    title: 'Department Risk Ranking',
    description:
      'Rank departments by completion, score, support use, failed attempts, and weak topics. Leadership can prioritise training investment where risk is highest.',
    track: 'analytics',
    category: 'Organisation Risk',
    sourceHint: 'D2L leadership dashboards',
  },
  {
    title: 'Supervisor Cohort Gap',
    description:
      'Compare teams under different supervisors on completion and competency outcomes. This can reveal coaching differences, workload pressure, or training inconsistency.',
    track: 'analytics',
    category: 'Organisation Risk',
    sourceHint: 'Workplace reporting lines',
  },
  {
    title: 'Certification Readiness Rate',
    description:
      'Measure the percentage of users who meet all thresholds for certification. This gives leadership a direct view of workforce readiness.',
    track: 'analytics',
    category: 'Certification',
    sourceHint: 'Moodle certificates and badges',
  },
  {
    title: 'Promotion Readiness Score',
    description:
      'Combine hard-question score, weighted judgement score, consistency, and completion history into a promotion signal. This supports evidence-based promotion conversations.',
    track: 'analytics',
    category: 'Talent Decisions',
    sourceHint: 'Workforce capability analytics',
  },
  {
    title: 'Compliance Evidence Score',
    description:
      'Measure how complete training evidence is for each user or department: assigned, started, completed, passed, remediated, certified, and audited. This supports regulatory and board reporting.',
    track: 'analytics',
    category: 'Compliance Evidence',
    sourceHint: 'Compliance training analytics',
  },
  {
    title: 'AI Recommended Intervention Count',
    description:
      'Count how many AI-generated recommendations are produced, accepted, ignored, or resolved. This shows whether decision intelligence is changing admin behaviour.',
    track: 'analytics',
    category: 'AI Effectiveness',
    sourceHint: 'AI analytics operations',
  },
  {
    title: 'Question-Bank Quality Trend',
    description:
      'Track whether a bank improves over time using difficulty balance, discrimination, reveal rate, complaints, and retirement actions. Content management becomes measurable improvement.',
    track: 'analytics',
    category: 'Question-Bank Health',
    sourceHint: 'Assessment quality dashboard',
  },
]

export const proposedAdminStats = analyticsFeatureCatalogue.map(({ title, description }) => ({
  name: title,
  description,
}))

function featureKey(item: string): string {
  return item.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

const implementedUpgradeItems = new Set(
  [
    'Server-Authoritative Assessment State',
    'Attempt Recovery Timeline',
    'Backup and Restore Console',
    'Admin Activity Export',
    'Uptime and Error Monitoring',
    'Safe Deployment Checklist',
    'Question Exposure Caps',
    'Item Calibration Dashboard',
    'Distractor Analysis',
    'Question Retirement Queue',
    'Personalized Study Plans',
    'Learning Paths',
    'AI Analytics Executive Brief',
    'Chat With Assessment Data',
    'Risk-Priority Recommendations',
    'Department Intervention Plans',
    'Anomaly Detection',
    'Compliance Evidence Packs',
    'Scheduled Reports',
    'API Access',
    'Multi-Tenant Organisations',
    'Executive Visual Hierarchy',
    'Dense Desktop Dashboard Mode',
    'Mobile-First Test Layout',
    'Glossy 3D Card System',
    'Accessible Dark Mode Tokens',
    'Chart-Friendly Colour Palette',
    'Sticky Admin Filter Bar',
    'Empty-State Guidance',
    'Inline Explain Buttons',
    'Result Review Timeline',
    'Progress Rings for Learning Center',
    'Persistent Action Rail',
    'Inline Bulk-Action Preview',
    'Smart Status Badges',
    'Responsive Chart Summaries',
    'Visual Sync Indicator',
    ...analyticsFeatureCatalogue.map((item) => item.title),
  ].map(featureKey),
)

const foundationUpgradeItems = new Set(
  [
    'Real Authentication and Password Reset',
    'Role-Based Route Guards',
    'Immutable Attempt Ledger',
    'Device and Session Control',
    'Adaptive Difficulty Engine',
    'Competency Blueprint Editor',
    'Test Versioning',
    'Standard-Setting Workflow',
    'Proctor Notes and Incident Flags',
    'Secure Question Delivery API',
    'Remediation Assignments',
    'Micro-Lessons by Weak Topic',
    'Manager Coaching Notes',
    'Certification Issuance',
    'Retake Rules',
    'Peer Cohort Comparison',
    'Promotion Readiness Profile',
    'Quarterly Reassessment Scheduler',
    'Question-Context AI Explanations',
    'Predictive Pass Risk',
    'Confidence Scoring',
    'Board-Level Executive Dashboard',
    'Bulk User Import and Validation',
    'Notification Workflows',
    'Data Retention Policies',
    'Offline-Friendly Test Mode',
    'Saved Filter Views',
    'Table Density Controls',
    'Keyboard Shortcuts for Admins',
    'Toast Notification Center',
    'Skeleton Loading States',
    'Modal Stepper for Test Launch',
    'Printable Result View',
    'Admin Command Palette',
    'Guided First-Run Setup',
  ].map(featureKey),
)

const integrationUpgradeItems = new Set(
  [
    'Single Sign-On',
    'HRIS Sync',
    'SCORM and LTI Support',
  ].map(featureKey),
)

export function upgradeStatusFor(item: string): { label: string; className: 'implemented' | 'foundation' | 'integration' | 'roadmap' } {
  const key = featureKey(item)
  if (implementedUpgradeItems.has(key)) return { label: 'Implemented', className: 'implemented' }
  if (foundationUpgradeItems.has(key)) return { label: 'Foundation ready', className: 'foundation' }
  if (integrationUpgradeItems.has(key)) return { label: 'Integration stage', className: 'integration' }
  return { label: 'Roadmap', className: 'roadmap' }
}
