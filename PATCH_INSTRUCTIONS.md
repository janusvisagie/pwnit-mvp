# PwnIt safe leaderboard + reset patch

## Files included
- `src/app/item/[id]/leaderboard/page.tsx`
- `scripts/reset-reopen-all-items.mjs`

## What this patch does
1. Replaces the leaderboard page UI with a more polished layout.
2. Keeps the live leaderboard logic based on:
   - `scoreMs`
   - `compareScores(...)`
   - `getGameMeta(...)`
   - the existing `BuyNowButton`
   - the existing `AliasEditor`
3. Adds a developer-only reset script for safely reopening or fully resetting all items.

## Apply the patch
1. Unzip this patch into your repo root.
2. Overwrite the matching files.
3. Commit and push.

## How to use the reset script

### Dry-run only
```bash
node scripts/reset-reopen-all-items.mjs --mode=reopen
node scripts/reset-reopen-all-items.mjs --mode=full-reset
```

### Re-open all items only
This makes every item `OPEN` again and clears `closesAt`, but leaves history intact.
```bash
node scripts/reset-reopen-all-items.mjs --mode=reopen --execute
```

### Full reset of all items
This:
- re-opens all items
- deletes attempts, winners, purchases, rounds, and item-linked ledger rows
- refunds attempt credits using `Attempt.freeUsed` and `Attempt.paidUsed`
- writes a JSON backup before deleting anything

```bash
node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
```

### If purchases exist
The script refuses a full reset by default when purchase rows exist.
If you deliberately want to clear purchase history too, run:

```bash
node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute --allow-purchases
```

## Recommended production order
1. Run the full-reset dry-run first.
2. Check the counts.
3. Run the full reset with `--execute`.
4. If the dry-run reports purchases and you are unsure, stop and inspect before using `--allow-purchases`.
