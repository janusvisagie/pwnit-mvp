PwnIt patch: architectural blockers + Rapid Math Relay

Changed files included:
- src/lib/verifiedGames.ts
- src/lib/gameRules.ts
- src/app/api/attempt/start/route.ts
- src/app/api/attempt/finish/route.ts
- src/app/play/[itemId]/_components/GameHost.tsx
- src/games/types.ts
- src/games/registry.ts
- src/games/balance-grid/BalanceGridGame.tsx
- src/games/pattern-match/PatternMatchGame.tsx
- src/games/spot-the-missing/SpotTheMissingGame.tsx
- src/games/rapid-math-relay/RapidMathRelayGame.tsx

What this patch does:
1. Keeps the three architectural fixes:
   - hidden answer fields are not returned to the browser for the hardened verified games,
   - official verified scoring uses server-observed elapsed time,
   - finish claims are single-use before processing.

2. Adds a new verified game:
   - rapid-math-relay

What Rapid Math Relay needs to be used:
- Point an item's gameKey at: rapid-math-relay
- The GameHost registry and verified-game server flow now support it.

Suggested localhost tests:
- Start a verified run on a rapid-math-relay item
- Submit all correct answers
- Submit some wrong answers
- Double-submit the same attemptId
- Confirm leaderboard labels render correctly for rapid-math-relay
