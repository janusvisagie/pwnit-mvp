PwnIt patch - activation/referral UX refresh

What is included
- Larger, clearer homepage prize cards
- Item page activation copy refresh
- New invite modal on the item page
- Redesigned referrals/rules screen
- Monthly referral leaderboard
- Referral growth split for NEW referrals:
  - +5 hidden activation credits to the first prize the referred player starts playing
  - +5 bonus credits to the referrer

Apply
1. Download this ZIP.
2. Open your local pwnit-mvp folder.
3. Extract the ZIP into the repo root.
4. Allow Windows to replace the existing files.
5. Run your normal dev/build flow.

Notes
- No Prisma/schema migration is required for this patch.
- Existing historical referrals remain as they were.
- The new 50/50 split applies to new referral qualifications after this patch is deployed.
