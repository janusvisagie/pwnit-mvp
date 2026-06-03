PwnIt 2 Patch 6 — Single campaign focus and softer palette

Apply from repo root:
C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Changed files:
- src/components/Pwnit2Home.tsx
- src/components/Pwnit2CampaignCard.tsx
- src/components/HeaderNav.tsx
- src/lib/pwnit2Lifecycle.ts
- src/app/layout.tsx
- src/app/buy-credits/page.tsx
- docs/PWNIT_2_PATCH_6_SINGLE_CAMPAIGN_EARTH_TONES.md
- README-PWNIT-2-PATCH-6.txt

After extracting, run:
npm run build

If build passes:
git add src/components/Pwnit2Home.tsx src/components/Pwnit2CampaignCard.tsx src/components/HeaderNav.tsx src/lib/pwnit2Lifecycle.ts src/app/layout.tsx src/app/buy-credits/page.tsx docs/PWNIT_2_PATCH_6_SINGLE_CAMPAIGN_EARTH_TONES.md README-PWNIT-2-PATCH-6.txt
git commit -m "Focus PwnIt 2 on one voucher campaign"
git push origin pwnit-2

Notes:
- This patch replaces the three static campaign examples with one Checkers voucher campaign.
- It softens the palette to dusty earth tones and muted sage accents.
- It keeps the credits route visible, but live credit purchasing remains paused until the PwnIt 2 wallet/ledger model is implemented.
- It does not include database or payment changes.
