PwnIt 2.0 Patch 3 — Primary home experience

Purpose:
- Make the pwnit-2 branch feel like PwnIt 2.0, not PwnIt 1 with an extra page.

Changed files:
- src/app/page.tsx
- src/app/pwnit-2/page.tsx
- src/app/layout.tsx
- src/components/HeaderNav.tsx
- src/components/Pwnit2Home.tsx
- docs/PWNIT_2_PATCH_3_PRIMARY_HOME.md

Apply:
1. Confirm you are on branch pwnit-2.
2. Extract this ZIP into the repo root:
   C:\Users\Janus\Desktop\Planne\JustSkill_MVP
3. Run:
   npm run build
4. If build passes:
   git add src/app/page.tsx src/app/pwnit-2/page.tsx src/app/layout.tsx src/components/HeaderNav.tsx src/components/Pwnit2Home.tsx docs/PWNIT_2_PATCH_3_PRIMARY_HOME.md README-PWNIT-2-PATCH-3.txt
   git commit -m "Make PwnIt 2 the primary home experience"
   git push origin pwnit-2

Notes:
- This patch does not remove legacy routes from the codebase.
- It makes the root page and header present PwnIt 2.0 as the main experience.
- It removes the old Buy credits link from the primary navigation.
