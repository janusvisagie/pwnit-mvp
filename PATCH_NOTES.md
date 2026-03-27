PwnIt patch: game label fixes, profile stabilisation, evaluation game mix, and puzzle UX updates

Included changes
- Fix Title Case game labels on home and item pages
- Stabilise the profile page with a safe fallback instead of a hard error page
- Explain the earlier credit jump: the old relink script refunded consumed credits; the updated relink script no longer does that
- Replace the current evaluation pair with Spot the Missing and Pattern Match
- Keep Route Builder and Sequence Restore in the repository and still selectable
- Make Route Builder harder for wider score dispersion
- Prevent Balance Grid preview-solving by hiding the grid and target until the run starts
- Add Clear to Codebreaker and rename Restart to New code
- Clarify Transform Memory instructions so players know they must transform, not copy
- Update Sequence Restore and Rule Lock wording to PwnIt-aligned words
- Change Rule Lock vertical wording from left/right to above/below

Files changed
- src/components/ItemCard.tsx
- src/app/item/[id]/page.tsx
- src/app/dashboard/page.tsx
- src/app/play/[itemId]/_components/GameHost.tsx
- src/lib/gameRules.ts
- src/lib/verifiedGames.ts
- src/games/balance-grid/BalanceGridGame.tsx
- src/games/codebreaker/CodebreakerGame.tsx
- src/games/route-builder/RouteBuilderGame.tsx
- src/games/rule-lock/RuleLockGame.tsx
- src/games/sequence-restore/SequenceRestoreGame.tsx
- src/games/transform-memory/TransformMemoryGame.tsx
- src/games/pattern-match/PatternMatchGame.tsx
- src/games/spot-the-missing/SpotTheMissingGame.tsx
- src/games/types.ts
- prisma/seed.mjs
- prisma/seed.demo.mjs
- prisma/seed.preview.mjs
- scripts/relink-verified-games.mjs

Recommended apply steps
1. Copy/overwrite the files from this patch into your repo.
2. Run:
   npm install
   npx prisma generate
   npx prisma db push
3. To relink existing items to the current evaluation mix without auto-refunding credits:
   node scripts/relink-verified-games.mjs
4. Or, if you prefer a full reset of the current seeded items:
   npm run db:seed

Current evaluation mix after relink/seed
- Fuel Voucher -> Spot the Missing
- Checkers Voucher -> Transform Memory
- Takealot Voucher -> Pattern Match
- Sony WH-1000XM5 Headphones -> Codebreaker
- Nintendo Switch OLED -> Rule Lock
- GoPro HERO13 Black -> Balance Grid

Notes
- Route Builder and Sequence Restore remain in the codebase and on the verified flow so they can still be selected later.
- The updated relink script clears competitive state so older results do not mix with the current evaluation games.
