PwnIt verified-play patch

What this patch does
- Replaces direct client score submission with a 2-step flow:
  - POST /api/attempt/start -> server issues a one-time paid challenge
  - POST /api/attempt/finish -> server re-verifies the move log and computes the official score
- Adds DB-backed rate limiting for the paid-play endpoints
- Adds server-issued challenge sessions to the Prisma schema
- Keeps the 6 puzzle-style games and wires them into the verified paid flow
- Blocks paid submissions for legacy client-scored games

Important
- This patch is intended to be applied on top of your current repo and already includes the puzzle-game files.
- After copying these files in, run:
  1. npm install
  2. npx prisma generate
  3. npx prisma db push
- If your current database items still use legacy game keys, re-seed or reassign the first 6 items so they use:
  sequence-restore, transform-memory, route-builder, codebreaker, rule-lock, balance-grid

Recommended simple next step
- After applying the patch, run your existing demo/preview seed so the live item mix moves onto the verified puzzle games.
