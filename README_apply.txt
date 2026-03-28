This patch includes full replacement files for:
- src/app/page.tsx
- src/components/ItemCard.tsx
- src/app/item/[id]/page.tsx
- src/app/play/[itemId]/page.tsx
- src/games/pattern-match/PatternMatchGame.tsx

Notes:
- Home cards are made more compact and viewport-aware on large screens.
- Item/play pages are tightened up.
- Pattern Match now uses visual tiles instead of plain words.
- Pattern Match button text is now Replay, and local/practice replay generates a fresh challenge.
- I did not replace the full dashboard page file in this ZIP just to change the Profile heading text.
  My recommendation is yes: "My Profile" reads better than "Profile".
