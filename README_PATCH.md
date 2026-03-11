PwnIt patch - full file replacements

Replace these files in your repo with the versions in this ZIP:

- src/app/layout.tsx
- src/app/page.tsx
- src/app/globals.css
- src/app/icon.svg
- src/components/ItemCard.tsx
- src/components/WelcomeModal.tsx
- src/games/number-memory/NumberMemoryGame.tsx
- src/games/moving-zone/MovingZoneGame.tsx
- src/games/trace-run/TraceRunGame.tsx

What this patch changes:
- fixes the welcome modal so the full text and Start button fit on mobile
- rebalances the desktop homepage so it fills the screen without clipping the cards
- adds a proper browser tab icon
- restores Memory Sprint to a manual start with multiple rounds
- puts the Moving Zone start button inside the zone on top of the cursor
- makes Trace Run touch-friendly by adding a separate phone touch pad below the arena
