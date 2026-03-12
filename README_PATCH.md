Replace these files in your repo with the versions from this ZIP:

- src/app/layout.tsx
- src/app/page.tsx
- src/components/ItemCard.tsx

This patch does two things:
1. Forces the homepage to use fresh live item states so closed/won items show correctly with the banner instead of still looking open.
2. Rebalances the homepage grid/card sizing so it fills desktop height better without oversizing the cards on smaller laptop screens.
