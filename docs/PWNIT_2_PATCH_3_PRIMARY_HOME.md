# PwnIt 2.0 Patch 3 — Primary home experience

This patch makes the PwnIt 2.0 foundation the primary experience on the `pwnit-2` branch.

## What changed

- `/` now renders the PwnIt 2.0 foundation home instead of the old MVP item grid.
- `/pwnit-2` renders the same foundation page, so the existing reference URL still works.
- The header is updated for the PwnIt 2.0 branch.
- The main navigation removes the old `Buy credits` entry.
- The layout title/description now refers to PwnIt 2.0.

## What did not change

- No database migration.
- No paid-play mechanics.
- No voucher purchase logic.
- No campaign monetisation logic.
- No deletion of legacy routes. They remain in the repository for reference/testing, but they are no longer the primary landing experience.

## Apply

Extract into the repository root on the `pwnit-2` branch, then run:

```bash
npm run build
```

If the build passes:

```bash
git add src/app/page.tsx src/app/pwnit-2/page.tsx src/app/layout.tsx src/components/HeaderNav.tsx src/components/Pwnit2Home.tsx docs/PWNIT_2_PATCH_3_PRIMARY_HOME.md README-PWNIT-2-PATCH-3.txt
git commit -m "Make PwnIt 2 the primary home experience"
git push origin pwnit-2
```
