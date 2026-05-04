# AGENTS.md - PractiOS Project Instructions

## 🔴 MANDATORY: Read Docker Compose BEFORE Any Commands

**AT THE START OF EVERY SESSION, BEFORE RUNNING ANY COMMANDS:**
1. Read `docker-compose.yml` to understand the full environment
2. Read `.env` to check service configuration
3. Run `docker ps` to see running containers
4. ONLY THEN proceed with development tasks

**NEVER assume this is a standard (non-Docker) setup. NEVER run `npm run dev` directly on host.**

---

## Environment: Dockerized Development

This project uses Docker containers for ALL services. Managed via `docker-compose.yml`.

### Service Overview (from docker-compose.yml)

| Service | Image | Container Port | Host Port | Notes |
|---------|-------|----------------|-----------|-------|
| **nginx** | nginx:alpine | 4000 | 4000 | Reverse proxy |
| **app** | built from `Dockerfile` | 3000 (Next.js default) | — | Next.js app, env vars from `.env` |
| **postgres** | postgres:16-alpine | 5432 | 5433 | PostgreSQL 16, healthcheck enabled |
| **pgbackup** | postgres:16-alpine | — | — | Daily cron backups to `/backups` |

### Networks & Volumes
- Network: `practios_network` (bridge driver)
- Volumes:
  - `postgres_data` — database persistence
  - `pgbackups` — database backups
  - `uploads_data` — app uploads (mounted to `/app/uploads`)

---

## Correct Commands (Dockerized)

| Action | Command |
|--------|---------|
| Start all services | `docker compose up -d` |
| Stop all services | `docker compose down` |
| View all logs | `docker compose logs -f` |
| View app logs | `docker compose logs -f app` |
| View DB logs | `docker compose logs -f postgres` |
| Restart app | `docker compose restart app` |
| Run migrations | `docker exec -it practios_app npm run prisma:migrate` |
| Generate Prisma client | `docker exec -it practios_app npm run prisma:generate` |
| Access database | `docker exec -it practios_db psql -U postgres practios` |
| Check DB ready | `docker exec -it practios_db pg_isready -U postgres` |
| Run seed script | `docker exec -it practios_app npx tsx prisma/seed.ts` |
| Check running containers | `docker ps` |
| Rebuild app image | `docker compose up -d --build app` |

---

## Development Practices

### ✅ DO:
- Use `docker exec -it practios_app <command>` for in-container operations
- Check `docker ps` first if a port seems "in use"
- Use `docker compose logs -f` to debug issues
- Read `docker-compose.yml` before starting/stopping services
- Reference `.env` for environment variables (DATABASE_URL, SMTP_*, etc.)

### ❌ DON'T:
- Run `npm run dev` directly on host — use `docker compose up`
- Connect to DB directly without checking Docker setup
- Assume standard ports (app uses nginx on 4000, DB on 5433)
- Kill/restart processes directly — use `docker compose` commands
- Forget nginx is the entry point (port 4000), not the Next.js app directly

---

## Debugging Tips

### Port Already in Use (EADDRINUSE)
```bash
# Check which containers are using ports
docker ps

# Fix: restart services cleanly
docker compose down && docker compose up -d
```

### Database Connection Issues
```bash
# Check DB logs
docker compose logs postgres

# Verify DB is ready
docker exec -it practios_db pg_isready -U postgres

# Connect directly
docker exec -it practios_db psql -U postgres practios
```

### App Not Responding (500 Errors)
```bash
# Check app logs
docker compose logs -f app

# Check nginx logs
docker compose logs -f nginx

# Restart app container
docker compose restart app

# Rebuild if needed
docker compose up -d --build app
```

### Stale Containers / Processes
```bash
# Kill ALL practios-related containers
docker compose down

# Start fresh
docker compose up -d

# Check what's actually running
docker ps
```

---

## Project-Specific Notes

- **Node.js version**: >=20.19.0 (defined in package.json)
- **Prisma schema**: `prisma/schema.prisma`
- **Auth**: Lucia Auth with PostgreSQL session store
- **Build system**: Next.js 14.2.35
- **Reverse proxy**: nginx on port 4000 (see `nginx.conf`)
- **External access**: Configured via `EXTERNAL_HOST` env var (default: localhost)
- **IMPORTANT**: Always read `docker-compose.yml` before running commands!

---

## Session Startup Checklist

At the start of EVERY session, verify:
- [ ] Read `docker-compose.yml` to understand current environment
- [ ] Read `.env` to check service configurations
- [ ] Run `docker ps` to see running containers
- [ ] Run `docker compose logs -f` to check for errors
- [ ] ONLY THEN proceed with development tasks

**If you skip these steps, you will "go rogue" and try to run commands directly on host.**
