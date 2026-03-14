Apply these files over the matching paths in your local pwnit-mvp repo, then commit and push.

Changed files in this patch:
- src/app/globals.css
- src/app/layout.tsx
- src/app/page.tsx
- src/components/CreditsPill.tsx
- src/components/DemoUserSwitcher.tsx
- src/components/HeaderNav.tsx
- src/components/ItemCard.tsx
- src/components/ProductImage.tsx

What changed:
- Simplified the overall shell and homepage to match the cleaner Genspark feel.
- Reduced the “busy” hero treatment and reverted to a straightforward logged-in line + live alert + card grid.
- Updated prize cards to a simpler product-first design.
- Changed product image priority so the real item imageUrl is used first whenever available.
- Kept all item state, countdown, winner settlement, navigation, credits refresh, and demo-user logic intact.
