# PwnIt 2.0 Patch 4 — Brand alignment and replacement shell

This patch tightens the PwnIt 2.0 branch so it feels less like a PwnIt 1 page was added to the existing app.

## What changed

- Keeps `/` and `/pwnit-2` on the same PwnIt 2.0 home experience.
- Aligns the PwnIt 2.0 shell with the existing PwnIt slate-and-white visual language.
- Changes the nav label from `Lifecycle` to `How it works`.
- Keeps legacy MVP routes available by direct URL for controlled testing/reference.
- Keeps the old `Buy credits` navigation link out of the primary nav because it points to PwnIt 1 mechanics, not a final PwnIt 2.0 wallet flow.

## What did not change

- No database migration.
- No schema changes.
- No paid-play mechanics.
- No voucher purchase logic.
- No campaign monetisation logic.

## Apply

Extract into the repository root on the `pwnit-2` branch, then run:

```bash
npm run build
```

If the build passes:

```bash
git add src/app/page.tsx src/app/pwnit-2/page.tsx src/app/layout.tsx src/components/HeaderNav.tsx src/components/Pwnit2Home.tsx docs/PWNIT_2_PATCH_4_BRAND_REPLACEMENT.md README-PWNIT-2-PATCH-4.txt
git commit -m "Align PwnIt 2 home shell with brand"
git push origin pwnit-2
```
