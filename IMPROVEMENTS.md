# TinyEnginy: Improvements Backlog

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Project      | TinyEnginy (lead management)               |
| Owner        | Engineering                                |
| Last updated | 2026-10-23                                 |
| Source       | Findings from the CSV country code bug fix |

**Status:** `Done` · `To do` · `Needs decision`
**Priority:** `High` (blocks work or ships bad data) · `Medium` (slows the team down) · `Low` (cleanup)

## Summary

| ID     | Title                                               | Area           | Priority | Status         |
| ------ | --------------------------------------------------- | -------------- | -------- | -------------- |
| IMP-01 | Validate country codes on CSV import                | Frontend + API | High     | Done           |
| IMP-02 | Frontend build is broken on `main`                  | Frontend       | High     | To do          |
| IMP-03 | Seeded lead uses non-ISO country `UK`               | Data           | Low      | Needs decision |
| IMP-04 | Country code list duplicated across FE and BE       | Architecture   | Medium   | To do          |
| IMP-05 | API routes cannot be tested in isolation            | Backend        | Medium   | To do          |
| IMP-06 | CSV columns `yearsInRole` and `phoneNumber` ignored | Frontend       | Medium   | To do          |

---

## IMP-01 · Validate country codes on CSV import

**Status:** Done · **Priority:** High · **Area:** Frontend + API · **Branch:** `fix/csv-country-codes`

**Problem**
CSV import accepted any `countryCode` value. Rows with `XXX` or `12` in `docs/leads-with-errors.csv` were marked valid, imported, and shown in the leads table.

**Evidence (confirmed)**

- `frontend/src/utils/csvParser.ts` stored the column without validation.
- `backend/src/index.ts` (`POST /leads/bulk`) persisted any string.
- Rows 14, 16 and 18 of `docs/leads-with-errors.csv` were returned with `isValid: true`.

**Resolution**
Both sides now validate codes against the ISO 3166-1 alpha-2 list and store them uppercased. Invalid rows show "Invalid country code" in the import preview, and the API counts them in `invalidLeads`. Regression tests were added in both projects.

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
Both files were created as copies in IMP-01.

**Next step**
Introduce a shared package (for example a pnpm workspace) for lead types and validation rules.

---

## IMP-05 · API routes cannot be tested in isolation

**Status:** To do · **Priority:** Medium · **Area:** Backend

**Problem**
Importing `backend/src/index.ts` calls `app.listen` and starts the Temporal worker. Route handlers therefore have no automated tests; IMP-01 could only test the extracted helper.

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
