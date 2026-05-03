import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Decimal from 'decimal.js'
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
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
  Moon,
  Play,
  Search,
  Settings2,
  ShieldCheck,
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
  explanation: string
  importBatchId: string
}

interface Assessment {
  id: string
  name: string
  description: string
  questionCount: 20 | 40 | 60
  difficulty: Difficulty | 'Mixed'
  departments: string[]
  startDate: string
  endDate: string
  allowReattempt: boolean
  showResults: boolean
  passMark: number
  status: 'Draft' | 'Live' | 'Archived'
  assignedUserIds: string[]
}

interface ResponseRecord {
  questionId: string
  selectedOption?: OptionKey
  secondsRemaining: number
  answerWeight: string
  timeMultiplier: string
  marksEarned: string
  responseTime: number
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
const sourceWorkbookPath = '/questions/nigeria-cybercrime-act-assessment-1500q.xlsx'
const sourceWorkbookVersion = 'nigeria-cybercrime-act-1500q-v1'

const departmentCatalog = [
  {
    name: 'Operations',
    description: 'Operational compliance, reporting discipline, risk controls, and continuity decisions.',
    topics: ['Operational Compliance', 'Reporting Obligations', 'Business Continuity', 'Risk Controls'],
  },
  {
    name: 'Legal',
    description: 'Cybercrime Act interpretation, penalties, lawful procedures, and regulatory duties.',
    topics: ['Legal Foundations', 'Offences and Penalties', 'Investigation and Enforcement', 'Privacy and Data Protection'],
  },
  {
    name: 'UI/UX & Development',
    description: 'Secure product design, access controls, evidence handling, and cyber-aware development decisions.',
    topics: ['System Security', 'Critical Infrastructure', 'Incident Response', 'Evidence Handling'],
  },
  {
    name: 'Human Resources',
    description: 'Employee conduct, cyberstalking awareness, acceptable use, and internal training accountability.',
    topics: ['Employee Conduct', 'Cyber Ethics', 'Awareness Training', 'Disciplinary Risk'],
  },
  {
    name: 'Digital Marketing',
    description: 'Safe campaign operations, phishing awareness, brand protection, and digital communication risk.',
    topics: ['Electronic Fraud', 'Audit Trail Management', 'Transaction Monitoring', 'Internal Controls'],
  },
  {
    name: 'Business Development',
    description: 'Client-facing cyber conduct, fraud awareness, risk escalation, and evidence-conscious communication.',
    topics: ['Electronic Fraud', 'Reporting Obligations', 'Cyber Ethics', 'Risk Controls'],
  },
  {
    name: 'Digital Content',
    description: 'Responsible publishing, online conduct, cyberstalking awareness, and digital evidence sensitivity.',
    topics: ['Employee Conduct', 'Privacy and Data Protection', 'Cyber Ethics', 'Evidence Handling'],
  },
  {
    name: 'Executive',
    description: 'Leadership-level oversight of cyber risk, compliance culture, accountability, and workforce readiness.',
    topics: ['Legal Foundations', 'Risk Controls', 'Reporting Obligations', 'Business Continuity'],
  },
  {
    name: 'Other',
    description: 'General organisational cybercrime awareness for team members outside a named department.',
    topics: ['Cybercrime Act General Knowledge', 'Employee Conduct', 'Awareness Training', 'Reporting Obligations'],
  },
]

const topicRules: Array<[RegExp, string]> = [
  [/section|act|law|court|jurisdiction|order|warrant/i, 'Legal Foundations'],
  [/penalty|fine|imprisonment|liable|conviction|years|million/i, 'Offences and Penalties'],
  [/fraud|phishing|identity|card|forgery|theft|scam/i, 'Electronic Fraud'],
  [/critical|infrastructure|protected|system|access|interference|computer/i, 'System Security'],
  [/evidence|investigation|search|seizure|forensic|preserve|record/i, 'Investigation and Enforcement'],
  [/data|privacy|personal|subscriber|traffic|interception|message/i, 'Privacy and Data Protection'],
  [/report|notify|escalat|incident|response/i, 'Incident Response'],
  [/employee|conduct|stalking|harassment|ethic|abuse/i, 'Employee Conduct'],
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
    explanation: 'The strongest response combines documentation, policy alignment, and timely escalation.',
    importBatchId: 'seed-bank',
  }
})

const seedTests: Assessment[] = [
  {
    id: 'test-onboarding',
    name: 'Nigeria Cybercrime Act Compliance Assessment',
    description: 'A timed organisational LMS assessment covering the Nigeria Cybercrimes Act, offences, penalties, evidence, privacy, and cyber conduct.',
    questionCount: 60,
    difficulty: 'Mixed',
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

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const values = crypto.getRandomValues(new Uint32Array(6))
  return Array.from(values, (value) => chars[value % chars.length]).join('')
}

function documentNameFromBatch(batchId: string): string {
  if (batchId === sourceWorkbookVersion) return 'Nigeria Cybercrime Act Assessment 1500Q'
  if (batchId === 'seed-bank') return 'Sample DEAP Question Bank'
  if (batchId.startsWith('file:')) return batchId.split(':')[1] || 'Uploaded Question Bank'
  if (batchId.startsWith('batch-')) return `Uploaded Question Bank ${batchId.replace('batch-', '')}`
  return batchId
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
export function scoreQuestion(question: Question, selectedOption: OptionKey | undefined, secondsRemaining: number): ResponseRecord {
  const answerWeight = getAnswerWeight(question, selectedOption)
  const timeMultiplier = getTimeMultiplier(secondsRemaining)
  const marksEarned = new Decimal(1).mul(answerWeight).mul(timeMultiplier)
  return {
    questionId: question.questionId,
    selectedOption,
    secondsRemaining,
    answerWeight: answerWeight.toFixed(2),
    timeMultiplier: timeMultiplier.toFixed(2),
    marksEarned: marksEarned.toFixed(2),
    responseTime: 60 - secondsRemaining,
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
      explanation: String(row.explanation ?? '').trim().slice(0, 1000),
      importBatchId: batchId,
    },
  }
}

/**
 * Classifies an imported cybercrime question into an LMS topic area.
 */
function classifyTopic(questionText: string): string {
  return topicRules.find(([pattern]) => pattern.test(questionText))?.[1] ?? 'Cybercrime Act General Knowledge'
}

/**
 * Converts the supplied workbook's compact score-column format to DEAP questions.
 */
function normalizeScoredOptionRow(row: Record<string, unknown>, rowNumber: number, batchId: string): { question?: Question; error?: string } {
  const rawQuestion = String(row.Question ?? '').trim()
  const difficultyMatch = rawQuestion.match(/^\[(Easy|Medium|Hard)(?:-[^\]]+)?\]\s*/i)
  const difficulty = (difficultyMatch?.[1] ?? 'Medium').replace(/^./, (letter) => letter.toUpperCase()) as Difficulty
  const questionText = rawQuestion.replace(/^\[[^\]]+\]\s*/i, '').slice(0, 500)
  const options = {
    A: String(row['Option A'] ?? '').trim(),
    B: String(row['Option B'] ?? '').trim(),
    C: String(row['Option C'] ?? '').trim(),
    D: String(row['Option D'] ?? '').trim(),
    E: String(row['Option E'] ?? '').trim(),
  }
  const scores = (['A', 'B', 'C', 'D', 'E'] as OptionKey[]).map((key) => ({ key, score: Number(row[`Score ${key}`] ?? 0) }))
  const ranked = [...scores].sort((left, right) => right.score - left.score)
  const correct = ranked[0]
  const partials = ranked.filter((item) => item.score > 0 && item.score < correct.score).slice(0, 2)

  if (!questionText) return { error: `Row ${rowNumber}: Question is required.` }
  if (Object.values(options).some((option) => !option)) return { error: `Row ${rowNumber}: all five options are required.` }
  if (!Number.isFinite(correct.score) || correct.score <= 0) return { error: `Row ${rowNumber}: at least one option must have a positive score.` }

  return {
    question: {
      questionId: `cybercrime-act-${rowNumber - 1}`,
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
      topicTag: classifyTopic(questionText),
      explanation: `The highest weighted answer is option ${correct.key}. Review the Nigeria Cybercrimes Act context for the governing provision and penalty detail.`,
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
  if (headers.includes('Question') && headers.includes('Score A')) {
    return parseScoredOptionRows(rows, new Set(), batchId)
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
function parseScoredOptionRows(rows: Array<Record<string, unknown>>, existingIds: Set<string>, batchId: string): { questions: Question[]; errors: string[] } {
  const questions: Question[] = []
  const errors: string[] = []
  rows.forEach((row, index) => {
    const result = normalizeScoredOptionRow(row, index + 2, batchId)
    if (result.error) errors.push(result.error)
    if (result.question && !existingIds.has(result.question.questionId)) questions.push(result.question)
  })
  return { questions: errors.length ? [] : questions, errors }
}

/**
 * Loads the bundled first question bank from Firebase Hosting assets.
 */
async function loadBundledQuestionBank(): Promise<Question[]> {
  const response = await fetch(sourceWorkbookPath)
  if (!response.ok) throw new Error('Unable to load bundled question bank.')
  const spreadsheet = await loadSpreadsheetTools()
  const buffer = await response.arrayBuffer()
  const workbook = spreadsheet.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = spreadsheet.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const result = parseScoredOptionRows(rows, new Set(), sourceWorkbookVersion)
  if (result.errors.length) throw new Error(result.errors[0])
  return result.questions
}

function App() {
  const [users, setUsers] = useState<User[]>(() => seedUsers)
  const [permissions, setPermissions] = useState<Record<string, Record<PermissionKey, boolean>>>(() =>
    transferPermissions(readStored('deap-permissions', buildDefaultPermissions(seedUsers)), seedUsers),
  )
  const [questions, setQuestions] = useState<Question[]>(() => readStored('deap-questions', seedQuestions))
  const [tests, setTests] = useState<Assessment[]>(() => transferAssignments(readStored('deap-tests', seedTests)))
  const [sessions, setSessions] = useState<TestSession[]>(() => transferSessions(readStored('deap-sessions', [])))
  const [currentUser, setCurrentUser] = useState<User | undefined>(() => readStored<User | undefined>('deap-current-user', undefined))
  const [view, setView] = useState<AppView>(() => (currentUser ? firstViewForUser(currentUser, permissions) : 'login'))
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => readStored('deap-audit-events', []))
  const [activeTestId, setActiveTestId] = useState<string>()
  const [activeSessionId, setActiveSessionId] = useState<string>()
  const [branding, setBranding] = useState<Branding>(() => readStored('deap-branding', defaultBranding))
  const [theme, setTheme] = useState<ThemeMode>(() => readStored('deap-theme', 'light'))
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => localStorage.setItem('deap-questions', JSON.stringify(questions)), [questions])
  useEffect(() => localStorage.setItem('deap-users', JSON.stringify(users)), [users])
  useEffect(() => localStorage.setItem('deap-permissions', JSON.stringify(permissions)), [permissions])
  useEffect(() => localStorage.setItem('deap-tests', JSON.stringify(tests)), [tests])
  useEffect(() => localStorage.setItem('deap-sessions', JSON.stringify(sessions)), [sessions])
  useEffect(() => localStorage.setItem('deap-audit-events', JSON.stringify(auditEvents.slice(0, 200))), [auditEvents])
  useEffect(() => localStorage.setItem('deap-current-user', JSON.stringify(currentUser)), [currentUser])
  useEffect(() => localStorage.setItem('deap-branding', JSON.stringify(branding)), [branding])
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
      setTests((existing) => transferAssignments(existing.length ? existing : seedTests))
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
        transferAssignments(existing.map((test) =>
          test.id === 'test-onboarding'
            ? {
                ...seedTests[0],
                assignedUserIds: uniqueUserIds(test.assignedUserIds.length ? test.assignedUserIds : seedTests[0].assignedUserIds),
              }
            : test,
        )),
      )
      localStorage.setItem('deap-lms-layout-version', 'iicocece-org-lms-v1')
    }
    if (
      localStorage.getItem('deap-source-workbook-version') === sourceWorkbookVersion &&
      questions.some((question) => question.importBatchId === sourceWorkbookVersion)
    ) {
      return
    }
    loadBundledQuestionBank()
      .then((loadedQuestions) => {
        setQuestions((existing) => [
          ...loadedQuestions,
          ...existing.filter((question) => !question.questionId.startsWith('seed-') && !question.questionId.startsWith('cybercrime-act-')),
        ])
        localStorage.setItem('deap-source-workbook-version', sourceWorkbookVersion)
        setToast(`${loadedQuestions.length} Nigeria Cybercrime Act questions are now available in the LMS.`)
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
      setToast('Invalid username or password.')
      return
    }
    recordAudit('Login', `${user.fullName} signed in.`, user.fullName)
    setCurrentUser(user)
    const resumable = sessions.find((session) => session.userId === user.id && session.status === 'in_progress')
    if (resumable) {
      setActiveTestId(resumable.testId)
      setActiveSessionId(resumable.id)
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
    recordAudit('Question import', `${result.questions.length} question(s) imported from ${file.name}.`)
    setToast(`${result.questions.length} question(s) imported successfully.`)
  }

  /**
   * Creates a configured assessment and assigns it to matching employees.
   */
  function createAssessment(form: FormData) {
    const difficulty = String(form.get('difficulty')) as Assessment['difficulty']
    const questionCount = Number(form.get('questionCount')) as 20 | 40 | 60
    const available = questions.filter((question) => difficulty === 'Mixed' || question.difficulty === difficulty)
    if (available.length < questionCount) {
      setToast(`Not enough ${difficulty} questions. ${available.length} available, ${questionCount} required.`)
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
    recordAudit('Test launched', `${next.name} assigned to ${assignedUserIds.length} employee(s).`)
    setToast(`${next.name} is live for ${assignedUserIds.length} employee(s).`)
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
    setToast(`${test.name} has been removed.`)
  }

  /**
   * Resets one user's password and keeps the current credential view in sync.
   */
  function resetUserPassword(userId: string) {
    const user = users.find((item) => item.id === userId)
    setUsers((existing) => existing.map((user) => (user.id === userId ? { ...user, password: generatePassword() } : user)))
    recordAudit('Password reset', `${user?.fullName ?? 'A user'} received a new generated password.`)
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
      setToast('Resuming your in-progress test. The timer continued from the saved question deadline.')
      setView('taking-test')
      return
    }
    const availableQuestions = questions.filter((question) => {
      const matchesDifficulty = test.difficulty === 'Mixed' || question.difficulty === test.difficulty
      const matchesSourceBank = test.id === 'test-onboarding' ? question.importBatchId === sourceWorkbookVersion : true
      return matchesDifficulty && matchesSourceBank
    })
    if (availableQuestions.length < test.questionCount) {
      setToast(`Not enough matching questions are available yet. ${availableQuestions.length} available, ${test.questionCount} required.`)
      return
    }
    const selectedQuestions = shuffle(availableQuestions).slice(0, test.questionCount)
    const selectedQuestionIds = selectedQuestions.map((question) => question.questionId)
    const optionOrderByQuestion = Object.fromEntries(selectedQuestions.map((question) => [question.questionId, shuffle(optionKeys)]))
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
    setActiveTestId(testId)
    setActiveSessionId(session.id)
    setView('taking-test')
  }

  /**
   * Completes a session after adding the newest question response.
   */
  function recordAnswer(sessionId: string, response: ResponseRecord) {
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
        completed_at: session.completedAt,
      }
    })
    const worksheet = spreadsheet.utils.json_to_sheet(rows)
    const workbook = spreadsheet.utils.book_new()
    spreadsheet.utils.book_append_sheet(workbook, worksheet, 'DEAP Results')
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
            <button key={itemView} className={view === itemView ? 'active' : ''} type="button" onClick={() => setView(itemView)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <UserFooter currentUser={currentUser} theme={theme} onToggleTheme={toggleTheme} onLogout={() => setCurrentUser(undefined)} />
      </aside>

      <main className={usesManagementWorkspace ? 'workspace' : 'employee-workspace'}>
        {view === 'dashboard' && <Dashboard tests={tests} questions={questions} sessions={sessions} users={users} />}
        {view === 'questions' && <QuestionBank questions={questions} query={query} setQuery={setQuery} onImport={handleImport} />}
        {view === 'tests' && <TestsPanel tests={tests} questions={questions} onCreate={createAssessment} onDelete={deleteAssessment} onTake={startTest} />}
        {view === 'employees' && <EmployeesPanel users={users} sessions={sessions} onResetPassword={resetUserPassword} onToast={setToast} />}
        {view === 'analytics' && <Analytics sessions={sessions} users={users} questions={questions} tests={tests} />}
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
        {view === 'my-tests' && <MyTests currentUser={currentUser} tests={tests} sessions={sessions} onStart={startTest} />}
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
  query,
  setQuery,
  onImport,
}: {
  questions: Question[]
  query: string
  setQuery: (value: string) => void
  onImport: (file?: File) => void
}) {
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
          name: documentNameFromBatch(batchId),
          total: documentQuestions.length,
          easy: documentQuestions.filter((question) => question.difficulty === 'Easy').length,
          medium: documentQuestions.filter((question) => question.difficulty === 'Medium').length,
          hard: documentQuestions.filter((question) => question.difficulty === 'Hard').length,
          definite: documentQuestions.filter((question) => !question.partialAnswer1 && !question.partialAnswer2).length,
          curve: documentQuestions.filter((question) => question.partialAnswer1 || question.partialAnswer2).length,
          topics: sortedTopics.slice(0, 6),
        }
      })
      .filter((summary) => `${summary.name} ${summary.topics.map(([topic]) => topic).join(' ')}`.toLowerCase().includes(normalizedQuery))
      .sort((left, right) => right.total - left.total)
  }, [questions, query])
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
        {documentSummaries.map((summary) => (
          <article className="document-card" key={summary.batchId}>
            <header>
              <FileSpreadsheet size={22} />
              <div>
                <h2>{summary.name}</h2>
                <p>{summary.total.toLocaleString()} imported question(s)</p>
              </div>
            </header>
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
        ))}
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
  onCreate,
  onDelete,
  onTake,
}: {
  tests: Assessment[]
  questions: Question[]
  onCreate: (form: FormData) => void
  onDelete: (testId: string) => void
  onTake: (testId: string) => void
}) {
  const defaultStart = toDateTimeLocal(new Date())
  const defaultEnd = toDateTimeLocal(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7))
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

function Analytics({ sessions, users, questions }: { sessions: TestSession[]; users: User[]; questions: Question[]; tests: Assessment[] }) {
  const { cohortData, topicData, trendData } = useMemo(() => {
    const completed = sessions.filter((session) => session.status === 'completed')
    const completedByUser = completed.reduce((map, session) => {
      const existing = map.get(session.userId) ?? []
      existing.push(session)
      map.set(session.userId, existing)
      return map
    }, new Map<string, TestSession[]>())
    const topicQuestionIds = questions.reduce((map, question) => {
      const existing = map.get(question.topicTag) ?? new Set<string>()
      existing.add(question.questionId)
      map.set(question.topicTag, existing)
      return map
    }, new Map<string, Set<string>>())
    const responses = completed.flatMap((session) => session.responses)
    return {
      cohortData: users
        .filter((user) => user.role === 'employee')
        .map((user) => {
          const userSessions = completedByUser.get(user.id) ?? []
          const average = userSessions.length ? userSessions.reduce((total, session) => total + Number(session.percentage), 0) / userSessions.length : 0
          const responseTimes = userSessions.flatMap((session) => session.responses.map((response) => response.responseTime))
          const speed = responseTimes.length ? responseTimes.reduce((total, value) => total + value, 0) / responseTimes.length : 0
          return { name: user.fullName.split(' ')[0], score: Number(average.toFixed(2)), speed: Number(speed.toFixed(1)), department: user.department }
        }),
      topicData: topics.map((topic) => {
        const topicIds = topicQuestionIds.get(topic) ?? new Set<string>()
        const topicResponses = responses.filter((response) => topicIds.has(response.questionId))
        const average = topicResponses.length ? topicResponses.reduce((total, response) => total + Number(response.marksEarned), 0) / topicResponses.length : 0
        return { topic, score: Number((average * 100).toFixed(0)) }
      }),
      trendData: completed.map((session, index) => ({ attempt: index + 1, score: Number(session.percentage) })),
    }
  }, [questions, sessions, users])

  return (
    <section>
      <PageTitle eyebrow="Analytics" title="Performance intelligence dashboard" />
      <div className="analytics-grid">
        <section className="panel">
          <h2>Topic performance</h2>
          <ResponsiveContainer height={270}>
            <BarChart data={topicData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#1B3A6B" radius={[6, 6, 0, 0]} />
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
              <Scatter data={cohortData} fill="#F0A500" />
            </ScatterChart>
          </ResponsiveContainer>
        </section>
        <section className="panel wide">
          <h2>Cohort trend</h2>
          <ResponsiveContainer height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attempt" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#2E75B6" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
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
            <div className="permission-matrix">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    {permissionCatalog.map((permission) => (
                      <th key={permission.key}>{permission.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.displayName}</strong>
                        <small>{user.jobRole}</small>
                      </td>
                      {permissionCatalog.map((permission) => {
                        const isAdminRow = user.role === 'super_admin' || user.role === 'admin'
                        const checked = isAdminRow ? true : (permissions[user.id]?.[permission.key] ?? defaultPermissionsFor(user)[permission.key])
                        return (
                          <td className={isAdminRow ? 'locked-permission' : ''} key={permission.key}>
                            <label className="toggle-cell">
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isAdminRow}
                                onChange={(event) => onSetPermission(user.id, permission.key, event.target.checked)}
                              />
                              <span>{isAdminRow ? 'Always on' : checked ? 'On' : 'Off'}</span>
                            </label>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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

function MyTests({ currentUser, tests, sessions, onStart }: { currentUser: User; tests: Assessment[]; sessions: TestSession[]; onStart: (testId: string) => void }) {
  const assigned = tests.filter((test) => test.status === 'Live' && test.assignedUserIds.includes(currentUser.id))
  const [pendingTest, setPendingTest] = useState<Assessment>()
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const totalMinutes = pendingTest ? pendingTest.questionCount : 0
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
                <small>{test.questionCount} questions · {availability.detail}</small>
              </div>
              {completed ? (
                <span className={completed.passed ? 'score-badge pass' : 'score-badge fail'}>{completed.score} / {completed.maxScore}</span>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  disabled={!availability.canStart}
                  title={availability.canStart ? 'Open test instructions' : availability.detail}
                  onClick={() => {
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
            <p>{pendingTest.description}</p>
            <div className="pretest-facts">
              <span><strong>{pendingTest.questionCount}</strong> Questions</span>
              <span><strong>60 sec</strong> Per question</span>
              <span><strong>{totalMinutes} min</strong> Maximum time</span>
              <span><strong>MCQ</strong> Five options each</span>
              <span><strong>5 sec</strong> Autosave heartbeat</span>
            </div>
            <div className="instruction-box">
              <h3>Before you begin</h3>
              <ul>
                <li>Each question appears one at a time with a countdown timer.</li>
                <li>Your question set is randomly selected only after you tick this agreement and click Start the test.</li>
                <li>The live test draws randomly from the approved 1,500-question bank to reduce cheating risk.</li>
                <li>Some questions have one definite correct answer; others may award partial marks on a curve.</li>
                <li>Your score combines answer accuracy and response speed.</li>
                <li>You cannot go back after submitting an answer, so read carefully before choosing.</li>
                <li>If the timer expires, the question is submitted as unanswered.</li>
                <li>Your progress is saved every few seconds, but the question timer continues even if the internet connection shakes.</li>
                <li>HR should guide the test administration in the office. The test should be monitored through Google Meet with the user's screen shared and camera/video on.</li>
              </ul>
            </div>
            <p className="encouragement">Take a breath. Read calmly, answer confidently, and do your best.</p>
            <label className="agreement-row">
              <input type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} />
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
            return [test?.name ?? 'Assessment', `${session.score} / ${session.maxScore}`, `${session.percentage}%`, session.passed ? 'Pass' : 'Fail', new Date(session.completedAt ?? '').toLocaleString()]
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
  onComplete,
}: {
  session: TestSession
  test?: Assessment
  questions: Question[]
  currentUser: User
  onAnswer: (sessionId: string, response: ResponseRecord) => void
  onAutosave: (sessionId: string) => void
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
  const submittedRef = useRef('')

  useEffect(() => {
    submittedRef.current = ''
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
    onAnswer(session.id, scoreQuestion(currentQuestion, option, remaining))
    const isFinal = currentIndex + 1 >= (test?.questionCount ?? sessionQuestions.length)
    if (isFinal) window.setTimeout(onComplete, 150)
  }

  if (!currentQuestion || !test) return <EmptyState title="No question available" body="This session cannot continue because the question set is unavailable." />

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (seconds / 60) * circumference
  const timerClass = seconds <= 10 ? 'danger' : seconds <= 20 ? 'warning' : ''
  const optionOrder = currentQuestion ? (session.optionOrderByQuestion?.[currentQuestion.questionId] ?? optionKeys) : optionKeys

  return (
    <section className="test-delivery">
      <div className="test-progress">
        <div style={{ width: `${(currentIndex / test.questionCount) * 100}%` }} />
      </div>
      <header>
        <span>Question {currentIndex + 1} of {test.questionCount}</span>
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
        <h1>{currentQuestion.questionText}</h1>
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
        <h1>{session.score} / {session.maxScore}</h1>
        <p>{session.percentage}%</p>
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
                <summary>Q{index + 1}: {response.marksEarned} mark(s) earned</summary>
                <p>{question?.questionText}</p>
                <p>Your answer: {response.selectedOption ?? 'No answer'} · Correct answer: {question?.correctAnswer}</p>
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
