
PwnIt hidden-state games patch

What this patch adds
- upgrades Codebreaker onto a true hidden-state verified flow
- adds Hidden Pair Memory as a new server-progressive verified game
- adds /api/attempt/progress for per-move server feedback
- makes /api/attempt/start return a redacted public challenge for hidden-state games
- updates relink + seed so Fuel Voucher uses Hidden Pair Memory and Sony stays on Codebreaker

Files included
- src/lib/verifiedGames.ts
- src/lib/gameRules.ts
- src/app/play/[itemId]/_components/GameHost.tsx
- src/app/api/attempt/start/route.ts
- src/app/api/attempt/progress/route.ts
- src/app/api/attempt/finish/route.ts
- src/games/codebreaker/CodebreakerGame.tsx
- src/games/hidden-pair-memory/HiddenPairMemoryGame.tsx
- src/games/types.ts
- src/games/registry.ts
- prisma/seed.mjs
- scripts/relink-verified-games.mjs

Apply
1. Unzip into your repo root and overwrite existing files.
2. Commit and push.
3. Redeploy.

To link current items without a full reseed
node scripts/relink-verified-games.mjs

To reseed from scratch
npm run db:seed

Notes
- No Prisma schema change is required for this patch.
- Codebreaker now checks each guess through the server.
- Hidden Pair Memory reveals only the chosen pair after each committed turn.
- Pattern Match / the other visible-puzzle games remain as they are for now.
