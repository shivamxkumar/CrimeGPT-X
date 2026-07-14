-- CrimeGPT Database Initialization
-- Ahmedabad Cyber Crime Branch

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fast text search

-- Full-text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cases_fts ON cases
USING gin(to_tsvector('english', coalesce(victim_name,'') || ' ' || coalesce(accused_name,'') || ' ' || coalesce(incident_description,'')));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_diary_case ON diary_entries(case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ── Seed Data ─────────────────────────────────────

-- Demo Users (passwords: demo1234 → bcrypt)
-- Hash generated with: passlib.hash.bcrypt("demo1234")
INSERT INTO users (id, badge_number, name, email, phone, hashed_password, role, police_station, rank, is_active, is_verified)
VALUES
  (uuid_generate_v4(), 'AHM-24-IO-047', 'SI Rajesh Sharma', 'rajesh.sharma@gujaratpolice.gov.in', '9825100047', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMdkBHtlCYzrBkFJqNkUmxLq', 'io', 'Ahmedabad Cyber Crime Branch', 'Sub-Inspector', true, true),
  (uuid_generate_v4(), 'AHM-23-SHO-012', 'DySP Amit Patel', 'amit.patel@gujaratpolice.gov.in', '9825100012', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMdkBHtlCYzrBkFJqNkUmxLq', 'sho', 'Ahmedabad Cyber Crime Branch', 'Deputy Superintendent', true, true),
  (uuid_generate_v4(), 'LEG-24-001', 'Adv. Priya Mehta', 'priya.mehta@gujaratpolice.gov.in', '9825100001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMdkBHtlCYzrBkFJqNkUmxLq', 'legal', 'Legal Cell, HQ', 'Legal Advisor', true, true),
  (uuid_generate_v4(), 'ADM-24-001', 'Admin Saurabh Shah', 'admin@gujaratpolice.gov.in', '9825100000', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMdkBHtlCYzrBkFJqNkUmxLq', 'admin', 'HQ Gandhinagar', 'System Administrator', true, true),
  (uuid_generate_v4(), 'AHM-24-IO-053', 'SI Anita Verma', 'anita.verma@gujaratpolice.gov.in', '9825100053', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMdkBHtlCYzrBkFJqNkUmxLq', 'io', 'Ahmedabad Cyber Crime Branch', 'Sub-Inspector', true, true)
ON CONFLICT (badge_number) DO NOTHING;

-- Sample view: Active Cases Summary
CREATE OR REPLACE VIEW v_active_cases_summary AS
SELECT
    c.case_id,
    c.fir_number,
    c.crime_category,
    c.status,
    c.priority,
    c.victim_name,
    c.accused_name,
    c.amount_defrauded,
    u.name AS io_name,
    c.created_at,
    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) AS evidence_count,
    (SELECT COUNT(*) FROM documents d WHERE d.case_id = c.id) AS document_count
FROM cases c
JOIN users u ON c.io_officer_id = u.id
WHERE c.status != 'closed';

COMMENT ON TABLE cases IS 'Core case registry — single source of truth for all investigation data';
COMMENT ON TABLE evidence IS 'Digital evidence with SHA-256 integrity hashing and chain of custody';
COMMENT ON TABLE documents IS 'AI-generated legal documents (chargesheet, remand, panchanama etc.)';
COMMENT ON TABLE diary_entries IS 'Automated and manual investigation timeline entries';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system actions';
