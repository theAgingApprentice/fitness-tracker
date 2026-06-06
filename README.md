# fitness-tracker

> **STATUS: Being extracted from InternalWebServer — not yet independently deployed**
>
> The app is currently live at [https://mitchellnet.local/fitness/](https://mitchellnet.local/fitness/) but is still served from the InternalWebServer repo. This repository will own the standalone service once extraction is complete.

## Project overview

`fitness-tracker` is a Flask-based fitness tracking web application backed by a MariaDB database. It is currently embedded in the InternalWebServer repository and is being extracted into its own standalone service following the MitchellNET service architecture pattern.

## Planned architecture

- Flask backend with a MariaDB database
- Deployed as a Docker container joining the `mitchellnet` network
- Accessible at [https://mitchellnet.local/fitness/](https://mitchellnet.local/fitness/) via an NGINX proxy
- Internal service port: `5000`
- MariaDB data volume will be migrated from the existing `mariadb-prod` container
- API paths will change from `/api` to `/fitness/api` to avoid namespace collisions

## Extraction plan

The migration will follow the steps from `docs/ARCHITECTURE.md` Section 8:

1. Create the standalone repository structure
2. Write the `Dockerfile`
3. Write `docker-compose.yml`
4. Set up CI/CD
5. Update API paths in `app.js`
6. Deploy alongside the existing stack
7. Migrate MariaDB data
8. Update NGINX routing
9. Verify the extracted service
10. Remove the embedded implementation from InternalWebServer

## Development workflow

All changes will go through pull requests using `aaGitPromote` and `aaGitCleanupBranches`. For the full developer workflow documentation, see `mitchellnet-infra/docs/runbook.md`.

## MitchellNET context

- `mitchellnet-infra` contains the overall MitchellNET architecture
- `InternalWebServer` contains the current embedded implementation of this app
