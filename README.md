# Trackwise Planner

Build a realistic simulation-based web prototype called "TRACKWISE".

TRACKWISE is an AI-assisted railway maintenance block planning and optimization platform for Indian Railways.

IMPORTANT:

This is a prototype/simulation and must NOT claim to control real railway signals, trains, interlocking, Kavach, or safety-critical railway infrastructure.

The purpose of the prototype is to demonstrate how railway maintenance activities from Engineering, S&T and TRD departments can be coordinated with train schedules and available railway corridor windows.

Create a professional railway control-room style dashboard.

CORE CONCEPT:

Input:

1. Train timetable

2. Railway sections

3. Maintenance requests

4. Maintenance duration

5. Maintenance priority

6. Department

7. Available maintenance windows

8. Resource availability

Processing:

1. Validate data

2. Calculate maintenance priority

3. Detect train/block conflicts

4. Identify compatible maintenance tasks

5. Bundle compatible tasks into common blocks

6. Generate an optimized maintenance schedule

7. Show explanation for every recommendation

8. Support what-if simulation and rescheduling

SIMULATION DATA:

Create a railway corridor:

Station A ---- Section S1 ---- Station B ---- Section S2 ---- Station C ---- Section S3 ---- Station D

Create 20 simulated trains with:

- Train ID

- Train type

- Section

- arrival time

- departure time

- priority

Create 30 simulated maintenance tasks from:

- Engineering

- S&T

- TRD

Each maintenance task should have:

- task ID

- department

- section

- asset type

- duration

- criticality

- urgency

- overdue days

- required resources

- status

Create multiple available maintenance windows.

DASHBOARD:

Show KPI cards:

- Active Trains

- Pending Maintenance Tasks

- High Priority Tasks

- Planned Blocks

- Block Utilization

- Asset Availability

- Conflicts Detected

- Estimated Delay Reduction

NETWORK VIEW:

Show a visual railway corridor map using a simulated network.

Use nodes for stations and sections between stations.

Show trains and maintenance status visually.

MAINTENANCE PAGE:

Table with:

Task ID

Department

Section

Work Type

Duration

Priority

Status

Allow filtering by department, priority and section.

AI BLOCK PLANNER:

Create a large "Generate Optimized Plan" button.

When clicked, show an optimization animation:

"Reading timetable..."

"Checking maintenance requirements..."

"Checking available windows..."

"Detecting conflicts..."

"Finding compatible tasks..."

"Optimizing block allocation..."

Then display the recommended block plan.

Example:

Block B-104

Section: S1

Time: 14:00–16:00

Tasks:

Engineering Track Repair

S&T Signal Maintenance

TRD OHE Inspection

Show:

Block Utilization: 91%

Tasks Bundled: 3

Train Conflicts: 0

EXPLAINABILITY:

For each AI recommendation show:

Why selected:

✓ No train conflict

✓ High priority maintenance

✓ Required crew available

✓ Compatible maintenance tasks

✓ High block utilization

Why rejected:

✗ Train conflict

✗ Insufficient duration

✗ Resource unavailable

GANTT VIEW:

Create a professional railway timeline showing:

- Train movements

- Maintenance blocks

- Department activities

- Conflicts

- Available windows

Use different visual indicators for trains, maintenance and conflicts.

WHAT-IF SIMULATOR:

Allow user to select:

"Train Delay"

Options:

+15 minutes

+30 minutes

+60 minutes

When simulated:

1. Move the affected train

2. Detect conflict with existing maintenance block

3. Highlight conflict

4. Run simulated re-optimization

5. Recommend a new block

6. Show before/after comparison

Example:

Original:

14:00–16:00

Train delay:

+30 minutes

Conflict detected.

New recommendation:

16:30–18:30

Show reason for rescheduling.

BEFORE VS AFTER:

Create a comparison panel:

Traditional Planning:

Separate blocks: 10

Total maintenance window: 30 hours

Conflicts: 8

Block utilization: 58%

TRACKWISE Simulation:

Coordinated blocks: 6

Total maintenance window: 21 hours

Conflicts: 1

Block utilization: 86%

IMPORTANT:

Clearly label these as "SIMULATION RESULTS USING REPRESENTATIVE DATA", not actual Indian Railways statistics.

APPROVAL WORKFLOW:

After optimization show:

[Approve Plan]

[Modify]

[Reject]

Show an audit log of actions.

USER ROLES:

Admin

Controller

Engineering

S&T

TRD

Viewer

TECHNICAL REQUIREMENTS:

Use React.

Use TypeScript.

Use Tailwind CSS.

Use a professional blue/white railway control-room design.

Use responsive layout.

Use charts and interactive timeline.

Use simulated data initially.

Structure the application so a real backend/API and optimization engine can be integrated later.

Do NOT use an LLM as the actual scheduling engine.

Create the UI so that the optimization engine can later be connected to Python FastAPI + Google OR-Tools CP-SAT.

The final prototype should feel like a realistic railway operations decision-support system rather than a generic AI dashboard.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://trackwise-plan-sim.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9665667-ea47-44e0-9f19-8e81f2693cf4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
### Frontend
- React (Vite) — fast dev/build tooling
- TailwindCSS — for rapid dashboard/grid UI development
- Recharts — Gantt-style block schedule and KPI visualizations
- Socket.io-client / Supabase Realtime — live operations feed

### Backend
- FastAPI (Python) — core API layer, hosts the AI/ML scheduling logic
- scikit-learn / OR-Tools (Google) — the actual optimizer; OR-Tools handles constraint-based scheduling (block allocation, conflict resolution)
- Pandas — processing simulated TMS/SMMS/TDMS data

### Database
- Supabase (Postgres) — built-in auth, realtime, and storage

### Deployment
- Frontend: Vercel
- Backend: Railway or Render (easy free-tier FastAPI deployment)

### Tooling
- Swagger / Postman — auto-generated API docs (via FastAPI) for demos
- GitHub + README with architecture diagram

---
Summary: FastAPI + OR-Tools backend, React + Tailwind frontend, and Supabase for the database cover the full stack.
