PwnIt 2 Patch 8 — Game + Leaderboard Shell

Apply by extracting this ZIP into your repo root:
C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Then run:
npm run build

If it passes:
git add src/components/Pwnit2Home.tsx src/components/Pwnit2CampaignCard.tsx src/components/Pwnit2Game.tsx src/components/Pwnit2Leaderboard.tsx src/lib/pwnit2DemoCampaign.ts src/app/play/pwnit-2/page.tsx src/app/pwnit-2/leaderboard/page.tsx docs/PWNIT_2_PATCH_8_GAME_LEADERBOARD.md README-PWNIT-2-PATCH-8.txt

git commit -m "Add PwnIt 2 game and leaderboard shell"
git push origin pwnit-2

After deployment, check:
/
/play/pwnit-2
/pwnit-2/leaderboard
