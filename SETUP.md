# Code On Track SIH 26 — local setup

Requirements: **Node.js 20.19+ or 22.12+** and npm.

```bash
npm install
npm run build     # optional production build check
npm run dev       # http://localhost:8080
```

- **Login:** open `/login`. The prototype accepts any employee ID and password; the selected **Role** decides the landing page (choose `Admin` for the Command Center at `/`).
- **Environment:** works with no `.env` (built-in simulated data). To connect optional services, copy `.env.example` to `.env` and fill in `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Never commit `.env`.
- **Backend (optional):** the FastAPI backend lives in `backend/` (see `backend/.env.example`). Without `VITE_API_URL` the frontend makes no backend calls.
- **Fonts:** Inter / IBM Plex Mono load from Google Fonts, so the first load needs internet access (system fonts are used otherwise).
- This is a simulation/prototype. It does not control real signals, trains or interlocking.

## Notes on the UI

- **Design system:** every page uses the CODEONTRACK dark-navy command-center theme (`.command-theme` in `src/styles.css`, applied by `MainShell`). The Admin Command Center (`/`) is the visual reference.
- **Maps are flat 2D:** the Command Center *Live corridor* (Manmad → Hazur Sahib Nanded) and the *Station Map* (NDG / Nandgaon Junction yard) are deterministic SVG maps. They need no map tiles or API keys and are labelled as simulated demo data.
- **Login:** the login system is unchanged (mock authentication; the selected role decides the landing page). The railway artwork is a vector scene in `src/components/trackwise/LoginRailwayScene.tsx`.
