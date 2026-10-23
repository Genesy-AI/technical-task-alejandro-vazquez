# TinyEnginy: Improvements Backlog

| Field        | Value                         |
| ------------ | ----------------------------- |
| Project      | TinyEnginy (lead management)  |
| Owner        | Engineering                   |
| Last updated | 2026-10-23                    |
| Source       | Findings from completed tasks |
| Next ID      | IMP-08                        |

Only pending items are listed. Resolved items are removed; their history lives in git.

**Status:** `To do` · `Needs decision`
**Priority:** `High` (blocks work or ships bad data) · `Medium` (slows the team down) · `Low` (cleanup)

## Summary

| ID     | Title                                               | Area         | Priority | Status         |
| ------ | --------------------------------------------------- | ------------ | -------- | -------------- |
| IMP-02 | Frontend build is broken on `main`                  | Frontend     | High     | To do          |
| IMP-04 | Country code list duplicated across FE and BE       | Architecture | Medium   | To do          |
| IMP-05 | API routes cannot be tested in isolation            | Backend      | Medium   | To do          |
| IMP-06 | CSV columns `yearsInRole` and `phoneNumber` ignored | Frontend     | Medium   | To do          |
| IMP-07 | Email verification blocks the HTTP request          | Backend      | Medium   | To do          |
| IMP-03 | Seeded lead uses non-ISO country `UK`               | Data         | Low      | Needs decision |

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
Both files were created as copies in the CSV country code fix (`fix/csv-country-codes`).

**Next step**
Introduce a shared package (for example a pnpm workspace) for lead types and validation rules.

---

## IMP-05 · API routes cannot be tested in isolation

**Status:** To do · **Priority:** Medium · **Area:** Backend

**Problem**
Importing `backend/src/index.ts` calls `app.listen` and starts the Temporal worker. Route handlers therefore have no automated tests; the CSV country code fix could only test the extracted helper.

**Evidence (confirmed)**
`backend/src/index.ts` calls `app.listen(4000)` and `runTemporalWorker()` at module load.

**Next step**
Export the Express `app` from its own module, start the server and worker in a separate entry point, and add route tests with `supertest`.

---

## IMP-06 · CSV columns `yearsInRole` and `phoneNumber` ignored

**Status:** To do · **Priority:** Medium · **Area:** Frontend

**Problem**
All sample CSVs in `docs/` include `yearsInRole` and `phoneNumber`, but the parser's header `switch` drops them during import.

**Evidence (confirmed)**
`frontend/src/utils/csvParser.ts`: the header `switch` has no case for these columns.

**Next step**
Cover this in the "New lead fields" task (phone number, years at company, LinkedIn).

---

## IMP-07 · Email verification blocks the HTTP request

**Status:** To do · **Priority:** Medium · **Area:** Backend

**Problem**
`POST /leads/verify-emails` runs one workflow per lead in sequence inside the request, opens a new Temporal connection per call and uses `Date.now()` workflow IDs. After the retry fix a failing lead no longer hangs forever, but a slow provider still holds the response about 17s per failing lead, and repeat clicks start duplicate workflows.

**Evidence (confirmed)**
`backend/src/index.ts:259-310`: `Connection.connect` per request, `await client.workflow.execute` in a `for` loop, `workflowId: verify-email-${lead.id}-${Date.now()}`. The email verification fix bounded the activity to 3 attempts of 5s each.

**Next step**
Start the workflows with stable IDs and return 202, then have the UI poll `emailVerified`.
