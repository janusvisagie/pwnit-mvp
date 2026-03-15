Apply this patch by copying the included file into the matching path in your repo, then commit and push.

Changed file:
- src/app/item/[id]/page.tsx

What this patch does:
- removes the height cap that was clipping some item-page content
- keeps the page compact enough for typical laptop screens
- reduces desktop image height and compresses spacing
- keeps all existing item-page logic unchanged
