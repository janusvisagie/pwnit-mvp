PwnIt 2.0 Patch 4 — Brand alignment and replacement shell

Purpose:
- Make the pwnit-2 branch feel more like PwnIt 2 replacing PwnIt 1, not PwnIt 2 being inserted inside PwnIt 1.
- Keep the same slate-and-white PwnIt visual language.
- Keep the old Buy credits route out of the primary navigation until a PwnIt 2-specific wallet/purchase flow is designed.

Changed files:
- src/app/page.tsx
- src/app/pwnit-2/page.tsx
- src/app/layout.tsx
- src/components/HeaderNav.tsx
- src/components/Pwnit2Home.tsx
- docs/PWNIT_2_PATCH_4_BRAND_REPLACEMENT.md

Apply:
1. Confirm you are on branch pwnit-2.
2. Extract this ZIP into the repo root:
   C:\Users\Janus\Desktop\Planne\JustSkill_MVP
3. Run:
   npm run build
4. If build passes:
   git add src/app/page.tsx src/app/pwnit-2/page.tsx src/app/layout.tsx src/components/HeaderNav.tsx src/components/Pwnit2Home.tsx docs/PWNIT_2_PATCH_4_BRAND_REPLACEMENT.md README-PWNIT-2-PATCH-4.txt
   git commit -m "Align PwnIt 2 home shell with brand"
   git push origin pwnit-2

Notes:
- No database changes.
- No schema changes.
- No payment or voucher mechanics.
- Legacy routes remain in the repository for direct testing.
