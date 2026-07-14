#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CrimeGPT — One-Command Setup & Deployment Script
# Gujarat Police Cyber Crime Branch
# Usage: bash scripts/deploy.sh [dev|prod|demo]
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

MODE="${1:-demo}"
RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'
YELLOW='\033[1;33m'; NC='\033[0m'; BOLD='\033[1m'

banner() {
cat << 'EOF'
  ██████╗██████╗ ██╗███╗   ███╗███████╗ ██████╗ ██████╗ ████████╗
 ██╔════╝██╔══██╗██║████╗ ████║██╔════╝██╔════╝ ██╔══██╗╚══██╔══╝
 ██║     ██████╔╝██║██╔████╔██║█████╗  ██║  ███╗██████╔╝   ██║   
 ██║     ██╔══██╗██║██║╚██╔╝██║██╔══╝  ██║   ██║██╔═══╝    ██║   
 ╚██████╗██║  ██║██║██║ ╚═╝ ██║███████╗╚██████╔╝██║        ██║   
  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝        ╚═╝   
EOF
echo ""
echo -e "  ${CYAN}AI-Powered Crime Documentation & Legal Intelligence Platform${NC}"
echo -e "  ${BLUE}From FIR to Arrest — One Intelligent Investigation Platform${NC}"
echo -e "  ${YELLOW}KANAD S.H.I.E.L.D. 2026 · Ahmedabad Cyber Crime Branch${NC}"
echo ""
}

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
info() { echo -e "${BLUE}[i]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
step() { echo ""; echo -e "${BOLD}${CYAN}━━━ $1 ━━━${NC}"; }

banner

step "CHECKING PREREQUISITES"

command -v docker   >/dev/null 2>&1 || err "Docker not found. Install from https://docs.docker.com/engine/install/"
command -v docker compose version >/dev/null 2>&1 || err "Docker Compose v2 not found."
log "Docker: $(docker --version)"
log "Docker Compose: $(docker compose version --short)"

step "ENVIRONMENT SETUP"

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    warn ".env created from .env.example"
    warn "Please set ANTHROPIC_API_KEY in .env before continuing"
  fi
fi

if [ -f ".env" ]; then
  source .env 2>/dev/null || true
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  warn "ANTHROPIC_API_KEY not set — AI features will use fallback mode"
  warn "Set it in .env to enable live Claude AI analysis"
else
  log "Anthropic API key found"
fi

step "PULLING DOCKER IMAGES"
docker compose pull --quiet 2>/dev/null || warn "Some images may build locally"

step "STARTING SERVICES"
if [ "$MODE" = "demo" ]; then
  info "Starting in DEMO mode (without pgAdmin to save resources)"
  docker compose up -d db redis chromadb minio backend frontend nginx worker
elif [ "$MODE" = "dev" ]; then
  info "Starting in DEV mode (with pgAdmin and Flower)"
  docker compose --profile dev up -d
else
  info "Starting in PRODUCTION mode"
  docker compose up -d
fi

step "WAITING FOR SERVICES"
echo -n "  Waiting for PostgreSQL"
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U crimegpt -d crimegpt_db >/dev/null 2>&1; then
    echo " ✓"; break
  fi
  echo -n "."
  sleep 2
done

echo -n "  Waiting for Backend API"
for i in {1..30}; do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    echo " ✓"; break
  fi
  echo -n "."
  sleep 2
done

step "DATABASE MIGRATIONS"
docker compose exec -T backend alembic upgrade head 2>/dev/null && log "Migrations applied" || warn "Migration skipped (DB may already be up to date)"

step "SEEDING DATA"
info "Seeding ChromaDB with landmark judgments..."
docker compose exec -T backend python scripts/seed_chroma.py 2>/dev/null && log "ChromaDB seeded" || warn "ChromaDB seed skipped (may already be seeded)"

info "Applying database seed (demo users + views)..."
docker compose exec -T db psql -U crimegpt -d crimegpt_db -f /docker-entrypoint-initdb.d/init.sql 2>/dev/null && log "DB seed applied" || warn "DB seed skipped"

step "HEALTH CHECK"
services=("http://localhost/health:Frontend" "http://localhost:8000/health:Backend API" "http://localhost:8001/api/v1/heartbeat:ChromaDB" "http://localhost:9000/minio/health/live:MinIO")
for entry in "${services[@]}"; do
  url="${entry%%:*}"
  name="${entry##*:}"
  if curl -sf "$url" >/dev/null 2>&1; then
    log "$name: Online"
  else
    warn "$name: May still be starting..."
  fi
done

step "DEPLOYMENT COMPLETE"
echo ""
echo -e "  ${BOLD}${GREEN}🎉 CrimeGPT is ready!${NC}"
echo ""
echo -e "  ${CYAN}Application${NC}      →  ${BOLD}http://localhost${NC}"
echo -e "  ${CYAN}Backend API${NC}      →  http://localhost:8000/api/docs"
echo -e "  ${CYAN}MinIO Console${NC}    →  http://localhost:9001"
if [ "$MODE" = "dev" ]; then
  echo -e "  ${CYAN}pgAdmin${NC}          →  http://localhost:5050"
  echo -e "  ${CYAN}Flower Monitor${NC}   →  http://localhost:5555"
fi
echo ""
echo -e "  ${BOLD}Demo Login Credentials:${NC}"
echo -e "  ${YELLOW}IO Officer${NC}  →  AHM-24-IO-047 / demo1234"
echo -e "  ${YELLOW}SHO/Supvr${NC}   →  AHM-23-SHO-012 / demo1234"
echo -e "  ${YELLOW}Legal Adv${NC}   →  LEG-24-001 / demo1234"
echo -e "  ${YELLOW}Admin${NC}       →  ADM-24-001 / demo1234"
echo ""
echo -e "  ${BOLD}Useful Commands:${NC}"
echo -e "  ${BLUE}docker compose logs -f backend${NC}  — View backend logs"
echo -e "  ${BLUE}docker compose ps${NC}               — Check service status"
echo -e "  ${BLUE}docker compose down${NC}              — Stop all services"
echo ""
echo -e "  ${DIM:-}Logs: docker compose logs -f${NC:-}"
echo ""
