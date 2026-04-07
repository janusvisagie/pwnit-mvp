PwnIt hidden-state games patch (next 4 games)

This patch adds:
- Progressive Mosaic
- Clue Ladder
- Safe Path Fog
- Signal Hunt

It keeps the previously added hidden-state games:
- Codebreaker
- Hidden Pair Memory

Files included:
- src/lib/nextHiddenStateGames.ts
- updated verified-game wiring / progress route / GameHost / gameRules / registry / types
- new game components
- updated seed + relink mapping so the 6 current prizes map to the 6 hidden-state games

Apply steps:
1. Unzip into your repo root and overwrite the included files.
2. Commit and push.
3. Redeploy.
4. After deploy, relink your current items:
   node scripts/relink-verified-games.mjs

If you want a full reset + reseed instead of relinking:
   npm run db:seed

New 6-game seeded mix after this patch:
- Fuel Voucher -> Hidden Pair Memory
- Checkers Voucher -> Clue Ladder
- Takealot Voucher -> Progressive Mosaic
- Sony WH-1000XM5 Headphones -> Codebreaker
- Nintendo Switch OLED -> Signal Hunt
- GoPro HERO13 Black -> Safe Path Fog
