# Renewable Operations Incident Board

A small operations console for triaging alerts across fictional solar and battery sites.

The main workflow is deliberately compact: scan the incident queue, filter to what needs attention, open an alert to inspect its evidence timeline, update its workflow status, and record a follow-up note. An optional AI action explains the incident from the linked event evidence and suggests safe diagnostic checks.

## What is included

- 15 realistic fictional alerts across solar farms and battery energy storage sites.
- Alert fields: site, timestamp, type, severity, description, and status.
- Server-side filtering by site, severity, and status.
- Client-side text search and sorting in the alert table.
- Clear counts for critical/high, open, investigating, and resolved alerts.
- Alert detail panel with linked operational events shown chronologically, including trigger/context roles.
- Status changes: `open`, `investigating`, and `resolved`.
- Persistent operator follow-up notes.
- Optional Gemini incident explanation with structured output, cited event IDs, suggested checks, confidence, and a safety caveat.
- Integration-style service tests covering filtering, evidence ordering, persistence, and missing-alert behavior.

## Tech stack

- Frontend: React 19, Vite, TanStack Router, TanStack Query, TanStack Table, Tailwind CSS.
- Backend: NestJS, TypeScript, Drizzle ORM.
- Persistence: SQLite via `better-sqlite3`.
- AI: Google Gemini via `@google/genai`; no AI key is needed to run the rest of the application.
- Package manager: pnpm.

## Prerequisites

- Node.js 20 or newer.
- pnpm 10 or newer. The repository declares pnpm 11 in its package-manager configuration, so pnpm 11 is recommended.

## Setup and run locally

From the repository root:

```bash
pnpm install
pnpm --filter api seed
```

The seed command recreates the local database contents with fictional data. It removes existing alerts, events, and notes in the configured database before inserting the sample data.

Start the API in one terminal:

```bash
pnpm --filter api start:dev
```

Start the web application in a second terminal:

```bash
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000). The API runs at [http://localhost:8080/api](http://localhost:8080/api).

The frontend currently points to `http://localhost:8080/api` in `apps/web/src/lib/api.ts`, and the NestJS API enables CORS for local development.

### Optional AI setup

To enable the **Analyze** action in the alert detail panel, provide a Gemini API key to the API process:

```bash
GEMINI_API_KEY=your-key pnpm --filter api start:dev
```

Without the key, the incident board, status updates, notes, filters, and tests still work; only the AI explanation request is unavailable. No API key is committed to the repository.

### Resetting the sample data

Run the seed command again:

```bash
pnpm --filter api seed
```

By default the database is stored at `apps/api/data/incidents.db` when the API is started from `apps/api`. The path can be changed with `DB_PATH`, or the containing directory with `DB_DIR`.

## API overview

The API has a small resource-oriented surface:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/alerts?site=&severity=&status=` | List alerts with optional filters |
| `GET` | `/api/alerts/:id` | Return an alert, linked event timeline, and notes |
| `PATCH` | `/api/alerts/:id/status` | Update status with `{ "status": "investigating" }` |
| `POST` | `/api/alerts/:id/notes` | Add a note with `{ "text": "..." }` |
| `POST` | `/api/alerts/:id/explain` | Generate the optional AI explanation |

## Architecture

```text
React dashboard
  └─ TanStack Query API hooks
       └─ NestJS AlertsController
            └─ AlertsService
                 ├─ Drizzle ORM → SQLite
                 └─ AiService → Gemini (optional)
```

The data model separates the alert from the raw operational evidence that explains it:

- `alerts` stores the triage record and workflow state.
- `operational_events` stores timestamped source events and JSON payloads.
- `alert_events` links events to alerts and labels each link as `trigger` or `context`.
- `follow_up_notes` stores operator-entered investigation notes.

This makes the evidence chain visible to the operator and gives the AI feature a bounded input rather than asking it to infer an incident from an opaque summary.

## AI feature and responsible-use boundary

The AI feature is an incident explanation assistant, not an autonomous operator. It receives the selected alert, its linked events, and its notes, then returns:

- a short summary;
- the most likely trigger;
- evidence statements tied to exact event IDs;
- suggested safe physical/SCADA checks;
- a low/medium/high confidence value; and
- a caveat that the result is advisory.

The prompt and response schema explicitly ask the model not to invent event IDs. The UI keeps the raw event timeline visible so an operator can check the explanation against source evidence. The AI action is manual and cannot change status, create notes, or control equipment.

Current limitation: the implemented integration uses Gemini when `GEMINI_API_KEY` is available and returns an error when it is not. A production version should add a deterministic/local fallback, validation that returned evidence IDs belong to the selected alert, structured logging, rate limits, and an evaluation set of known incident timelines. Any generated recommendation would still require review under the site's operating and safety procedures.

## Testing and quality checks

Run the backend tests:

```bash
pnpm --filter api test:e2e
```

The tests use an in-memory SQLite database and cover:

- combined site/severity/status filtering;
- chronological ordering and trigger/context roles for linked evidence;
- persistence of status changes and notes; and
- `404` behavior for an unknown alert.

Useful frontend checks:

```bash
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web check
```

## Assumptions and key trade-offs

- The data is fictional and local; there is no authentication, multi-user concurrency, or real SCADA integration.
- SQLite and a local seed script keep the exercise easy to run and inspect. A hosted deployment would likely use PostgreSQL and migrations.
- The alert list is intentionally a focused queue rather than a full analytics product. It prioritises scanability and the next operator action over charts.
- Filtering is sent to the API while text search and table sorting happen in the browser. This is simple and appropriate for 15 records; server-side search, pagination, and cursor-based sorting would be needed for a larger portfolio.
- Status changes and notes are persisted, but there is no audit history, author identity, or optimistic locking yet.
- The API currently accepts status and note payloads with minimal validation. Production hardening would add DTO validation, authentication, authorization, audit events, and rate limiting.

## Suggested 5–10 minute walkthrough

1. Start with the queue and point out the critical/high and open counts.
2. Filter to open or critical alerts and sort by timestamp/severity.
3. Open an alert and explain the distinction between the alert record and its evidence timeline.
4. Change the status to `investigating` and add a technician follow-up note.
5. If a Gemini key is configured, run **Analyze** and compare the cited event IDs with the visible timeline.
6. Briefly show the SQLite schema and the tests, then discuss the AI boundary and production improvements.

## What I would improve with more time

- Add DTO validation and a visible API error state for failed mutations or AI requests.
- Add frontend component tests and a small end-to-end browser test for the main triage flow.
- Add an audit trail for status transitions and notes, including operator identity and timestamps.
- Add an offline deterministic AI fallback so the feature is demonstrable without external credentials.
- Add a proper environment-based API URL and a production build/deployment configuration.
- Improve accessibility review, including keyboard navigation, focus management, and screen-reader announcements for status updates.
- Add pagination and server-side search/sorting once the number of alerts is no longer small.

## AI development-tool disclosure

AI development tools were used while building this repository. The reconstructed interaction record, including prompts, material outputs, follow-up corrections, review notes, and redaction statement, is in [AI_USAGE.md](AI_USAGE.md).

The application’s AI feature is separate from the AI tools used during development; its limitations and review process are described above.
