PwnIt 2.0 Patch 1 — Safe Campaign Lifecycle Foundation
=======================================================

What this patch adds
--------------------
1. A new lifecycle helper module:
   src/lib/pwnit2Lifecycle.ts

2. A simple reference page:
   src/app/pwnit-2/page.tsx

3. A foundation note:
   docs/PWNIT_2_SAFE_LIFECYCLE_FOUNDATION.md

How to apply
------------
1. Confirm you are on the PwnIt 2 branch:

   git branch

   You should see:

   * pwnit-2

2. Confirm the working tree is clean:

   git status

   You should see:

   nothing to commit, working tree clean

3. Extract this ZIP into the repo root:

   C:\Users\Janus\Desktop\Planne\JustSkill_MVP

4. Run:

   npm run build

5. If the build passes, commit and push:

   git add src/lib/pwnit2Lifecycle.ts src/app/pwnit-2/page.tsx docs/PWNIT_2_SAFE_LIFECYCLE_FOUNDATION.md README-PWNIT-2-PATCH-1.txt
   git commit -m "Add PwnIt 2 lifecycle foundation"
   git push origin pwnit-2

After deploy
------------
Open:

   /pwnit-2

This page confirms the lifecycle foundation has been added.

No database migration is required for this patch.
