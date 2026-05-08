# TESTS

## Automated tests

Run all tests:

```bash
npm run test
```

## Test files

### `src/lib/audit.test.ts`

Covers the core audit engine logic:

1. Confirms plan price lookup works.
2. Detects extra paid seats above team size.
3. Recommends cheaper individual plans for very small teams.
4. Detects high API spend as a discounted credits opportunity.
5. Avoids manufacturing savings for already optimized spend.
6. Calculates monthly and annual stack savings.

All tests passed locally on Day 2.
## Day 3 manual test

I manually tested the lead capture flow by submitting a sample audit report from the frontend form and verifying that the row appeared in the Supabase `audit_leads` table.

The `/api/leads` route includes:
- email validation
- honeypot spam protection
- basic in-memory rate limiting
- server-side Supabase insert