Replace these two files in your repo:
- scripts/check-item-states.mjs
- scripts/reset-reopen-all-items.mjs

Then run:

node scripts/check-item-states.mjs
node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
node scripts/check-item-states.mjs

If the second check shows OPEN for all items but the app still shows them as closed, your browser/app is pointed at a different database environment than the script.
