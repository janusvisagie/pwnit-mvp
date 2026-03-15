# PwnIt reset script fix

This patch replaces the reset script so it loads the same `.env*` files as the Next.js app before creating Prisma.

## Files included
- `scripts/reset-reopen-all-items.mjs`
- `scripts/check-item-states.mjs`

## Apply
Unzip into your repo root and overwrite the matching file.

## Then run
```bash
node scripts/check-item-states.mjs
node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
node scripts/check-item-states.mjs
```

## Why this fix matters
The previous standalone Node script could end up using a different `DATABASE_URL` than the app if your app was loading `.env.local` through Next.js.
