-- CrimeGPT-X Database Initialization
-- Ahmedabad Cyber Crime Branch
--
-- Runs as a postgres docker-entrypoint-initdb.d script — i.e. BEFORE the
-- backend has connected and created any tables. Only put statements here
-- that don't reference application tables (indexes, seed data, views live
-- in app/core/seed.py instead, which runs after Base.metadata.create_all
-- on backend startup — for both docker-compose and Railway, where this
-- init script never runs at all since it's not a Docker Postgres).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fast text search
