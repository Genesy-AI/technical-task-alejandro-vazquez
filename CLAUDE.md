# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

TinyEnginy is a take-home exercise: a small lead-management app. It has an Express + Prisma (SQLite) + Temporal backend and a React + Vite + TanStack Query frontend. `README.md` lists the assignment tasks: CSV country-code bug, email-verification hang, new lead fields, a phone-enrichment Temporal workflow with three provider APIs, a PR review, and `IMPROVEMENTS.md`. Read the README for task specs and provider API details before working on any of these tasks.

`backend/` and `frontend/` are independent pnpm projects with no root workspace. Run commands from inside each directory. Node version: `v22` (`.nvmrc`).

## Commands

Backend (`cd backend`):

- `pnpm install && pnpm migrate:dev && pnpm gen:prisma`: one-time setup
- `temporal server start-dev`: the Temporal server must be running on `localhost:7233` before `pnpm dev`
- `pnpm dev`: API on port 4000 (nodemon + ts-node). This process also starts the Temporal worker.
- `pnpm migrate:dev`: run after every `prisma/schema.prisma` change (creates a migration and regenerates the client)
- `pnpm build`: `tsc`
- `pnpm test`: vitest (node env)

Frontend (`cd frontend`):

- `pnpm dev`: Vite dev server. `VITE_API_URL` comes from the committed `frontend/.env` (`http://localhost:4000`), and the app throws on startup if it is missing.
- `pnpm build`: `tsc -b && vite build` (this is the typecheck)
- `pnpm lint`: ESLint with `--max-warnings 0`. It currently fails before checking any files: ESLint 9 cannot load the legacy `.eslintrc.cjs` config. That failure is not a regression from your change. Until the config is migrated, `pnpm build` is the only working static check.
- `pnpm test`: vitest (jsdom, setup in `src/test/setup.ts`)

Run a single test file or test name (either project): `pnpm test src/utils/csvParser.test.ts` or `pnpm test -t "test name"`. `pnpm test` starts in watch mode. Use `pnpm test --run` for a single run.

Formatting is Prettier in both projects (`pnpm format`): no semicolons, single quotes, print width 110, es5 trailing commas.

## Architecture

### Backend

- `src/index.ts` contains everything HTTP: all Express routes, inline validation, Prisma calls, and CORS headers. One module-level `PrismaClient` is shared. There is no router, service, or controller layer.
- The same process calls `runTemporalWorker()` (`src/worker.ts`), so one `pnpm dev` runs both the API and the worker on task queue `myQueue`, namespace `default`.
- Temporal layout: workflows live in `src/workflows/workflows.ts` and are re-exported from `src/workflows/index.ts`. The worker loads them through `workflowsPath`, so that file runs in the Temporal workflow sandbox: no I/O, Prisma, or Node APIs there. Activities live in `src/workflows/activities/` (re-exported from `activities/index.ts`) and are called from workflows via `proxyActivities`, which is where timeouts and retry policies are configured.
- `POST /leads/verify-emails` opens a new Temporal `Client` per request and calls `client.workflow.execute` sequentially for each lead, blocking the HTTP response until every workflow finishes. Its workflow IDs include `Date.now()`, so repeated runs for the same lead are not deduplicated. Then it writes `emailVerified` back with Prisma. `verifyEmail` in `activities/utils.ts` is a stub with hardcoded behaviors: `john.doe` → false, `jane.smith` → 20s delay, `+` → false.
- `src/utils/messageGenerator.ts` replaces `{field}` placeholders in a template. It throws on unknown or empty fields, and `generate-messages` collects those errors per lead.
- The DB is SQLite at `prisma/dev.db`, which is committed to git (`.env.sample` is unrelated MySQL boilerplate). Migrations are in `prisma/migrations/`.

### Frontend

- API layer: `src/api/utils.ts` `endpoint<Output, Input>(method, path | pathBuilder)` builds typed axios callers. Endpoints are declared in `src/api/modules/leads.ts`, and each endpoint has its own input/output types in `src/api/types/leads/<endpoint>.ts`. Everything is exposed as `api.leads.*`.
- Mutations go through the registry in `src/api/mutations/useApiMutation.ts`. Register each mutation's options (`mutationFn`, optimistic updates, invalidation) in `apiMutationsOptions`, keyed by its `api` path. Components then call `useApiMutation('leads.<name>')` instead of `useMutation` directly. Today only `leads.create` is registered, and the existing components still call `useMutation` directly. Treat those as legacy and don't copy the pattern. When you touch a mutation, move it into the registry.
- The leads list uses `useQuery` with query key `['leads', 'getMany']`, and mutations invalidate it.
- UI: all screens are three components in `src/components/`: `LeadsList` (table, selection, delete, verify), `CsvImportModal`, and `MessageTemplateModal`. Styling is Tailwind v4 via `@tailwindcss/vite`, toasts use `react-hot-toast`, and icons come from `@tabler/icons-react`.
- `src/utils/csvParser.ts` parses CSVs with papaparse and maps normalized headers to lead fields with a `switch`. It also does per-row validation (`isValid`, `errors`, `rowIndex`).

### Lead fields are duplicated across the stack

There is no shared types package. Adding or changing a lead field means updating all of these:

1. `backend/prisma/schema.prisma` (+ `pnpm migrate:dev`)
2. `backend/src/index.ts`: field whitelists in `POST /leads/bulk` (and in create/update if relevant)
3. `backend/src/utils/messageGenerator.ts`: the `Lead` interface and the `availableFields` map
4. `frontend/src/api/types/leads/*.ts` (`getMany`, `getOne`, `bulkImport`, …)
5. `frontend/src/utils/csvParser.ts`: the `CsvLead` type and the header `switch`
6. `frontend/src/components/MessageTemplateModal.tsx`: the hardcoded `availableFields` array
7. `frontend/src/components/LeadsList.tsx` / `CsvImportModal.tsx`: table columns and preview
8. `frontend/src/api/mutations/useApiMutation.ts`: the optimistic `newLead` object in `leads.create`

### Known quirks

- The frontend `update` endpoint sends `PUT /leads/:id`, but the backend only defines `PATCH`.
- `POST /leads` expects `name` in the body and stores it as `firstName`.

Sample CSVs for manual testing are in `docs/` (`leads-ok-*.csv`, `leads-with-errors.csv`). UI wireframes are in `docs/ui-wireframes.png`.
