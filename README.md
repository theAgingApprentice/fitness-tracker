# Fitness Tracker

> **STATUS: LIVE at https://mitchellnet.local/fitness/**

A Flask-based fitness tracking application with a MariaDB database. Tracks daily activities on a calendar interface.

## URL

- **App:** https://mitchellnet.local/fitness/
- **API base path:** `/fitness/api/`
- **Admin:** https://mitchellnet.local/fitness/admin.html

## Structure

```
fitness-tracker/
├── app/                    # Flask backend
│   ├── app.py
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Static HTML/CSS/JS
│   ├── index.html
│   ├── admin.html
│   ├── css/
│   └── js/
├── database/
│   ├── structure/          # Schema + seed SQL (run in order: units, activities, activityLog)
│   └── migrations/         # Future schema migrations
└── docker-compose.yml
```

## Deployment

The app runs fully in production on the Ubuntu server at `192.168.2.10`.

| Component | Details |
|-----------|---------|
| Flask app | Docker container, `mitchellnet` Docker network |
| MariaDB | Separate container, `fitness-internal` network (not exposed externally) |
| NGINX proxy | Routes `/fitness/` using Approach A (trailing slash on `proxy_pass`) — see mitchellnet-infra runbook |
| CI/CD | GitHub Actions deploys automatically on every merged PR |
| Build | `docker compose build --no-cache` runs on every deploy |

### First-time setup on the server

```bash
cd /home/andrew/services/fitness-tracker
cp .env.example .env
# Edit .env with production credentials
docker compose up -d
```

### Data migration note

The `database/structure/` SQL files contain both schema and seed data (670+ activity log entries). On first deployment, MariaDB runs these automatically via `docker-entrypoint-initdb.d`. Run them in order: `units.sql` → `activities.sql` → `activityLog.sql`. For subsequent schema changes, use `database/migrations/`.

## Development workflow

See [mitchellnet-infra/docs/runbook.md](../mitchellnet-infra/docs/runbook.md) for the full local development setup, NGINX proxy configuration, and service management procedures.

## Environment variables

See [.env.example](.env.example) for all required variables.
