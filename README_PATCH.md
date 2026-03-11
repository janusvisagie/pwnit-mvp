Repo-specific patch for janusvisagie/pwnit-mvp

Included changes
- Restores repo-local image assets for Nintendo / Sony / GoPro by:
  - adding local PNG showcase assets under public/products/
  - updating src/lib/productCatalog.ts to use those local files
  - updating prisma/seed.mjs so future fresh seeds use local assets
  - updating src/components/ItemCard.tsx to prefer the repo-local fallback asset first
- Adds Alphabet Sprint as a new playable game:
  - src/games/alphabet-sprint/AlphabetSprintGame.tsx
  - src/app/play/[itemId]/_components/GameHost.tsx
  - src/lib/gameRules.ts
  - src/components/ItemCard.tsx
- Adds preview-only seeding without touching the live production 6-game mix:
  - prisma/seed.preview.mjs
  - package.json script: npm run db:seed:preview
  - prisma/seed.demo.mjs corrected to the current live 6-game mix

Recommended apply / test flow
1. Merge these files into the repo.
2. For Preview or local dev, seed as usual:
   npm run db:seed
3. Then switch Preview/local to the preview mix:
   npm run db:seed:preview
4. Verify Alphabet Sprint appears on slot 2 (replacing Memory Sprint only in Preview/local).
5. Production stays on the current 6-game mix unless someone explicitly runs the preview seed with an override.

Notes
- The current public repo no longer contains the earlier Nintendo / Sony / GoPro photo binaries, so this patch adds repo-local replacement showcase assets rather than the exact original photo files.
- The leaderboard page was also updated to respect higher-is-better games, so Alphabet Sprint ranks correctly in Preview.
