# AGENTS.md - Skill-Stacker Project Instructions

## 🔴 MANDATORY: Read This Before Any Commands

**AT THE START OF EVERY SESSION, BEFORE RUNNING ANY COMMANDS:**
1. Read `docker-compose.yml` to understand the full environment
2. Read `.env` to check service configuration
3. Run `docker ps` to see running containers
4. Check if port 5252 is in use, use different port if needed
5. Run `docker compose logs -f` to check for errors
6. ONLY THEN proceed with development tasks

**NEVER assume this is a standard (non-Docker) setup. NEVER run `npm` commands directly on host.**

---

## Environment: Dockerized Development

This project uses Docker containers for ALL services. Managed via `docker-compose.yml`.

### Service Overview

| Service | Image | Container Port | Host Port | Notes |
|---------|-------|----------------|-----------|-------|
| **db** | `postgres:16-alpine` | 5432 | — (internal only) | PostgreSQL 16, database `cvbuilder` |
| **app** | built from `Dockerfile` | 5252 | 5252 | Next.js app (production) |

### Networks & Volumes
- Network: `skill-stacker-network` (bridge driver)
- Volume: `postgres_data` — PostgreSQL data persistence
- Bind mounts: `./scripts` (ro), `./uploads` (file uploads)

> **Database is PostgreSQL 16**, accessed directly via the `pg` driver (`app/lib/db.ts`). There is no Prisma and no SQLite.

---

## Correct Commands (Dockerized)

| Action | Command |
|--------|---------|
| Start services | `docker compose up -d` |
| Stop services | `docker compose down` |
| View all logs | `docker compose logs -f` |
| View app logs | `docker compose logs -f app` |
| Restart app | `docker compose restart app` |
| Rebuild app image | `docker compose up -d --build app` |
| Check running containers | `docker ps` |
| Access app shell | `docker exec -it skill-stacker-app-1 sh` |

### Build Commands (via docker compose)

| Action | Command |
|--------|---------|
| Install dependencies | `docker compose build --no-cache` |
| Run linter | `docker compose exec app npm run lint` |
| Format code | `docker compose exec app npm run format --write` |

**DON'T run `npm` commands directly on host — do it via docker compose build/exec.**

---

## Development Practices

### ✅ DO:
- Use `docker compose exec app <command>` for in-container operations
- Check `docker ps` first if a port seems "in use"
- Use `docker compose logs -f` to debug issues
- Read `docker-compose.yml` before starting/stopping services
- Reference `.env` for environment variables

### ❌ DON'T:
- Run `npm run dev` or `npm run build` directly on host
- Run `npm install` directly on host
- Connect to DB directly without checking Docker setup
- Assume standard ports (app uses port 5252)
- Kill/restart processes directly — use `docker compose` commands

---

## Debugging Tips

### Port Already in Use (EADDRINUSE)
```bash
# Check if port 5252 is already in use
lsof -i :5252 || netstat -tuln | grep 5252

# Fix: use a different port on the host
HOST_PORT=5253 docker compose up -d

# Or override in .env:
# HOST_PORT=5253
```

### App Not Responding (500 Errors)
```bash
# Check app logs
docker compose logs -f app

# Rebuild if needed
docker compose up -d --build app
```

### Stale Containers / Processes
```bash
# Kill all containers
docker compose down

# Start fresh
docker compose up -d

# Check what's actually running
docker ps
```

---

## Project-Specific Notes

- **Node.js version**: >=20.x (Next.js 16, React 19)
- **Database**: PostgreSQL 16 (dockerized) — database `cvbuilder`
- **No ORM**: Direct SQL via the `pg` driver (`app/lib/db.ts`)
- **LLM Support**: disabled (AI routes removed)
- **Build system**: Next.js 16 with Turbopack
- **Entry point**: Port 5252 (no nginx reverse proxy)

### LLM Configuration (Removed)

AI endpoints were removed in Sep 2026. `.env` may still reference `LLM_*` variables, but they are inert.

---

## Session Startup Checklist

At the start of EVERY session, verify:
- [ ] Read `docker-compose.yml` to understand current environment
- [ ] Read `.env` to check service configurations
- [ ] Run `docker ps` to see running containers
- [ ] Check if port 5252 is in use, use different port if needed
- [ ] Run `docker compose logs -f` to check for errors
- [ ] ONLY THEN proceed with development tasks

**If you skip these steps, you will "go rogue" and try to run commands directly on host.**
## 📝 Changelog

**MANDATORY: Update CHANGELOG.md on every task completion.**

After any meaningful change:
1. Open `CHANGELOG.md` and add an entry under `[Unreleased]`
2. Section: Added / Changed / Fixed / Removed / Deprecated / Security
3. Format: `- YYYY-MM-DD: Brief description ([#ref](link))`
4. When changes are verified working (run tests if available), run `~/.agents/scripts/release.sh` to stamp as a versioned release
5. If no CHANGELOG.md exists, copy from `~/.agents/templates/CHANGELOG.md`
6. **Also** add a one-line summary to the central changelog at ~/projects/tailnet-changelog/CHANGELOG.md on evo
