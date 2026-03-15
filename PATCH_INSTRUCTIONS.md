Replace these files in your repo:
- scripts/check-item-states.mjs
- scripts/reset-reopen-all-items.mjs
- scripts/_load-env-like-next.mjs

Then run:

1) Check which DB the scripts are using:
   node scripts/check-item-states.mjs

2) Reopen/reset against the same DB as `npm run dev`:
   node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute

3) Confirm:
   node scripts/check-item-states.mjs

These scripts now load env files in Next.js order for development:
- .env.development.local
- .env.local
- .env.development
- .env

So they should match your local app instead of accidentally preferring localhost from `.env`.
