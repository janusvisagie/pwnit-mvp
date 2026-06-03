PwnIt 2 Patch 5 — Campaign board, palette alignment and credits route

Apply from repo root:
C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Changed files:
- src/components/Pwnit2Home.tsx
- src/components/Pwnit2CampaignCard.tsx
- src/components/HeaderNav.tsx
- src/app/layout.tsx
- src/app/buy-credits/page.tsx
- docs/PWNIT_2_PATCH_5_CAMPAIGN_BOARD.md
- README-PWNIT-2-PATCH-5.txt

After extracting, run:
npm run build

If build passes:
git add src/components/Pwnit2Home.tsx src/components/Pwnit2CampaignCard.tsx src/components/HeaderNav.tsx src/app/layout.tsx src/app/buy-credits/page.tsx docs/PWNIT_2_PATCH_5_CAMPAIGN_BOARD.md README-PWNIT-2-PATCH-5.txt
git commit -m "Add PwnIt 2 campaign board"
git push origin pwnit-2

Notes:
- This patch restores the credits route in the PwnIt 2 navigation.
- It does not enable live credit purchases yet.
- It keeps value growth locked before activation.
