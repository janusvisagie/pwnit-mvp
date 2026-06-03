PwnIt 2 Patch 9 — Database-backed campaign flow

Apply by extracting this ZIP into your repo root:
C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Then run:
npm run build

If it passes:
git add src/lib/pwnit2DemoCampaign.ts src/lib/pwnit2CampaignServer.ts src/app/api/pwnit-2/campaign/route.ts src/app/api/pwnit-2/score/route.ts src/components/Pwnit2CampaignCard.tsx src/components/Pwnit2Home.tsx src/components/Pwnit2Game.tsx src/components/Pwnit2Leaderboard.tsx src/components/Pwnit2Status.tsx src/app/pwnit-2/status/page.tsx src/app/buy-credits/page.tsx docs/PWNIT_2_PATCH_9_DB_CAMPAIGN_FLOW.md README-PWNIT-2-PATCH-9.txt

git commit -m "Add PwnIt 2 database-backed campaign flow"
git push origin pwnit-2

After deployment, check:
/
/play/pwnit-2
/pwnit-2/leaderboard
/pwnit-2/status
/buy-credits
