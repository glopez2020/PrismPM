-- Prism PM Database Schema
-- Turso/libSQL (SQLite-compatible)
-- Run against the product Turso database (not the team coordination DB)

-- Disable FK checks during schema creation to allow any-order table creation
PRAGMA foreign_keys = OFF;

-- ============================
-- Organizations (multi-tenant)
-- ============================
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ==========
-- Users
-- ==========
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ======================
-- Organization Members
-- ======================
CREATE TABLE IF NOT EXISTS organization_members (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'pm', 'viewer')) DEFAULT 'pm',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(organization_id, user_id)
);

-- ==========
-- Projects
-- ==========
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'cancelled')),
  start_date TEXT,
  end_date TEXT,
  budget_total REAL NOT NULL DEFAULT 0,
  budget_spent REAL NOT NULL DEFAULT 0,
  pm_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_pm ON projects(pm_id);

-- ============
-- Schedules (milestones)
-- ============
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  planned_start TEXT,
  planned_end TEXT,
  actual_start TEXT,
  actual_end TEXT,
  progress_pct REAL NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_schedules_project ON schedules(project_id);

-- =============
-- Project Tasks
-- =============
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  estimated_hours REAL,
  actual_hours REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_schedule ON project_tasks(schedule_id);

-- =================
-- Budget Line Items
-- =================
CREATE TABLE IF NOT EXISTS budget_line_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('materials', 'labour', 'equipment', 'permits', 'other')),
  description TEXT NOT NULL DEFAULT '',
  allocated REAL NOT NULL DEFAULT 0,
  spent REAL NOT NULL DEFAULT 0,
  committed REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_budget_project ON budget_line_items(project_id);

-- ==============
-- Daily Reports
-- ==============
CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by TEXT NOT NULL REFERENCES users(id),
  raw_text TEXT NOT NULL,
  parsed_data TEXT,  -- JSON from AI
  report_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_parse' CHECK (status IN ('pending_parse', 'parsed', 'error')),
  ai_confidence REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_date ON daily_reports(report_date);

-- ============
-- Risk Flags
-- ============
CREATE TABLE IF NOT EXISTS risk_flags (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('schedule', 'budget', 'supplier', 'resource', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK (source IN ('ai_detected', 'pm_manual')) DEFAULT 'ai_detected',
  source_report_id TEXT REFERENCES daily_reports(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  resolved_at TEXT,
  resolved_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_risks_project ON risk_flags(project_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risk_flags(status);

-- ============
-- Suppliers
-- ============
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);

-- =======================
-- Supplier Communications
-- =======================
CREATE TABLE IF NOT EXISTS supplier_communications (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('quote_request', 'quote_received', 'order', 'delivery_update', 'general')),
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  ai_generated INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'needs_review', 'sent', 'received')),
  pm_approved_at TEXT,
  pm_approved_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comms_project ON supplier_communications(project_id);
CREATE INDEX IF NOT EXISTS idx_comms_supplier ON supplier_communications(supplier_id);

-- ==============
-- PM Approvals
-- ==============
CREATE TABLE IF NOT EXISTS pm_approvals (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('schedule_change', 'budget_change', 'supplier_comms', 'risk_action')),
  proposal_data TEXT NOT NULL,  -- JSON
  options TEXT,                 -- JSON array
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  pm_decision TEXT,             -- JSON
  pm_id TEXT REFERENCES users(id),
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_approvals_project ON pm_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON pm_approvals(status);

-- ============
-- Sessions (Auth)
-- ============
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Re-enable foreign key enforcement
PRAGMA foreign_keys = ON;