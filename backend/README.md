# Trackwise FastAPI Backend

This backend is an additive API for the existing React/TanStack railway operations prototype. It does not replace the current simulated UI or Supabase realtime client.

## Run locally

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health`.
OpenAPI docs: `http://localhost:8000/docs`.

## Configuration

Set `DATABASE_URL` to enable the SQLAlchemy session factory. `SUPABASE_URL` and `SUPABASE_KEY` are included for Supabase integration configuration; the current repository uses an in-memory adapter when no database is configured, making local development deterministic.

Set `VITE_API_URL=http://localhost:8000/api` in the frontend environment to use the typed Axios services under `src/services/api`. Existing routes remain unchanged until they explicitly opt into a service.

## API groups

- `/api/trains`, `/api/tracks`, `/api/signals`, `/api/stations`, `/api/issues`
- `/api/scheduling/recommend`
- `/api/analytics`
- `/api/health`
- `/api/optimizer/platform`, `/api/optimizer/track`, `/api/optimizer/block`, `/api/optimizer/conflicts`, `/api/optimizer/schedule`
- `/api/predict/delay`

Pandas analytics and reporting endpoints:

- `GET /api/analytics/tms`, `/api/analytics/smms`, `/api/analytics/tdms`
- `GET /api/analytics/summary?period=daily|weekly|monthly`
- `POST /api/import/csv` with `tracks.csv`, `signals.csv`, `power.csv`, or `issues.csv`
- `GET /api/export/excel`

The AI engine uses OR-Tools CP-SAT for resource allocation and schedule optimization. The delay module uses a bounded `RandomForestRegressor` trained from supplied historical rows or a deterministic sample dataset for local development. Run `pytest` from `backend/` to execute the allocator and prediction smoke tests.

Authentication is available at `POST /api/auth/token` for local development. The development password is `change-me`; replace this endpoint with Supabase Auth or an enterprise identity provider before production. `require_roles(...)` provides the role-based dependency used to protect future command endpoints.

The scheduling module is deterministic and explainable. It returns resource selections, conflict warnings, and a delay-risk score; it is a decision-support prototype and must not be connected directly to safety-critical railway control systems.
