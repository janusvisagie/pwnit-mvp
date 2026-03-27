PwnIt patch: relink current items to the verified puzzle games

Why this patch exists
- The new game components are in the codebase, but your current database items can still be linked to legacy game keys.
- When that happens, the play page shows the legacy-flow warning and blocks competitive submissions.

What this patch adds
- scripts/relink-verified-games.mjs
- clearer legacy-link messaging in the play page and attempt start route

What the relink script does
- updates the current items in the database to the verified puzzle game keys
- uses the known 6-item title mapping first
- falls back to a legacy-key-to-verified-key mapping when titles do not match
- refunds previously consumed play credits from stored attempts
- clears attempts, attempt sessions, rounds, and winners so legacy and verified results do not mix

How to apply
1. Unzip this patch over the repo root.
2. Deploy or rebuild as normal.
3. Run this once against the database you actually want to fix:

   node scripts/relink-verified-games.mjs

4. Refresh the site and open an item play page again.

Important
- This is intended for your current demo/test state.
- It resets competitive history so the new server-verified puzzle results start cleanly.
