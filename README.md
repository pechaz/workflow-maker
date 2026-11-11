# Production Workflow Editor

A local editor for one production workflow. You add and edit steps on a graph, connect a step to the steps that must finish before it, and the screen shows when each step can start, when it finishes, and how long the whole workflow takes.

The workflow time is the length of one critical path: the dependency chain whose durations add up to the longest completion time. A step starts only after every prerequisite has finished. Steps with no dependency between them run in parallel, with no limit on how many can run at once.

## Prerequisites

- Docker
- Docker Compose

The app does not need Node.js or Postgres installed on the machine. Both run in containers. Node.js 24 or newer is only needed if you want to run the tests on the host instead of in Docker.

## Run

From this directory:

```sh
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080).

The first launch builds the images and starts Postgres, the API, and the editor. Postgres keeps the workflow in a Docker volume, so a later `docker compose up` opens the same workflow. The editor and the API share port 8080: the page is served there, and `/api` and `/health` are proxied to the API inside the Docker network. Postgres is also published on port 5432.

Stop the stack with `Ctrl+C`, then `docker compose down`. `docker compose down -v` also deletes the saved workflow.

Copy `.env.example` only if you want to read the local database settings. `docker compose up` already uses those values and does not need a `.env` file.

## Tests

Automated tests cover the time calculation, validation, and the load/save HTTP API.

```sh
docker compose run --rm backend npm test
```

With Node.js 24 or newer installed locally, the same tests are:

```sh
npm install
npm test
```

`npm run typecheck` checks the TypeScript projects.

## Using the editor

The canvas is [React Flow](https://reactflow.dev) (`@xyflow/react`). Drag the background to pan and scroll to zoom. The controls on the canvas also zoom and fit the graph.

- **Add step** places a new step on the graph.
- Drag a step to move it. The new position is saved when you drop it.
- Edit the name and the estimated duration on the step. Those fields save shortly after you stop typing.
- Drag from the handle on the right of a step to the handle on the left of another step. That arrow means the first step is a prerequisite of the second. Drag either end of an existing arrow to retarget it.
- Select a step or a connection and press Delete or Backspace to remove it. Deleting a step also removes its arrows.
- Click a link in the critical path to select that connection. The selected path is blue. **Remove** deletes the selected connections.
- **Reset** asks for confirmation, then removes every step and connection and saves the empty workflow.
- **Start** marks a step that has no prerequisites.
- **Critical** marks a step on the highlighted critical path. The toolbar shows that path and the workflow time in minutes.
- Each step shows its earliest start and earliest finish, in minutes from the beginning of the workflow.

The status badge is **Saving…**, **All changes saved**, or **Not saved**. A failed save stays on screen with **Retry** and a message such as “Could not reach the server. Your changes are still on screen.” An invalid workflow also stays on screen, with a banner that names each problem, but it is not written to the database. The last valid workflow remains stored. Times and the critical path follow the graph on screen, including while a save is still in flight.

## How the time is calculated

A connection `A → B` means A must finish before B can start.

- The earliest start of a step is 0 when it has no prerequisites. Otherwise it is the latest earliest finish among its prerequisites.
- The earliest finish is the earliest start plus that step’s duration.
- The workflow time is the largest earliest finish. Separate groups are included: the slowest group sets the time.
- The critical path is one chain of prerequisites whose durations sum to that workflow time. Each duration on that chain is a critical point. If several chains tie, the editor highlights one of them. The choice is stable for a given graph: it follows the earliest step id at each tie.

Example: Cutting takes 20 minutes and Preparation takes 10. Both are prerequisites of Assembly, which takes 15. Assembly starts at minute 20 and finishes at minute 35. The workflow takes 35 minutes. The critical path is Cutting → Assembly. Preparation is not on it.

## Validation

The same rules run in the editor and in the API. The API checks them again before any write, including when a client skips the UI.

A workflow is rejected when:

- a step name is empty or only whitespace
- a duration is missing, not a number, or not greater than 0
- a position is not a finite number
- a step or connection id is duplicated
- a connection points at a missing step, or the same arrow is repeated
- the arrows form a cycle, including a step that depends on itself

A stored name is trimmed. The field keeps what you typed until the workflow is loaded again.

A malformed request (not JSON, or not a workflow object) returns HTTP 400 with code `malformed-workflow`. A readable but invalid workflow returns HTTP 422 with code `invalid-workflow`. Both use the same error body:

```json
{
  "error": {
    "code": "invalid-workflow",
    "message": "Workflow is invalid and was not saved. Fix the problems below and keep editing.",
    "issues": [
      {
        "code": "cycle",
        "message": "This workflow has a cycle: Cutting → Assembly → Cutting. Remove a connection in the cycle to continue.",
        "stepIds": ["cutting", "assembly"],
        "connectionIds": ["cutting-assembly", "assembly-cutting"]
      }
    ]
  }
}
```

The editor keeps the invalid draft, highlights the steps and connections named in the issues, and lets you keep editing.

## API

- `GET /health` → `{ "status": "ok" }`
- `GET /api/workflow` → `{ revision, workflow, schedule }`
- `PUT /api/workflow` with `{ "workflow": { "steps": [], "connections": [] } }` → the same shape, or the error body above

## How the JSON document is created and kept

Postgres stores one workflow as one JSON document. The schedule, the selection, and the on-screen size of a step are calculated or kept in the editor. They are left out of the database. The stored value is the workflow object: an array of steps and an array of connections.

```json
{
  "steps": [
    {
      "id": "cutting",
      "name": "Cutting",
      "durationMinutes": 20,
      "position": { "x": 0, "y": 0 }
    }
  ],
  "connections": [
    {
      "id": "cutting-assembly",
      "fromStepId": "cutting",
      "toStepId": "assembly"
    }
  ]
}
```

A step keeps `id`, `name`, `durationMinutes`, and `position` (`x` and `y`). A connection keeps `id`, `fromStepId`, and `toStepId`. Names are stored trimmed. Durations are numbers of minutes. New steps and connections created in the editor get a random UUID. The seeded example uses the stable ids `cutting`, `preparation`, `assembly`, `cutting-assembly`, and `preparation-assembly`.

### The table

`backend/migrations/001_init.sql` defines a single table, `workflow_document`:

| Column | Role |
| --- | --- |
| `id` | Always `1`. The primary key, with a check that rejects any other id. |
| `revision` | A `bigint` counter. The first write is `1`. Each later write adds 1. |
| `document` | The workflow object, stored as `jsonb`. |
| `updated_at` | The time of the last write, `timestamptz`, defaulting to `now()`. |

There is one row. The API never inserts a second workflow, and it never keeps older copies of the document. `revision` counts writes. The client does not send it back, and a save is accepted without comparing it to the revision currently stored.

### Creating the table

On startup the API opens a Postgres pool and runs `001_init.sql`. The statement is `CREATE TABLE IF NOT EXISTS`, so a restart leaves an existing table in place. Startup creates the table and does not insert a workflow. The Docker volume `workflow-postgres` holds the Postgres data directory, so the table and its row survive `docker compose down` and the next `docker compose up`. `docker compose down -v` deletes that volume. The next launch creates an empty table again, and the next load seeds it as described below.

### Creating the first document

The row appears on the first `GET /api/workflow` when `id = 1` is missing. The repository inserts the Cutting / Preparation / Assembly example from `shared`, with `revision` 1, and casts the JSON string to `jsonb`. The insert is `ON CONFLICT (id) DO NOTHING`. If two loads arrive together, one insert wins and returns the new row. The other insert changes nothing, then reads the row the first request wrote. Either way the caller receives revision 1 and the example workflow.

A `PUT` can also create the row when the table is still empty. That insert stores the workflow from the request at revision 1. It uses the example only when the row is created by a load.

After either write, the repository reads the `jsonb` back through the same validator the API uses on input. A row that cannot be read as a workflow fails the request with “Stored workflow is invalid.” A normal save cannot produce that row, because the API validates before it writes.

### What a save writes

`PUT /api/workflow` expects `{ "workflow": { "steps": [], "connections": [] } }`. The body must be JSON, at most 1 MB. The API validates `workflow` before it touches the database. A malformed body returns HTTP 400. A readable workflow that breaks a rule returns HTTP 422. In both cases the stored row stays as it was.

A valid workflow is written in one statement:

```sql
INSERT INTO workflow_document (id, revision, document)
VALUES (1, 1, $1::jsonb)
ON CONFLICT (id) DO UPDATE
SET document = EXCLUDED.document,
    revision = workflow_document.revision + 1,
    updated_at = now()
RETURNING revision, document
```

The whole `document` value is replaced. Steps and connections that were removed in the editor are absent from the new JSON, and fields that were edited have their new values. Postgres applies that update as one row write, so an interrupted statement or two overlapping saves leave either the previous document or the new one. They do not leave a mix of old and new steps. When two saves overlap, the later committed statement wins, and `revision` still increases by 1 for each committed write. The response returns the stored workflow, the new revision, and a schedule computed from that workflow. The schedule is not written into `document`.

`GET /api/workflow` reads that same row and computes the schedule again. A load of an existing row leaves `revision` and `document` unchanged.

### How the editor maintains the document

The screen loads `GET /api/workflow` once and turns the JSON into editor state: the duration becomes text, and each step and connection gains a selected flag. Node width and height are measured on the canvas. Those three things stay in the browser.

Each edit rebuilds a workflow object from the current editor state and, when the edit should be stored, sends that whole object. The database never receives a patch.

- **Add step** appends a step named “New step”, lasting 10 minutes, placed near the last steps, and saves immediately.
- **Rename** and **duration** update that step and save about 300ms after the last keystroke. The duration text is parsed to a number in the JSON. Text that is not a positive number fails validation, so the previous document stays stored.
- **Drag** updates `position` and saves when the step is dropped. Moving the pointer during the drag stays on screen.
- **Connect** appends one connection from the source step to the target step and saves immediately. A second arrow with the same ends is ignored. A connection from a step to itself is kept on screen, fails the cycle check, and is not written. **Retarget** changes `fromStepId` and `toStepId` on the existing connection id, and ignores a drag that would point the step at itself or repeat an arrow that is already there.
- **Delete** removes the step or connection from the arrays. Deleting a step also removes every connection that used it. That save is immediate. **Remove** does the same for the selected connections.
- **Reset** replaces the editor state with empty `steps` and `connections` and saves that empty document. The empty document is valid, so the row becomes `{ "steps": [], "connections": [] }` and `revision` increases. The example is not written again while the row exists.
- Selecting a step or a connection, and measuring a node, change editor state only. They do not start a save.

Before the request, the editor runs the same validator as the API. An invalid graph is kept on screen and is not sent. A graph that matches the last successful save is not sent again. One save is in flight at a time. Edits made while it is in flight are kept, and when that request finishes the editor sends the latest valid snapshot if it differs from what was just stored. **Retry** sends the current valid snapshot after a network or server failure. A failed save leaves the previous row in place and leaves the draft on screen.

## Design

`shared`, `backend`, and `front` are separate npm workspaces. `shared` is the only place the workflow types, validation rules, and timing rules exist. `backend` is HTTP and Postgres, with one folder per feature under `backend/src/modules`. `front` is the screen: React Flow edits the graph, and the components are split into atoms, molecules, organisms, templates, and pages. A new rule goes in `shared`, a new route in a backend module, and a new interaction in `front`.

`validateWorkflow` and `scheduleWorkflow` are the domain API. The repository stores an already valid workflow and a revision. The UI maps that document onto React Flow nodes and edges, and maps graph edits back into the same document.

Types use the domain words (step, connection, earliest start, critical path), and validation messages say what to fix. The schedule is one earliest-start pass, then one walk back along a tight chain.

Each rule is implemented once and covered by tests whose expected minutes are written out by hand. The API tests use an in-memory repository, so they check the HTTP contract without a database. The SQL store is a single `jsonb` update with that same contract, so an interrupted or overlapping save cannot leave a partial document.

A new workflow field starts in the shared type and validator, then in the step node, and in a SQL migration only if the stored shape changes. A second workflow would start in the repository, which is the only place that assumes one row.

React, TypeScript, and Vite are the client stack; SWC compiles JSX instead of Babel. React Flow (`@xyflow/react`) supplies nodes, handles, directed edges, drag, zoom, and pan, instead of a custom canvas or the older `reactflow` package name. Express serves the few JSON routes, `node:test` runs the tests without another runner, and `pg` talks to Postgres without an ORM because the store is one document. Postgres replaces the starter’s JSON file so a save is one atomic update. Tailwind CSS and the copied shadcn primitives style the screen. nginx serves the built editor and proxies `/api`, so the browser has one origin. The longer layout notes are in [docs/architecture.md](docs/architecture.md).

## How I used AI

I used Cursor to implement this project from the take-home brief, the starter, and the walkthrough notes. I directed it to keep React Flow, to put every validation and timing rule in one shared module, and to save only valid documents. I reviewed the schedule against the Cutting example (35 minutes, Cutting → Assembly), a disconnected pair of groups, and a diamond where the long chain is not the widest step in each column. I also reviewed cycle detection and the save path so an invalid or overlapping save cannot replace the stored workflow with a partial document.

## Assumptions and limitations

- The product is one workflow, not an account system and not a list of workflows.
- Durations are positive numbers of minutes and may be fractional. Zero and negative durations are invalid.
- Name and duration wait about 300ms after the last keystroke before saving. Adding, deleting, connecting, retargeting, and dropping a dragged step save immediately.
- An invalid draft is kept on screen and is not stored. The previous valid workflow stays in the database. There is no automatic repair suggestion.
- When several critical paths take the same time, one is highlighted.
- The API does not reject a stale revision. The later committed save wins.
- UI tests are not included. The automated tests cover calculation, validation, and the HTTP load/save path.
