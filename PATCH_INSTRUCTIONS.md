Apply this patch by copying these files into the matching paths in your local pwnit-mvp repo, then commit and push.

Files included:
- src/components/ItemCard.tsx
- src/app/page.tsx
- src/app/layout.tsx

What this patch changes:
- Makes the local Genspark product images primary for the six catalog items.
- Compresses the homepage card grid on large screens so six items are more likely to fit within one laptop viewport.
- Slightly reduces large-screen header, main, and footer vertical spacing.

What this patch does not change:
- Credits logic
- Countdown logic
- Winner / closed-item logic
- Welcome modal session behavior
- Routing or API behavior
