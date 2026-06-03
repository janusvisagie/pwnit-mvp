PwnIt 2 Patch 1B - Build Fix
=============================

Purpose
-------
Fixes the local/production build failure where Next.js attempts to prerender /api/me during npm run build and Prisma tries to reach the database at build time.

Changed file
------------
src/app/api/me/route.ts

Change made
-----------
Adds:

export const dynamic = "force-dynamic";

This keeps /api/me as a runtime API route instead of allowing Next.js to evaluate it during static prerendering.

Apply
-----
Extract this ZIP into the repo root:

C:\Users\Janus\Desktop\Planne\JustSkill_MVP

Then run:

npm run build

git status

git add src/app/api/me/route.ts README-PWNIT-2-PATCH-1B-BUILD-FIX.txt
git commit -m "Mark API me route as dynamic"
git push origin pwnit-2
