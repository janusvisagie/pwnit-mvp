This patch contains full-file replacements only.

Replace these files in the repo:
- src/lib/productCatalog.ts
- src/components/ItemCard.tsx
- prisma/seed.mjs
- prisma/seed.demo.mjs

What this repatch does:
- restores the exact Nintendo / Sony / GoPro photo-style display by pointing product catalog entries back to the exact remote photo URLs
- keeps local SVG assets as the fallback path for those three products
- makes the marketplace card prefer the catalog photo first and fall back to the repo-local SVG if the remote image fails
- keeps the production 6-item game mix unchanged
- keeps Alphabet Sprint preview-only via the existing prisma/seed.preview.mjs flow
- fixes prisma/seed.demo.mjs so it matches the live supported 6-game mix

Recommended after replacing files:
- redeploy the app
- if you want already-seeded local/preview databases to use the SVG fallback image paths in item.imageUrl, re-run: npm run db:seed
- only run npm run db:seed:preview in preview/local, never in production
