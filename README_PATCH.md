Replace these files in your repo:
- src/app/page.tsx
- src/components/ItemCard.tsx

What this patch changes:
- home page uses 3 columns from md upward so desktop/laptop shows 6 items in a 3 x 2 grid instead of 2 x 3
- card height is reduced so the full home grid fits more reliably inside one screen on desktop
- no game mix, product image, or preview-seed logic is changed
