# Fitness Tracker

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

### First-time setup on the server

```bash
cd /home/andrew/services/fitness-tracker
cp .env.example .env
# Edit .env with production credentials
docker compose up -d
```

### Routine deployment

Push to `main` or trigger the GitHub Actions workflow manually. The workflow syncs code, rebuilds the image, and restarts the container.

### Data migration note

The `database/structure/` SQL files contain both schema and seed data (670+ activity log entries from InternalWebServer). On first deployment, MariaDB runs these automatically via `docker-entrypoint-initdb.d`. Run them in order: `units.sql` → `activities.sql` → `activityLog.sql`. This is not done automatically on subsequent deployments — use `database/migrations/` for schema changes going forward.

## Development workflow

See [mitchellnet-infra/docs/runbook.md](../mitchellnet-infra/docs/runbook.md) for the full local development setup, NGINX proxy configuration, and service management procedures.

## Environment variables

See [.env.example](.env.example) for all required variables.
