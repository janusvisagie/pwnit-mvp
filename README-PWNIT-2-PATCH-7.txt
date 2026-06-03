PwnIt 2 Patch 7 — Brighter Workflow Shell

Apply from repo root:
C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Files changed:
- src/components/Pwnit2Home.tsx
- src/components/Pwnit2CampaignCard.tsx
- src/components/HeaderNav.tsx
- src/app/buy-credits/page.tsx
- docs/PWNIT_2_PATCH_7_BRIGHTER_WORKFLOW_SHELL.md

After extracting, run:
npm run build

If build passes:
git add src/components/Pwnit2Home.tsx src/components/Pwnit2CampaignCard.tsx src/components/HeaderNav.tsx src/app/buy-credits/page.tsx docs/PWNIT_2_PATCH_7_BRIGHTER_WORKFLOW_SHELL.md README-PWNIT-2-PATCH-7.txt
git commit -m "Refine PwnIt 2 workflow shell"
git push origin pwnit-2

This patch keeps the PwnIt 2 shell non-transactional. It restores a brighter palette, softens the orange/amber into coral/peach, keeps one campaign, and replaces the old buy-credits redirect with a PwnIt 2 credits-status page.
