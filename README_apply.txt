PwnIt cheat-resistance patch

Changed files included:
- src/lib/verifiedGames.ts
- src/app/api/attempt/start/route.ts
- src/app/api/attempt/finish/route.ts
- src/games/balance-grid/BalanceGridGame.tsx
- src/games/pattern-match/PatternMatchGame.tsx
- src/games/spot-the-missing/SpotTheMissingGame.tsx

What this patch fixes:
1. Answer leakage
   - The server now stores the full private challenge and only returns a redacted public challenge to the browser.
   - Hidden answer fields are no longer sent for balance-grid, pattern-match, and spot-the-missing.

2. Client-controlled elapsed time
   - Verified scoring now uses serverElapsedMs only.
   - Client elapsedMs is no longer trusted for official scoring.

3. Atomic finish claiming
   - /api/attempt/finish now first atomically claims the session by switching ISSUED -> SUBMITTING.
   - A second finish call on the same attempt now gets rejected cleanly.

Important temporary behaviour change:
- route-builder and codebreaker are removed from the hardened verified flow for now.
- If an item is still configured to one of those game keys, the attempt start route will return a 409 and that item should be re-seeded or switched to one of the still-hardened verified games.

How to apply:
1. Unzip this folder into the root of your repo.
2. Replace the existing files with these ones.
3. Run your normal local checks / dev server.
4. Test these flows on localhost first:
   - verified attempt start
   - verified attempt finish
   - double-click / double-submit finish
   - wrong answer rejection
   - balance-grid / pattern-match / spot-the-missing still render correctly

Recommended current verified games after this patch:
- Rule Lock
- Transform Memory
- Sequence Restore
- Balance Grid
- Pattern Match
- Spot the Missing
