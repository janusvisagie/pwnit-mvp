Replace these two files in your repo:
- scripts/check-item-states.mjs
- scripts/reset-reopen-all-items.mjs

Then run:

node scripts/check-item-states.mjs
node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
node scripts/check-item-states.mjs

If the checks show OPEN for all items but the browser still shows them as closed, you are viewing a different app environment than the local database printed by the scripts.
