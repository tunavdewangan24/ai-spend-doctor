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