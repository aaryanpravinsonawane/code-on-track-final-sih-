# Trackwise Operational Workflow Gap Analysis

Audit basis: the active `code-on-track-final-sih-` repository, its frontend route/component/service layers, FastAPI modules, SQL/Supabase wiring, and the public SAMARATH README as a functional reference only. SAMARATH source, branding, assets, and credentials are not used.

## Existing Architecture

- Frontend: React 19, TypeScript, TanStack Router, TanStack Query, and a shared `TrackwiseProvider` in `src/lib/trackwise/store.tsx`.
- Screens: 30 file-based routes cover command, department, station, maintenance, analytics, audit, and optimizer views. Shared presentation lives in `src/components/trackwise` and `src/components/ui`.
- State/data: deterministic track/task/train/window fixtures live in `src/lib/trackwise/data.ts`; several other pages generate their own mock data. Only the plan, active role, delays, and session audit are in the shared provider. Those values are not durably persisted.
- API: Axios services exist for issues, trains, scheduling, analytics, and train/platform/track optimization. Most operational pages do not call them. Backend CRUD uses `InMemoryRepository`; SQLAlchemy session setup is optional and is not connected to the repositories. The checked-in backend SQL migration is empty.
- Roles: demo login selects one of eight roles and hides some navigation through permission strings. The route guard is module-based; server mutations do not consistently require a role. `canApprove` is a single broad frontend predicate.
- Optimization: the browser's local heuristic bundles seeded maintenance tasks against static windows and train paths. The backend uses OR-Tools for train platform/track/block assignment, but has no maintenance-window scheduling model. The optimizer screen currently displays a fixed recommendation and fixed conflict counts.
- Audit: the UI records session-only action labels without entity linkage, before/after state, or integrity hashes.
- Live data: current feeds and station/incident records are simulated. They are not connected to signalling, interlocking, or live railway systems.

## Capability Matrix

| Capability | Existing coverage | Gap / required upgrade |
| --- | --- | --- |
| Central Control Console | Dashboard, priority queue, incidents, alerts | No shared operational command state spanning requests, approvals, issues, and replans |
| Department-wise consoles | TMS, SMMS, TDMS, COA, DRM routes | Pages mainly read static/generated data; department actions do not share a demand lifecycle |
| Station Master operations | Station page and station telemetry components | Operational records/actions are not centrally persisted or fully stateful |
| TMS / Civil Engineering | Department page and Engineering fixtures | No end-to-end request, sanction, execution workflow |
| SMMS / S&T | Department page and S&T fixtures | No end-to-end request, sanction, execution workflow |
| TDMS / TRD | Department page and TRD fixtures | No end-to-end request, sanction, execution workflow |
| COA / statutory workflow | COA route and train data | No enforceable control-review transitions or statutory audit evidence |
| Maintenance / Field Reporter | Maintenance/work-order screens | No event submission that creates an issue and triggers a replan |
| AI Block Optimizer | Browser heuristic; OR-Tools package installed | Backend solver models train allocation, not maintenance blocks; page recommendation/conflict summaries are hard-coded |
| Conflict detection | Local heuristic checks train overlap; backend train conflict detector | No integrated overlap + resource + train-window feasibility report for maintenance demands |
| Block bundling | Browser heuristic bundles seeded tasks in one section | Not a first-class shared request or approval entity |
| Train-path protection | Heuristic checks train occupancy with a buffer | No independent, solver-backed maintenance-window validation in the backend |
| Approval / sanction / trim / reject | Plan status draft/approved/rejected/modified | No per-demand state machine, trim action, resubmission, dispatch, or execution state |
| Audit and history | Session audit list and timeline page | No durable entity-linked before/after history or hash chain |
| Live operational updates | Simulated hooks, notification UI, socket client dependency | No workflow event stream connected to persisted mutations |
| Export / reporting | Analytics and Excel export endpoints, reports route | Reports are not consistently sourced from a unified workflow store |
| Role-based access control | Demo role list, permission helpers, guarded navigation | UI-only/coarse authorization; workflow transitions need explicit role checks server-side and client-side |

## Scope and Safety Notes

The demo must label seeded or locally generated records as simulated. OR-Tools results must only be labeled solver output after an actual CP-SAT solve returns a feasible/optimal status; a browser heuristic is demo output, not solver output. No workflow here is a substitute for approved railway control, signalling, interlocking, or statutory safety procedures.
