Apply this patch by copying these folders into your repo root and overwriting the matching files:

- src/components/WelcomeModal.tsx
- src/lib/productCatalog.ts
- public/images/*.webp

What this patch does:
- Adds six new product images under public/images/
- Updates productCatalog.ts to use those images first
- Replaces the welcome modal with a tighter version that keeps the same sessionStorage logic

What this patch does not change:
- Homepage logic
- Item activation or closing logic
- Countdown logic
- Credits logic
- Winner logic
- Routing
