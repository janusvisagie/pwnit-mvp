PwnIt cheat-resistance patch

Changed files in this ZIP:
- src/lib/verifiedGames.ts
- src/app/api/attempt/start/route.ts
- src/app/api/attempt/finish/route.ts
- src/games/route-builder/RouteBuilderGame.tsx
- src/games/balance-grid/BalanceGridGame.tsx
- src/games/pattern-match/PatternMatchGame.tsx
- src/games/spot-the-missing/SpotTheMissingGame.tsx

What this patch does:
1. Stops sending answer-bearing fields to the browser for the patched verified games.
2. Stops trusting client-reported elapsed time for scoring.
3. Makes finish claiming single-use via an atomic claim step before debit / attempt creation.
4. Temporarily disables Codebreaker on the server-verified flow until a secure server-side hint / grading flow is added.

How to apply:
1. Unzip this folder over your repo root, replacing the existing files.
2. Commit the changes.
3. Deploy.

Note:
- If any live item is still seeded to `codebreaker`, its start request will now return a 409 until you reseed away from it.
