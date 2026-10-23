# TinyEnginy: Improvements Backlog

| Field        | Value                         |
| ------------ | ----------------------------- |
| Project      | TinyEnginy (lead management)  |
| Owner        | Engineering                   |
| Last updated | 2026-10-23                    |
| Source       | Findings from completed tasks |
| Next ID      | IMP-12                        |

Only pending items are listed. Resolved items are removed; their history lives in git.

**Status:** `To do` · `Needs decision`
**Priority:** `High` (blocks work or ships bad data) · `Medium` (slows the team down) · `Low` (cleanup)

## Summary

| ID     | Title                                                 | Area         | Priority | Status         |
| ------ | ----------------------------------------------------- | ------------ | -------- | -------------- |
| IMP-02 | Frontend build is broken on `main`                    | Frontend     | High     | To do          |
| IMP-04 | Country code list duplicated across FE and BE         | Architecture | Medium   | To do          |
| IMP-07 | Email verification blocks the HTTP request            | Backend      | Medium   | To do          |
| IMP-08 | API lacks request validation, layering and tests      | Full stack   | Medium   | To do          |
| IMP-09 | Deleting leads has no confirmation                    | Frontend     | Medium   | To do          |
| IMP-03 | Seeded lead uses non-ISO country `UK`                 | Data         | Low      | Needs decision |
| IMP-10 | CSV import reports success when only duplicates found | Frontend     | Low      | To do          |
| IMP-11 | No range selection in the leads table                 | Frontend     | Low      | To do          |

---

## IMP-02 · Frontend build is broken on `main`

**Status:** To do · **Priority:** High · **Area:** Frontend

**Problem**
`pnpm build` fails, and with ESLint unable to load its config, it is the only working static check in the frontend.

**Evidence (confirmed)**
`frontend/src/api/mutations/useApiMutation.ts:64`: the optimistic `newLead` object is missing `emailVerified` (TS2741).

**Next step**
Add `emailVerified: null` to the optimistic lead and add the build to CI.

---

## IMP-03 · Seeded lead uses non-ISO country `UK`

**Status:** Needs decision · **Priority:** Low · **Area:** Data

**Problem**
Seeded lead 3 (Emily) in `backend/prisma/dev.db` has country `UK`. The ISO code is `GB`, so the new validation would reject this lead on re-import.

**Evidence (confirmed)**
`SELECT countryCode FROM lead WHERE id = 3` returns `UK`.

**Next step**
Decide whether to migrate stored `UK` values to `GB`, or to accept `UK` as an alias on import and map it to `GB`.

---

## IMP-04 · Country code list duplicated across FE and BE

**Status:** To do · **Priority:** Medium · **Area:** Architecture

**Problem**
`frontend/src/utils/countryCodes.ts` and `backend/src/utils/countryCodes.ts` hold identical lists, because the repo has no shared types package. Lead fields are duplicated across the stack in the same way.

**Evidence (confirmed)**
Both files were created as copies in the CSV country code fix (`fix/csv-country-codes`). The new lead fields task added the same duplication for LinkedIn URL validation (`isValidLinkedinUrl` in `frontend/src/utils/csvParser.ts`, `parseLinkedinUrl` in `backend/src/index.ts`). Message template fields are no longer duplicated: the composer loads them from `GET /leads/template-fields` (`TEMPLATE_FIELDS` in `backend/src/utils/messageGenerator.ts`).

**Next step**
Introduce a shared package (for example a pnpm workspace) for lead types and validation rules.

---

## IMP-07 · Email verification blocks the HTTP request

**Status:** To do · **Priority:** Medium · **Area:** Backend

**Problem**
`POST /leads/verify-emails` runs one workflow per lead in sequence inside the request, opens a new Temporal connection per call and uses `Date.now()` workflow IDs. After the retry fix a failing lead no longer hangs forever, but a slow provider still holds the response about 17s per failing lead, and repeat clicks start duplicate workflows.

**Evidence (confirmed)**
`backend/src/index.ts:259-310`: `Connection.connect` per request, `await client.workflow.execute` in a `for` loop, `workflowId: verify-email-${lead.id}-${Date.now()}`. The email verification fix bounded the activity to 3 attempts of 5s each.

**Next step**
Start the workflows with stable IDs and return 202, then have the UI poll `emailVerified`.

---

## IMP-08 · API lacks request validation, layering and tests

**Status:** To do · **Priority:** Medium · **Area:** Full stack

**Problem**
`backend/src/index.ts` holds every route, with ad-hoc inline validation and direct Prisma calls. It has no schema validation and no router or service layer. Importing it starts the server and the Temporal worker, so routes cannot be tested. Test coverage is limited to a few utils, the workflow and one component: there are no React component tests for the main screens, no integration tests and no end-to-end tests.

**Evidence (confirmed)**
Validation is hand-written per route: the `POST /leads/bulk` filter (`backend/src/index.ts:205-218`), and `POST /leads` only checks presence and coerces with `String()` (`backend/src/index.ts:25-40`). `backend/src/index.ts` calls `app.listen(4000)` and `runTemporalWorker()` at module load, and `backend/package.json` has no validation library. Existing tests cover `countryCodes`, `messageGenerator` and the workflows in the backend, and `countryCodes`, `csvParser` and `TemplateFieldPicker` in the frontend. There are no tests for routes, `LeadsList`, `CsvImportModal`, `MessageTemplateModal` or the mutations. `TemplateFieldPicker.test.tsx` renders with `react-dom/client` directly because `@testing-library/react` is not installed, and neither project has `supertest` or an e2e tool (Playwright, Cypress).

**Next step**
Export the Express `app` from its own module and start the server and worker in a separate entry point. Split routes into `routes/leads.ts` and Prisma access into `services/leads.ts`. Validate bodies, params and queries with schemas (for example zod middleware) that return consistent 400 errors. Then add three test layers:

- React component tests with `@testing-library/react` for `LeadsList`, `CsvImportModal` and `MessageTemplateModal`, mocking `api.leads.*`.
- Integration tests: backend route tests with `supertest` against a test SQLite database, and frontend tests of the mutations and query invalidation against a mocked API (for example `msw`).
- End-to-end tests with Playwright against the running API, worker and Vite app, covering CSV import, delete, email verification and message generation.

---

## IMP-09 · Deleting leads has no confirmation

**Status:** To do · **Priority:** Medium · **Area:** Frontend

**Problem**
The Delete button permanently removes every selected lead on a single click, with no confirmation and no undo.

**Evidence (confirmed)**
`frontend/src/components/LeadsList.tsx:89-92`: `handleDeleteSelected` calls `deleteLeadsMutation.mutate(selectedLeads)` directly.

**Next step**
Show a confirmation dialog with the number of leads to delete before running the mutation, and move the mutation into the `useApiMutation` registry.

---

## IMP-10 · CSV import reports success when only duplicates found

**Status:** To do · **Priority:** Low · **Area:** Frontend

**Problem**
When every row is a duplicate or invalid, the import still shows a green toast such as "Successfully imported 0 leads! (3 duplicates skipped)". The message also always says "leads", even for one lead.

**Evidence (confirmed)**
`frontend/src/components/CsvImportModal.tsx:115-124` always calls `toast.success` with `Successfully imported ${data.importedCount} leads!`.

**Next step**
Show a warning toast when `importedCount` is 0 (for example "No leads imported: 3 duplicates skipped"), keep the success toast for partial imports, and pluralize "lead"/"leads".

---

## IMP-11 · No range selection in the leads table

**Status:** To do · **Priority:** Low · **Area:** Frontend

**Problem**
Leads can only be selected one checkbox at a time or all at once, so selecting a block of rows is slow.

**Evidence (confirmed)**
`frontend/src/components/LeadsList.tsx:72-86`: `handleSelectAll` and `handleSelectLead` toggle single ids. Nothing tracks the last clicked row or reads `shiftKey`.

**Next step**
Track the last clicked row index, and on shift+click select or deselect every row between it and the current row in list order.
