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

An empty database is seeded with the Cutting / Preparation / Assembly example. There is one workflow. Each successful save replaces that document and increments `revision`. The API does not require a revision token. Overlapping saves are full documents; the later committed update wins. The editor sends the latest valid snapshot again if you edit during a save.

Steps store `id`, `name`, `durationMinutes`, and `position`. Connections store `id`, `fromStepId`, and `toStepId`.

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
