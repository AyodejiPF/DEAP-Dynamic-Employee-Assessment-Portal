CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'employee');
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE option_key AS ENUM ('a', 'b', 'c', 'd', 'e');
CREATE TYPE test_status AS ENUM ('draft', 'live', 'archived');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned', 'expired');
CREATE TYPE analytics_event_type AS ENUM (
  'login_success',
  'login_failed',
  'logout',
  'view_change',
  'test_instructions_opened',
  'test_agreement_checked',
  'test_started',
  'test_resumed',
  'answer_submitted',
  'hint_opened',
  'answer_revealed',
  'autosave_heartbeat',
  'test_completed',
  'question_import',
  'test_created',
  'test_deleted',
  'question_bank_deleted',
  'password_reset',
  'permission_changed',
  'bulk_permission_changed',
  'logo_updated',
  'logo_restored',
  'export_results'
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  display_name VARCHAR(180),
  description VARCHAR(600),
  imported_by UUID REFERENCES users(id),
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_question_id VARCHAR(120) UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  difficulty question_difficulty NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT NOT NULL,
  correct_answer option_key NOT NULL,
  partial_answer_1 option_key,
  partial_answer_2 option_key,
  correct_weight NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  partial_weight_1 NUMERIC(4,2),
  partial_weight_2 NUMERIC(4,2),
  topic_tag VARCHAR(100),
  explanation TEXT,
  bloom_level VARCHAR(50),
  import_batch_id UUID REFERENCES import_batches(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (char_length(question_text) <= 500),
  CHECK (correct_weight > 0 AND correct_weight <= 1),
  CHECK (partial_weight_1 IS NULL OR partial_weight_1 < correct_weight),
  CHECK (partial_weight_2 IS NULL OR partial_weight_2 < correct_weight)
);

CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500),
  question_count INTEGER NOT NULL CHECK (question_count IN (20, 40, 60)),
  difficulty question_difficulty,
  mixed_difficulty BOOLEAN NOT NULL DEFAULT false,
  question_bank_id UUID REFERENCES import_batches(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  allow_reattempt BOOLEAN NOT NULL DEFAULT false,
  show_results BOOLEAN NOT NULL DEFAULT true,
  pass_mark NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  status test_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, user_id)
);

CREATE TABLE test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id),
  user_id UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  question_ids JSONB NOT NULL DEFAULT '[]',
  option_order_by_question JSONB NOT NULL DEFAULT '{}',
  current_question_started_at TIMESTAMPTZ,
  current_question_deadline_at TIMESTAMPTZ,
  last_saved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_score NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_possible_score NUMERIC(6,2) NOT NULL,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  status session_status NOT NULL DEFAULT 'in_progress'
);

CREATE TABLE question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_option option_key,
  seconds_remaining SMALLINT NOT NULL CHECK (seconds_remaining >= 0 AND seconds_remaining <= 60),
  answer_weight NUMERIC(4,2) NOT NULL,
  time_decay_multiplier NUMERIC(4,2) NOT NULL,
  hint_used BOOLEAN NOT NULL DEFAULT false,
  answer_revealed BOOLEAN NOT NULL DEFAULT false,
  score_penalty_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
  response_time_seconds SMALLINT NOT NULL DEFAULT 0,
  marks_earned NUMERIC(5,2) NOT NULL,
  submitted_at TIMESTAMPTZ,
  UNIQUE (session_id, question_id)
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type analytics_event_type NOT NULL,
  user_id UUID REFERENCES users(id),
  test_id UUID REFERENCES tests(id),
  question_id UUID REFERENCES questions(id),
  question_bank_id UUID REFERENCES import_batches(id),
  department_id UUID REFERENCES departments(id),
  difficulty question_difficulty,
  topic_tag VARCHAR(100),
  value NUMERIC(12,2),
  duration_seconds INTEGER,
  outcome VARCHAR(120),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_topic ON questions(topic_tag);
CREATE INDEX idx_sessions_user ON test_sessions(user_id);
CREATE INDEX idx_sessions_test ON test_sessions(test_id);
CREATE INDEX idx_responses_session ON question_responses(session_id);
CREATE INDEX idx_responses_question ON question_responses(question_id);
CREATE INDEX idx_analytics_event_type_created ON analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_user_created ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_test_created ON analytics_events(test_id, created_at DESC);
CREATE INDEX idx_analytics_question_bank ON analytics_events(question_bank_id, created_at DESC);
CREATE INDEX idx_audit_actor_created ON audit_logs(actor_id, created_at DESC);
