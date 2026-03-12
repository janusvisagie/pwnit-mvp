Replace the existing repo files with the files in this ZIP, preserving the same paths.

This patch does four things:
1. Makes the mobile welcome modal more compact so the full text and button fit better.
2. Restores normal desktop scrolling and widens the page so the homepage looks less compressed on a monitor.
3. Changes Moving Zone Hold so the black pointer/bar inside the zone is what starts the game, and updates the instruction text.
4. Replaces Trace Run with Alphabet Sprint, including labels and leaderboard behaviour, without requiring a database reseed.

Files included:
- src/app/layout.tsx
- src/app/page.tsx
- src/components/WelcomeModal.tsx
- src/components/ItemCard.tsx
- src/games/moving-zone/MovingZoneGame.tsx
- src/games/trace-run/TraceRunGame.tsx
- src/games/alphabet-sprint/AlphabetSprintGame.tsx
- src/app/play/[itemId]/_components/GameHost.tsx
- src/lib/gameRules.ts
