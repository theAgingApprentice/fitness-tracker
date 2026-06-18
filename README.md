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

---

## Development Notes

### MitchellNET Header/Footer

The app uses the shared MitchellNET header and footer fragments served by `nginx-proxy` from
`~/web_server/includes/` on the server. Both `index.html` and `admin.html` load them via the
client-side include system:

```html
<div data-include="/includes/header.html"></div>
<div data-include="/includes/footer.html"></div>
```

To update the nav or footer, edit `InternalWebServer/includes/header.html` or
`InternalWebServer/includes/footer.html` and merge via PR. All apps pick up the change
automatically — no changes required here.

### CSS

The app loads two stylesheets:

- `/css/style.css` — shared MitchellNET stylesheet (nav, footer, typography). Served by `nginx-proxy` from the `InternalWebServer` repo.
- `css/style.css` — app-specific styles (calendar, activity cards, forms). Lives in `frontend/css/style.css` in this repo.

Do not duplicate styles already in the shared stylesheet.

### Docker Health Check

The `app/Dockerfile` installs `curl` and defines a `HEALTHCHECK` targeting `/api/health`.
This is required — without `curl` in the container, Docker marks the container `unhealthy`
even when the app is working correctly.

---

## Security

### API Authentication

All `/api/*` endpoints require an `X-API-Key` header. The `/api/health` endpoint
is exempt (used by Docker healthcheck and uptime monitors).

The API key is set via the `API_KEY` environment variable on the server. It is
never committed to version control.

**Server-side key injection:** Flask injects the API key into `index.html` and
`admin.html` at request time, replacing `window.FITNESS_API_KEY = ''` with the
live key value. The frontend JS reads `window.FITNESS_API_KEY` and sends it as
the `X-API-Key` header on every fetch call. This means the key is never stored
in any file in the repository.

**Fail-closed:** If `API_KEY` is not set in the environment, the server returns
`500` on all protected endpoints rather than allowing unauthenticated access.

**Testing:** Auth tests live in `tests/test_auth.py`. Run with:

```bash
API_KEY=test-key python -m pytest tests/test_auth.py -v
```
