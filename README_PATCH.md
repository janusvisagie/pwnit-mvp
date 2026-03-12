Replace these files in your repo with the versions in this ZIP:

- src/app/layout.tsx
- src/app/page.tsx
- src/components/ItemCard.tsx
- src/components/WelcomeModal.tsx
- src/games/moving-zone/MovingZoneGame.tsx
- src/lib/gameRules.ts

What this patch changes:
- monitor / desktop home screen layout stretches the two card rows better on wide screens
- welcome modal reverts to the fuller visual version while keeping all content visible
- Moving Zone Hold now scores drift from the centre line, shows a red centre guide, and keeps the easier-to-grab black bar
- Moving Zone Hold copy is updated to match the scoring logic
