PwnIt patch: puzzle-first game pack

What this patch adds
- Route Builder
- Codebreaker
- Rule Lock
- Transform Memory
- Sequence Restore

Files changed
- prisma/seed.mjs
- prisma/seed.demo.mjs
- prisma/seed.preview.mjs
- src/app/play/[itemId]/_components/GameHost.tsx
- src/games/registry.ts
- src/games/types.ts
- src/lib/gameRules.ts
- plus 5 new game component files under src/games/

Seed mix used in this patch
- Fuel Voucher -> sequence-restore
- Checkers Voucher -> transform-memory
- Takealot Voucher -> route-builder
- Sony WH-1000XM5 Headphones -> codebreaker
- Nintendo Switch OLED -> rule-lock
- GoPro HERO13 Black -> memory-sprint

How to apply
1. Unzip the patch over the repo root.
2. Run npm install if needed.
3. Run npm run db:seed for a full reseed, or npm run db:seed:demo / npm run db:seed:preview if that is your normal flow.
4. Run npm run dev and test the new games.

Important caveat
This patch changes the game mix to puzzle-style games that are less attractive to simple timing/tap bots, but it does NOT make the platform server-authoritative. The current /api/attempt flow still accepts client-submitted scores, so this reduces abuse risk but does not eliminate cheating.
