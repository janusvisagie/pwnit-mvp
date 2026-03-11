PwnIt homepage fit patch v3

Replace these full files in the repo:
- src/app/layout.tsx
- src/app/page.tsx
- src/components/ItemCard.tsx

What this patch changes:
- frees a little more vertical space in the header/footer shell
- makes the homepage grid consume available height more cleanly on desktop
- slightly reduces item-card height so the bottom frame and activation bar remain visible

What this patch does not change:
- product photos
- Alphabet Sprint logic
- preview/production seeding
