# Skill-Stacker

A professional CV builder — create, preview, and export resumes in 7 templates.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript 5.9
- **PostgreSQL 16** (dockerized) via the `pg` driver
- **Tailwind CSS v4**
- **Vitest** (unit) + **Playwright** (e2e)
- **Biome** (lint/format)
- **zod** (validation)

## Features

- 7 CV templates: Classic, Executive, Modern, Minimal, Creative, Two-Column, Academic
- Per-template colour themes and font pairs (MS Word-style)
- Live template preview on the "New CV" page
- Photo upload (two-column + academic templates)
- Multi-page PDF and Word (DOCX) export
- Auto-save (30s debounce) with save indicator
- Version history — up to 20 saved versions per CV, with restore
- AI CV Tailoring — tailor your CV to a job ad via Ollama (SSE live diffs)

## AI CV Tailoring

Tailor your CV to a specific job ad from the edit page:

1. Paste a job-ad URL (scraped with Playwright's chromium) or raw job text
2. The `/api/tailor` SSE pipeline runs **scrape → extract → tailor → diff** in real time
3. Review proposed rewrites in the panel and **Apply** or **Reject** each diff
4. A guard flags proposed content that introduces facts not in your CV

Backed by Ollama. Configuration lives in `.env` (defaults shown):

```env
LLM_BASE_URL=http://100.85.216.53:11434
LLM_MODEL_EXTRACT=qwen2.5-coder:14b
LLM_MODEL_TAILOR=mistral:7b
LLM_MODEL=llama3.1:8b
```

## Getting Started

The project runs fully in Docker.

```bash
# Start the stack (Postgres + app)
docker compose up -d --build app

# App is available at
open http://localhost:5252

# Health check
curl http://localhost:5252/api/health
```

## Docker Commands

| Action | Command |
|--------|---------|
| Start services | `docker compose up -d` |
| View logs | `docker compose logs -f app` |
| Restart app | `docker compose restart app` |
| Rebuild app | `docker compose up -d --build app` |
| Run linter | `docker compose exec app npm run lint` |
| Run unit tests | `docker compose exec app npm run test` |
| Run e2e tests | `docker compose exec app npm run test:e2e` |

> **Note:** Do not run `npm` commands directly on the host — use the Docker commands above.

## Database

- PostgreSQL 16 (`postgres:16-alpine`), database `cvbuilder`
- Schema lives in `app/lib/db.ts` (tables: `cvs`, `cv_photos`, `cv_versions`, and CV content tables)
- Data persists in the `postgres_data` named volume

## Environment

Configuration lives in `.env` (see `docker-compose.yml` for defaults):

```env
DB_HOST=db
DB_PORT=5432
DB_NAME=cvbuilder
DB_USER=postgres
DB_PASSWORD=postgres
HOST_PORT=5252
LOG_LEVEL=info
```

## Development logging

Server flow logging is gated by `LOG_LEVEL` (`debug | info | warn | error`, default `info`). Set it in `.env` or override per-run (`LOG_LEVEL=warn docker compose up -d --force-recreate app`) to silence info/debug flow lines in `docker compose logs -f app`.