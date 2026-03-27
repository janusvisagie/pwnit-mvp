PwnIt patch: compact layouts + visual Pattern Match

Changed files
- src/app/page.tsx
- src/components/ItemCard.tsx
- src/app/item/[id]/page.tsx
- src/app/play/[itemId]/page.tsx
- src/app/play/[itemId]/_components/GameHost.tsx
- src/games/pattern-match/PatternMatchGame.tsx
- src/lib/verifiedGames.ts

What this patch does
- Makes the home page grid more compact so 6 cards fit more comfortably on desktop.
- Keeps larger item images but reduces card height and spacing.
- Makes item and play pages more compact.
- Changes Pattern Match from word strips to visual prize/platform tiles.
- Updates server-issued Pattern Match challenges to use the same visual tile IDs.

Apply
1. Unzip into your repo root and overwrite the existing files.
2. Commit and push.
3. Redeploy.

Notes
- No database migration is needed for this patch.
- Pattern Match remains server-verified; only the displayed assets changed from words to visual tiles.
