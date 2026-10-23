# Improvements

## Findings

- `frontend/src/utils/csvParser.ts` / `backend/src/index.ts` (`POST /leads/bulk`): `countryCode` was stored without validation, so values like `XXX` or `12` from `docs/leads-with-errors.csv` were imported and shown in the leads table. Confirmed, fixed with an ISO 3166-1 alpha-2 check on both sides.
- `backend/prisma/dev.db`: seeded lead 3 (Emily) has country `UK`, which is not an ISO 3166-1 alpha-2 code (`GB` is). The new validation would reject it on re-import. Confirmed, data not migrated.
- `frontend/src/utils/countryCodes.ts` / `backend/src/utils/countryCodes.ts`: the country list is duplicated because there is no shared types package. Confirmed.
- `backend/src/index.ts`: importing the module calls `app.listen` and starts the Temporal worker, so routes cannot be tested without side effects. Confirmed.
- `frontend/src/api/mutations/useApiMutation.ts:64`: the optimistic `newLead` is missing `emailVerified`, so `pnpm build` (the only working static check) fails on `main`. Confirmed.
- `docs/*.csv`: the `yearsInRole` and `phoneNumber` columns are ignored by the parser's header `switch`. Confirmed, relates to the new lead fields task.
