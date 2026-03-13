Replace these files in your repo with the versions in this ZIP:
- src/app/layout.tsx
- src/app/page.tsx
- src/components/ItemCard.tsx

This patch:
- restores a clear diagonal closed/won banner on homepage cards
- treats any non-OPEN / non-ACTIVATED item as closed on the homepage
- makes the homepage layout more height-aware so it behaves better on both laptop and external monitor screens
