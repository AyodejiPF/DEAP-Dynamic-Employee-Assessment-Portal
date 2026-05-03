import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Decimal from 'decimal.js'
import {
  AlertCircle,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Copy,
  Clock3,
  FileDown,
  FileSpreadsheet,
  Gauge,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  Moon,
  Play,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  UserRound,
  UsersRound,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type Role = 'super_admin' | 'admin' | 'employee'
type Difficulty = 'Easy' | 'Medium' | 'Hard'
type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E'
type ThemeMode = 'light' | 'dark'
type PermissionKey =
  | 'take_tests'
  | 'view_own_results'
  | 'view_dashboard'
  | 'manage_questions'
  | 'manage_tests'
  | 'manage_users'
  | 'view_analytics'
  | 'export_reports'
  | 'manage_settings'
  | 'take_admin_self_test'
type AppView =
  | 'login'
  | 'dashboard'
  | 'questions'
  | 'tests'
  | 'analytics'
  | 'employees'
  | 'reports'
  | 'settings'
  | 'my-tests'
  | 'my-results'
  | 'taking-test'
  | 'result'

interface User {
  id: string
  userId: string
  email: string
  fullName: string
  displayName: string
  password: string
  role: Role
  jobRole: string
  department: string
  supervisorId?: string
}

interface Question {
  questionId: string
  questionText: string
  difficulty: Difficulty
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionE: string
  correctAnswer: OptionKey
  partialAnswer1?: OptionKey
  partialAnswer2?: OptionKey
  correctWeight: number
  partialWeight1?: number
  partialWeight2?: number
  topicTag: string
  hint?: string
  explanation: string
  importBatchId: string
}

interface QuestionBankMetadata {
  name: string
  description: string
}

type QuestionBankMetadataMap = Record<string, QuestionBankMetadata>

interface Assessment {
  id: string
  name: string
  description: string
  overviewSections?: AssessmentOverviewSection[]
  questionCount: 20 | 40 | 60
  difficulty: Difficulty | 'Mixed'
  questionBankId?: string
  departments: string[]
  startDate: string
  endDate: string
  allowReattempt: boolean
  showResults: boolean
  passMark: number
  status: 'Draft' | 'Live' | 'Archived'
  assignedUserIds: string[]
}

interface AssessmentOverviewSection {
  title: string
  body: string
}

interface ResponseRecord {
  questionId: string
  selectedOption?: OptionKey
  secondsRemaining: number
  answerWeight: string
  timeMultiplier: string
  marksEarned: string
  responseTime: number
  hintUsed?: boolean
  answerRevealed?: boolean
  scorePenaltyMultiplier?: string
}

interface TestSession {
  id: string
  testId: string
  userId: string
  startedAt: string
  questionIds?: string[]
  optionOrderByQuestion?: Record<string, OptionKey[]>
  currentQuestionStartedAt?: string
  currentQuestionDeadlineAt?: string
  lastSavedAt?: string
  completedAt?: string
  status: 'in_progress' | 'completed' | 'abandoned'
  responses: ResponseRecord[]
  score: string
  maxScore: string
  percentage: string
  passed: boolean
}

interface AuditEvent {
  id: string
  actorName: string
  action: string
  detail: string
  createdAt: string
}

type AnalyticsEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'view_change'
  | 'test_instructions_opened'
  | 'test_agreement_checked'
  | 'test_started'
  | 'test_resumed'
  | 'answer_submitted'
  | 'hint_opened'
  | 'answer_revealed'
  | 'autosave_heartbeat'
  | 'test_completed'
  | 'question_import'
  | 'test_created'
  | 'test_deleted'
  | 'question_bank_deleted'
  | 'password_reset'
  | 'permission_changed'
  | 'bulk_permission_changed'
  | 'logo_updated'
  | 'logo_restored'
  | 'export_results'

interface AnalyticsEvent {
  id: string
  type: AnalyticsEventType
  userId?: string
  userName?: string
  department?: string
  role?: Role
  testId?: string
  testName?: string
  questionId?: string
  questionBankId?: string
  difficulty?: Difficulty | 'Mixed'
  topicTag?: string
  value?: number
  durationSeconds?: number
  outcome?: string
  createdAt: string
  metadata?: Record<string, string | number | boolean | undefined>
}

interface AiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface AiChatThread {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AiChatMessage[]
}

interface AiIntelligencePayload {
  question: string
  filters: Record<string, string>
  chatHistory: Array<Pick<AiChatMessage, 'role' | 'content'>>
  analytics: Record<string, unknown>
  questionBankContext: Record<string, unknown>
}

interface AiIntelligenceResponse {
  answer: string
  model?: string
  citations?: string[]
}

type QuestionExposureCounts = Record<string, number>

interface Branding {
  logoUrl: string
}

const defaultBranding: Branding = {
  logoUrl: '/iicocece-logo.svg',
}

const requiredColumns = [
  'question_id',
  'question_text',
  'difficulty',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'option_e',
  'correct_answer',
  'partial_answer_1',
  'partial_answer_2',
  'correct_weight',
  'partial_weight_1',
  'partial_weight_2',
  'topic_tag',
  'explanation',
]

const seedUsers: User[] = [
  {
    id: 'u-admin',
    userId: 'U001',
    email: 'admin@iicocece.com',
    fullName: 'Ayodeji Falope',
    displayName: 'Ayodeji',
    password: 'GODhelpUS',
    role: 'super_admin',
    jobRole: 'Admin',
    department: 'Operations',
  },
  {
    id: 'u002',
    userId: 'U002',
    email: '',
    fullName: 'Ndubuisi Nwobodo',
    displayName: 'Ndubuisi',
    password: 'Nd4P7q',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Legal',
    supervisorId: 'U001',
  },
  {
    id: 'u003',
    userId: 'U003',
    email: '',
    fullName: 'Martin Ifodo',
    displayName: 'Martin',
    password: 'Ma8K2t',
    role: 'employee',
    jobRole: 'Employee',
    department: 'UI/UX & Development',
    supervisorId: 'U001',
  },
  {
    id: 'u004',
    userId: 'U004',
    email: '',
    fullName: 'Glory Idajili',
    displayName: 'Glory',
    password: 'Gl6R9m',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Human Resources',
    supervisorId: 'U001',
  },
  {
    id: 'u005',
    userId: 'U005',
    email: '',
    fullName: 'Isaac Ogbodo',
    displayName: 'Isaac',
    password: 'Is5N3p',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Digital Marketing',
    supervisorId: 'U001',
  },
  {
    id: 'u006',
    userId: 'U006',
    email: '',
    fullName: 'Precious Ogbu',
    displayName: 'Precious',
    password: 'Pr7X4c',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Business Development',
    supervisorId: 'U001',
  },
  {
    id: 'u007',
    userId: 'U007',
    email: '',
    fullName: 'Olaide Kareem',
    displayName: 'Olaide',
    password: 'Ol6L2r',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Digital Content',
    supervisorId: 'U001',
  },
  {
    id: 'u009',
    userId: 'U009',
    email: '',
    fullName: 'Nimi Ajala',
    displayName: 'Nimi',
    password: 'Ni9Q2j',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Other',
    supervisorId: 'U001',
  },
  {
    id: 'u011',
    userId: 'U011',
    email: '',
    fullName: 'Samuel Martin',
    displayName: 'Samuel',
    password: 'Sa7K2p',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Other',
    supervisorId: 'U001',
  },
  {
    id: 'u012',
    userId: 'U012',
    email: '',
    fullName: 'Toyosi Adebowale',
    displayName: 'Toyosi',
    password: 'To4X9s',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Other',
    supervisorId: 'U001',
  },
  {
    id: 'u013',
    userId: 'U013',
    email: 'ceo@iicocece.com',
    fullName: 'Chidinma Ogu-Chiedozie',
    displayName: 'Chidinma',
    password: 'Ch7L4x',
    role: 'employee',
    jobRole: 'CEO',
    department: 'Executive',
  },
  {
    id: 'u014',
    userId: 'U014',
    email: '',
    fullName: 'Precious Chinedu',
    displayName: 'PreciousC',
    password: 'Pc2F8d',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Business Development',
    supervisorId: 'U001',
  },
  {
    id: 'u015',
    userId: 'U015',
    email: '',
    fullName: 'Kelechi Asagwara',
    displayName: 'Kelechi',
    password: 'Ke6H5p',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Digital Content',
    supervisorId: 'U001',
  },
  {
    id: 'u016',
    userId: 'U016',
    email: '',
    fullName: 'Chiamaka Soronnadi',
    displayName: 'Chiamaka',
    password: 'Ch2C9g',
    role: 'employee',
    jobRole: 'Employee',
    department: 'Digital Content',
    supervisorId: 'U001',
  },
]

const topics = ['Compliance', 'Customer Strategy', 'Operations', 'Ethics', 'Data Interpretation']
const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard']
const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D', 'E']
const sourceWorkbookPath = '/questions/iicocece-consent-based-sales-outreach-1500q.xlsx'
const cybercrimesWorkbookPath = '/questions/nigeria-cybercrimes-act-comprehensive-competency-1500q.xlsx'
const legacyCybercrimeBankId = 'nigeria-cybercrime-act-1500q-v1'
const cybercrimesActBankId = 'nigeria-cybercrimes-act-comprehensive-1500-v2'
const sourceWorkbookVersion = 'iicocece-cso-1500-v1'
const bundledQuestionBanks = [
  { id: sourceWorkbookVersion, path: sourceWorkbookPath },
  { id: cybercrimesActBankId, path: cybercrimesWorkbookPath },
] as const
const defaultQuestionBankMetadata: QuestionBankMetadataMap = {
  [sourceWorkbookVersion]: {
    name: 'iicocece Consent-Based Sales Outreach — Professional Competency Assessment',
    description: 'Assessment Code: ICOCECE-CSO-1500. A 1,500-question professional competency assessment for sales agents, team leaders, and managers operating within the iicocece consent-based real estate sales outreach model.',
  },
  [cybercrimesActBankId]: {
    name: 'Nigeria Cybercrimes Act Comprehensive Competency Assessment',
    description: 'Covers the Cybercrimes (Prohibition, Prevention, Etc.) Act 2015 and the Cybercrimes (Amendment) Act 2024. A 1,500-question professional competency assessment for legal practitioners, compliance officers, cybersecurity professionals, law enforcement personnel, corporate risk managers, HR professionals, IT governance teams, and organisations operating within Nigeria’s digital and financial ecosystem.',
  },
  [legacyCybercrimeBankId]: {
    name: 'Nigeria Cybercrimes Act Comprehensive Competency Assessment',
    description: 'Legacy question bank retained only when previously imported; it can be deleted from Question Bank if no longer needed.',
  },
  'seed-bank': {
    name: 'Sample DEAP Question Bank',
    description: 'A small built-in sample bank used for demo and fallback assessment testing.',
  },
}
export const cybercrimesAssessmentOverview: AssessmentOverviewSection[] = [
  {
    title: 'Covering the Cybercrimes Act 2015 and the 2024 Amendment',
    body: 'This assessment covers the Cybercrimes (Prohibition, Prevention, Etc.) Act 2015 and the Cybercrimes (Prohibition, Prevention, Etc.) (Amendment) Act 2024.',
  },
  {
    title: 'About This Assessment',
    body: 'This is a rigorous, professional-grade competency evaluation designed to test knowledge of Nigeria\'s primary cybercrime legislation at three levels of depth: foundational recall, applied understanding, and advanced legal analysis. It was developed for legal practitioners, compliance officers, cybersecurity professionals, law enforcement personnel, corporate risk managers, HR professionals, IT governance teams, and organisations operating within Nigeria\'s digital and financial ecosystem.',
  },
  {
    title: 'Legislative Coverage',
    body: 'The assessment covers the Cybercrimes Act 2015 across all 59 sections and 8 parts, as well as the substantive changes introduced by the 2024 Amendment Act, signed into law on 28 February 2024.',
  },
  {
    title: 'Part I - Critical National Information Infrastructure',
    body: 'Sections 3 to 5 cover designation criteria, protective obligations, and the consequences of attacks on Critical National Information Infrastructure.',
  },
  {
    title: 'Part II - Offences and Penalties',
    body: 'Sections 6 to 36 cover the full range of cybercrime offences, including unlawful system access, system interference, data tampering, interception of electronic communications, computer-related forgery and fraud, malware, cyber terrorism, child grooming and child pornography, publication of false information, identity theft, cyberstalking, cybersquatting, racist and xenophobic content, phishing, spam, ATM and POS fraud, card-not-present fraud, SIM swap fraud, and employee or director liability.',
  },
  {
    title: 'Part III - Financial Institutions and Electronic Transactions',
    body: 'Sections 37 to 40 cover obligations of banks and financial institutions, Know Your Customer requirements, NIN verification mandates, and institutional liability.',
  },
  {
    title: 'Part IV - Administration and the Nigeria Cybersecurity Fund',
    body: 'Sections 41 to 44 cover the role of the Office of the National Security Adviser, the 0.5% cybersecurity levy on eligible electronic transactions, the structure and administration of the Nigeria Cybersecurity Fund, and Sectoral Computer Emergency Response Teams.',
  },
  {
    title: 'Part V - Enforcement and Forfeiture',
    body: 'Sections 45 to 49 cover powers of search and seizure, preservation and production orders, forfeiture of assets, and obligations placed on service providers.',
  },
  {
    title: 'Part VI - Jurisdiction and International Cooperation',
    body: 'Sections 50 to 56 cover Nigerian territorial and extraterritorial jurisdiction, mutual legal assistance treaties, and cross-border cybercrime investigation frameworks.',
  },
  {
    title: 'Parts VII and VIII - Miscellaneous and General Provisions',
    body: 'Sections 57 to 59 cover interpretation, transitional provisions, and the relationship between the Cybercrimes Act and other legislation.',
  },
  {
    title: '2024 Amendment Key Changes Tested',
    body: 'The assessment tests the increase of the cybersecurity levy from 0.005% to 0.5% of eligible transaction values, removal of the N10.00 minimum threshold, mandatory 72-hour incident reporting to ngCERT, NIN-linked account verification requirements, establishment of Sectoral CERTs under designated sector regulators, and revised penalties across multiple sections.',
  },
  {
    title: 'Assessment Structure',
    body: 'The assessment contains 1,500 multiple-choice questions across three difficulty tiers: Easy, Medium, and Hard. Each tier contains 500 questions, made up of 375 standard questions and 125 weighted scenario questions. Each question has five answer options, A through E.',
  },
  {
    title: 'Question Types and Difficulty Levels',
    body: 'Easy questions test foundational recall such as definitions, section numbers, penalty thresholds, offence classifications, and basic provisions. Medium questions test applied understanding through scenarios that ask the user to identify legal classifications, penalties, or procedures. Hard questions test advanced legal analysis across multiple provisions, closely related offences, defences, exceptions, and the 2024 Amendment changes.',
  },
  {
    title: 'Scoring Methodology',
    body: 'Standard questions make up 75% of the assessment and have one definitively correct answer. A correct answer scores 1.0 and any other answer scores 0.0. Weighted questions make up 25% of the assessment and are identified by the prefix "S" in the question text. They reward legal judgement: the best answer scores 1.0, the second-best answer scores 0.75, the third-best answer scores 0.50, and incorrect answers score 0.0.',
  },
  {
    title: 'Maximum Possible Score',
    body: 'The full assessment has a maximum possible score of 1,500.0 points: 1,125.0 points from standard questions and 375.0 points from weighted questions. A score of 1,500.0 represents 100% mastery of all tested provisions.',
  },
  {
    title: 'Recommended Use Cases',
    body: 'This assessment can support corporate compliance training, professional certification preparation, law enforcement and regulatory capacity building, academic and institutional training, internal audit, and cybercrime awareness risk assessment.',
  },
  {
    title: 'Data Source and Quality',
    body: 'Questions are grounded in the Cybercrimes Act 2015 and the 2024 Amendment Act. Approximately 80% of questions are derived from the official training slide deck, while the remaining 20% draw on authoritative supplementary sources such as CBN circulars, ngCERT advisories, NITDA guidelines, and the Nigeria Data Protection Act 2023 where it intersects with cybercrime compliance obligations. Penalty figures, section references, timelines, and levy rates reflect the law as amended and in force from 28 February 2024.',
  },
]

const consentSalesAssessmentOverview: AssessmentOverviewSection[] = [
  {
    title: 'Assessment Code: ICOCECE-CSO-1500',
    body: 'This is a 1,500-question professional competency assessment for sales agents, team leaders, and managers operating within the iicocece consent-based real estate sales outreach model.',
  },
  {
    title: 'Overview',
    body: 'The assessment measures knowledge, judgement, and applied skill across the full iicocece operational framework: consent-based outreach philosophy, NDPR compliance, sales scripts, CRM management, NHF financing, and Nigerian real estate due diligence.',
  },
  {
    title: 'Structure and Batches',
    body: 'The assessment is organised into three progressive batches: Batch 1 Easy with 500 foundational questions, Batch 2 Medium with 500 applied process questions, and Batch 3 Hard with 500 advanced judgement questions.',
  },
  {
    title: 'Question Types and Scoring',
    body: 'Each question has five options, A through E. Standard questions have one definitively correct answer. Weighted scenario questions award calibrated partial credit to measure professional judgement in realistic sales and compliance situations.',
  },
  {
    title: '14 Competency Areas',
    body: 'The assessment covers Consent Philosophy, NDPR Compliance, Six Strategic Principles, Seven-Stage Funnel, CRM Taxonomy, Lead Qualification and BANT, Team Structure and Roles, Scripts and Templates, Email Nurture Sequences, KPIs and Metrics, Risk Register, Rollout and Implementation Plan, NHF Product Knowledge, and Nigerian Real Estate Context.',
  },
  {
    title: 'Recommended Use Cases',
    body: 'Use this assessment for pre-employment screening, onboarding verification, ongoing professional development, promotion readiness assessment, team leader evaluation, management review, and iicocece professional certification.',
  },
  {
    title: 'Reporting Guidance',
    body: 'Results should be reviewed by overall score, difficulty batch, competency area, standard versus weighted scenario performance, response speed, hint or answer-reveal dependence, and percentile ranking once enough candidates complete the assessment.',
  },
]

const departmentCatalog = [
  {
    name: 'Operations',
    description: 'Operational rollout discipline, CRM process control, risk escalation, and sales execution governance.',
    topics: ['Seven-Stage Funnel', 'CRM Taxonomy', 'Risk Register', 'Rollout and Implementation Plan'],
  },
  {
    name: 'Legal',
    description: 'NDPR obligations, consent capture standards, client data rights, and property due diligence.',
    topics: ['NDPR Compliance', 'Consent Philosophy', 'Nigerian Real Estate Context', 'Risk Register'],
  },
  {
    name: 'UI/UX & Development',
    description: 'CRM usability, data hygiene, lead-stage visibility, reporting flows, and product support for sales operations.',
    topics: ['CRM Taxonomy', 'KPIs and Metrics', 'Seven-Stage Funnel', 'Rollout and Implementation Plan'],
  },
  {
    name: 'Human Resources',
    description: 'Agent readiness, role accountability, training verification, and promotion-readiness decisions.',
    topics: ['Team Structure and Roles', 'Scripts and Templates', 'KPIs and Metrics', 'Risk Register'],
  },
  {
    name: 'Digital Marketing',
    description: 'Consent-safe messaging, email nurture design, content sequencing, and campaign performance interpretation.',
    topics: ['Consent Philosophy', 'Email Nurture Sequences', 'Scripts and Templates', 'KPIs and Metrics'],
  },
  {
    name: 'Business Development',
    description: 'Lead qualification, BANT judgement, prospect follow-up, financing knowledge, and transaction readiness.',
    topics: ['Lead Qualification and BANT', 'Seven-Stage Funnel', 'NHF Product Knowledge', 'Nigerian Real Estate Context'],
  },
  {
    name: 'Digital Content',
    description: 'Consent-aligned copy, objection-handling language, nurture content, and trust-building communication.',
    topics: ['Scripts and Templates', 'Email Nurture Sequences', 'Consent Philosophy', 'Six Strategic Principles'],
  },
  {
    name: 'Executive',
    description: 'Leadership oversight of sales readiness, compliance culture, pipeline quality, and certification decisions.',
    topics: ['KPIs and Metrics', 'Risk Register', 'Rollout and Implementation Plan', 'Team Structure and Roles'],
  },
  {
    name: 'Other',
    description: 'General organisational understanding of the iicocece consent-based sales model.',
    topics: ['Consent Philosophy', 'NDPR Compliance', 'Seven-Stage Funnel', 'Lead Qualification and BANT'],
  },
]

const topicRules: Array<[RegExp, string]> = [
  [/consent|permission|trust|opt.?in|outreach philosophy|broadcast/i, 'Consent Philosophy'],
  [/ndpr|ndpc|data protection|lawful basis|personal data|data subject|privacy|processing/i, 'NDPR Compliance'],
  [/six strategic|strategic principles|principle/i, 'Six Strategic Principles'],
  [/seven.?stage|funnel|journey|stage|pipeline/i, 'Seven-Stage Funnel'],
  [/crm|tag|taxonomy|record|data hygiene|pipeline stage|audit trail/i, 'CRM Taxonomy'],
  [/bant|budget|authority|need|timeline|qualification|qualify|readiness/i, 'Lead Qualification and BANT'],
  [/team|role|agent|leader|manager|crm manager|content creator|accountability/i, 'Team Structure and Roles'],
  [/script|template|objection|follow.?up|re.?engagement|initial contact|message/i, 'Scripts and Templates'],
  [/email|nurture|sequence|open rate|engagement rate|trigger/i, 'Email Nurture Sequences'],
  [/kpi|metric|conversion|velocity|cost of acquisition|referral|performance/i, 'KPIs and Metrics'],
  [/risk|mitigation|escalation|reputational|commercial|likelihood|impact/i, 'Risk Register'],
  [/rollout|implementation|launch|milestone|go.?no.?go|post.?launch|training/i, 'Rollout and Implementation Plan'],
  [/nhf|national housing fund|pmb|loan|mortgage|contribution|interest rate|housing/i, 'NHF Product Knowledge'],
  [/real estate|property|title|c of o|certificate of occupancy|deed|governor'?s consent|land use act|lasrera|developer|due diligence|lagos/i, 'Nigerian Real Estate Context'],
  [/cnii|critical national information infrastructure|infrastructure|protected system/i, 'Critical National Information Infrastructure'],
  [/section|act|law|court|jurisdiction|order|warrant|statutory|legislation/i, 'Legal Foundations'],
  [/penalty|fine|imprisonment|liable|conviction|years|million|offence|offense/i, 'Offences and Penalties'],
  [/phishing|identity|card|forgery|theft|scam|atm|pos|sim swap|card-not-present|fraud/i, 'Electronic Fraud'],
  [/malware|harmful program|system access|system interference|data tampering|interception|cyber terrorism/i, 'Cybercrime Offences'],
  [/search|seizure|forfeiture|preservation|production order|service provider|enforcement/i, 'Enforcement and Forfeiture'],
  [/levy|cybersecurity fund|onsa|sectoral cert|ngcert|incident report|72-hour|72 hour/i, 'Administration and Reporting'],
  [/cbn|nitda|ndpc|kyc|nin|financial institution|bank/i, 'Financial Institutions and Electronic Transactions'],
  [/mlat|mutual legal assistance|international cooperation|extraterritorial|cross-border/i, 'Jurisdiction and International Cooperation'],
]

const seedQuestions: Question[] = Array.from({ length: 60 }, (_, index) => {
  const difficulty = difficulties[index % difficulties.length]
  const topic = topics[index % topics.length]
  return {
    questionId: `seed-${index + 1}`,
    questionText: `In a ${topic.toLowerCase()} scenario, what is the best first action for a competent employee handling case ${index + 1}?`,
    difficulty,
    optionA: 'Document the issue clearly and follow the approved escalation path.',
    optionB: 'Wait until the next review meeting before taking any action.',
    optionC: 'Ask an unrelated colleague to decide informally.',
    optionD: 'Ignore the issue unless a customer complains again.',
    optionE: 'Make a quick decision without checking the policy context.',
    correctAnswer: 'A',
    partialAnswer1: 'B',
    partialAnswer2: 'C',
    correctWeight: 1,
    partialWeight1: 0.6,
    partialWeight2: 0.3,
    topicTag: topic,
    hint: 'Look for the option that combines policy alignment, documentation, and escalation rather than speed alone.',
    explanation: 'The strongest response combines documentation, policy alignment, and timely escalation.',
    importBatchId: 'seed-bank',
  }
})

const seedTests: Assessment[] = [
  {
    id: 'test-onboarding',
    name: 'iicocece Consent-Based Sales Outreach — Professional Competency Assessment',
    description: 'Assessment Code: ICOCECE-CSO-1500. A professional competency assessment for sales agents, team leaders, and managers operating within the iicocece consent-based real estate sales outreach model.',
    overviewSections: consentSalesAssessmentOverview,
    questionCount: 60,
    difficulty: 'Mixed',
    questionBankId: sourceWorkbookVersion,
    departments: ['Operations', 'Legal', 'UI/UX & Development', 'Human Resources', 'Digital Marketing', 'Business Development', 'Digital Content', 'Executive', 'Other'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    allowReattempt: false,
    showResults: true,
    passMark: 50,
    status: 'Live',
    assignedUserIds: seedUsers.filter((user) => user.role === 'employee').map((user) => user.id),
  },
]

const navItems = [
  ['dashboard', LayoutDashboard, 'Dashboard'],
  ['questions', FileSpreadsheet, 'Question Bank'],
  ['tests', ListChecks, 'Tests'],
  ['employees', UsersRound, 'Manage Users'],
  ['analytics', BarChart3, 'Analytics'],
  ['reports', FileDown, 'Reports'],
  ['settings', Settings2, 'Permissions'],
] as const

const employeeNav = [
  ['my-tests', ListChecks, 'My Tests'],
  ['my-results', Gauge, 'My Results'],
] as const

const adminViewPermissions: Partial<Record<AppView, PermissionKey>> = {
  dashboard: 'view_dashboard',
  questions: 'manage_questions',
  tests: 'manage_tests',
  employees: 'manage_users',
  analytics: 'view_analytics',
  reports: 'export_reports',
  settings: 'manage_settings',
}

const employeeViewPermissions: Partial<Record<AppView, PermissionKey>> = {
  'my-tests': 'take_tests',
  'my-results': 'view_own_results',
}

const departedUserIds = ['u008', 'u010']
const transferTargetUserId = 'u009'

const permissionCatalog: Array<{ key: PermissionKey; label: string; description: string; adminOnly?: boolean }> = [
  { key: 'take_tests', label: 'Take assigned tests', description: 'Can open and complete assigned LMS assessments.' },
  { key: 'view_own_results', label: 'View own results', description: 'Can view personal completed assessment results.' },
  { key: 'view_dashboard', label: 'Admin dashboard', description: 'Can see workforce capability overview.', adminOnly: true },
  { key: 'manage_questions', label: 'Question bank', description: 'Can import and inspect assessment questions.', adminOnly: true },
  { key: 'manage_tests', label: 'Manage tests', description: 'Can create, launch, remove, and schedule assessments.', adminOnly: true },
  { key: 'manage_users', label: 'User directory', description: 'Can view staff profiles and completion status.', adminOnly: true },
  { key: 'view_analytics', label: 'Analytics', description: 'Can view cohort and topic performance dashboards.', adminOnly: true },
  { key: 'export_reports', label: 'Reports export', description: 'Can export result workbooks.', adminOnly: true },
  { key: 'manage_settings', label: 'Settings and permissions', description: 'Can view credentials and change app permissions.', adminOnly: true },
  { key: 'take_admin_self_test', label: 'Admin self-test', description: 'Can take a launched assessment from the admin test screen.', adminOnly: true },
]

function defaultPermissionsFor(user: User): Record<PermissionKey, boolean> {
  const isAdminUser = user.role === 'super_admin' || user.role === 'admin'
  if (isAdminUser) {
    return {
      take_tests: true,
      view_own_results: true,
      view_dashboard: true,
      manage_questions: true,
      manage_tests: true,
      manage_users: true,
      view_analytics: true,
      export_reports: true,
      manage_settings: true,
      take_admin_self_test: true,
    }
  }
  return {
    take_tests: true,
    view_own_results: true,
    view_dashboard: false,
    manage_questions: false,
    manage_tests: false,
    manage_users: false,
    view_analytics: false,
    export_reports: false,
    manage_settings: false,
    take_admin_self_test: false,
  }
}

function buildDefaultPermissions(users: User[]): Record<string, Record<PermissionKey, boolean>> {
  return Object.fromEntries(users.map((user) => [user.id, defaultPermissionsFor(user)]))
}

function transferUserId(userId: string): string {
  return departedUserIds.includes(userId) ? transferTargetUserId : userId
}

function uniqueUserIds(userIds: string[]): string[] {
  return Array.from(new Set(userIds.map(transferUserId).filter((userId) => !departedUserIds.includes(userId))))
}

function transferAssignments(tests: Assessment[]): Assessment[] {
  return tests.map((test) => ({
    ...test,
    assignedUserIds: uniqueUserIds(test.assignedUserIds),
  }))
}

function syncSeedAssessmentMetadata(tests: Assessment[]): Assessment[] {
  const source = seedTests[0]
  return tests.map((test) =>
    test.id === source.id
      ? {
          ...test,
          name: source.name,
          description: source.description,
          overviewSections: source.overviewSections,
          questionBankId: source.questionBankId,
        }
      : test,
  )
}

function transferSessions(sessions: TestSession[]): TestSession[] {
  return sessions.map((session) => ({
    ...session,
    userId: transferUserId(session.userId),
  }))
}

function transferPermissions(
  existing: Record<string, Record<PermissionKey, boolean>>,
  activeUsers: User[],
): Record<string, Record<PermissionKey, boolean>> {
  const next = buildDefaultPermissions(activeUsers)
  Object.entries(existing).forEach(([userId, userPermissions]) => {
    const targetUserId = transferUserId(userId)
    if (!next[targetUserId]) return
    permissionCatalog.forEach((permission) => {
      next[targetUserId][permission.key] = Boolean(next[targetUserId][permission.key] || userPermissions[permission.key])
    })
  })
  activeUsers.forEach((user) => {
    if (user.role === 'super_admin' || user.role === 'admin') next[user.id] = defaultPermissionsFor(user)
  })
  return next
}

function firstViewForUser(user: User, permissionMap: Record<string, Record<PermissionKey, boolean>>): AppView {
  if (user.role === 'super_admin' || user.role === 'admin') return 'dashboard'
  const userPermissions = permissionMap[user.id] ?? defaultPermissionsFor(user)
  const firstManagementView = navItems.find(([itemView]) => {
    const required = adminViewPermissions[itemView]
    return required ? userPermissions[required] : false
  })?.[0]
  if (firstManagementView) return firstManagementView
  if (userPermissions.take_tests) return 'my-tests'
  if (userPermissions.view_own_results) return 'my-results'
  return 'login'
}

/**
 * Reads application state from localStorage or returns the supplied fallback.
 */
function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function eventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`
}

function analyticsEventLabel(type: AnalyticsEventType): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function average(values: number[]): number {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const midpoint = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function percentile(values: number[], targetPercentile: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((targetPercentile / 100) * sorted.length) - 1))
  return sorted[index]
}

function percent(part: number, total: number): number {
  return total ? (part / total) * 100 : 0
}

function round(value: number, digits = 1): number {
  return Number(value.toFixed(digits))
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000
}

function dateKey(isoDate?: string): string {
  if (!isoDate) return 'Unknown'
  return new Date(isoDate).toISOString().slice(0, 10)
}

function inDateWindow(isoDate: string | undefined, range: string): boolean {
  if (!isoDate || range === 'all') return true
  const timestamp = new Date(isoDate).getTime()
  if (!Number.isFinite(timestamp)) return false
  if (range === '7d') return timestamp >= daysAgo(7)
  if (range === '30d') return timestamp >= daysAgo(30)
  if (range === '90d') return timestamp >= daysAgo(90)
  return true
}

function responseOutcome(question: Question | undefined, response: ResponseRecord): 'Correct' | 'Partial' | 'Wrong' | 'Unanswered' {
  if (!response.selectedOption) return 'Unanswered'
  if (question?.correctAnswer === response.selectedOption) return 'Correct'
  if (question && (response.selectedOption === question.partialAnswer1 || response.selectedOption === question.partialAnswer2)) return 'Partial'
  return 'Wrong'
}

function displayQuestionText(rawText: string | undefined): string {
  const original = String(rawText ?? '').trim()
  if (!original) return ''
  let cleaned = original
  let previous = ''
  while (cleaned && cleaned !== previous) {
    previous = cleaned
    cleaned = cleaned
      .replace(/^\s*(?:\[[^\]]{1,48}\]|\((?:easy|medium|hard|standard|weighted|scenario|curve|mcq|single answer|multiple choice)[^)]{0,32}\))\s*/i, '')
      .replace(/^\s*(?:easy|medium|hard|standard|weighted|scenario|curve|mcq|single-answer|single answer|multiple-choice|multiple choice)(?:\s+(?:question|scenario|item|batch|type))?\s*[:\-–—|]\s*/i, '')
      .replace(/^\s*(?:question|item|no\.?|number|q)\s*#?\s*\d{1,5}[a-z]?\s*[\).:\-–—]\s*/i, '')
      .replace(/^\s*[sq]\s*\d{1,5}[a-z]?\s*[\).:\-–—]\s*/i, '')
      .replace(/^\s*\d{1,5}[a-z]?\s*[\).:\-–—]\s*/, '')
      .trim()
  }
  return cleaned || original
}

function shortQuestionText(question: Question | undefined): string {
  if (!question) return 'Unknown question'
  const cleaned = displayQuestionText(question.questionText)
  return cleaned.length > 76 ? `${cleaned.slice(0, 73)}...` : cleaned
}

function aiThreadTitle(prompt: string): string {
  const title = prompt.replace(/\s+/g, ' ').trim()
  return title.length > 58 ? `${title.slice(0, 55)}...` : title || 'New intelligence chat'
}

function createAiThread(title = 'New intelligence chat'): AiChatThread {
  const now = new Date().toISOString()
  return {
    id: eventId('ai-thread'),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
}

function questionOption(question: Question, option: OptionKey): string {
  return String(question[`option${option}` as keyof Question] ?? '')
}

function relevantQuestionScore(question: Question, terms: string[]): number {
  if (!terms.length) return 0
  const haystack = `${question.questionText} ${question.topicTag} ${questionOption(question, 'A')} ${questionOption(question, 'B')} ${questionOption(question, 'C')} ${questionOption(question, 'D')} ${questionOption(question, 'E')}`.toLowerCase()
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0)
}

function randomUnit(): number {
  const value = crypto.getRandomValues(new Uint32Array(1))[0]
  return value / 0x100000000
}

function exposureAverage(questions: Question[], exposureCounts: QuestionExposureCounts): number {
  return questions.length ? average(questions.map((question) => exposureCounts[question.questionId] ?? 0)) : 0
}

function exposurePriority(exposureCount: number, averageExposure: number): { label: string; boostPercent: 0 | 25 | 50 | 75; weight: number } {
  if (exposureCount === 0) return { label: '75% priority boost', boostPercent: 75, weight: 1.75 }
  if (averageExposure > 0 && exposureCount <= averageExposure * 0.5) return { label: '50% priority boost', boostPercent: 50, weight: 1.5 }
  if (averageExposure > 0 && exposureCount <= averageExposure * 0.75) return { label: '25% priority boost', boostPercent: 25, weight: 1.25 }
  return { label: 'Standard rotation', boostPercent: 0, weight: 1 }
}

function exposureAwareQuestionDraw(availableQuestions: Question[], questionCount: number, exposureCounts: QuestionExposureCounts): Question[] {
  const remaining = [...availableQuestions]
  const selected: Question[] = []
  const averageExposure = exposureAverage(availableQuestions, exposureCounts)
  while (selected.length < questionCount && remaining.length) {
    const weighted = remaining.map((question) => ({
      question,
      weight: exposurePriority(exposureCounts[question.questionId] ?? 0, averageExposure).weight,
    }))
    const totalWeight = weighted.reduce((total, item) => total + item.weight, 0)
    let cursor = randomUnit() * totalWeight
    let selectedIndex = 0
    for (let index = 0; index < weighted.length; index += 1) {
      cursor -= weighted[index].weight
      if (cursor <= 0) {
        selectedIndex = index
        break
      }
    }
    selected.push(remaining[selectedIndex])
    remaining.splice(selectedIndex, 1)
  }
  return selected
}

function credentialText(user: User): string {
  return `Username: ${user.fullName}\nPassword: ${user.password}`
}

function allCredentialText(users: User[]): string {
  return users.map((user) => credentialText(user)).join('\n\n')
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const element = document.createElement('textarea')
  element.value = text
  document.body.appendChild(element)
  element.select()
  document.execCommand('copy')
  document.body.removeChild(element)
}

/**
 * Lazy-loads SheetJS only when import/export work is actually needed.
 */
async function loadSpreadsheetTools() {
  return import('xlsx')
}

async function requestAiIntelligence(payload: AiIntelligencePayload): Promise<AiIntelligenceResponse> {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const endpoint = isLocal ? 'https://iicocece-assessment.web.app/api/analytics-intelligence' : '/api/analytics-intelligence'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('AI backend is not deployed yet. Upgrade Firebase to Blaze, deploy the function, then try again.')
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(body.error ?? 'AI intelligence request failed.'))
  return {
    answer: String(body.answer ?? '').trim() || 'No analysis was returned.',
    model: typeof body.model === 'string' ? body.model : undefined,
    citations: Array.isArray(body.citations) ? body.citations.filter((item: unknown): item is string => typeof item === 'string') : [],
  }
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const values = crypto.getRandomValues(new Uint32Array(6))
  return Array.from(values, (value) => chars[value % chars.length]).join('')
}

function fallbackDocumentNameFromBatch(batchId: string): string {
  if (batchId === 'seed-bank') return 'Sample DEAP Question Bank'
  if (batchId.startsWith('file:')) return batchId.split(':')[1] || 'Uploaded Question Bank'
  if (batchId.startsWith('batch-')) return `Uploaded Question Bank ${batchId.replace('batch-', '')}`
  return batchId
}

function normalizeQuestionBankMetadata(metadata: Partial<QuestionBankMetadata> = {}): QuestionBankMetadata {
  return {
    name: String(metadata.name ?? '').trim().slice(0, 180),
    description: String(metadata.description ?? '').trim().slice(0, 1600),
  }
}

function mergeQuestionBankMetadata(stored: QuestionBankMetadataMap = {}): QuestionBankMetadataMap {
  const merged: QuestionBankMetadataMap = { ...defaultQuestionBankMetadata }
  Object.entries(stored).forEach(([batchId, metadata]) => {
    const normalized = normalizeQuestionBankMetadata(metadata)
    if (!normalized.name && !normalized.description) return
    merged[batchId] = normalized
  })
  return merged
}

function documentNameFromBatch(batchId: string, metadata: QuestionBankMetadataMap = defaultQuestionBankMetadata): string {
  return metadata[batchId]?.name || fallbackDocumentNameFromBatch(batchId)
}

function documentDescriptionFromBatch(batchId: string, metadata: QuestionBankMetadataMap = defaultQuestionBankMetadata): string {
  return metadata[batchId]?.description || ''
}

function getQuestionBankSummaries(
  questions: Question[],
  metadata: QuestionBankMetadataMap = defaultQuestionBankMetadata,
): Array<{ id: string; name: string; total: number }> {
  return Array.from(
    questions.reduce((map, question) => {
      map.set(question.importBatchId, (map.get(question.importBatchId) ?? 0) + 1)
      return map
    }, new Map<string, number>()),
  )
    .map(([id, total]) => ({ id, name: documentNameFromBatch(id, metadata), total }))
    .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name))
}

/**
 * Calculates the time-decay multiplier from server-authoritative seconds remaining.
 */
export function getTimeMultiplier(secondsRemaining: number): Decimal {
  if (secondsRemaining >= 51) return new Decimal(1)
  if (secondsRemaining >= 41) return new Decimal(0.9)
  if (secondsRemaining >= 31) return new Decimal(0.8)
  if (secondsRemaining >= 21) return new Decimal(0.7)
  if (secondsRemaining >= 11) return new Decimal(0.5)
  if (secondsRemaining >= 1) return new Decimal(0.25)
  return new Decimal(0)
}

/**
 * Returns the configured answer weight for a selected option.
 */
export function getAnswerWeight(question: Question, selectedOption?: OptionKey): Decimal {
  if (!selectedOption) return new Decimal(0)
  if (selectedOption === question.correctAnswer) return new Decimal(question.correctWeight)
  if (selectedOption === question.partialAnswer1) return new Decimal(question.partialWeight1 ?? 0)
  if (selectedOption === question.partialAnswer2) return new Decimal(question.partialWeight2 ?? 0)
  return new Decimal(0)
}

/**
 * Calculates a single question score with decimal-safe arithmetic.
 */
export function scoreQuestion(
  question: Question,
  selectedOption: OptionKey | undefined,
  secondsRemaining: number,
  support: { hintUsed?: boolean; answerRevealed?: boolean } = {},
): ResponseRecord {
  const answerWeight = getAnswerWeight(question, selectedOption)
  const timeMultiplier = getTimeMultiplier(secondsRemaining)
  const penaltyMultiplier = support.answerRevealed ? new Decimal(0) : support.hintUsed ? new Decimal(0.5) : new Decimal(1)
  const marksEarned = new Decimal(1).mul(answerWeight).mul(timeMultiplier).mul(penaltyMultiplier)
  return {
    questionId: question.questionId,
    selectedOption,
    secondsRemaining,
    answerWeight: answerWeight.toFixed(2),
    timeMultiplier: timeMultiplier.toFixed(2),
    marksEarned: marksEarned.toFixed(2),
    responseTime: 60 - secondsRemaining,
    hintUsed: Boolean(support.hintUsed),
    answerRevealed: Boolean(support.answerRevealed),
    scorePenaltyMultiplier: penaltyMultiplier.toFixed(2),
  }
}

/**
 * Produces a randomized copy of an array using Fisher-Yates shuffling.
 */
function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  const randomValues = crypto.getRandomValues(new Uint32Array(Math.max(copy.length, 1)))
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomValues[index] % (index + 1)
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

/**
 * Validates one imported spreadsheet row and converts it to the internal question shape.
 */
function normalizeQuestion(row: Record<string, unknown>, rowNumber: number, batchId: string): { question?: Question; error?: string } {
  const difficulty = String(row.difficulty ?? '').trim()
  const correctAnswer = String(row.correct_answer ?? '').trim().toUpperCase()
  const partial1 = String(row.partial_answer_1 ?? '').trim().toUpperCase()
  const partial2 = String(row.partial_answer_2 ?? '').trim().toUpperCase()
  const correctWeight = Number(row.correct_weight)
  const partialWeight1 = row.partial_weight_1 === '' || row.partial_weight_1 == null ? undefined : Number(row.partial_weight_1)
  const partialWeight2 = row.partial_weight_2 === '' || row.partial_weight_2 == null ? undefined : Number(row.partial_weight_2)
  const validOption = (value: string) => ['A', 'B', 'C', 'D', 'E'].includes(value)

  if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) return { error: `Row ${rowNumber}: difficulty must be Easy, Medium, or Hard.` }
  if (!validOption(correctAnswer)) return { error: `Row ${rowNumber}: correct_answer must be A, B, C, D, or E.` }
  if (partial1 && !validOption(partial1)) return { error: `Row ${rowNumber}: partial_answer_1 must be blank or A-E.` }
  if (partial2 && !validOption(partial2)) return { error: `Row ${rowNumber}: partial_answer_2 must be blank or A-E.` }
  if (!Number.isFinite(correctWeight) || correctWeight <= 0 || correctWeight > 1) {
    return { error: `Row ${rowNumber}: correct_weight must be between 0.01 and 1.00.` }
  }
  if (partialWeight1 && partialWeight1 >= correctWeight) return { error: `Row ${rowNumber}: partial_weight_1 must be lower than correct_weight.` }
  if (partialWeight2 && partialWeight2 >= correctWeight) return { error: `Row ${rowNumber}: partial_weight_2 must be lower than correct_weight.` }

  return {
    question: {
      questionId: String(row.question_id).trim(),
      questionText: String(row.question_text).trim().slice(0, 500),
      difficulty: difficulty as Difficulty,
      optionA: String(row.option_a).trim().slice(0, 250),
      optionB: String(row.option_b).trim().slice(0, 250),
      optionC: String(row.option_c).trim().slice(0, 250),
      optionD: String(row.option_d).trim().slice(0, 250),
      optionE: String(row.option_e).trim().slice(0, 250),
      correctAnswer: correctAnswer as OptionKey,
      partialAnswer1: partial1 ? (partial1 as OptionKey) : undefined,
      partialAnswer2: partial2 ? (partial2 as OptionKey) : undefined,
      correctWeight,
      partialWeight1,
      partialWeight2,
      topicTag: String(row.topic_tag ?? 'General').trim().slice(0, 100) || 'General',
      hint: String(row.hint ?? row.question_hint ?? row.assessment_hint ?? '').trim().slice(0, 500) || undefined,
      explanation: String(row.explanation ?? '').trim().slice(0, 1000),
      importBatchId: batchId,
    },
  }
}

/**
 * Classifies an imported sales outreach question into an iicocece competency area.
 */
function classifyTopic(questionText: string): string {
  const matched = topicRules.find(([pattern]) => pattern.test(questionText))?.[1]
  if (matched) return matched
  return /cyber|crime|act|section|penalty|ngcert|cnii|cbn|nitda|ndpc|phishing|fraud/i.test(questionText)
    ? 'Cybercrime Act General Knowledge'
    : 'Consent Philosophy'
}

/**
 * Converts the supplied workbook's compact score-column format to DEAP questions.
 */
function normalizeScoredOptionRow(
  row: Record<string, unknown>,
  rowNumber: number,
  batchId: string,
  difficultyHint?: Difficulty,
): { question?: Question; error?: string } {
  const rawQuestion = String(row.Question ?? '').trim()
  const difficultyMatch = rawQuestion.match(/^\[(Easy|Medium|Hard)(?:-[^\]]+)?\]\s*/i)
  const difficulty = (difficultyMatch?.[1] ? difficultyMatch[1].replace(/^./, (letter) => letter.toUpperCase()) : difficultyHint ?? 'Medium') as Difficulty
  const questionText = rawQuestion.replace(/^\[[^\]]+\]\s*/i, '').slice(0, 500)
  const options = {
    A: String(row['Option A'] ?? '').trim(),
    B: String(row['Option B'] ?? '').trim(),
    C: String(row['Option C'] ?? '').trim(),
    D: String(row['Option D'] ?? '').trim(),
    E: String(row['Option E'] ?? '').trim(),
  }
  const scores = (['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((key) => ({ key, score: Number(row[`${key} Score`] ?? row[`Score ${key}`] ?? 0) }))
  const ranked = [...scores].sort((left, right) => right.score - left.score)
  const correct = ranked[0]
  const partials = ranked.filter((item) => item.score > 0 && item.score < correct.score).slice(0, 2)
  const topicTag = classifyTopic(questionText)

  if (!questionText) return { error: `Row ${rowNumber}: Question is required.` }
  if (Object.values(options).some((option) => !option)) return { error: `Row ${rowNumber}: all five options are required.` }
  if (!Number.isFinite(correct.score) || correct.score <= 0) return { error: `Row ${rowNumber}: at least one option must have a positive score.` }

  return {
    question: {
      questionId: `${batchId}-${String(rowNumber - 1).padStart(4, '0')}`,
      questionText,
      difficulty,
      optionA: options.A.slice(0, 250),
      optionB: options.B.slice(0, 250),
      optionC: options.C.slice(0, 250),
      optionD: options.D.slice(0, 250),
      optionE: options.E.slice(0, 250),
      correctAnswer: correct.key,
      partialAnswer1: partials[0]?.key,
      partialAnswer2: partials[1]?.key,
      correctWeight: 1,
      partialWeight1: partials[0] ? Number(new Decimal(partials[0].score).div(correct.score).toFixed(2)) : undefined,
      partialWeight2: partials[1] ? Number(new Decimal(partials[1].score).div(correct.score).toFixed(2)) : undefined,
      topicTag,
      hint: String(row.hint ?? row.Hint ?? row.question_hint ?? row['Question Hint'] ?? '').trim().slice(0, 500) || undefined,
      explanation: `The highest weighted answer is option ${correct.key}. This question maps to ${topicTag} within the iicocece consent-based sales outreach competency model.`,
      importBatchId: batchId,
    },
  }
}

/**
 * Parses an uploaded CSV/XLSX file into validated question records.
 */
async function parseQuestionFile(file: File, existingIds: Set<string>): Promise<{ questions: Question[]; errors: string[] }> {
  const spreadsheet = await loadSpreadsheetTools()
  const buffer = await file.arrayBuffer()
  const workbook = spreadsheet.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = spreadsheet.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const headers = Object.keys(rows[0] ?? {})
  const batchId = `file:${file.name}:${Date.now()}`
  if (headers.includes('Question') && (headers.includes('A Score') || headers.includes('Score A'))) {
    const allRows = workbook.SheetNames.flatMap((sheetName: string) => {
      const sheetRows = spreadsheet.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })
      const sheetHeaders = Object.keys(sheetRows[0] ?? {})
      if (!sheetHeaders.includes('Question') || !(sheetHeaders.includes('A Score') || sheetHeaders.includes('Score A'))) return []
      const sheetDifficulty = sheetName.match(/Easy/i) ? 'Easy' : sheetName.match(/Hard/i) ? 'Hard' : sheetName.match(/Medium/i) ? 'Medium' : undefined
      return sheetRows.map((row, index) => ({ row, sheetName, sheetDifficulty: sheetDifficulty as Difficulty | undefined, rowNumber: index + 2 }))
    })
    return parseScoredOptionRows(allRows, new Set(), batchId)
  }
  const missing = requiredColumns.filter((column) => !headers.includes(column))
  if (missing.length) return { questions: [], errors: [`Missing required column(s): ${missing.join(', ')}`] }

  const seen = new Set<string>()
  const questions: Question[] = []
  const errors: string[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const id = String(row.question_id ?? '').trim()
    if (!id) {
      errors.push(`Row ${rowNumber}: question_id is required.`)
      return
    }
    if (seen.has(id) || existingIds.has(id)) {
      errors.push(`Row ${rowNumber}: duplicate question_id "${id}".`)
      return
    }
    seen.add(id)
    const result = normalizeQuestion(row, rowNumber, batchId)
    if (result.error) errors.push(result.error)
    if (result.question) questions.push(result.question)
  })

  return { questions: errors.length ? [] : questions, errors }
}

/**
 * Parses workbook rows where each option has an explicit score column.
 */
function parseScoredOptionRows(
  rows: Array<Record<string, unknown> | { row: Record<string, unknown>; sheetName?: string; sheetDifficulty?: Difficulty; rowNumber?: number }>,
  existingIds: Set<string>,
  batchId: string,
): { questions: Question[]; errors: string[] } {
  const questions: Question[] = []
  const errors: string[] = []
  rows.forEach((entry, index) => {
    const wrapped =
      'row' in entry && typeof entry.row === 'object' && entry.row !== null
        ? (entry as { row: Record<string, unknown>; sheetDifficulty?: Difficulty; rowNumber?: number })
        : { row: entry as Record<string, unknown>, rowNumber: index + 2 }
    const result = normalizeScoredOptionRow(wrapped.row, index + 2, batchId, wrapped.sheetDifficulty)
    if (result.error) errors.push(result.error)
    if (result.question && !existingIds.has(result.question.questionId)) questions.push(result.question)
  })
  return { questions: errors.length ? [] : questions, errors }
}

/**
 * Loads the bundled first question bank from Firebase Hosting assets.
 */
async function loadBundledQuestionBank(bank: { id: string; path: string }): Promise<Question[]> {
  const response = await fetch(bank.path)
  if (!response.ok) throw new Error('Unable to load bundled question bank.')
  const spreadsheet = await loadSpreadsheetTools()
  const buffer = await response.arrayBuffer()
  const workbook = spreadsheet.read(buffer, { type: 'array' })
  const rows = workbook.SheetNames.flatMap((sheetName: string) => {
    const sheetRows = spreadsheet.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' })
    const sheetHeaders = Object.keys(sheetRows[0] ?? {})
    if (!sheetHeaders.includes('Question') || !(sheetHeaders.includes('A Score') || sheetHeaders.includes('Score A'))) return []
    const sheetDifficulty = sheetName.match(/Easy/i) ? 'Easy' : sheetName.match(/Hard/i) ? 'Hard' : sheetName.match(/Medium/i) ? 'Medium' : undefined
    return sheetRows.map((row, index) => ({ row, sheetName, sheetDifficulty: sheetDifficulty as Difficulty | undefined, rowNumber: index + 2 }))
  })
  const result = parseScoredOptionRows(rows, new Set(), bank.id)
  if (result.errors.length) throw new Error(result.errors[0])
  return result.questions
}

function App() {
  const [users, setUsers] = useState<User[]>(() => seedUsers)
  const [permissions, setPermissions] = useState<Record<string, Record<PermissionKey, boolean>>>(() =>
    transferPermissions(readStored('deap-permissions', buildDefaultPermissions(seedUsers)), seedUsers),
  )
  const [questions, setQuestions] = useState<Question[]>(() => readStored('deap-questions', seedQuestions))
  const [questionBankMetadata, setQuestionBankMetadata] = useState<QuestionBankMetadataMap>(() =>
    mergeQuestionBankMetadata(readStored('deap-question-bank-metadata', defaultQuestionBankMetadata)),
  )
  const [deletedQuestionBankIds, setDeletedQuestionBankIds] = useState<string[]>(() => readStored('deap-deleted-question-banks', []))
  const [tests, setTests] = useState<Assessment[]>(() => syncSeedAssessmentMetadata(transferAssignments(readStored('deap-tests', seedTests))))
  const [sessions, setSessions] = useState<TestSession[]>(() => transferSessions(readStored('deap-sessions', [])))
  const [currentUser, setCurrentUser] = useState<User | undefined>(() => readStored<User | undefined>('deap-current-user', undefined))
  const [view, setView] = useState<AppView>(() => (currentUser ? firstViewForUser(currentUser, permissions) : 'login'))
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => readStored('deap-audit-events', []))
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => readStored('deap-analytics-events', []))
  const [questionExposureCounts, setQuestionExposureCounts] = useState<QuestionExposureCounts>(() => readStored('deap-question-exposure-counts', {}))
  const [activeTestId, setActiveTestId] = useState<string>()
  const [activeSessionId, setActiveSessionId] = useState<string>()
  const [branding, setBranding] = useState<Branding>(() => readStored('deap-branding', defaultBranding))
  const [theme, setTheme] = useState<ThemeMode>(() => readStored('deap-theme', 'light'))
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem('deap-questions', JSON.stringify(questions)), [questions])
  useEffect(() => localStorage.setItem('deap-question-bank-metadata', JSON.stringify(questionBankMetadata)), [questionBankMetadata])
  useEffect(() => localStorage.setItem('deap-deleted-question-banks', JSON.stringify(deletedQuestionBankIds)), [deletedQuestionBankIds])
  useEffect(() => localStorage.setItem('deap-users', JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem('deap-permissions', JSON.stringify(permissions)), [permissions])
  useEffect(() => localStorage.setItem('deap-tests', JSON.stringify(tests)), [tests])
  useEffect(() => localStorage.setItem('deap-sessions', JSON.stringify(sessions)), [sessions])
  useEffect(() => localStorage.setItem('deap-audit-events', JSON.stringify(auditEvents.slice(0, 200))), [auditEvents])
  useEffect(() => localStorage.setItem('deap-analytics-events', JSON.stringify(analyticsEvents.slice(0, 5000))), [analyticsEvents])
  useEffect(() => localStorage.setItem('deap-question-exposure-counts', JSON.stringify(questionExposureCounts)), [questionExposureCounts])
  useEffect(() => localStorage.setItem('deap-current-user', JSON.stringify(currentUser)), [currentUser])
  useEffect(() => localStorage.setItem('deap-branding', JSON.stringify(branding)), [branding])
  useEffect(() => {
    if (Object.keys(questionExposureCounts).length || !sessions.length) return
    const restoredCounts: QuestionExposureCounts = {}
    sessions.forEach((session) => {
      const exposedIds = session.questionIds?.length ? session.questionIds : session.responses.map((response) => response.questionId)
      Array.from(new Set(exposedIds)).forEach((questionId) => {
        restoredCounts[questionId] = (restoredCounts[questionId] ?? 0) + 1
      })
    })
    if (Object.keys(restoredCounts).length) setQuestionExposureCounts(restoredCounts)
  }, [questionExposureCounts, sessions])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('deap-theme', JSON.stringify(theme))
  }, [theme])
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'deap-permissions' && event.newValue) {
        try {
          setPermissions(transferPermissions(JSON.parse(event.newValue), users))
        } catch {
          setPermissions(buildDefaultPermissions(users))
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [users])
  useEffect(() => {
    if (localStorage.getItem('deap-user-directory-version') !== 'iicocece-users-v4') {
      setUsers(seedUsers)
      setTests((existing) => syncSeedAssessmentMetadata(transferAssignments(existing.length ? existing : seedTests)))
      setSessions((existing) => transferSessions(existing))
      setPermissions((existing) => transferPermissions(existing, seedUsers))
      setCurrentUser((existing) => {
        if (!existing) return undefined
        if (departedUserIds.includes(existing.id)) return seedUsers.find((user) => user.id === transferTargetUserId)
        return seedUsers.find((user) => user.id === existing.id)
      })
      localStorage.setItem('deap-user-directory-version', 'iicocece-users-v4')
    }
    if (localStorage.getItem('deap-lms-layout-version') !== 'iicocece-org-lms-v1') {
      setTests((existing) =>
        syncSeedAssessmentMetadata(
          transferAssignments(existing.map((test) =>
            test.id === 'test-onboarding'
              ? {
                  ...seedTests[0],
                  assignedUserIds: uniqueUserIds(test.assignedUserIds.length ? test.assignedUserIds : seedTests[0].assignedUserIds),
                }
              : test,
          )),
        ),
      )
      localStorage.setItem('deap-lms-layout-version', 'iicocece-org-lms-v1')
    }
    const bundledVersionKey = `deap-bundled-question-banks-${bundledQuestionBanks.map((bank) => bank.id).join('|')}`
    const missingBundledBanks = bundledQuestionBanks.filter(
      (bank) => !deletedQuestionBankIds.includes(bank.id) && !questions.some((question) => question.importBatchId === bank.id),
    )
    if (!missingBundledBanks.length && localStorage.getItem(bundledVersionKey) === 'loaded') return
    Promise.all(missingBundledBanks.map((bank) => loadBundledQuestionBank(bank)))
      .then((loadedGroups) => {
        const loadedQuestions = loadedGroups.flat()
        const loadedBankIds = new Set<string>(missingBundledBanks.map((bank) => bank.id))
        setQuestions((existing) => [
          ...loadedQuestions,
          ...existing.filter((question) => !question.questionId.startsWith('seed-') && !question.questionId.startsWith('cybercrime-act-') && question.importBatchId !== legacyCybercrimeBankId && !loadedBankIds.has(question.importBatchId)),
        ])
        localStorage.setItem('deap-source-workbook-version', sourceWorkbookVersion)
        localStorage.setItem(bundledVersionKey, 'loaded')
        setToast(`${loadedQuestions.length} bundled question(s) were added to the LMS.`)
      })
      .catch(() => setToast('The bundled question bank could not be loaded. You can still import it manually from Question Bank.'))
  }, [])

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
  const activeSession = sessions.find((session) => session.id === activeSessionId)
  const currentPermissions = currentUser ? (isAdmin ? defaultPermissionsFor(currentUser) : (permissions[currentUser.id] ?? defaultPermissionsFor(currentUser))) : undefined
  const hasPermission = (permission: PermissionKey) => Boolean(isAdmin || currentPermissions?.[permission])
  const visibleEmployeeNav = employeeNav.filter(([itemView]) => {
    const required = employeeViewPermissions[itemView]
    return required ? hasPermission(required) : true
  })
  const visibleAdminNav = navItems.filter(([itemView]) => {
    const required = adminViewPermissions[itemView]
    return required ? hasPermission(required) : true
  })
  const visibleNavigation = isAdmin ? visibleAdminNav : [...visibleAdminNav, ...visibleEmployeeNav]
  const usesManagementWorkspace = isAdmin || visibleAdminNav.some(([itemView]) => view === itemView)
  const canAccessCurrentView = view === 'login' || view === 'taking-test' || view === 'result' || visibleNavigation.some(([itemView]) => itemView === view)

  useEffect(() => {
    if (currentUser && !canAccessCurrentView) setView(firstViewForUser(currentUser, permissions))
  }, [canAccessCurrentView, currentUser, permissions])

  /**
   * Stores a concise local audit event for admin visibility in this hosted MVP.
   */
  function recordAudit(action: string, detail: string, actor = currentUser?.fullName ?? 'System') {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`,
      actorName: actor,
      action,
      detail,
      createdAt: new Date().toISOString(),
    }
    setAuditEvents((existing) => [event, ...existing].slice(0, 200))
  }

  /**
   * Stores a structured analytics event that powers the admin intelligence dashboards.
   */
  function recordAnalytics(
    type: AnalyticsEventType,
    details: Partial<AnalyticsEvent> = {},
    actor: User | undefined = currentUser,
  ) {
    const eventUser = details.userId ? users.find((user) => user.id === details.userId) : actor
    const eventTest = details.testId ? tests.find((test) => test.id === details.testId) : undefined
    const eventQuestion = details.questionId ? questions.find((question) => question.questionId === details.questionId) : undefined
    const event: AnalyticsEvent = {
      id: eventId('analytics'),
      type,
      userId: eventUser?.id ?? details.userId,
      userName: eventUser?.fullName ?? details.userName,
      department: eventUser?.department ?? details.department,
      role: eventUser?.role ?? details.role,
      testId: eventTest?.id ?? details.testId,
      testName: eventTest?.name ?? details.testName,
      questionId: eventQuestion?.questionId ?? details.questionId,
      questionBankId: eventQuestion?.importBatchId ?? details.questionBankId ?? eventTest?.questionBankId,
      difficulty: details.difficulty ?? eventQuestion?.difficulty ?? eventTest?.difficulty,
      topicTag: details.topicTag ?? eventQuestion?.topicTag,
      value: details.value,
      durationSeconds: details.durationSeconds,
      outcome: details.outcome,
      metadata: details.metadata,
      createdAt: new Date().toISOString(),
    }
    setAnalyticsEvents((existing) => [event, ...existing].slice(0, 5000))
  }

  /**
   * Routes users between views while capturing feature adoption and navigation behaviour.
   */
  function navigateTo(nextView: AppView) {
    if (nextView !== view) {
      recordAnalytics('view_change', {
        outcome: nextView,
        metadata: { from_view: view, to_view: nextView },
      })
    }
    setView(nextView)
  }

  /**
   * Signs the current user out and records the end of an access session.
   */
  function handleLogout() {
    recordAnalytics('logout', { outcome: 'signed_out' })
    setCurrentUser(undefined)
    setView('login')
  }

  /**
   * Authenticates demo users and routes them to their correct portal.
   */
  function handleLogin(username: string, password: string) {
    const normalizedUsername = username.trim().toLowerCase()
    const user = users.find(
      (candidate) =>
        [candidate.userId, candidate.displayName, candidate.fullName, candidate.email]
          .filter(Boolean)
          .some((value) => value.toLowerCase() === normalizedUsername) && candidate.password === password,
    )
    if (!user) {
      recordAnalytics('login_failed', {
        userName: username.trim() || 'Unknown',
        outcome: 'invalid_credentials',
        metadata: { attempted_username: username.trim().slice(0, 120) },
      }, undefined)
      setToast('Invalid username or password.')
      return
    }
    recordAudit('Login', `${user.fullName} signed in.`, user.fullName)
    recordAnalytics('login_success', { userId: user.id, outcome: 'signed_in' }, user)
    setCurrentUser(user)
    const resumable = sessions.find((session) => session.userId === user.id && session.status === 'in_progress')
    if (resumable) {
      setActiveTestId(resumable.testId)
      setActiveSessionId(resumable.id)
      recordAnalytics('test_resumed', {
        userId: user.id,
        testId: resumable.testId,
        outcome: 'restored_on_login',
        metadata: { session_id: resumable.id, answered_questions: resumable.responses.length },
      }, user)
      setToast('Your in-progress test has been restored. The question timer continued while you were away.')
      setView('taking-test')
      return
    }
    setView(firstViewForUser(user, permissions))
  }

  /**
   * Imports a question file and updates the question bank when all rows pass validation.
   */
  async function handleImport(file?: File) {
    if (!file) return
    const result = await parseQuestionFile(file, new Set(questions.map((question) => question.questionId)))
    if (result.errors.length) {
      setToast(result.errors.slice(0, 3).join(' '))
      return
    }
    setQuestions((existing) => [...result.questions, ...existing])
    const batchId = result.questions[0]?.importBatchId
    if (batchId) {
      setQuestionBankMetadata((existing) =>
        mergeQuestionBankMetadata({
          ...existing,
          [batchId]: existing[batchId] ?? {
            name: documentNameFromBatch(batchId, existing),
            description: `Imported from ${file.name}.`,
          },
        }),
      )
    }
    recordAudit('Question import', `${result.questions.length} question(s) imported from ${file.name}.`)
    recordAnalytics('question_import', {
      questionBankId: batchId,
      value: result.questions.length,
      outcome: 'imported',
      metadata: { filename: file.name, imported_questions: result.questions.length },
    })
    setToast(`${result.questions.length} question(s) imported successfully.`)
  }

  /**
   * Updates the editable name and description for a question bank.
   */
  function updateQuestionBankMetadata(batchId: string, metadata: QuestionBankMetadata) {
    const normalized = normalizeQuestionBankMetadata(metadata)
    if (!normalized.name) {
      setToast('Question bank name is required.')
      return
    }

    setQuestionBankMetadata((existing) => mergeQuestionBankMetadata({ ...existing, [batchId]: normalized }))
    recordAudit('Question bank updated', `${documentNameFromBatch(batchId, questionBankMetadata)} was renamed to ${normalized.name}.`)
    setToast('Question bank details saved.')
  }

  /**
   * Deletes a question bank and any local tests or attempts that depend on it.
   */
  function deleteQuestionBank(batchId: string) {
    const bankName = documentNameFromBatch(batchId, questionBankMetadata)
    const questionCount = questions.filter((question) => question.importBatchId === batchId).length
    const linkedTestIds = tests.filter((test) => test.questionBankId === batchId).map((test) => test.id)
    const linkedSessionCount = sessions.filter((session) => linkedTestIds.includes(session.testId)).length
    const confirmed = window.confirm(
      `Delete "${bankName}"?\n\nThis removes ${questionCount.toLocaleString()} question(s), ${linkedTestIds.length} linked test(s), and ${linkedSessionCount} linked attempt(s) from this device.`,
    )
    if (!confirmed) return
    setQuestions((existing) => existing.filter((question) => question.importBatchId !== batchId))
    setTests((existing) => existing.filter((test) => test.questionBankId !== batchId))
    setSessions((existing) => existing.filter((session) => !linkedTestIds.includes(session.testId)))
    setQuestionBankMetadata((existing) => {
      const next = { ...existing }
      delete next[batchId]
      return next
    })
    setDeletedQuestionBankIds((existing) => Array.from(new Set([...existing, batchId])))
    recordAudit('Question bank deleted', `${bankName} was deleted with ${questionCount} question(s).`)
    recordAnalytics('question_bank_deleted', {
      questionBankId: batchId,
      value: questionCount,
      outcome: 'deleted',
      metadata: { linked_tests: linkedTestIds.length, linked_sessions: linkedSessionCount },
    })
    setToast(`${bankName} has been deleted. Linked tests and attempts were also removed locally.`)
  }

  /**
   * Creates a configured assessment and assigns it to matching employees.
   */
  function createAssessment(form: FormData) {
    const difficulty = String(form.get('difficulty')) as Assessment['difficulty']
    const questionCount = Number(form.get('questionCount')) as 20 | 40 | 60
    const questionBankId = String(form.get('questionBankId') || '').trim()
    const available = questions.filter((question) => {
      const matchesDifficulty = difficulty === 'Mixed' || question.difficulty === difficulty
      const matchesQuestionBank = questionBankId ? question.importBatchId === questionBankId : true
      return matchesDifficulty && matchesQuestionBank
    })
    if (available.length < questionCount) {
      setToast(`Not enough ${difficulty} questions in the selected question bank. ${available.length} available, ${questionCount} required.`)
      return
    }
    const departments = String(form.get('departments') || 'Sales,Operations')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const assignedUserIds = users.filter((user) => user.role === 'employee' && departments.includes(user.department)).map((user) => user.id)
    const startDate = new Date(String(form.get('startDate') || new Date().toISOString()))
    const endDate = new Date(String(form.get('endDate') || new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()))
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setToast('Please set a valid availability window. End date/time must be after start date/time.')
      return
    }
    const next: Assessment = {
      id: `test-${Date.now()}`,
      name: String(form.get('name') || 'Untitled Assessment').slice(0, 120),
      description: String(form.get('description') || '').slice(0, 500),
      questionCount,
      difficulty,
      questionBankId: questionBankId || undefined,
      departments,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      allowReattempt: form.get('allowReattempt') === 'on',
      showResults: true,
      passMark: Number(form.get('passMark') || 50),
      status: 'Live',
      assignedUserIds,
    }
    setTests((existing) => [next, ...existing])
    recordAudit('Test launched', `${next.name} assigned to ${assignedUserIds.length} employee(s) from ${questionBankId ? documentNameFromBatch(questionBankId, questionBankMetadata) : 'all question banks'}.`)
    recordAnalytics('test_created', {
      testId: next.id,
      testName: next.name,
      questionBankId: next.questionBankId,
      difficulty: next.difficulty,
      value: assignedUserIds.length,
      outcome: 'live',
      metadata: { question_count: next.questionCount, assigned_users: assignedUserIds.length, departments: departments.join(', ') },
    })
    setToast(`${next.name} is live for ${assignedUserIds.length} employee(s) from ${questionBankId ? documentNameFromBatch(questionBankId, questionBankMetadata) : 'all question banks'}.`)
  }

  /**
   * Permanently removes a launched test and any attempts linked to it.
   */
  function deleteAssessment(testId: string) {
    const test = tests.find((item) => item.id === testId)
    if (!test) return
    const confirmed = window.confirm(`Remove "${test.name}" and its linked attempts from this device?`)
    if (!confirmed) return
    setTests((existing) => existing.filter((item) => item.id !== testId))
    setSessions((existing) => existing.filter((session) => session.testId !== testId))
    recordAudit('Test removed', `${test.name} and linked local attempts were removed.`)
    recordAnalytics('test_deleted', {
      testId,
      testName: test.name,
      questionBankId: test.questionBankId,
      outcome: 'removed',
      metadata: { removed_sessions: sessions.filter((session) => session.testId === testId).length },
    })
    setToast(`${test.name} has been removed.`)
  }

  /**
   * Resets one user's password and keeps the current credential view in sync.
   */
  function resetUserPassword(userId: string) {
    const user = users.find((item) => item.id === userId)
    setUsers((existing) => existing.map((user) => (user.id === userId ? { ...user, password: generatePassword() } : user)))
    recordAudit('Password reset', `${user?.fullName ?? 'A user'} received a new generated password.`)
    recordAnalytics('password_reset', { userId, outcome: 'reset' })
    setToast('Password reset. Click the hidden password button to copy the updated credential.')
  }

  /**
   * Updates one permission flag for one user.
   */
  function setUserPermission(userId: string, permission: PermissionKey, enabled: boolean) {
    const user = users.find((item) => item.id === userId)
    if (!user) return
    if (user.role === 'super_admin' || user.role === 'admin') {
      setPermissions((existing) => ({ ...existing, [user.id]: defaultPermissionsFor(user) }))
      setToast('Admin access is locked on. Admin always has every permission.')
      return
    }
    setPermissions((existing) => ({
      ...existing,
      [userId]: {
        ...(existing[userId] ?? defaultPermissionsFor(user)),
        [permission]: enabled,
      },
    }))
    recordAudit('Permission changed', `${permission} was turned ${enabled ? 'on' : 'off'} for ${user?.fullName ?? userId}.`)
    recordAnalytics('permission_changed', {
      userId,
      outcome: enabled ? 'enabled' : 'disabled',
      metadata: { permission },
    })
  }

  /**
   * Applies one permission value to multiple selected users.
   */
  function bulkSetPermission(userIds: string[], permission: PermissionKey, enabled: boolean) {
    const editableUserIds = userIds.filter((userId) => {
      const user = users.find((candidate) => candidate.id === userId)
      return user && user.role !== 'super_admin' && user.role !== 'admin'
    })
    setPermissions((existing) => {
      const next = { ...existing }
      userIds.forEach((userId) => {
        const user = users.find((candidate) => candidate.id === userId)
        if (!user) return
        if (user.role === 'super_admin' || user.role === 'admin') {
          next[userId] = defaultPermissionsFor(user)
          return
        }
        next[userId] = { ...(next[userId] ?? defaultPermissionsFor(user)), [permission]: enabled }
      })
      return next
    })
    recordAudit('Bulk permission changed', `${permission} was turned ${enabled ? 'on' : 'off'} for ${editableUserIds.length} non-admin user(s).`)
    recordAnalytics('bulk_permission_changed', {
      value: editableUserIds.length,
      outcome: enabled ? 'enabled' : 'disabled',
      metadata: { permission, affected_users: editableUserIds.length },
    })
    setToast(`${enabled ? 'Enabled' : 'Disabled'} ${permissionCatalog.find((item) => item.key === permission)?.label ?? permission} for ${editableUserIds.length} non-admin user(s). Admin access stayed locked on.`)
  }

  /**
   * Stores an uploaded organisation logo so every shared app surface uses it.
   */
  function updatePlatformLogo(file?: File) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToast('Please upload an image file for the platform logo.')
      return
    }
    if (file.size > 1_500_000) {
      setToast('Please upload a logo smaller than 1.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setBranding({ logoUrl: String(reader.result) })
      recordAudit('Logo updated', `${file.name} was uploaded as the platform logo.`)
      recordAnalytics('logo_updated', { outcome: 'uploaded', metadata: { filename: file.name, bytes: file.size } })
      setToast('Platform logo updated. It now appears across the LMS.')
    }
    reader.onerror = () => setToast('Logo upload failed. Please try another image file.')
    reader.readAsDataURL(file)
  }

  /**
   * Restores the bundled iicocece logo as the active platform brand.
   */
  function resetPlatformLogo() {
    setBranding(defaultBranding)
    recordAudit('Logo restored', 'The default iicocece logo was restored.')
    recordAnalytics('logo_restored', { outcome: 'default_restored' })
    setToast('The default iicocece logo has been restored.')
  }

  /**
   * Switches between the glossy light and dark iicocece themes.
   */
  function toggleTheme() {
    setTheme((existing) => (existing === 'light' ? 'dark' : 'light'))
  }

  /**
   * Starts a test session and selects a randomized question set.
   */
  function startTest(testId: string) {
    if (!currentUser) return
    const test = tests.find((item) => item.id === testId)
    if (!test) return
    if (isAdmin && !hasPermission('take_admin_self_test')) {
      setToast('Your admin self-test permission is disabled.')
      return
    }
    if (!isAdmin && !hasPermission('take_tests')) {
      setToast('Your permission to take tests is disabled.')
      return
    }
    const now = Date.now()
    if (test.status !== 'Live' || now < new Date(test.startDate).getTime() || now > new Date(test.endDate).getTime()) {
      setToast('This test is not currently available. Check the start and end date/time.')
      return
    }
    if (test.id === 'test-onboarding' && !questions.some((question) => question.importBatchId === sourceWorkbookVersion)) {
      setToast('The question bank is still loading. Please wait a few seconds and start again.')
      return
    }
    const existingSession = sessions.find((session) => session.testId === testId && session.userId === currentUser.id && session.status === 'in_progress')
    if (existingSession) {
      if (!existingSession.currentQuestionDeadlineAt) {
        setSessions((existing) =>
          existing.map((session) =>
            session.id === existingSession.id
              ? {
                  ...session,
                  currentQuestionStartedAt: new Date().toISOString(),
                  currentQuestionDeadlineAt: new Date(Date.now() + 60_000).toISOString(),
                  lastSavedAt: new Date().toISOString(),
                }
              : session,
          ),
        )
      }
      setActiveTestId(testId)
      setActiveSessionId(existingSession.id)
      recordAnalytics('test_resumed', {
        testId,
        userId: currentUser.id,
        outcome: 'manual_resume',
        metadata: { session_id: existingSession.id, answered_questions: existingSession.responses.length },
      })
      setToast('Resuming your in-progress test. The timer continued from the saved question deadline.')
      setView('taking-test')
      return
    }
    const availableQuestions = questions.filter((question) => {
      const matchesDifficulty = test.difficulty === 'Mixed' || question.difficulty === test.difficulty
      const selectedQuestionBankId = test.questionBankId ?? (test.id === 'test-onboarding' ? sourceWorkbookVersion : undefined)
      const matchesSourceBank = selectedQuestionBankId ? question.importBatchId === selectedQuestionBankId : true
      return matchesDifficulty && matchesSourceBank
    })
    if (availableQuestions.length < test.questionCount) {
      setToast(`Not enough matching questions are available yet. ${availableQuestions.length} available, ${test.questionCount} required.`)
      return
    }
    const exposureAverageBeforeDraw = exposureAverage(availableQuestions, questionExposureCounts)
    const selectedQuestions = exposureAwareQuestionDraw(availableQuestions, test.questionCount, questionExposureCounts)
    const selectedQuestionIds = selectedQuestions.map((question) => question.questionId)
    const optionOrderByQuestion = Object.fromEntries(selectedQuestions.map((question) => [question.questionId, shuffle(optionKeys)]))
    const selectedExposureTiers = selectedQuestions.map((question) => exposurePriority(questionExposureCounts[question.questionId] ?? 0, exposureAverageBeforeDraw).boostPercent)
    const selectedNeverFeatured = selectedQuestions.filter((question) => (questionExposureCounts[question.questionId] ?? 0) === 0).length
    setQuestionExposureCounts((existing) => {
      const next = { ...existing }
      selectedQuestionIds.forEach((questionId) => {
        next[questionId] = (next[questionId] ?? 0) + 1
      })
      return next
    })
    localStorage.setItem(`deap-session-questions-${testId}-${currentUser.id}`, JSON.stringify(selectedQuestionIds))
    const questionStartedAt = new Date().toISOString()
    const questionDeadlineAt = new Date(Date.now() + 60_000).toISOString()
    const session: TestSession = {
      id: `session-${Date.now()}`,
      testId,
      userId: currentUser.id,
      startedAt: new Date().toISOString(),
      questionIds: selectedQuestionIds,
      optionOrderByQuestion,
      currentQuestionStartedAt: questionStartedAt,
      currentQuestionDeadlineAt: questionDeadlineAt,
      lastSavedAt: new Date().toISOString(),
      status: 'in_progress',
      responses: [],
      score: '0.00',
      maxScore: test.questionCount.toFixed(2),
      percentage: '0.00',
      passed: false,
    }
    setSessions((existing) => [session, ...existing])
    recordAudit('Test started', `${currentUser.fullName} started ${test.name}.`, currentUser.fullName)
    recordAnalytics('test_started', {
      testId,
      userId: currentUser.id,
      questionBankId: test.questionBankId,
      difficulty: test.difficulty,
      value: selectedQuestionIds.length,
      outcome: 'randomized_started',
      metadata: {
        session_id: session.id,
        question_count: selectedQuestionIds.length,
        available_pool: availableQuestions.length,
        exposure_average_before_draw: round(exposureAverageBeforeDraw, 2),
        never_featured_questions_selected: selectedNeverFeatured,
        boost_75_count: selectedExposureTiers.filter((boost) => boost === 75).length,
        boost_50_count: selectedExposureTiers.filter((boost) => boost === 50).length,
        boost_25_count: selectedExposureTiers.filter((boost) => boost === 25).length,
        randomization_signature: selectedQuestionIds.slice(0, 5).join('|'),
      },
    })
    setActiveTestId(testId)
    setActiveSessionId(session.id)
    setView('taking-test')
  }

  /**
   * Captures pre-test agreement and instruction behaviour.
   */
  function recordPreTestEvent(type: 'test_instructions_opened' | 'test_agreement_checked', testId: string) {
    const test = tests.find((item) => item.id === testId)
    recordAnalytics(type, {
      testId,
      questionBankId: test?.questionBankId,
      difficulty: test?.difficulty,
      outcome: type === 'test_instructions_opened' ? 'opened' : 'accepted',
      metadata: { question_count: test?.questionCount ?? 0 },
    })
  }

  /**
   * Captures real-time hint and reveal-answer decisions before the answer is submitted.
   */
  function recordQuestionSupportEvent(type: 'hint_opened' | 'answer_revealed', session: TestSession, question: Question) {
    recordAnalytics(type, {
      testId: session.testId,
      userId: session.userId,
      questionId: question.questionId,
      questionBankId: question.importBatchId,
      difficulty: question.difficulty,
      topicTag: question.topicTag,
      outcome: type === 'hint_opened' ? 'half_score_penalty' : 'zero_score_penalty',
      metadata: { session_id: session.id, question_number: session.responses.length + 1 },
    })
  }

  /**
   * Completes a session after adding the newest question response.
   */
  function recordAnswer(sessionId: string, response: ResponseRecord) {
    const currentSession = sessions.find((session) => session.id === sessionId)
    const test = currentSession ? tests.find((item) => item.id === currentSession.testId) : undefined
    const question = questions.find((item) => item.questionId === response.questionId)
    if (currentSession) {
      const nextResponseCount = currentSession.responses.length + 1
      const complete = nextResponseCount >= (test?.questionCount ?? 0)
      const nextScore = currentSession.responses
        .concat(response)
        .reduce((total, item) => total.plus(item.marksEarned), new Decimal(0))
      const nextPercentage = nextScore.div(test?.questionCount ?? nextResponseCount).mul(100)
      recordAnalytics('answer_submitted', {
        testId: currentSession.testId,
        userId: currentSession.userId,
        questionId: response.questionId,
        questionBankId: question?.importBatchId,
        difficulty: question?.difficulty,
        topicTag: question?.topicTag,
        value: Number(response.marksEarned),
        durationSeconds: response.responseTime,
        outcome: responseOutcome(question, response),
        metadata: {
          session_id: currentSession.id,
          selected_option: response.selectedOption ?? 'none',
          seconds_remaining: response.secondsRemaining,
          answer_weight: response.answerWeight,
          time_multiplier: response.timeMultiplier,
          hint_used: Boolean(response.hintUsed),
          answer_revealed: Boolean(response.answerRevealed),
        },
      })
      if (complete) {
        recordAnalytics('test_completed', {
          testId: currentSession.testId,
          userId: currentSession.userId,
          questionBankId: test?.questionBankId,
          value: Number(nextPercentage.toFixed(2)),
          durationSeconds: Math.round((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000),
          outcome: nextPercentage.greaterThanOrEqualTo(test?.passMark ?? 50) ? 'passed' : 'failed',
          metadata: {
            session_id: currentSession.id,
            score: nextScore.toFixed(2),
            percentage: nextPercentage.toFixed(2),
            responses: nextResponseCount,
          },
        })
      }
    }
    setSessions((existing) =>
      existing.map((session) => {
        if (session.id !== sessionId) return session
        const test = tests.find((item) => item.id === session.testId)
        const responses = [...session.responses, response]
        const score = responses.reduce((total, item) => total.plus(item.marksEarned), new Decimal(0))
        const percentage = score.div(test?.questionCount ?? responses.length).mul(100)
        const complete = responses.length >= (test?.questionCount ?? 0)
        const nextQuestionStartedAt = new Date().toISOString()
        const nextQuestionDeadlineAt = new Date(Date.now() + 60_000).toISOString()
        return {
          ...session,
          responses,
          score: score.toFixed(2),
          percentage: percentage.toFixed(2),
          status: complete ? 'completed' : 'in_progress',
          completedAt: complete ? new Date().toISOString() : undefined,
          currentQuestionStartedAt: complete ? undefined : nextQuestionStartedAt,
          currentQuestionDeadlineAt: complete ? undefined : nextQuestionDeadlineAt,
          lastSavedAt: new Date().toISOString(),
          passed: percentage.greaterThanOrEqualTo(test?.passMark ?? 50),
        }
      }),
    )
  }

  /**
   * Saves a heartbeat for an in-progress session so reconnects resume cleanly.
   */
  function autosaveSession(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId)
    if (session?.status === 'in_progress') {
      recordAnalytics('autosave_heartbeat', {
        testId: session.testId,
        userId: session.userId,
        outcome: 'saved',
        metadata: { session_id: session.id, answered_questions: session.responses.length },
      })
    }
    setSessions((existing) =>
      existing.map((session) =>
        session.id === sessionId && session.status === 'in_progress' ? { ...session, lastSavedAt: new Date().toISOString() } : session,
      ),
    )
  }

  /**
   * Exports session analytics as a CSV file for administrators.
   */
  async function exportCsv() {
    const spreadsheet = await loadSpreadsheetTools()
    recordAnalytics('export_results', {
      value: sessions.length,
      outcome: 'xlsx_generated',
      metadata: { sessions: sessions.length, analytics_events: analyticsEvents.length },
    })
    const rows = sessions.map((session) => {
      const test = tests.find((item) => item.id === session.testId)
      const user = users.find((item) => item.id === session.userId)
      return {
        test_name: test?.name,
        employee: user?.fullName,
        department: user?.department,
        score: session.score,
        max_score: session.maxScore,
        percentage: session.percentage,
        status: session.status,
        correct_answers: session.responses.filter((response) => {
          const question = questions.find((item) => item.questionId === response.questionId)
          return question?.correctAnswer === response.selectedOption
        }).length,
        wrong_answers: session.responses.filter((response) => response.selectedOption && Number(response.answerWeight) === 0).length,
        unanswered: session.responses.filter((response) => !response.selectedOption).length,
        hints_used: session.responses.filter((response) => response.hintUsed).length,
        answers_revealed: session.responses.filter((response) => response.answerRevealed).length,
        average_response_time_seconds: session.responses.length
          ? (session.responses.reduce((total, response) => total + response.responseTime, 0) / session.responses.length).toFixed(1)
          : '0.0',
        completed_at: session.completedAt,
      }
    })
    const analyticsRows = analyticsEvents.map((event) => ({
      time: event.createdAt,
      event_type: analyticsEventLabel(event.type),
      user: event.userName,
      department: event.department,
      role: event.role,
      test: event.testName,
      question_id: event.questionId,
      question_bank: event.questionBankId ? documentNameFromBatch(event.questionBankId, questionBankMetadata) : '',
      difficulty: event.difficulty,
      topic: event.topicTag,
      value: event.value,
      duration_seconds: event.durationSeconds,
      outcome: event.outcome,
      metadata: event.metadata ? JSON.stringify(event.metadata) : '',
    }))
    const questionById = new Map(questions.map((question) => [question.questionId, question]))
    const responseEvents = sessions.flatMap((session) =>
      session.responses.map((response) => {
        const question = questionById.get(response.questionId)
        return { session, response, question }
      }),
    )
    const questionQualityRows = questions
      .map((question) => {
        const records = responseEvents.filter((item) => item.response.questionId === question.questionId)
        const correct = records.filter((item) => responseOutcome(item.question, item.response) === 'Correct').length
        const hints = records.filter((item) => item.response.hintUsed).length
        const reveals = records.filter((item) => item.response.answerRevealed).length
        return {
          question_id: question.questionId,
          question_bank: documentNameFromBatch(question.importBatchId, questionBankMetadata),
          topic: question.topicTag,
          difficulty: question.difficulty,
          attempts: records.length,
          correct_rate_percent: round(percent(correct, records.length), 1),
          average_response_seconds: round(average(records.map((item) => item.response.responseTime)), 1),
          hints_used: hints,
          answers_revealed: reveals,
          review_flag: records.length >= 3 && percent(correct, records.length) < 35 ? 'Review: low correctness' : records.length >= 3 && percent(reveals, records.length) > 30 ? 'Review: high answer reveals' : '',
          question: shortQuestionText(question),
        }
      })
      .filter((row) => row.attempts > 0)
    const exposureRows = questions.map((question) => {
      const bankQuestions = questions.filter((candidate) => candidate.importBatchId === question.importBatchId)
      const averageForBank = exposureAverage(bankQuestions, questionExposureCounts)
      const exposureCount = questionExposureCounts[question.questionId] ?? 0
      return {
        question_id: question.questionId,
        question_bank: documentNameFromBatch(question.importBatchId, questionBankMetadata),
        topic: question.topicTag,
        difficulty: question.difficulty,
        exposure_count: exposureCount,
        next_draw_priority: exposurePriority(exposureCount, averageForBank).label,
        question: shortQuestionText(question),
      }
    })
    const userRiskRows = users
      .filter((user) => user.role === 'employee')
      .map((user) => {
        const userSessions = sessions.filter((session) => session.userId === user.id)
        const completed = userSessions.filter((session) => session.status === 'completed')
        const responses = userSessions.flatMap((session) => session.responses)
        const avgScore = round(average(completed.map((session) => Number(session.percentage))), 1)
        const supportRate = round(percent(responses.filter((response) => response.hintUsed || response.answerRevealed).length, responses.length), 1)
        const completionRate = round(percent(completed.length, userSessions.length), 1)
        const riskScore = Math.min(100, Math.round((100 - avgScore) * 0.45 + (100 - completionRate) * 0.35 + supportRate * 0.2))
        return {
          employee: user.fullName,
          department: user.department,
          attempts: userSessions.length,
          completed: completed.length,
          completion_rate_percent: completionRate,
          average_score_percent: avgScore,
          average_response_seconds: round(average(responses.map((response) => response.responseTime)), 1),
          support_rate_percent: supportRate,
          risk_score: riskScore,
          recommendation: riskScore >= 70 ? 'Urgent coaching and supervised retest' : riskScore >= 45 ? 'Targeted topic support' : 'Maintain current path',
        }
      })
    const worksheet = spreadsheet.utils.json_to_sheet(rows)
    const workbook = spreadsheet.utils.book_new()
    spreadsheet.utils.book_append_sheet(workbook, worksheet, 'DEAP Results')
    spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.json_to_sheet(analyticsRows), 'Analytics Events')
    spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.json_to_sheet(questionQualityRows), 'Question Quality')
    spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.json_to_sheet(exposureRows), 'Question Exposure')
    spreadsheet.utils.book_append_sheet(workbook, spreadsheet.utils.json_to_sheet(userRiskRows), 'User Risk')
    spreadsheet.writeFile(workbook, `DEAP_Results_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (!currentUser || view === 'login') {
    return <LoginScreen onLogin={handleLogin} toast={toast} branding={branding} theme={theme} onToggleTheme={toggleTheme} />
  }

  return (
    <div className="app-shell">
      {toast && (
        <button className="toast" type="button" onClick={() => setToast('')}>
          {toast}
        </button>
      )}
      <aside className={`sidebar ${isAdmin ? '' : 'employee-sidebar'}`} aria-label={isAdmin ? 'Administrator navigation' : 'User navigation'}>
        <BrandHeader branding={branding} subtitle="iicocece-assessment" />
        <nav>
          {visibleNavigation.map(([itemView, Icon, label]) => (
            <button key={itemView} className={view === itemView ? 'active' : ''} type="button" onClick={() => navigateTo(itemView)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <UserFooter currentUser={currentUser} theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
      </aside>

      <main className={usesManagementWorkspace ? 'workspace' : 'employee-workspace'}>
        {view === 'dashboard' && <Dashboard tests={tests} questions={questions} sessions={sessions} users={users} />}
        {view === 'questions' && (
          <QuestionBank
            questions={questions}
            questionBankMetadata={questionBankMetadata}
            query={query}
            setQuery={setQuery}
            onImport={handleImport}
            onUpdateMetadata={updateQuestionBankMetadata}
            onDeleteQuestionBank={deleteQuestionBank}
          />
        )}
        {view === 'tests' && <TestsPanel tests={tests} questions={questions} questionBankMetadata={questionBankMetadata} onCreate={createAssessment} onDelete={deleteAssessment} onTake={startTest} />}
        {view === 'employees' && <EmployeesPanel users={users} sessions={sessions} onResetPassword={resetUserPassword} onToast={setToast} />}
        {view === 'analytics' && (
          <Analytics
            sessions={sessions}
            users={users}
            questions={questions}
            tests={tests}
            analyticsEvents={analyticsEvents}
            questionBankMetadata={questionBankMetadata}
            questionExposureCounts={questionExposureCounts}
          />
        )}
        {view === 'reports' && <Reports onExport={exportCsv} sessions={sessions} tests={tests} users={users} questions={questions} auditEvents={auditEvents} />}
        {view === 'settings' && (
          <SettingsPanel
            users={users}
            permissions={permissions}
            onResetPassword={resetUserPassword}
            onSetPermission={setUserPermission}
            onBulkSetPermission={bulkSetPermission}
            branding={branding}
            onLogoUpload={updatePlatformLogo}
            onLogoReset={resetPlatformLogo}
            onToast={setToast}
          />
        )}
        {view === 'my-tests' && (
          <MyTests
            currentUser={currentUser}
            tests={tests}
            sessions={sessions}
            onStart={startTest}
            onInstructionOpen={(testId) => recordPreTestEvent('test_instructions_opened', testId)}
            onAgreementAccept={(testId) => recordPreTestEvent('test_agreement_checked', testId)}
          />
        )}
        {view === 'my-results' && <MyResults currentUser={currentUser} sessions={sessions} tests={tests} />}
        {view === 'taking-test' && activeSession && (
          <TestDelivery
            key={activeSession.id}
            session={activeSession}
            test={tests.find((test) => test.id === activeTestId)}
            questions={questions}
            currentUser={currentUser}
            onAnswer={recordAnswer}
            onAutosave={autosaveSession}
            onSupportEvent={recordQuestionSupportEvent}
            onComplete={() => setView('result')}
          />
        )}
        {view === 'result' && activeSessionId && (
          <ResultView
            session={sessions.find((session) => session.id === activeSessionId)}
            questions={questions}
            test={tests.find((test) => test.id === activeTestId)}
            onReturn={() => setView('my-tests')}
          />
        )}
      </main>
    </div>
  )
}

function LoginScreen({
  onLogin,
  toast,
  branding,
  theme,
  onToggleTheme,
}: {
  onLogin: (email: string, password: string) => void
  toast: string
  branding: Branding
  theme: ThemeMode
  onToggleTheme: () => void
}) {
  const [username, setUsername] = useState('Ayodeji')
  const [password, setPassword] = useState('GODhelpUS')
  return (
    <main className="login-page">
      <button className="theme-switch floating-theme-switch" type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
      <section className="login-card" aria-labelledby="login-title">
        <BrandHeader branding={branding} subtitle="Dynamic Employee Assessment Platform" className="login-brand" />
        <h1 id="login-title">Sign in to iicocece-assessment</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onLogin(username, password)
          }}
        >
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} type="text" autoComplete="username" />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          <button className="primary-button" type="submit">
            <ShieldCheck size={18} /> Log In
          </button>
        </form>
        <p className="hint">Use your assigned display name, User ID, full name, or email as username.</p>
        {toast && <p className="inline-error">{toast}</p>}
      </section>
    </main>
  )
}

function BrandHeader({ branding, subtitle, className = '' }: { branding: Branding; subtitle: string; className?: string }) {
  return (
    <div className={`brand ${className}`.trim()}>
      <span className="brand-logo-frame">
        <img src={branding.logoUrl} alt="iicocece logo" />
      </span>
      <div>
        <strong>DEAP</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  )
}

function UserFooter({
  currentUser,
  theme,
  onToggleTheme,
  onLogout,
}: {
  currentUser: User
  theme: ThemeMode
  onToggleTheme: () => void
  onLogout: () => void
}) {
  return (
    <footer className="user-footer">
      <UserRound size={20} />
      <div>
        <strong>{currentUser.fullName}</strong>
        <small>{currentUser.role.replace('_', ' ')}</small>
      </div>
      <button className="icon-button" type="button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`} onClick={onToggleTheme}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <button className="icon-button" type="button" aria-label="Sign out" onClick={onLogout}>
        <LogOut size={18} />
      </button>
    </footer>
  )
}

function Dashboard({ tests, questions, sessions, users }: { tests: Assessment[]; questions: Question[]; sessions: TestSession[]; users: User[] }) {
  const dashboardStats = useMemo(() => {
    const completed = sessions.filter((session) => session.status === 'completed')
    const userById = new Map(users.map((user) => [user.id, user.fullName]))
    return {
      liveTests: tests.filter((test) => test.status === 'Live').length,
      employeeCount: users.filter((user) => user.role === 'employee').length,
      passRate: completed.length ? Math.round((completed.filter((session) => session.passed).length / completed.length) * 100) : 0,
      difficultyData: difficulties.map((difficulty) => ({ difficulty, count: questions.filter((question) => question.difficulty === difficulty).length })),
      recentRows: sessions.slice(0, 6).map((session) => [
        userById.get(session.userId) ?? 'Unknown',
        session.status,
        `${session.score} / ${session.maxScore}`,
        session.completedAt ? new Date(session.completedAt).toLocaleDateString() : 'In progress',
      ]),
    }
  }, [questions, sessions, tests, users])
  return (
    <section>
      <PageTitle eyebrow="Administrator dashboard" title="Workforce capability overview" />
      <div className="metric-grid">
        <Metric label="Live tests" value={dashboardStats.liveTests} icon={<ListChecks />} />
        <Metric label="Question bank" value={questions.length} icon={<FileSpreadsheet />} />
        <Metric label="Employees" value={dashboardStats.employeeCount} icon={<UsersRound />} />
        <Metric label="Pass rate" value={`${dashboardStats.passRate}%`} icon={<CheckCircle2 />} />
      </div>
      <LearningCatalog questions={questions} />
      <div className="split-layout">
        <section className="panel">
          <h2>Difficulty stock</h2>
          <ResponsiveContainer height={260}>
            <BarChart data={dashboardStats.difficultyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2E75B6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Recent attempts</h2>
          <DataTable
            columns={['Employee', 'Status', 'Score', 'Completed']}
            rows={dashboardStats.recentRows}
          />
        </section>
      </div>
    </section>
  )
}

function QuestionBank({
  questions,
  questionBankMetadata,
  query,
  setQuery,
  onImport,
  onUpdateMetadata,
  onDeleteQuestionBank,
}: {
  questions: Question[]
  questionBankMetadata: QuestionBankMetadataMap
  query: string
  setQuery: (value: string) => void
  onImport: (file?: File) => void
  onUpdateMetadata: (batchId: string, metadata: QuestionBankMetadata) => void
  onDeleteQuestionBank: (batchId: string) => void
}) {
  const [editingBatchId, setEditingBatchId] = useState<string>()
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const difficultyCounts = useMemo(
    () => Object.fromEntries(difficulties.map((difficulty) => [difficulty, questions.filter((question) => question.difficulty === difficulty).length])) as Record<Difficulty, number>,
    [questions],
  )
  const documentSummaries = useMemo(() => {
    const normalizedQuery = query.toLowerCase()
    return Array.from(
      questions.reduce((map, question) => {
        const existing = map.get(question.importBatchId) ?? []
        existing.push(question)
        map.set(question.importBatchId, existing)
        return map
      }, new Map<string, Question[]>()),
    )
      .map(([batchId, documentQuestions]) => {
        const topicCounts = documentQuestions.reduce<Record<string, number>>((counts, question) => {
          counts[question.topicTag] = (counts[question.topicTag] ?? 0) + 1
          return counts
        }, {})
        const sortedTopics = Object.entries(topicCounts).sort((left, right) => right[1] - left[1])
        return {
          batchId,
          name: documentNameFromBatch(batchId, questionBankMetadata),
          description: documentDescriptionFromBatch(batchId, questionBankMetadata),
          total: documentQuestions.length,
          easy: documentQuestions.filter((question) => question.difficulty === 'Easy').length,
          medium: documentQuestions.filter((question) => question.difficulty === 'Medium').length,
          hard: documentQuestions.filter((question) => question.difficulty === 'Hard').length,
          definite: documentQuestions.filter((question) => !question.partialAnswer1 && !question.partialAnswer2).length,
          curve: documentQuestions.filter((question) => question.partialAnswer1 || question.partialAnswer2).length,
          topics: sortedTopics.slice(0, 6),
        }
      })
      .filter((summary) => `${summary.name} ${summary.description} ${summary.topics.map(([topic]) => topic).join(' ')}`.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => right.total - left.total)
  }, [questions, query, questionBankMetadata])

  function startEditing(summary: { batchId: string; name: string; description: string }) {
    setEditingBatchId(summary.batchId)
    setDraftName(summary.name)
    setDraftDescription(summary.description)
  }

  function saveEditing(batchId: string) {
    onUpdateMetadata(batchId, {
      name: draftName,
      description: draftDescription,
    })
    setEditingBatchId(undefined)
  }

  return (
    <section>
      <PageTitle eyebrow="Question bank" title="Uploaded document overview" />
      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input placeholder="Search uploaded documents or topics" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="upload-button">
          <Upload size={18} /> Import XLSX/CSV
          <input type="file" accept=".xlsx,.csv" onChange={(event) => onImport(event.target.files?.[0])} />
        </label>
      </div>
      <div className="metric-grid small">
        {difficulties.map((difficulty) => (
          <Metric key={difficulty} label={`${difficulty} questions`} value={difficultyCounts[difficulty]} icon={<Gauge />} />
        ))}
      </div>
      <div className="document-overview-list">
        {documentSummaries.map((summary) => {
          const isEditing = editingBatchId === summary.batchId
          return (
            <article className="document-card" key={summary.batchId}>
              <header>
                <FileSpreadsheet size={22} />
                <div>
                  <h2>{summary.name}</h2>
                  <p>{summary.total.toLocaleString()} imported question(s)</p>
                </div>
                <button className="secondary-button compact" type="button" onClick={() => startEditing(summary)}>
                  <Settings2 size={16} /> Edit name
                </button>
                <button className="danger-button compact" type="button" onClick={() => onDeleteQuestionBank(summary.batchId)}>
                  <Trash2 size={16} /> Delete
                </button>
              </header>
              {summary.description && <p>{summary.description}</p>}
              {isEditing && (
                <div className="question-bank-editor">
                  <label>
                    Question bank name
                    <input value={draftName} maxLength={180} onChange={(event) => setDraftName(event.target.value)} />
                  </label>
                  <label>
                    Description / internal note
                    <textarea value={draftDescription} maxLength={1600} onChange={(event) => setDraftDescription(event.target.value)} />
                  </label>
                  <div className="editor-actions">
                    <button className="primary-button" type="button" onClick={() => saveEditing(summary.batchId)}>
                      Save changes
                    </button>
                    <button className="secondary-button" type="button" onClick={() => setEditingBatchId(undefined)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="document-stats">
                <span><strong>{summary.easy}</strong> Easy</span>
                <span><strong>{summary.medium}</strong> Medium</span>
                <span><strong>{summary.hard}</strong> Hard</span>
                <span><strong>{summary.definite}</strong> Definite answer</span>
                <span><strong>{summary.curve}</strong> Curve / partial scoring</span>
              </div>
              <div className="topic-pills">
                {summary.topics.map(([topic, count]) => (
                  <span className="available" key={topic}>
                    {topic}: {count}
                  </span>
                ))}
              </div>
              <p className="hint">Question text, options, answers, and explanations are hidden from this overview.</p>
            </article>
          )
        })}
        {!documentSummaries.length && <EmptyState title="No matching documents" body="Import a question bank or clear the search field." />}
      </div>
    </section>
  )
}

function LearningCatalog({ questions }: { questions: Question[] }) {
  const loadedTopics = useMemo(() => Array.from(new Set(questions.map((question) => question.topicTag))).sort(), [questions])
  return (
    <section className="lms-band" aria-labelledby="lms-catalog-title">
      <div className="lms-heading">
        <span>Organisation LMS</span>
        <h2 id="lms-catalog-title">iicocece departmental learning map</h2>
        <p>Assessment questions are organised as workplace learning topics for departments, not university courses.</p>
      </div>
      <div className="department-grid">
        {departmentCatalog.map((department) => (
          <article className="department-card" key={department.name}>
            <h3>{department.name}</h3>
            <p>{department.description}</p>
            <div className="topic-pills">
              {department.topics.map((topic) => (
                <span className={loadedTopics.includes(topic) ? 'available' : ''} key={topic}>
                  {topic}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function toDateTimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function availabilityLabel(test: Assessment): string {
  return getAvailabilityState(test).label
}

function getAvailabilityState(test: Assessment): { label: string; detail: string; canStart: boolean } {
  const now = Date.now()
  const starts = new Date(test.startDate).getTime()
  const ends = new Date(test.endDate).getTime()
  if (test.status !== 'Live') return { label: test.status, detail: 'This assessment is not live yet.', canStart: false }
  if (now < starts) return { label: 'Scheduled', detail: `Opens ${new Date(test.startDate).toLocaleString()}`, canStart: false }
  if (now > ends) return { label: 'Closed', detail: `Closed ${new Date(test.endDate).toLocaleString()}`, canStart: false }
  return { label: 'Available now', detail: `Closes ${new Date(test.endDate).toLocaleString()}`, canStart: true }
}

function TestsPanel({
  tests,
  questions,
  questionBankMetadata,
  onCreate,
  onDelete,
  onTake,
}: {
  tests: Assessment[]
  questions: Question[]
  questionBankMetadata: QuestionBankMetadataMap
  onCreate: (form: FormData) => void
  onDelete: (testId: string) => void
  onTake: (testId: string) => void
}) {
  const defaultStart = toDateTimeLocal(new Date())
  const defaultEnd = toDateTimeLocal(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7))
  const questionBanks = useMemo(() => getQuestionBankSummaries(questions, questionBankMetadata), [questions, questionBankMetadata])
  const defaultQuestionBankId = questionBanks.find((bank) => bank.id === sourceWorkbookVersion)?.id ?? questionBanks[0]?.id ?? ''
  return (
    <section>
      <PageTitle eyebrow="LMS test builder" title="Assign topic assessments by department" />
      <LearningCatalog questions={questions} />
      <div className="split-layout">
        <form
          className="panel form-panel"
          onSubmit={(event) => {
            event.preventDefault()
            onCreate(new FormData(event.currentTarget))
          }}
        >
          <h2>Create test</h2>
          <label>
            Test name
            <input name="name" defaultValue="Department Knowledge Assessment" maxLength={120} required />
          </label>
          <label>
            Description
            <textarea name="description" defaultValue="Timed DEAP assessment generated from approved training material." maxLength={500} />
          </label>
          <label>
            Question bank
            <select name="questionBankId" defaultValue={defaultQuestionBankId} required>
              {questionBanks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} - {bank.total.toLocaleString()} questions
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Question count
              <select name="questionCount" defaultValue="20">
                <option>20</option>
                <option>40</option>
                <option>60</option>
              </select>
            </label>
            <label>
              Difficulty
              <select name="difficulty" defaultValue="Mixed">
                <option>Mixed</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
          </div>
          <label>
            Departments
            <input name="departments" defaultValue="Operations,Legal,UI/UX & Development,Human Resources,Digital Marketing,Business Development,Digital Content,Executive,Other" />
          </label>
          <div className="form-grid">
            <label>
              Available from
              <input name="startDate" type="datetime-local" defaultValue={defaultStart} />
            </label>
            <label>
              Available until
              <input name="endDate" type="datetime-local" defaultValue={defaultEnd} />
            </label>
          </div>
          <label>
            Pass mark (%)
            <input name="passMark" type="number" min="1" max="100" defaultValue="50" />
          </label>
          <label className="checkbox-row">
            <input name="allowReattempt" type="checkbox" /> Allow reattempt
          </label>
          <button className="primary-button" type="submit">
            <Play size={18} /> Launch Test
          </button>
        </form>
        <section className="panel">
          <h2>Launched tests</h2>
          <div className="admin-test-list">
            {tests.map((test) => {
              const status = availabilityLabel(test)
              const canTake = status === 'Available now'
              return (
                <article className="admin-test-card" key={test.id}>
                  <div>
                    <span className={`badge ${String(test.difficulty).toLowerCase()}`}>{test.difficulty}</span>
                    <h3>{test.name}</h3>
                    <p>{test.questionCount} questions · {test.assignedUserIds.length} assigned employee(s)</p>
                    <p className="hint">Question bank: {test.questionBankId ? documentNameFromBatch(test.questionBankId, questionBankMetadata) : 'All question banks'}</p>
                    <small>
                      <CalendarDays size={14} /> {new Date(test.startDate).toLocaleString()} to {new Date(test.endDate).toLocaleString()}
                    </small>
                  </div>
                  <div className="test-actions">
                    <span className={`status-pill ${canTake ? 'open' : ''}`}>{status}</span>
                    <button className="secondary-button" type="button" onClick={() => onTake(test.id)} disabled={!canTake}>
                      <Play size={16} /> Take test myself
                    </button>
                    <button className="danger-button" type="button" onClick={() => onDelete(test.id)}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="hint">Available question stock: {questions.length}. Tests are prevented from launching without enough matching questions.</p>
        </section>
      </div>
    </section>
  )
}

function EmployeesPanel({
  users,
  sessions,
  onResetPassword,
  onToast,
}: {
  users: User[]
  sessions: TestSession[]
  onResetPassword: (userId: string) => void
  onToast: (message: string) => void
}) {
  const [selectedUser, setSelectedUser] = useState<User>()
  const [showPassword, setShowPassword] = useState(false)
  const [userFilter, setUserFilter] = useState('')
  const filteredUsers = useMemo(() => {
    const normalized = userFilter.toLowerCase().trim()
    if (!normalized) return users
    return users.filter((user) => `${user.userId} ${user.fullName} ${user.displayName} ${user.department} ${user.jobRole}`.toLowerCase().includes(normalized))
  }, [userFilter, users])
  const supervisorName = (supervisorId?: string) => users.find((user) => user.userId === supervisorId)?.displayName ?? '—'
  async function copyCredential(user: User) {
    await copyToClipboard(credentialText(user))
    onToast('Username and password copied. You can paste it into WhatsApp now.')
  }
  return (
    <section>
      <PageTitle eyebrow="Manage users" title="iicocece user access and credentials" />
      <section className="panel">
        <div className="panel-heading-row">
          <div>
            <h2>Users</h2>
            <p>Click any user to view details. Passwords stay hidden until you reveal them inside the popup.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => copyToClipboard(allCredentialText(users)).then(() => onToast('All usernames and passwords copied.'))}>
            <Copy size={18} /> Copy all access details
          </button>
        </div>
        <label className="search-box user-management-search">
          <Search size={18} />
          <input placeholder="Search users, departments, roles, or User IDs" value={userFilter} onChange={(event) => setUserFilter(event.target.value)} />
        </label>
        <div className="user-management-grid">
          {filteredUsers.map((user) => {
            const userSessions = sessions.filter((session) => session.userId === user.id && session.status === 'completed')
            const average = userSessions.length ? userSessions.reduce((total, session) => total + Number(session.percentage), 0) / userSessions.length : 0
            return (
              <button
                className="managed-user-card"
                key={user.id}
                type="button"
                onClick={() => {
                  setSelectedUser(user)
                  setShowPassword(false)
                }}
              >
                <span>{user.userId}</span>
                <strong>{user.fullName}</strong>
                <small>{user.department} · {user.jobRole}</small>
                <em>{userSessions.length} attempt(s) · {average.toFixed(2)}% avg.</em>
              </button>
            )
          })}
        </div>
        {!filteredUsers.length && <EmptyState title="No users found" body="Clear the search field to show the full iicocece user directory." />}
      </section>
      {selectedUser && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedUser(undefined)}>
          <section className="credential-modal" role="dialog" aria-modal="true" aria-labelledby="manage-user-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="manage-user-title">{selectedUser.fullName}</h2>
            <div className="credential-box">
              <span>User ID</span>
              <strong>{selectedUser.userId}</strong>
              <span>Username</span>
              <strong>{selectedUser.fullName}</strong>
              <span>Department</span>
              <strong>{selectedUser.department}</strong>
              <span>Role</span>
              <strong>{selectedUser.jobRole}</strong>
              <span>Supervisor</span>
              <strong>{supervisorName(selectedUser.supervisorId)}</strong>
              <span>Password</span>
              {showPassword ? <strong>{selectedUser.password}</strong> : <button className="secret-button" type="button" onClick={() => setShowPassword(true)}>Click to view password</button>}
            </div>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => copyCredential(selectedUser)} disabled={!showPassword}>
                <Copy size={18} /> Copy username and password
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  onResetPassword(selectedUser.id)
                  setSelectedUser(undefined)
                }}
              >
                Reset password
              </button>
              <button className="secondary-button" type="button" onClick={() => setSelectedUser(undefined)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function Analytics({
  sessions,
  users,
  questions,
  tests,
  analyticsEvents,
  questionBankMetadata,
  questionExposureCounts,
}: {
  sessions: TestSession[]
  users: User[]
  questions: Question[]
  tests: Assessment[]
  analyticsEvents: AnalyticsEvent[]
  questionBankMetadata: QuestionBankMetadataMap
  questionExposureCounts: QuestionExposureCounts
}) {
  const [range, setRange] = useState('all')
  const [department, setDepartment] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState('all')
  const [selectedTestId, setSelectedTestId] = useState('all')
  const [selectedQuestionBankId, setSelectedQuestionBankId] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedRole, setSelectedRole] = useState('all')
  const [chatThreads, setChatThreads] = useState<AiChatThread[]>(() => {
    const stored = readStored<AiChatThread[]>('deap-ai-chat-threads', [])
    return stored.length ? stored : [createAiThread()]
  })
  const [selectedChatId, setSelectedChatId] = useState(() => localStorage.getItem('deap-ai-selected-chat-id') ?? '')
  const [aiDraft, setAiDraft] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const departments = useMemo(() => Array.from(new Set(users.map((user) => user.department))).sort(), [users])
  const availableTopics = useMemo(() => Array.from(new Set(questions.map((question) => question.topicTag))).sort(), [questions])
  const questionBanks = useMemo(() => getQuestionBankSummaries(questions, questionBankMetadata), [questionBankMetadata, questions])

  const analytics = useMemo(() => {
    const userById = new Map(users.map((user) => [user.id, user]))
    const testById = new Map(tests.map((test) => [test.id, test]))
    const questionById = new Map(questions.map((question) => [question.questionId, question]))
    const userMatches = (user?: User) => {
      if (!user) return false
      if (department !== 'all' && user.department !== department) return false
      if (selectedUserId !== 'all' && user.id !== selectedUserId) return false
      if (selectedRole !== 'all' && user.role !== selectedRole) return false
      return true
    }
    const testMatches = (test?: Assessment) => {
      if (!test) return false
      if (selectedTestId !== 'all' && test.id !== selectedTestId) return false
      if (selectedQuestionBankId !== 'all' && test.questionBankId !== selectedQuestionBankId) return false
      if (selectedDifficulty !== 'all' && test.difficulty !== selectedDifficulty && test.difficulty !== 'Mixed') return false
      return true
    }
    const questionMatches = (question?: Question) => {
      if (!question) return selectedQuestionBankId === 'all' && selectedDifficulty === 'all' && selectedTopic === 'all'
      if (selectedQuestionBankId !== 'all' && question.importBatchId !== selectedQuestionBankId) return false
      if (selectedDifficulty !== 'all' && question.difficulty !== selectedDifficulty) return false
      if (selectedTopic !== 'all' && question.topicTag !== selectedTopic) return false
      return true
    }
    const scopedTests = tests.filter((test) => testMatches(test))
    const scopedSessions = sessions.filter((session) => {
      const user = userById.get(session.userId)
      const test = testById.get(session.testId)
      if (!userMatches(user) || !testMatches(test)) return false
      if (!inDateWindow(session.completedAt ?? session.startedAt, range)) return false
      if (selectedTopic !== 'all') return session.responses.some((response) => questionMatches(questionById.get(response.questionId)))
      return true
    })
    const scopedEvents = analyticsEvents.filter((event) => {
      const user = event.userId ? userById.get(event.userId) : undefined
      if (event.userId && !userMatches(user)) return false
      if (department !== 'all' && event.department !== department) return false
      if (selectedUserId !== 'all' && event.userId !== selectedUserId) return false
      if (selectedRole !== 'all' && event.role !== selectedRole) return false
      if (selectedTestId !== 'all' && event.testId !== selectedTestId) return false
      if (selectedQuestionBankId !== 'all' && event.questionBankId !== selectedQuestionBankId) return false
      if (selectedDifficulty !== 'all' && event.difficulty !== selectedDifficulty) return false
      if (selectedTopic !== 'all' && event.topicTag !== selectedTopic) return false
      return inDateWindow(event.createdAt, range)
    })
    const scopedResponseRecords = scopedSessions.flatMap((session) =>
      session.responses
        .map((response) => ({ session, response, question: questionById.get(response.questionId), user: userById.get(session.userId), test: testById.get(session.testId) }))
        .filter((record) => questionMatches(record.question)),
    )
    const completed = scopedSessions.filter((session) => session.status === 'completed')
    const completedScores = completed.map((session) => Number(session.percentage))
    const assignedSeats = scopedTests.reduce((total, test) => total + test.assignedUserIds.filter((userId) => userMatches(userById.get(userId))).length, 0)
    const correct = scopedResponseRecords.filter((record) => responseOutcome(record.question, record.response) === 'Correct').length
    const partial = scopedResponseRecords.filter((record) => responseOutcome(record.question, record.response) === 'Partial').length
    const wrong = scopedResponseRecords.filter((record) => responseOutcome(record.question, record.response) === 'Wrong').length
    const unanswered = scopedResponseRecords.filter((record) => responseOutcome(record.question, record.response) === 'Unanswered').length
    const hints = scopedResponseRecords.filter((record) => record.response.hintUsed).length
    const reveals = scopedResponseRecords.filter((record) => record.response.answerRevealed).length
    const activeUsers = new Set(scopedEvents.filter((event) => event.userId && ['login_success', 'view_change', 'test_started', 'answer_submitted'].includes(event.type)).map((event) => event.userId))
    const loginSuccesses = scopedEvents.filter((event) => event.type === 'login_success')
    const failedLogins = scopedEvents.filter((event) => event.type === 'login_failed')
    const autosaves = scopedEvents.filter((event) => event.type === 'autosave_heartbeat')
    const resumedAttempts = scopedEvents.filter((event) => event.type === 'test_resumed')
    const instructionOpens = scopedEvents.filter((event) => event.type === 'test_instructions_opened')
    const agreements = scopedEvents.filter((event) => event.type === 'test_agreement_checked')
    const responseTimes = scopedResponseRecords.map((record) => record.response.responseTime)

    const userRiskData = users
      .filter((user) => user.role === 'employee' && userMatches(user))
      .map((user) => {
        const userSessions = scopedSessions.filter((session) => session.userId === user.id)
        const userCompleted = userSessions.filter((session) => session.status === 'completed')
        const userResponses = scopedResponseRecords.filter((record) => record.session.userId === user.id)
        const avgScore = average(userCompleted.map((session) => Number(session.percentage)))
        const completionRate = percent(userCompleted.length, Math.max(userSessions.length, tests.filter((test) => test.assignedUserIds.includes(user.id)).length))
        const supportRate = percent(userResponses.filter((record) => record.response.hintUsed || record.response.answerRevealed).length, userResponses.length)
        const wrongRate = percent(userResponses.filter((record) => ['Wrong', 'Unanswered'].includes(responseOutcome(record.question, record.response))).length, userResponses.length)
        const avgSpeed = average(userResponses.map((record) => record.response.responseTime))
        const lastLogin = scopedEvents.find((event) => event.type === 'login_success' && event.userId === user.id)?.createdAt
        const riskScore = Math.min(100, Math.round((100 - avgScore) * 0.36 + (100 - completionRate) * 0.28 + supportRate * 0.18 + wrongRate * 0.18))
        const recommendation =
          riskScore >= 70
            ? 'Urgent HR coaching and supervised retest'
            : riskScore >= 45
              ? 'Targeted support on weak topics'
              : !userSessions.length
                ? 'Prompt to start assigned assessment'
                : 'Maintain current training path'
        return {
          name: user.fullName,
          department: user.department,
          attempts: userSessions.length,
          completed: userCompleted.length,
          completionRate: round(completionRate, 1),
          avgScore: round(avgScore, 1),
          avgSpeed: round(avgSpeed, 1),
          supportRate: round(supportRate, 1),
          wrongRate: round(wrongRate, 1),
          riskScore,
          lastLogin: lastLogin ? new Date(lastLogin).toLocaleString() : 'No login recorded',
          recommendation,
        }
      })
      .sort((left, right) => right.riskScore - left.riskScore || left.name.localeCompare(right.name))

    const groupByDepartment = departments.map((dept) => {
      const departmentUsers = users.filter((user) => user.department === dept && userMatches(user))
      const ids = new Set(departmentUsers.map((user) => user.id))
      const departmentSessions = scopedSessions.filter((session) => ids.has(session.userId))
      const departmentCompleted = departmentSessions.filter((session) => session.status === 'completed')
      const departmentResponses = scopedResponseRecords.filter((record) => ids.has(record.session.userId))
      return {
        department: dept,
        users: departmentUsers.length,
        attempts: departmentSessions.length,
        completed: departmentCompleted.length,
        score: round(average(departmentCompleted.map((session) => Number(session.percentage))), 1),
        completion: round(percent(departmentCompleted.length, departmentSessions.length), 1),
        support: round(percent(departmentResponses.filter((record) => record.response.hintUsed || record.response.answerRevealed).length, departmentResponses.length), 1),
      }
    }).filter((row) => row.users || row.attempts)

    const topicsInScope = Array.from(new Set(scopedResponseRecords.map((record) => record.question?.topicTag).filter(Boolean) as string[]))
    const topicData = topicsInScope
      .map((topic) => {
        const records = scopedResponseRecords.filter((record) => record.question?.topicTag === topic)
        const score = percent(records.reduce((total, record) => total + Number(record.response.marksEarned), 0), records.length)
        return { topic, score: round(score, 1), responses: records.length }
      })
      .sort((left, right) => right.responses - left.responses)
      .slice(0, 12)

    const difficultyTimingData = difficulties.map((difficulty) => {
      const records = scopedResponseRecords.filter((record) => record.question?.difficulty === difficulty)
      return {
        difficulty,
        seconds: round(average(records.map((record) => record.response.responseTime)), 1),
        score: round(percent(records.reduce((total, record) => total + Number(record.response.marksEarned), 0), records.length), 1),
        responses: records.length,
      }
    })

    const trendDates = Array.from(new Set([...scopedEvents.map((event) => dateKey(event.createdAt)), ...completed.map((session) => dateKey(session.completedAt))])).sort()
    const trendData = trendDates.map((day) => ({
      day: day.slice(5),
      logins: scopedEvents.filter((event) => event.type === 'login_success' && dateKey(event.createdAt) === day).length,
      starts: scopedEvents.filter((event) => event.type === 'test_started' && dateKey(event.createdAt) === day).length,
      completions: completed.filter((session) => dateKey(session.completedAt) === day).length,
    }))

    const cohortData = users
      .filter((user) => user.role === 'employee' && userMatches(user))
      .map((user) => {
        const userCompleted = completed.filter((session) => session.userId === user.id)
        const userResponses = scopedResponseRecords.filter((record) => record.session.userId === user.id)
        return {
          name: user.displayName,
          score: round(average(userCompleted.map((session) => Number(session.percentage))), 1),
          speed: round(average(userResponses.map((record) => record.response.responseTime)), 1),
          support: round(percent(userResponses.filter((record) => record.response.hintUsed || record.response.answerRevealed).length, userResponses.length), 1),
        }
      })

    const questionQualityRows = Array.from(new Set(scopedResponseRecords.map((record) => record.response.questionId)))
      .map((questionId) => {
        const records = scopedResponseRecords.filter((record) => record.response.questionId === questionId)
        const question = questionById.get(questionId)
        const correctRate = percent(records.filter((record) => responseOutcome(record.question, record.response) === 'Correct').length, records.length)
        const supportRate = percent(records.filter((record) => record.response.hintUsed || record.response.answerRevealed).length, records.length)
        const avgTime = average(records.map((record) => record.response.responseTime))
        const flag = records.length < 2
          ? 'Needs more data'
          : correctRate < 35
            ? 'Review: too hard/confusing'
            : correctRate > 95
              ? 'Review: too easy'
              : supportRate > 35
                ? 'Review: high support use'
                : avgTime > 45
                  ? 'Review: slow response'
                  : 'Stable'
        return {
          questionId,
          question: shortQuestionText(question),
          topic: question?.topicTag ?? 'Unknown',
          difficulty: question?.difficulty ?? 'Mixed',
          attempts: records.length,
          correctRate: round(correctRate, 1),
          avgTime: round(avgTime, 1),
          hints: records.filter((record) => record.response.hintUsed).length,
          reveals: records.filter((record) => record.response.answerRevealed).length,
          flag,
        }
      })
      .sort((left, right) => {
        const priority = (flag: string) => (flag.startsWith('Review') ? 2 : flag === 'Needs more data' ? 1 : 0)
        return priority(right.flag) - priority(left.flag) || right.attempts - left.attempts
      })
      .slice(0, 10)

    const optionData = optionKeys.map((option) => ({
      option,
      count: scopedResponseRecords.filter((record) => record.response.selectedOption === option).length,
    }))

    const questionBankRows = questionBanks.map((bank) => {
      const bankQuestions = questions.filter((question) => question.importBatchId === bank.id)
      const bankResponses = scopedResponseRecords.filter((record) => record.question?.importBatchId === bank.id)
      const linkedTests = tests.filter((test) => test.questionBankId === bank.id)
      return {
        bank: bank.name,
        questions: bankQuestions.length,
        easy: bankQuestions.filter((question) => question.difficulty === 'Easy').length,
        medium: bankQuestions.filter((question) => question.difficulty === 'Medium').length,
        hard: bankQuestions.filter((question) => question.difficulty === 'Hard').length,
        liveTests: linkedTests.filter((test) => test.status === 'Live').length,
        responses: bankResponses.length,
        avgScore: round(percent(bankResponses.reduce((total, record) => total + Number(record.response.marksEarned), 0), bankResponses.length), 1),
      }
    })

    const scopedQuestionPool = questions.filter((question) => questionMatches(question))
    const exposureValues = scopedQuestionPool.map((question) => questionExposureCounts[question.questionId] ?? 0)
    const averageExposureCount = exposureAverage(scopedQuestionPool, questionExposureCounts)
    const exposurePriorityRows = scopedQuestionPool
      .map((question) => {
        const exposureCount = questionExposureCounts[question.questionId] ?? 0
        const priority = exposurePriority(exposureCount, averageExposureCount)
        return {
          question: shortQuestionText(question),
          bank: documentNameFromBatch(question.importBatchId, questionBankMetadata),
          topic: question.topicTag,
          difficulty: question.difficulty,
          shown: exposureCount,
          nextDrawPriority: priority.label,
          boostPercent: priority.boostPercent,
        }
      })
      .sort((left, right) => right.boostPercent - left.boostPercent || left.shown - right.shown || left.question.localeCompare(right.question))
      .slice(0, 15)

    const randomizationRows = questionBanks
      .map((bank) => {
        const bankQuestions = questions.filter((question) => question.importBatchId === bank.id && questionMatches(question))
        const bankAverageExposure = exposureAverage(bankQuestions, questionExposureCounts)
        const bankExposureValues = bankQuestions.map((question) => questionExposureCounts[question.questionId] ?? 0)
        const priorityCounts = bankQuestions.reduce(
          (counts, question) => {
            const boost = exposurePriority(questionExposureCounts[question.questionId] ?? 0, bankAverageExposure).boostPercent
            counts[boost] += 1
            return counts
          },
          { 0: 0, 25: 0, 50: 0, 75: 0 } as Record<0 | 25 | 50 | 75, number>,
        )
        return {
          bank: bank.name,
          pool: bankQuestions.length,
          neverShown: priorityCounts[75],
          boosted25: priorityCounts[25],
          boosted50: priorityCounts[50],
          standard: priorityCounts[0],
          shownAtLeastOnce: bankQuestions.length - priorityCounts[75],
          minShown: bankExposureValues.length ? Math.min(...bankExposureValues) : 0,
          maxShown: bankExposureValues.length ? Math.max(...bankExposureValues) : 0,
          avgShown: round(bankAverageExposure, 2),
          imbalance: bankExposureValues.length ? Math.max(...bankExposureValues) - Math.min(...bankExposureValues) : 0,
        }
      })
      .filter((row) => row.pool > 0)

    const connectivityRows = scopedSessions
      .filter((session) => session.status === 'in_progress' || autosaves.some((event) => event.metadata?.session_id === session.id) || resumedAttempts.some((event) => event.metadata?.session_id === session.id))
      .map((session) => {
        const user = userById.get(session.userId)
        const test = testById.get(session.testId)
        return {
          employee: user?.fullName ?? 'Unknown',
          test: test?.name ?? 'Assessment',
          status: session.status,
          answered: session.responses.length,
          autosaves: autosaves.filter((event) => event.metadata?.session_id === session.id).length,
          resumed: resumedAttempts.filter((event) => event.metadata?.session_id === session.id).length,
          lastSaved: session.lastSavedAt ? new Date(session.lastSavedAt).toLocaleString() : 'Not saved',
        }
      })
      .slice(0, 10)

    const operationRows = Array.from(scopedEvents.reduce((map, event) => {
      const label = analyticsEventLabel(event.type)
      map.set(label, (map.get(label) ?? 0) + 1)
      return map
    }, new Map<string, number>()))
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([event, count]) => ({ event, count }))

    return {
      usageMetrics: {
        activeUsers: activeUsers.size,
        loginSuccesses: loginSuccesses.length,
        failedLogins: failedLogins.length,
        assignedSeats,
        startedAttempts: scopedSessions.length,
        completedAttempts: completed.length,
        completionRate: round(percent(completed.length, scopedSessions.length), 1),
        startConversion: round(percent(scopedSessions.length, assignedSeats), 1),
        avgScore: round(average(completedScores), 1),
        medianScore: round(median(completedScores), 1),
        scoreStdDev: round(standardDeviation(completedScores), 1),
        p25: round(percentile(completedScores, 25), 1),
        p75: round(percentile(completedScores, 75), 1),
        p90: round(percentile(completedScores, 90), 1),
        totalResponses: scopedResponseRecords.length,
        correct,
        partial,
        wrong,
        unanswered,
        avgResponseTime: round(average(responseTimes), 1),
        medianResponseTime: round(median(responseTimes), 1),
        hints,
        reveals,
        supportRate: round(percent(hints + reveals, scopedResponseRecords.length), 1),
        autosaves: autosaves.length,
        resumed: resumedAttempts.length,
        instructionOpens: instructionOpens.length,
        agreements: agreements.length,
        riskFlags: userRiskData.filter((user) => user.riskScore >= 45).length,
        questionPool: scopedQuestionPool.length,
        neverFeaturedQuestions: exposureValues.filter((value) => value === 0).length,
        minQuestionExposure: exposureValues.length ? Math.min(...exposureValues) : 0,
        maxQuestionExposure: exposureValues.length ? Math.max(...exposureValues) : 0,
        exposureImbalance: exposureValues.length ? Math.max(...exposureValues) - Math.min(...exposureValues) : 0,
      },
      outcomeData: [
        { name: 'Correct', count: correct },
        { name: 'Partial', count: partial },
        { name: 'Wrong', count: wrong },
        { name: 'Unanswered', count: unanswered },
      ],
      supportUsageData: [
        { name: 'Hints', count: hints },
        { name: 'Reveals', count: reveals },
        { name: 'Autosaves', count: autosaves.length },
        { name: 'Resumes', count: resumedAttempts.length },
      ],
      trendData,
      difficultyTimingData,
      topicData,
      cohortData,
      departmentData: groupByDepartment,
      questionQualityRows,
      optionData,
      questionBankRows,
      randomizationRows,
      exposurePriorityRows,
      userRiskData,
      connectivityRows,
      operationRows,
    }
  }, [analyticsEvents, department, departments, questionBankMetadata, questionBanks, questionExposureCounts, questions, range, selectedDifficulty, selectedQuestionBankId, selectedRole, selectedTestId, selectedTopic, selectedUserId, sessions, tests, users])

  const activeChat = useMemo(() => chatThreads.find((thread) => thread.id === selectedChatId) ?? chatThreads[0], [chatThreads, selectedChatId])

  useEffect(() => {
    localStorage.setItem('deap-ai-chat-threads', JSON.stringify(chatThreads.slice(0, 40)))
  }, [chatThreads])

  useEffect(() => {
    if (!chatThreads.length) return
    const nextSelectedId = chatThreads.some((thread) => thread.id === selectedChatId) ? selectedChatId : chatThreads[0].id
    if (nextSelectedId !== selectedChatId) setSelectedChatId(nextSelectedId)
    localStorage.setItem('deap-ai-selected-chat-id', nextSelectedId)
  }, [chatThreads, selectedChatId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeChat?.messages.length, aiBusy])

  function createChat() {
    const thread = createAiThread()
    setChatThreads((existing) => [thread, ...existing])
    setSelectedChatId(thread.id)
    setAiDraft('')
    setAiError('')
  }

  function deleteChat(threadId: string) {
    setChatThreads((existing) => {
      const next = existing.filter((thread) => thread.id !== threadId)
      return next.length ? next : [createAiThread()]
    })
    if (selectedChatId === threadId) setSelectedChatId('')
  }

  function buildAiPayload(prompt: string, thread: AiChatThread | undefined): AiIntelligencePayload {
    const selectedUser = users.find((user) => user.id === selectedUserId)
    const selectedTest = tests.find((test) => test.id === selectedTestId)
    const selectedBank = questionBanks.find((bank) => bank.id === selectedQuestionBankId)
    const terms = prompt
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((term) => term.length > 3)
    const weakTopics = new Set(analytics.topicData.filter((row) => row.score < 70 || row.responses >= 3).slice(0, 8).map((row) => row.topic))
    const flaggedQuestionIds = new Set(analytics.questionQualityRows.filter((row) => row.flag.startsWith('Review')).map((row) => row.questionId))
    const scopedQuestions = questions.filter((question) => {
      if (selectedQuestionBankId !== 'all' && question.importBatchId !== selectedQuestionBankId) return false
      if (selectedDifficulty !== 'all' && question.difficulty !== selectedDifficulty) return false
      if (selectedTopic !== 'all' && question.topicTag !== selectedTopic) return false
      return true
    })
    const scoredQuestions = scopedQuestions
      .map((question) => ({
        question,
        score:
          relevantQuestionScore(question, terms) +
          (flaggedQuestionIds.has(question.questionId) ? 5 : 0) +
          (weakTopics.has(question.topicTag) ? 2 : 0),
      }))
      .sort((left, right) => right.score - left.score)
    const samples = (scoredQuestions.some((item) => item.score > 0) ? scoredQuestions.filter((item) => item.score > 0) : scoredQuestions)
      .slice(0, 36)
      .map(({ question }) => ({
        id: question.questionId,
        bank: documentNameFromBatch(question.importBatchId, questionBankMetadata),
        topic: question.topicTag,
        difficulty: question.difficulty,
        question: displayQuestionText(question.questionText).slice(0, 700),
        options: {
          A: question.optionA.slice(0, 240),
          B: question.optionB.slice(0, 240),
          C: question.optionC.slice(0, 240),
          D: question.optionD.slice(0, 240),
          E: question.optionE.slice(0, 240),
        },
        scoring: {
          correctAnswer: question.correctAnswer,
          correctWeight: question.correctWeight,
          partialAnswer1: question.partialAnswer1,
          partialWeight1: question.partialWeight1,
          partialAnswer2: question.partialAnswer2,
          partialWeight2: question.partialWeight2,
        },
      }))
    const bankContext = questionBanks.map((bank) => {
      const bankQuestions = questions.filter((question) => question.importBatchId === bank.id)
      const topicCounts = Array.from(
        bankQuestions.reduce((map, question) => {
          map.set(question.topicTag, (map.get(question.topicTag) ?? 0) + 1)
          return map
        }, new Map<string, number>()),
      )
        .sort((left, right) => right[1] - left[1])
        .slice(0, 18)
        .map(([topic, count]) => ({ topic, count }))
      return {
        id: bank.id,
        name: bank.name,
        description: documentDescriptionFromBatch(bank.id, questionBankMetadata),
        totalQuestions: bank.total,
        difficultyCounts: {
          easy: bankQuestions.filter((question) => question.difficulty === 'Easy').length,
          medium: bankQuestions.filter((question) => question.difficulty === 'Medium').length,
          hard: bankQuestions.filter((question) => question.difficulty === 'Hard').length,
        },
        topicCounts,
      }
    })

    return {
      question: prompt,
      filters: {
        range,
        department,
        user: selectedUser?.fullName ?? selectedUserId,
        test: selectedTest?.name ?? selectedTestId,
        questionBank: selectedBank?.name ?? selectedQuestionBankId,
        difficulty: selectedDifficulty,
        topic: selectedTopic,
        role: selectedRole,
      },
      chatHistory: (thread?.messages ?? []).slice(-10).map((message) => ({ role: message.role, content: message.content.slice(0, 1800) })),
      analytics: {
        usageMetrics: analytics.usageMetrics,
        questionBanks: analytics.questionBankRows,
        randomization: analytics.randomizationRows,
        underFeaturedQuestions: analytics.exposurePriorityRows,
        departments: analytics.departmentData,
        topics: analytics.topicData,
        difficulty: analytics.difficultyTimingData,
        answerOutcomes: analytics.outcomeData,
        supportSignals: analytics.supportUsageData,
        optionPattern: analytics.optionData,
        interventionPriority: analytics.userRiskData.slice(0, 15),
        questionQuality: analytics.questionQualityRows.slice(0, 15),
        connectivity: analytics.connectivityRows.slice(0, 10),
        operations: analytics.operationRows.slice(0, 12),
        trend: analytics.trendData.slice(-30),
      },
      questionBankContext: {
        banks: bankContext,
        relevantQuestionSamples: samples,
      },
    }
  }

  async function submitAiQuestion(event?: FormEvent) {
    event?.preventDefault()
    const prompt = aiDraft.trim()
    if (!prompt || aiBusy) return
    setAiDraft('')
    setAiError('')
    setAiBusy(true)
    const now = new Date().toISOString()
    const threadId = activeChat?.id ?? eventId('ai-thread')
    const userMessage: AiChatMessage = { id: eventId('ai-user'), role: 'user', content: prompt, createdAt: now }
    const baseThread = activeChat ?? createAiThread(aiThreadTitle(prompt))
    const nextTitle = baseThread.messages.length ? baseThread.title : aiThreadTitle(prompt)
    const optimisticThread: AiChatThread = {
      ...baseThread,
      id: threadId,
      title: nextTitle,
      updatedAt: now,
      messages: [...baseThread.messages, userMessage],
    }
    setSelectedChatId(threadId)
    setChatThreads((existing) => [optimisticThread, ...existing.filter((thread) => thread.id !== threadId)])
    try {
      const result = await requestAiIntelligence(buildAiPayload(prompt, optimisticThread))
      const assistantMessage: AiChatMessage = {
        id: eventId('ai-assistant'),
        role: 'assistant',
        content: result.answer,
        createdAt: new Date().toISOString(),
      }
      setChatThreads((existing) =>
        existing.map((thread) =>
          thread.id === threadId
            ? { ...thread, updatedAt: assistantMessage.createdAt, messages: [...thread.messages, assistantMessage] }
            : thread,
        ),
      )
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'AI analysis could not be completed.')
    } finally {
      setAiBusy(false)
    }
  }

  return (
    <section>
      <PageTitle eyebrow="Analytics" title="Decision intelligence dashboard" />
      <section className="panel analytics-control-panel">
        <div>
          <h2>Analytics filters</h2>
          <p>Slice every metric by time, department, user, test, question bank, difficulty, topic, and role.</p>
        </div>
        <div className="analytics-filter-grid">
          <label>
            Date range
            <select value={range} onChange={(event) => setRange(event.target.value)}>
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <label>
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="all">All departments</option>
              {departments.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            User
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              <option value="all">All users</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.fullName}</option>)}
            </select>
          </label>
          <label>
            Test
            <select value={selectedTestId} onChange={(event) => setSelectedTestId(event.target.value)}>
              <option value="all">All tests</option>
              {tests.map((test) => <option key={test.id} value={test.id}>{test.name}</option>)}
            </select>
          </label>
          <label>
            Question bank
            <select value={selectedQuestionBankId} onChange={(event) => setSelectedQuestionBankId(event.target.value)}>
              <option value="all">All banks</option>
              {questionBanks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
            </select>
          </label>
          <label>
            Difficulty
            <select value={selectedDifficulty} onChange={(event) => setSelectedDifficulty(event.target.value)}>
              <option value="all">All difficulty levels</option>
              {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
            </select>
          </label>
          <label>
            Topic
            <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
              <option value="all">All topics</option>
              {availableTopics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </label>
          <label>
            Role
            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="super_admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel ai-chat-panel">
        <div className="panel-heading-row">
          <div>
            <h2>Perplexity intelligence chat</h2>
            <p>Ask follow-up questions against the current filters, analytics signals, and question-bank context.</p>
          </div>
          <button className="secondary-button compact" type="button" onClick={createChat}>
            <Plus size={16} /> New chat
          </button>
        </div>
        <div className="ai-chat-shell">
          <aside className="ai-chat-sidebar" aria-label="Saved AI chats">
            {chatThreads.map((thread) => (
              <div className={`ai-chat-thread ${activeChat?.id === thread.id ? 'active' : ''}`} key={thread.id}>
                <button type="button" onClick={() => setSelectedChatId(thread.id)}>
                  <MessageSquare size={16} />
                  <span>{thread.title}</span>
                  <small>{new Date(thread.updatedAt).toLocaleString()}</small>
                </button>
                <button className="icon-button" type="button" aria-label={`Delete ${thread.title}`} onClick={() => deleteChat(thread.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </aside>
          <div className="ai-chat-main">
            <div className="ai-message-list" aria-live="polite">
              {activeChat?.messages.length ? (
                activeChat.messages.map((message) => (
                  <article className={`ai-message ${message.role}`} key={message.id}>
                    <div>
                      {message.role === 'assistant' ? <Bot size={17} /> : <UserRound size={17} />}
                      <strong>{message.role === 'assistant' ? 'DEAP Intelligence' : 'You'}</strong>
                      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p>{message.content}</p>
                  </article>
                ))
              ) : (
                <EmptyState title="No messages yet" body="Ask about risk flags, weak topics, item quality, completion gaps, or what to do next." />
              )}
              {aiBusy && (
                <article className="ai-message assistant pending">
                  <div>
                    <Sparkles size={17} />
                    <strong>DEAP Intelligence</strong>
                    <span>Analyzing</span>
                  </div>
                  <p>Reading the selected analytics and question-bank context...</p>
                </article>
              )}
              <div ref={chatEndRef} />
            </div>
            {aiError && <p className="inline-error">{aiError}</p>}
            <form className="ai-compose" onSubmit={submitAiQuestion}>
              <textarea
                value={aiDraft}
                placeholder="Ask what the data means, who needs intervention, which questions are weak, or what action to take next."
                onChange={(event) => setAiDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void submitAiQuestion()
                  }
                }}
              />
              <button className="primary-button" type="submit" disabled={!aiDraft.trim() || aiBusy}>
                <Send size={18} /> Ask
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="metric-grid analytics-metrics">
        <Metric label="Active users" value={analytics.usageMetrics.activeUsers} icon={<UsersRound />} />
        <Metric label="Failed logins" value={analytics.usageMetrics.failedLogins} icon={<AlertCircle />} />
        <Metric label="Start conversion" value={`${analytics.usageMetrics.startConversion}%`} icon={<Play />} />
        <Metric label="Completion rate" value={`${analytics.usageMetrics.completionRate}%`} icon={<CheckCircle2 />} />
        <Metric label="Average score" value={`${analytics.usageMetrics.avgScore}%`} icon={<Gauge />} />
        <Metric label="Median score" value={`${analytics.usageMetrics.medianScore}%`} icon={<BarChart3 />} />
        <Metric label="Avg response" value={`${analytics.usageMetrics.avgResponseTime}s`} icon={<Clock3 />} />
        <Metric label="Risk flags" value={analytics.usageMetrics.riskFlags} icon={<ShieldCheck />} />
        <Metric label="Never featured" value={analytics.usageMetrics.neverFeaturedQuestions} icon={<Shuffle />} />
        <Metric label="Exposure spread" value={analytics.usageMetrics.exposureImbalance} icon={<BarChart3 />} />
      </div>

      <section className="panel analytics-summary-panel">
        <h2>Score distribution and support dependence</h2>
        <div className="analytics-stat-strip">
          <span><strong>{analytics.usageMetrics.totalResponses}</strong> responses</span>
          <span><strong>{analytics.usageMetrics.correct}</strong> correct</span>
          <span><strong>{analytics.usageMetrics.partial}</strong> partial</span>
          <span><strong>{analytics.usageMetrics.wrong + analytics.usageMetrics.unanswered}</strong> wrong/unanswered</span>
          <span><strong>{analytics.usageMetrics.supportRate}%</strong> hint/reveal rate</span>
          <span><strong>{analytics.usageMetrics.scoreStdDev}</strong> score spread</span>
          <span><strong>{analytics.usageMetrics.p25}%</strong> P25</span>
          <span><strong>{analytics.usageMetrics.p75}%</strong> P75</span>
          <span><strong>{analytics.usageMetrics.p90}%</strong> P90</span>
        </div>
      </section>

      <div className="analytics-grid">
        <section className="panel">
          <h2>Access, starts, and completions</h2>
          <ResponsiveContainer height={270}>
            <LineChart data={analytics.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="logins" stroke="#004331" strokeWidth={3} />
              <Line type="monotone" dataKey="starts" stroke="#D5B52E" strokeWidth={3} />
              <Line type="monotone" dataKey="completions" stroke="#2E75B6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Answer outcomes</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.outcomeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#004331" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Difficulty mastery and timing</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.difficultyTimingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#004331" radius={[6, 6, 0, 0]} />
              <Bar dataKey="seconds" fill="#D5B52E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Hint, reveal, and recovery signals</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.supportUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#C00000" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Topic mastery</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.topicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={84} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#2E75B6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Speed vs accuracy</h2>
          <ResponsiveContainer height={270}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey="speed" name="Avg seconds" />
              <YAxis dataKey="score" name="Score %" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={analytics.cohortData} fill="#F0A500" />
            </ScatterChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Department comparison</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={78} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#004331" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completion" fill="#D5B52E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h2>Option selection pattern</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={analytics.optionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="option" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B3A6B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading-row">
          <div>
            <h2>Intervention priority list</h2>
            <p>Who needs help first, based on score, completion, wrong answers, and hint/reveal dependence.</p>
          </div>
        </div>
        <DataTable
          columns={['Employee', 'Dept', 'Attempts', 'Done', 'Score', 'Speed', 'Support', 'Risk', 'Recommendation']}
          rows={analytics.userRiskData.slice(0, 12).map((row) => [
            row.name,
            row.department,
            row.attempts,
            row.completed,
            `${row.avgScore}%`,
            `${row.avgSpeed}s`,
            `${row.supportRate}%`,
            row.riskScore,
            row.recommendation,
          ])}
        />
      </section>

      <div className="split-layout">
        <section className="panel">
          <h2>Question/item quality review</h2>
          <DataTable
            columns={['Question', 'Topic', 'Diff', 'Attempts', 'Correct', 'Avg time', 'Hints', 'Reveals', 'Flag']}
            rows={analytics.questionQualityRows.map((row) => [
              row.question,
              row.topic,
              row.difficulty,
              row.attempts,
              `${row.correctRate}%`,
              `${row.avgTime}s`,
              row.hints,
              row.reveals,
              row.flag,
            ])}
          />
        </section>
        <section className="panel">
          <h2>Question-bank intelligence</h2>
          <DataTable
            columns={['Bank', 'Qs', 'Easy', 'Medium', 'Hard', 'Live', 'Responses', 'Avg score']}
            rows={analytics.questionBankRows.map((row) => [
              row.bank,
              row.questions,
              row.easy,
              row.medium,
              row.hard,
              row.liveTests,
              row.responses,
              `${row.avgScore}%`,
            ])}
          />
        </section>
        <section className="panel">
          <h2>Randomisation fairness</h2>
          <DataTable
            columns={['Bank', 'Pool', '+75%', '+50%', '+25%', 'Standard', 'Min', 'Max', 'Avg', 'Spread']}
            rows={analytics.randomizationRows.map((row) => [
              row.bank,
              row.pool,
              row.neverShown,
              row.boosted50,
              row.boosted25,
              row.standard,
              row.minShown,
              row.maxShown,
              row.avgShown,
              row.imbalance,
            ])}
          />
        </section>
        <section className="panel">
          <h2>Under-featured priority queue</h2>
          <DataTable
            columns={['Question', 'Bank', 'Topic', 'Diff', 'Shown', 'Next draw priority']}
            rows={analytics.exposurePriorityRows.map((row) => [
              row.question,
              row.bank,
              row.topic,
              row.difficulty,
              row.shown,
              row.nextDrawPriority,
            ])}
          />
        </section>
        <section className="panel">
          <h2>Autosave and recovery monitor</h2>
          <DataTable
            columns={['Employee', 'Test', 'Status', 'Answered', 'Autosaves', 'Resumes', 'Last saved']}
            rows={analytics.connectivityRows.map((row) => [
              row.employee,
              row.test,
              row.status,
              row.answered,
              row.autosaves,
              row.resumed,
              row.lastSaved,
            ])}
          />
        </section>
        <section className="panel">
          <h2>Admin and app operations</h2>
          <DataTable
            columns={['Event', 'Count']}
            rows={analytics.operationRows.map((row) => [row.event, row.count])}
          />
        </section>
      </div>
    </section>
  )
}

function Reports({
  onExport,
  sessions,
  tests,
  users,
  questions,
  auditEvents,
}: {
  onExport: () => void | Promise<void>
  sessions: TestSession[]
  tests: Assessment[]
  users: User[]
  questions: Question[]
  auditEvents: AuditEvent[]
}) {
  const completed = sessions.filter((session) => session.status === 'completed')
  const inProgress = sessions.filter((session) => session.status === 'in_progress')
  return (
    <section>
      <PageTitle eyebrow="Reports" title="Export assessment data" />
      <div className="metric-grid">
        <Metric label="Live tests" value={tests.filter((test) => test.status === 'Live').length} icon={<ListChecks />} />
        <Metric label="Employees" value={users.filter((user) => user.role === 'employee').length} icon={<UsersRound />} />
        <Metric label="Question stock" value={questions.length} icon={<FileSpreadsheet />} />
        <Metric label="In progress" value={inProgress.length} icon={<Clock3 />} />
      </div>
      <div className="split-layout">
        <section className="panel report-panel">
          <FileDown size={42} />
          <h2>DEAP Results Workbook</h2>
          <p>{completed.length} completed attempt(s), {inProgress.length} in progress. Export raw result data to Excel for HR reviews and board packs.</p>
          <button className="primary-button" type="button" onClick={onExport} disabled={!sessions.length}>
            <FileDown size={18} /> Export XLSX
          </button>
        </section>
        <section className="panel">
          <h2>Recent activity trail</h2>
          <DataTable
            columns={['Time', 'Actor', 'Action', 'Detail']}
            rows={auditEvents.slice(0, 8).map((event) => [
              new Date(event.createdAt).toLocaleString(),
              event.actorName,
              event.action,
              event.detail,
            ])}
          />
          {!auditEvents.length && <p className="hint">No local audit events recorded yet.</p>}
        </section>
      </div>
    </section>
  )
}

function SettingsPanel({
  users,
  permissions,
  onResetPassword,
  onSetPermission,
  onBulkSetPermission,
  branding,
  onLogoUpload,
  onLogoReset,
  onToast,
}: {
  users: User[]
  permissions: Record<string, Record<PermissionKey, boolean>>
  onResetPassword: (userId: string) => void
  onSetPermission: (userId: string, permission: PermissionKey, enabled: boolean) => void
  onBulkSetPermission: (userIds: string[], permission: PermissionKey, enabled: boolean) => void
  branding: Branding
  onLogoUpload: (file?: File) => void
  onLogoReset: () => void
  onToast: (message: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'credentials' | 'permissions' | 'branding'>('permissions')
  const [revealedUser, setRevealedUser] = useState<User>()
  const [selectedUsers, setSelectedUsers] = useState<string[]>(() => users.filter((user) => user.role !== 'super_admin' && user.role !== 'admin').map((user) => user.id))
  const [userFilter, setUserFilter] = useState('')
  const [bulkPermission, setBulkPermission] = useState<PermissionKey>('take_tests')
  const [openPermissionUserId, setOpenPermissionUserId] = useState<string>()
  const editableUsers = useMemo(() => users.filter((user) => user.role !== 'super_admin' && user.role !== 'admin'), [users])
  const filteredUsers = useMemo(() => {
    const normalized = userFilter.toLowerCase().trim()
    if (!normalized) return users
    return users.filter((user) => `${user.userId} ${user.fullName} ${user.displayName} ${user.department} ${user.jobRole}`.toLowerCase().includes(normalized))
  }, [userFilter, users])
  const supervisorName = (supervisorId?: string) => users.find((user) => user.userId === supervisorId)?.fullName ?? '—'

  /**
   * Copies text and shows an admin confirmation toast.
   */
  async function copyCredential(text: string) {
    await copyToClipboard(text)
    onToast('Credential copied. You can paste it into WhatsApp now.')
  }

  /**
   * Selects or deselects one user in the bulk permissions panel.
   */
  function toggleSelectedUser(userId: string) {
    const user = users.find((candidate) => candidate.id === userId)
    if (user?.role === 'super_admin' || user?.role === 'admin') return
    setSelectedUsers((existing) => (existing.includes(userId) ? existing.filter((id) => id !== userId) : [...existing, userId]))
  }

  return (
    <section>
      <PageTitle eyebrow="Permissions" title="Control web app access by user" />
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button className={activeTab === 'credentials' ? 'active' : ''} type="button" onClick={() => setActiveTab('credentials')}>
          <KeyRound size={18} /> User passwords
        </button>
        <button className={activeTab === 'permissions' ? 'active' : ''} type="button" onClick={() => setActiveTab('permissions')}>
          <ShieldCheck size={18} /> Permissions
        </button>
        <button className={activeTab === 'branding' ? 'active' : ''} type="button" onClick={() => setActiveTab('branding')}>
          <Upload size={18} /> Branding
        </button>
      </div>
      <div className="settings-filter-row">
        <label className="search-box">
          <Search size={18} />
          <input placeholder="Search users, departments, roles, or User IDs" value={userFilter} onChange={(event) => setUserFilter(event.target.value)} />
        </label>
        <span>{filteredUsers.length} of {users.length} user(s) shown</span>
      </div>

      {activeTab === 'credentials' && (
        <section className="panel">
          <div className="panel-heading-row">
            <div>
              <h2>All user credentials</h2>
              <p>Passwords are hidden until you click a password button. Copy output is formatted for WhatsApp.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => copyCredential(allCredentialText(users))}>
              <Copy size={18} /> Copy all usernames and passwords
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Full name</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Supervisor</th>
                  <th>Password</th>
                  <th>Reset</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.userId}</td>
                    <td>{user.fullName}</td>
                    <td>{user.fullName}</td>
                    <td>{user.department}</td>
                    <td>{user.jobRole}</td>
                    <td>{supervisorName(user.supervisorId)}</td>
                    <td>
                      <button className="secret-button" type="button" onClick={() => setRevealedUser(user)}>
                        Hidden - click to view
                      </button>
                    </td>
                    <td>
                      <button className="secondary-button compact" type="button" onClick={() => onResetPassword(user.id)}>
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'branding' && (
        <section className="panel branding-panel">
          <div className="panel-heading-row">
            <div>
              <h2>Platform logo</h2>
              <p>Upload the organisation logo that appears at the top left of every admin and employee screen.</p>
            </div>
          </div>
          <div className="branding-control">
            <div className="logo-preview-card" aria-label="Current platform logo preview">
              <img src={branding.logoUrl} alt="Current iicocece platform logo" />
            </div>
            <div className="branding-actions">
              <label className="upload-button">
                <Upload size={18} /> Upload new logo
                <input type="file" accept="image/*" onChange={(event) => onLogoUpload(event.target.files?.[0])} />
              </label>
              <button className="secondary-button" type="button" onClick={onLogoReset}>
                Restore default iicocece logo
              </button>
              <p className="hint">Recommended: PNG, JPG, SVG, or WebP under 1.5 MB. A wide logo works best in the sidebar placeholder.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'permissions' && (
        <section className="permissions-layout">
          <section className="panel">
            <div className="panel-heading-row">
              <div>
                <h2>Bulk permission control</h2>
                <p>Select users, choose one permission, then enable or disable it for everyone selected.</p>
              </div>
            </div>
            <div className="bulk-toolbar">
              <button className="secondary-button" type="button" onClick={() => setSelectedUsers(editableUsers.map((user) => user.id))}>
                Select all non-admin
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setSelectedUsers(filteredUsers.filter((user) => user.role !== 'super_admin' && user.role !== 'admin').map((user) => user.id))}
              >
                Select visible
              </button>
              <button className="secondary-button" type="button" onClick={() => setSelectedUsers([])}>
                Clear selection
              </button>
              <select value={bulkPermission} onChange={(event) => setBulkPermission(event.target.value as PermissionKey)}>
                {permissionCatalog.map((permission) => (
                  <option key={permission.key} value={permission.key}>
                    {permission.label}
                  </option>
                ))}
              </select>
              <button className="primary-button" type="button" onClick={() => onBulkSetPermission(selectedUsers, bulkPermission, true)} disabled={!selectedUsers.length}>
                Enable selected
              </button>
              <button className="danger-button" type="button" onClick={() => onBulkSetPermission(selectedUsers, bulkPermission, false)} disabled={!selectedUsers.length}>
                Disable selected
              </button>
            </div>
            <div className="user-chip-grid">
              {filteredUsers.map((user) => (
                <label className="user-chip" key={user.id}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    disabled={user.role === 'super_admin' || user.role === 'admin'}
                    onChange={() => toggleSelectedUser(user.id)}
                  />
                  <span>{user.displayName}</span>
                  <small>{user.role === 'super_admin' || user.role === 'admin' ? 'Admin locked' : user.jobRole}</small>
                </label>
              ))}
            </div>
          </section>

          <section className="panel permission-table-panel">
            <h2>Current permission status</h2>
            <div className="permission-accordion-list">
              {filteredUsers.map((user) => {
                const isAdminRow = user.role === 'super_admin' || user.role === 'admin'
                const isOpen = openPermissionUserId === user.id
                const enabledCount = permissionCatalog.filter((permission) => isAdminRow || (permissions[user.id]?.[permission.key] ?? defaultPermissionsFor(user)[permission.key])).length
                return (
                  <article className="permission-accordion-item" key={user.id}>
                    <button
                      className="permission-user-button"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenPermissionUserId((current) => (current === user.id ? undefined : user.id))}
                    >
                      {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span>
                        <strong>{user.displayName}</strong>
                        <small>{user.jobRole} · {user.department}</small>
                      </span>
                      <em>{isAdminRow ? 'All permissions locked on' : `${enabledCount} of ${permissionCatalog.length} enabled`}</em>
                    </button>
                    {isOpen && (
                      <div className="permission-detail-grid">
                        {permissionCatalog.map((permission) => {
                          const checked = isAdminRow ? true : (permissions[user.id]?.[permission.key] ?? defaultPermissionsFor(user)[permission.key])
                          return (
                            <label className={`permission-toggle-card ${isAdminRow ? 'locked-permission' : ''}`} key={permission.key}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isAdminRow}
                                onChange={(event) => onSetPermission(user.id, permission.key, event.target.checked)}
                              />
                              <span>
                                <strong>{permission.label}</strong>
                                <small>{permission.description}</small>
                              </span>
                              <em>{isAdminRow ? 'Always on' : checked ? 'On' : 'Off'}</em>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        </section>
      )}

      {revealedUser && (
        <div className="modal-backdrop" role="presentation" onClick={() => setRevealedUser(undefined)}>
          <section className="credential-modal" role="dialog" aria-modal="true" aria-labelledby="credential-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="credential-title">Password for {revealedUser.fullName}</h2>
            <div className="credential-box">
              <span>Username</span>
              <strong>{revealedUser.fullName}</strong>
              <span>Password</span>
              <strong>{revealedUser.password}</strong>
            </div>
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={() => copyCredential(credentialText(revealedUser))}>
                <Copy size={18} /> Copy for WhatsApp
              </button>
              <button className="secondary-button" type="button" onClick={() => setRevealedUser(undefined)}>
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function AssessmentOverview({ test }: { test: Assessment }) {
  if (!test.overviewSections?.length) return <p>{test.description}</p>
  return (
    <div className="assessment-description-panel">
      <p className="assessment-summary">{test.description}</p>
      {test.overviewSections.map((section) => (
        <section className="assessment-description-section" key={section.title}>
          <h3>{section.title}</h3>
          {section.body.split('\n').filter(Boolean).map((paragraph, index) => (
            <p key={`${section.title}-${index}`}>{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
  )
}

function MyTests({
  currentUser,
  tests,
  sessions,
  onStart,
  onInstructionOpen,
  onAgreementAccept,
}: {
  currentUser: User
  tests: Assessment[]
  sessions: TestSession[]
  onStart: (testId: string) => void
  onInstructionOpen: (testId: string) => void
  onAgreementAccept: (testId: string) => void
}) {
  const assigned = tests.filter((test) => test.status === 'Live' && test.assignedUserIds.includes(currentUser.id))
  const [pendingTest, setPendingTest] = useState<Assessment>()
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  return (
    <section>
      <PageTitle eyebrow={`Welcome, ${currentUser.fullName}`} title="My assigned tests" />
      <div className="test-card-list">
        {assigned.map((test) => {
          const completed = sessions.find((session) => session.testId === test.id && session.userId === currentUser.id && session.status === 'completed')
          const availability = getAvailabilityState(test)
          return (
            <article className="employee-test-card" key={test.id}>
              <div>
                <div className="card-badge-row">
                  <span className={`badge ${String(test.difficulty).toLowerCase()}`}>{test.difficulty}</span>
                  <span className={`status-pill ${availability.canStart ? 'live' : 'locked'}`}>{availability.label}</span>
                  <span className="status-pill supervised">HR supervised</span>
                </div>
                <h2>{test.name}</h2>
                <p>{test.description}</p>
                <small>Timed randomized assessment · {availability.detail}</small>
              </div>
              {completed ? (
                <span className={completed.passed ? 'score-badge pass' : 'score-badge fail'}>{completed.percentage}%</span>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  disabled={!availability.canStart}
                  title={availability.canStart ? 'Open test instructions' : availability.detail}
                  onClick={() => {
                    onInstructionOpen(test.id)
                    setPendingTest(test)
                    setAgreementAccepted(false)
                  }}
                >
                  <Play size={18} /> Start Test
                </button>
              )}
            </article>
          )
        })}
        {!assigned.length && <EmptyState title="No tests assigned yet" body="Check back soon for your next DEAP assessment." />}
      </div>
      {pendingTest && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPendingTest(undefined)}>
          <section className="pretest-modal" role="dialog" aria-modal="true" aria-labelledby="pretest-title" onClick={(event) => event.stopPropagation()}>
            <span className={`badge ${String(pendingTest.difficulty).toLowerCase()}`}>{pendingTest.difficulty}</span>
            <h2 id="pretest-title">{pendingTest.name}</h2>
            <AssessmentOverview test={pendingTest} />
            <div className="pretest-facts">
              <span><strong>60 sec</strong> Per question</span>
              <span><strong>Random</strong> Question draw</span>
              <span><strong>MCQ</strong> Five options each</span>
              <span><strong>5 sec</strong> Autosave heartbeat</span>
            </div>
            <div className="instruction-box">
              <h3>Before you begin</h3>
              <ul>
                <li>Each question appears one at a time with a countdown timer.</li>
                <li>Your question set is randomly selected only after you tick this agreement and click Start the test.</li>
                <li>The live test draws randomly from the approved question bank to reduce cheating risk.</li>
                <li>Some questions have one definite correct answer; others may award partial marks on a curve.</li>
                <li>Your score combines answer accuracy and response speed.</li>
                <li>If a hint is available and you open it, the maximum marks for only that question are immediately reduced by 50%.</li>
                <li>If you reveal the answer, you lose all marks for only that question, even if you answer correctly afterward.</li>
                <li>You cannot go back after submitting an answer, so read carefully before choosing.</li>
                <li>If the timer expires, the question is submitted as unanswered.</li>
                <li>Your progress is saved every few seconds, but the question timer continues even if the internet connection shakes.</li>
                <li>HR should guide the test administration in the office. The test should be monitored through Google Meet with the user's screen shared and camera/video on.</li>
              </ul>
            </div>
            <p className="encouragement">Take a breath. Read calmly, answer confidently, and do your best.</p>
            <label className="agreement-row">
              <input
                type="checkbox"
                checked={agreementAccepted}
                onChange={(event) => {
                  setAgreementAccepted(event.target.checked)
                  if (event.target.checked) onAgreementAccept(pendingTest.id)
                }}
              />
              I understand the test instructions and agree to proceed honestly.
            </label>
            <div className="modal-actions">
              <button
                className="primary-button"
                type="button"
                disabled={!agreementAccepted}
                onClick={() => {
                  onStart(pendingTest.id)
                  setPendingTest(undefined)
                }}
              >
                <Play size={18} /> Start the test
              </button>
              <button className="secondary-button" type="button" onClick={() => setPendingTest(undefined)}>
                Not yet
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function MyResults({ currentUser, sessions, tests }: { currentUser: User; sessions: TestSession[]; tests: Assessment[] }) {
  const completed = sessions.filter((session) => session.userId === currentUser.id && session.status === 'completed')
  return (
    <section>
      <PageTitle eyebrow="My results" title="Assessment history" />
      <section className="panel">
        <DataTable
          columns={['Test', 'Score', 'Percentage', 'Outcome', 'Completed']}
          rows={completed.map((session) => {
            const test = tests.find((item) => item.id === session.testId)
            return [test?.name ?? 'Assessment', session.score, `${session.percentage}%`, session.passed ? 'Pass' : 'Fail', new Date(session.completedAt ?? '').toLocaleString()]
          })}
        />
      </section>
    </section>
  )
}

function TestDelivery({
  session,
  test,
  questions,
  currentUser,
  onAnswer,
  onAutosave,
  onSupportEvent,
  onComplete,
}: {
  session: TestSession
  test?: Assessment
  questions: Question[]
  currentUser: User
  onAnswer: (sessionId: string, response: ResponseRecord) => void
  onAutosave: (sessionId: string) => void
  onSupportEvent: (type: 'hint_opened' | 'answer_revealed', session: TestSession, question: Question) => void
  onComplete: () => void
}) {
  const sessionQuestions = useMemo(() => {
    if (!test) return []
    const questionIds = session.questionIds?.length ? session.questionIds : readStored<string[]>(`deap-session-questions-${test.id}-${currentUser.id}`, [])
    const questionById = new Map(questions.map((question) => [question.questionId, question]))
    return questionIds.map((id) => questionById.get(id)).filter(Boolean) as Question[]
  }, [currentUser.id, questions, session.questionIds, test])
  const currentIndex = session.responses.length
  const currentQuestion = sessionQuestions[currentIndex]
  const [seconds, setSeconds] = useState(60)
  const [announcer, setAnnouncer] = useState('')
  const [hintVisible, setHintVisible] = useState(false)
  const [answerVisible, setAnswerVisible] = useState(false)
  const submittedRef = useRef('')
  const hintUsedRef = useRef(false)
  const answerRevealedRef = useRef(false)

  useEffect(() => {
    submittedRef.current = ''
    hintUsedRef.current = false
    answerRevealedRef.current = false
    setHintVisible(false)
    setAnswerVisible(false)
    const deadline = session.currentQuestionDeadlineAt ? new Date(session.currentQuestionDeadlineAt).getTime() : Date.now() + 60_000
    const frame = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(remaining)
      if ([30, 10, 5].includes(remaining)) setAnnouncer(`${remaining} seconds remaining`)
      if (remaining <= 0) {
        window.clearInterval(frame)
        submitAnswer(undefined, 0)
      }
    }, 100)
    return () => window.clearInterval(frame)
  }, [currentQuestion?.questionId, session.currentQuestionDeadlineAt])

  useEffect(() => {
    const saveTimer = window.setInterval(() => onAutosave(session.id), 5000)
    return () => window.clearInterval(saveTimer)
  }, [session.id, onAutosave])

  /**
   * Records the selected answer and advances to the next question or results.
   */
  function submitAnswer(option?: OptionKey, forcedSeconds?: number) {
    if (!currentQuestion) return
    if (submittedRef.current === currentQuestion.questionId) return
    submittedRef.current = currentQuestion.questionId
    const remaining = forcedSeconds ?? seconds
    onAnswer(session.id, scoreQuestion(currentQuestion, option, remaining, { hintUsed: hintUsedRef.current, answerRevealed: answerRevealedRef.current }))
    const isFinal = currentIndex + 1 >= (test?.questionCount ?? sessionQuestions.length)
    if (isFinal) window.setTimeout(onComplete, 150)
  }

  if (!currentQuestion || !test) return <EmptyState title="No question available" body="This session cannot continue because the question set is unavailable." />

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (seconds / 60) * circumference
  const timerClass = seconds <= 10 ? 'danger' : seconds <= 20 ? 'warning' : ''
  const optionOrder = currentQuestion ? (session.optionOrderByQuestion?.[currentQuestion.questionId] ?? optionKeys) : optionKeys
  const revealedAnswerText = `${currentQuestion.correctAnswer}. ${currentQuestion[`option${currentQuestion.correctAnswer}` as keyof Question] as string}`
  const learnerQuestionText = displayQuestionText(currentQuestion.questionText)

  return (
    <section className="test-delivery">
      <header>
        <span>Assessment item</span>
        <strong>{test.name}</strong>
        <small>Autosaved {session.lastSavedAt ? new Date(session.lastSavedAt).toLocaleTimeString() : 'now'}</small>
      </header>
      <div className={`timer ${timerClass}`} aria-label={`${seconds} seconds remaining`}>
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="54" />
          <circle cx="60" cy="60" r="54" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <span>00:{String(seconds).padStart(2, '0')}</span>
      </div>
      <p className="sr-only" aria-live="polite">{announcer}</p>
      <article className="question-stage">
        <h1>{learnerQuestionText}</h1>
        <div className="question-support">
          {currentQuestion.hint ? (
            <button
              className="assist-link"
              type="button"
              disabled={hintVisible || answerVisible}
              onClick={() => {
                hintUsedRef.current = true
                setHintVisible(true)
                onSupportEvent('hint_opened', session, currentQuestion)
              }}
            >
              Show hint - lose 50% of this question's possible score
            </button>
          ) : null}
          <button
            className="assist-link danger"
            type="button"
            disabled={answerVisible}
            onClick={() => {
              answerRevealedRef.current = true
              setAnswerVisible(true)
              onSupportEvent('answer_revealed', session, currentQuestion)
            }}
          >
            Reveal answer - lose all points for this question
          </button>
          {hintVisible && currentQuestion.hint && (
            <div className="support-reveal">
              <strong>Hint</strong>
              <p>{currentQuestion.hint}</p>
            </div>
          )}
          {answerVisible && (
            <div className="support-reveal answer">
              <strong>Answer revealed: zero marks for this question</strong>
              <p>{revealedAnswerText}</p>
              {currentQuestion.explanation && <p>{currentQuestion.explanation}</p>}
            </div>
          )}
        </div>
        <div className="answers">
          {optionOrder.map((key, index) => (
            <button key={key} type="button" onClick={() => submitAnswer(key)}>
              <span>{optionKeys[index]}</span>
              {currentQuestion[`option${key}` as keyof Question] as string}
            </button>
          ))}
        </div>
      </article>
    </section>
  )
}

function ResultView({ session, questions, test, onReturn }: { session?: TestSession; questions: Question[]; test?: Assessment; onReturn: () => void }) {
  if (!session || !test) return null
  const averageResponse = session.responses.length ? session.responses.reduce((total, response) => total + response.responseTime, 0) / session.responses.length : 0
  const fastest = session.responses.reduce((best, response) => (response.responseTime < best.responseTime ? response : best), session.responses[0])
  const slowest = session.responses.reduce((best, response) => (response.responseTime > best.responseTime ? response : best), session.responses[0])
  return (
    <section>
      <PageTitle eyebrow={session.passed ? 'Passed' : 'Completed'} title="Your assessment result" />
      <section className="result-hero">
        <span className={session.passed ? 'score-badge pass' : 'score-badge fail'}>{session.passed ? 'Pass' : 'Fail'}</span>
        <h1>{session.percentage}%</h1>
        <p>Assessment completed</p>
      </section>
      <div className="metric-grid">
        <Metric label="Average response" value={`${averageResponse.toFixed(0)}s`} icon={<Clock3 />} />
        <Metric label="Fastest answer" value={`${fastest?.responseTime ?? 0}s`} icon={<Gauge />} />
        <Metric label="Slowest answer" value={`${slowest?.responseTime ?? 0}s`} icon={<AlertCircle />} />
      </div>
      <section className="panel">
        <h2>Question breakdown</h2>
        <div className="accordion-list">
          {session.responses.map((response, index) => {
            const question = questions.find((item) => item.questionId === response.questionId)
              return (
                <details key={`${response.questionId}-${index}`}>
                  <summary>Response detail: {response.marksEarned} mark(s) earned</summary>
                  <p>{displayQuestionText(question?.questionText)}</p>
                  <p>Your answer: {response.selectedOption ?? 'No answer'} · Correct answer: {question?.correctAnswer}</p>
                  <p>
                    Hint used: {response.hintUsed ? 'Yes - 50% penalty' : 'No'} · Answer revealed: {response.answerRevealed ? 'Yes - zero marks' : 'No'} · Response time: {response.responseTime}s
                  </p>
                  <p>{question?.explanation}</p>
                </details>
              )
          })}
        </div>
      </section>
      <button className="primary-button" type="button" onClick={onReturn}>Return to My Tests</button>
    </section>
  )
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <article className="metric-card">
      <span>{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  )
}

function PageTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="page-title">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  )
}

function DataTable({ columns, rows }: { columns: string[]; rows: Array<Array<string | number | undefined>> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>)}</tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={columns.length}>No records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="empty-state">
      <AlertCircle size={36} />
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  )
}

export default App
