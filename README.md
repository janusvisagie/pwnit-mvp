# Skill-first MVP (Next.js + Prisma + SQLite)

Developer-ready MVP skeleton for a **skill-first, leaderboard-wins** prize platform.

## Quick start

```bash
npm i
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open: http://localhost:3000

## What’s included
- 9-card marketplace grid + activation progress UI
- Play flow (reaction game) + score submission
- Leaderboard per item + day
- Loyalty Credits ledger (non-cash, non-withdrawable)
- Referral hook (schema + future API extension)
- Admin dashboard (read-only MVP)

## Replace before production
- Auth (currently a demo cookie login)
- Anti-cheat (currently basic flagging)
- Proper legal copy + disclosures
