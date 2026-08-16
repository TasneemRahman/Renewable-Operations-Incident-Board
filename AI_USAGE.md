# AI Usage Record

## Short version

I built the project structure, backend, API, data model, and frontend structure myself.

I used Antigravity to speed up implementation work:

- to draft the fictional seed-data script;
- to write much of the frontend inside the structure I had already made;
- for normal inline autocomplete; and
- to help with small UI fixes and cleanup while I worked.

This is a plain-English reconstruction of the useful AI interactions. Antigravity did not provide a full chat export. No API keys, real site data, personal data, or customer information were shared with it.

## Tool used

**Antigravity** — chat assistance and inline code completion.

## What I did myself

I made the important decisions myself:

- what the app is for and what is out of scope;
- the event, alert, note, and database model;
- the NestJS backend structure and API endpoints;
- the SQLite persistence setup;
- how the AI feature should be limited and kept safe;
- the frontend route, data layer, page layout, and component structure.

I started with the frontend structure because I wanted clear boundaries before using AI to fill in UI details. This made it easier to keep the generated frontend code consistent with the API and the intended operator workflow.

## AI interaction notes

### 1. Mock seed data

**What I asked AI**

> Write a starting TypeScript seed script for fictional solar and battery incidents. I need realistic-looking alerts and linked event logs. Include temperature, fan, output, communications, and battery examples. Keep all sites and data fictional.

**What AI helped with**

- A first draft of repetitive seed records.
- Example event messages, timestamps, payload values, and alert descriptions.
- A few event chains, such as temperature increasing before a fan problem.

**What I did after**

- Put the seed data into the schema and database setup I had already written.
- Edited the records, statuses, severity levels, and event links to suit the app.
- Checked that the data was fictional and did not contain real operations data.

### 2. Frontend starting structure

**What I did first**

I created the frontend structure before asking AI to write screens:

- dashboard route;
- API/data hooks;
- alert-table component;
- alert-detail component;
- small reusable UI components; and
- the split list-and-detail page layout.

**Why**

I did not want AI deciding where code should live or how the frontend should be organised. I wanted it to fill in individual pieces inside a structure I could understand and maintain.

### 3. Alert list screen

**What I asked AI**

> Inside my existing alert-table component, create the UI for a renewable operations incident list. Add a search field, site/severity/status filters, sortable columns, severity badges, status badges, loading state, empty state, and row selection. Use the alert data shape already provided.

**What AI helped with**

- Most of the table markup and styling.
- Filter controls and search input wiring.
- Sortable column headers.
- Severity and status badge rendering.
- Loading and no-results states.

**What I did after**

- Connected it to my existing data hooks and API response.
- Reviewed the alert fields shown to make sure they were useful for an operator.
- Adjusted the labels and visual priority to fit the incident workflow.

### 4. Alert detail screen

**What I asked AI**

> Inside my existing alert-detail component, build a detail panel for one alert. Show severity, status, description, status buttons, a timeline of linked event logs, a note form, existing notes, and a button that requests the AI explanation. Do not change the API shape.

**What AI helped with**

- Much of the detail-panel JSX and CSS classes.
- The timeline presentation for trigger and context events.
- The status-button UI.
- The note form and notes list.
- The visual section for showing an AI explanation.

**What I did after**

- Hooked the UI up to the endpoints I had already built.
- Kept raw events visible so the operator can check any AI explanation against real evidence.
- Kept the AI button manual: it only runs when an operator asks for it.

### 5. Dashboard and visual polish

**What I asked AI**

> Use the components already in my project to finish the dashboard shell. Add a small summary area for critical/high, open, investigating, and resolved alerts. Keep it compact and focused on renewable operations.

**What AI helped with**

- Dashboard summary cards.
- Layout and spacing suggestions.
- Button, badge, and panel styling.
- Small display details such as timestamps and empty states.

**What I did after**

- Chose the final wording and which metrics mattered.
- Kept the dashboard focused on what needs attention, rather than adding unrelated charts or features.

### 6. Small fixes while building the frontend

I also used autocomplete and short prompts for small fixes as I worked. These were implementation-level changes, not design decisions.

Examples of the kind of help requested:

> The selected alert should reset cleanly when the list changes. Help simplify this React effect without changing the screen structure.

> The note submit button should be disabled for blank notes and while the request is running. Complete the existing handler and button props.

> Make the alert table usable on smaller screens by allowing horizontal scrolling, without changing the columns or page layout.

> Tidy the loading, empty, and error-adjacent states so the panel does not look broken while data is being fetched.

**What I did after**

- Read each suggestion before using it.
- Kept only changes that worked with my existing component structure.
- Changed or removed suggestions that did not match the API or workflow.

### 7. Inline autocomplete

Autocomplete was enabled throughout implementation. I mainly used it for repetitive local code:

- TypeScript imports and types;
- JSX closing tags and repeated markup;
- API request boilerplate;
- repeated seed objects; and
- CSS/Tailwind class continuations.

I did not accept autocomplete blindly. Suggestions were reviewed in context and changed when needed.

## AI feature boundary

The application itself includes an AI incident-explanation feature. I defined its boundary: it can explain the linked event logs and suggest checks, but it cannot change an alert, create a note, control equipment, or claim a confirmed root cause.

Any generated explanation must be checked by an operator against the visible event timeline.

## Final review

Before submitting, I would manually check:

- the seeded alerts appear in the list;
- selecting an alert shows its linked event logs and notes;
- status changes and notes are saved;
- filters and sorting still work after UI changes;
- the AI explanation only uses the selected alert’s evidence; and
- no real or sensitive data is present in the repository or this document.

## Redactions

None. No sensitive information was included in the interactions above.

