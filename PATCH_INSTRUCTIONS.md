Apply these files into your repo root, overwriting the existing files:

- src/lib/rounds.ts
- src/app/play/[itemId]/page.tsx
- src/games/target-grid/TargetGridGame.tsx

What this patch does:
- fixes the play/submit mismatch by making rounds self-heal when an item has been reopened but its last round is still in a terminal state
- makes the play page check the round lifecycle, so it only offers gameplay when the backend will accept submissions
- removes the redundant "Target cell" block from Target Grid while keeping the highlighted target square
