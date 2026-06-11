# fitness-tracker Security Notes

**Last updated:** June 2026

---

## API Authentication

Authentication uses a static API key passed as an HTTP header.

- **Header:** `X-API-Key`
- **Value:** Set via `API_KEY` environment variable on the server
- **Comparison:** `hmac.compare_digest` (timing-safe)
- **Unset key behaviour:** Returns `500 Server misconfiguration` — fail-closed
- **Wrong key behaviour:** Returns `401 Unauthorized` — no detail leaked

### Protected endpoints

All routes registered on the `api_bp` blueprint except `/api/health`:

- `GET /api/activities`
- `GET/POST /api/activity-log`
- `PUT/DELETE /api/activity-log/<id>`
- `GET/POST/DELETE /api/items`
- `GET/POST/DELETE /api/admin/unit-types`
- `GET/POST/PUT/DELETE /api/admin/units`
- `GET/POST/PUT/DELETE /api/admin/activities`
- `GET /api/test-month` *(debug endpoint — candidate for removal in Item 5)*

### Exempt endpoints

- `GET /api/health` — Docker healthcheck compatibility
- `GET /` — serves index.html (static page load, not an API call)
- `GET /<path>` — serves static assets (JS, CSS — not API calls)

### Implementation

The `require_api_key` decorator lives at the top of `app/routes/api_routes.py`
and is applied to each protected route individually.

### Key injection into frontend

Flask serves `index.html` and `admin.html` via a helper that reads the file,
replaces `window.FITNESS_API_KEY = ''` with the live `API_KEY` value, and
returns the modified HTML. The static JS files are served normally via
`send_from_directory`. This keeps the API key out of all files in the repo.

---

## Secrets Management

| Secret | Storage | Rotation |
|---|---|---|
| `API_KEY` | `~/services/fitness-tracker/.env` on server; `.env` at repo root on Dev Machine (gitignored) | Rotate by updating both `.env` files and restarting the container |
| `DB_PASSWORD` | Same `.env` files | Rotate via MariaDB + `.env` update |
| `DB_ROOT_PASSWORD` | Same `.env` files | Rotate via MariaDB + `.env` update |

No secrets are stored in:

- Any file tracked by git
- Docker images
- GitHub Actions secrets (deploy uses rsync, not SSH credential injection)
- `.env.example` (uses `change_me_*` placeholders only)

---

## Known Remaining Issues (Phase 0)

| Item | Description |
|---|---|
| Item 4 | CORS is currently wide-open (`CORS(app)` with no origin restriction) |
| Item 5 | `/api/test-month` is a debug endpoint that should be removed |
| Item 7 | Some error responses include `str(e)` — exception detail leaks to client |
| Item 10 | `curl` not installed in container image — Docker healthcheck reports unhealthy |

These are tracked in the Phase 0 security remediation plan in
[mitchellnet-infra/docs/ARCHITECTURE.md](../mitchellnet-infra/docs/ARCHITECTURE.md).
