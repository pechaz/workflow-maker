# Project layout

`front` and `backend` do not import each other.

- `shared` holds the workflow types, `validateWorkflow`, and `scheduleWorkflow`, plus the example. The time rules and the validation rules exist only here. Both apps call them.
- `backend` is the Express API and the Postgres repository. Each feature lives in its own folder under `backend/src/modules`: `health` and `workflow` register their own routers. `database` opens the pool and applies the migration. `http` owns the error body. `app` only mounts those modules.
- `front` is the Vite + React editor. React Flow draws and edits the graph. It does not calculate the schedule. The screen follows atomic design: `components/atoms` holds the shadcn primitives, `molecules` combine them, `organisms` are the toolbar, banner, step, and canvas, `templates` is the frame, and `pages` loads the workflow and wires editing.

## Module and directory structure

The repository is an npm workspace with one lockfile. `shared` is the domain boundary, `backend` is HTTP and storage, and `front` is the screen. A new teammate can put a new workflow rule in `shared`, a new endpoint in `backend`, and a new interaction in `front`.

## Interfaces and boundaries

`validateWorkflow` and `scheduleWorkflow` are the only public domain operations. The repository accepts an already valid workflow and returns the stored document plus a revision. The UI maps that document onto React Flow nodes and edges, and maps graph edits back into the same document.

## Readability

Types name the domain words (step, connection, earliest start, critical path). Validation messages say what to fix. The schedule function follows the earliest-start definition in one pass, then walks one tight chain back from the workflow finish.

## Maintainability

Each rule is implemented once, in `shared`, and covered by tests whose expected numbers are written out by hand. The API tests use an in-memory repository, so they check the HTTP contract without a database. The SQL store is a single document update, which is the same contract.

## Extensibility

A new workflow field starts in the shared type and validator, then in the step node and, only if the stored shape changes, in a new SQL migration. A second workflow would start at the repository, which is the only place that currently assumes one row.

## Libraries and tools

- React, TypeScript, and Vite are required for the client and match the starter. Vite builds the editor and proxies `/api` during local UI development. `@vitejs/plugin-react-swc` compiles JSX with SWC instead of Babel, so dev refresh and production transforms stay fast. Babel was not kept.
- Tailwind CSS v4 styles the editor through the Vite plugin. Utility classes live on the components, and the theme tokens come from shadcn.
- shadcn/ui (Nova preset, Base UI) supplies the button, input, badge, and alert atoms. Those primitives are copied into the repo so the screen can be changed without a component runtime. A separate component library was not added on top of them.
- React Flow (`@xyflow/react`, the package documented at reactflow.dev) supplies nodes, handles, directed edges, drag, zoom, and pan. The older `reactflow` package name and a custom canvas were not used.
- Express serves the API. It was already the starter’s server, and this app only needs a few JSON routes.
- `node:test` runs the automated tests without an extra test runner.
- `pg` talks to Postgres. An ORM was skipped because the store is one document and a handful of statements.
- Postgres stores the workflow. The starter’s JSON file was not kept, because a single `UPDATE` of a `jsonb` document is atomic if a save is interrupted or two saves overlap.
- Docker Compose runs Postgres, the API, and nginx. nginx serves the built editor and proxies `/api`, so the browser has one origin.
