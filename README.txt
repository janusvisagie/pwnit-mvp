Apply this patch in the CURRENT GitHub-based repo root.

What it changes:
- Home-page cards: preserve full product image more cleanly.
- Progressive Mosaic: less obvious first reveal, clearer objective wording, richer answer-tile styling, clearer answer-options heading.
- Clue Ladder: clearer objective wording, richer answer-tile styling, clearer answer-options heading.
- Spot the Missing: removes the misleading 'Visible now' wording.
- All 4 active arcade-style games (Progressive Mosaic, Clue Ladder, Spot the Missing, Rapid Math Relay):
  - live countdown display (mm:ss)
  - ticking timer state so timeout actually fires reliably
- Option banks: increases distractors from 3 to 5 where the current helper uses slice(0, 3), giving 6 choices instead of 4.

How to apply:
1. Unzip into your repo root.
2. Run:
   python apply-open-items-patch.py
3. Stop dev.
4. Delete .next
5. Start again with npm run dev
6. Hard refresh the browser.

Notes:
- This patch is written against the current GitHub repo patterns, not the uploaded ZIP.
- It is an automated patcher because the current repo state has changed repeatedly, and this avoids asking you to hand-edit files.
- It addresses the still-open items above, but it does NOT fully re-architect Progressive Mosaic into a server-issued true image-asset reveal system. It does, however, stop the first reveal from directly matching the answer and makes the game meaningfully less straightforward.
