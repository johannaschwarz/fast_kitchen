# Repository guide

## Project
- `frontend/`: React app built with Vite.
- `backend/`: Python FastAPI API.
- Keep frontend API parameters aligned with backend models and enums.
- Follow the component READMEs for setup and running the application.

## Changes
- Keep changes small and focused; follow existing conventions.
- Preserve unrelated work and avoid unnecessary dependencies.
- Never commit credentials, local configuration, or generated build files.

## Local testing setup
- Limit the local backend to one database connection (`MySQLDatabase.MAX_POOL_SIZE = 1`) because remote database connection capacity is limited. Apply this only at local startup, keep it out of commits, and run only one backend worker.
- When asked to set up local testing, run the frontend and backend locally using the component READMEs.
- Reuse an existing compatible Python virtual environment for backend commands and dependencies. Use its Python to run `-m pip install -r backend/requirements.txt` from the repo root when dependencies are missing; create a new environment only if none is usable.
- Connect the local backend to the remote database using config in `backend/assets/`. These files are excluded from Git by `.gitignore`; do not substitute a local database or force-add these files.
- Temporarily set `API_BASE` in `frontend/src/Config.js` to `http://localhost:8000/` so the frontend uses the local backend. This file is tracked by Git, so explicitly exclude this local URL change from commits.
- Never commit or push local testing overrides or credentials. Check staged changes before committing and keep the committed frontend API URL pointing to `https://api.flottekueche.de/`.

## Validation
- For frontend changes, run `npm test` and `npm run build` from `frontend/`
- Run relevant backend tests for backend changes.
- Run `git diff --check` before finishing; report any checks you could not run.

## Merge
- Always create a PR on the remote when asked to merge something and merge the PR if instructed.
- When asked to merge PRs, always delete the branch on the remote once merged.

## Release
- Frontend: bump `version` in `frontend/package.json` and update the lockfile, commit the changes, then run `task publish-fe` from the repo root.
- Backend: bump `__version__` in `backend/app.py`, commit the changes, then run `task publish-api` from the repo root.
- These commands push `fe-v*` or `api-v*` tags for the current commit and trigger deployment via GitHub Actions.
