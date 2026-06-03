# PwnIt 2 Patch 5 — Campaign board, palette alignment and credits route

Patch 5 continues moving the `pwnit-2` branch from a PwnIt 1-style homepage toward a PwnIt 2 campaign-board experience.

## Changed files

- `src/components/Pwnit2Home.tsx`
- `src/components/Pwnit2CampaignCard.tsx`
- `src/components/HeaderNav.tsx`
- `src/app/layout.tsx`
- `src/app/buy-credits/page.tsx`
- `docs/PWNIT_2_PATCH_5_CAMPAIGN_BOARD.md`
- `README-PWNIT-2-PATCH-5.txt`

## What changed

- Adds a PwnIt 2 campaign-board homepage with static campaign examples.
- Makes the visual design less black-and-white by adding warm orange/amber and cyan accents over the existing slate/white base.
- Restores a credits navigation entry and `/buy-credits` route.
- Keeps the credits route as a PwnIt 2 placeholder rather than reusing the old PwnIt 1 live payment flow.
- Keeps the rule that voucher/value growth is locked before activation.

## What did not change

- No database schema changes.
- No migration.
- No payment processor changes.
- No live paid-credit logic.
- No campaign ledger logic yet.
