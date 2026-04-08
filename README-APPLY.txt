Patch contents
- src/components/ItemCard.tsx
- src/games/progressive-mosaic/ProgressiveMosaicGame.tsx
- src/games/clue-ladder/ClueLadderGame.tsx
- src/games/spot-the-missing/SpotTheMissingGame.tsx
- src/games/rapid-math-relay/RapidMathRelayGame.tsx
- src/lib/rateLimit.ts
- apply-item-page-image-fix.mjs

Apply steps
1. Unzip into your repo root and overwrite the included files.
2. Run:
   node apply-item-page-image-fix.mjs
3. Stop dev if running.
4. Delete .next
5. Start again:
   npm run dev
6. Hard refresh the browser.

Notes
- Home-page images are switched back to full-image containment.
- Item-page image is enlarged via the small patch script.
- Progressive Mosaic and Clue Ladder now auto-reveal the first clue when a run starts.
- Practice mode for Progressive Mosaic, Clue Ladder, Spot the Missing, and Rapid Math Relay now continues until the user makes a mistake or times out.
- Rapid Math Relay now enforces timer expiry.
- The Prisma rate limiter no longer uses a transaction wrapper.
