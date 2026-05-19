PwnIt patch: remove homepage intro wording/block

What this does
- Removes this block from the home page:
  "Pick. Play. PwnIt."
  "Prizes build through play and verified subscriber growth."
  "Each item activates from registered player activity plus visible verified subscriber contribution..."

Files included
- apply-remove-home-copy.mjs
- README-APPLY.txt

How to apply
1. Extract this ZIP into the root of your pwnit-mvp repository.
   Example target folder:
   C:\Users\Janus\Desktop\Planne\JustSkill_MVP

2. From that repository root, run:
   node apply-remove-home-copy.mjs

3. Then run your normal check/build:
   npm run build

4. Commit and push the resulting change to src/app/page.tsx.

Notes
- No database command is required.
- You do not need to run npm run db:push.
- You do not need to run npm run db:seed.
- If the block is already gone, the script will safely say that no change is needed.
