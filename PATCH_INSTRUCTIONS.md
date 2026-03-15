Apply this patch by copying the included file into your repo root and overwriting the existing file:

- src/app/item/[id]/page.tsx

What it changes:
- Keeps all existing item-page logic intact
- Compresses the desktop/laptop item page layout so it is more likely to fit within one screen
- Leaves mobile behavior responsive

What it does not change:
- game logic
- credits logic
- winner logic
- countdown logic
- product catalog logic
- leaderboard page
