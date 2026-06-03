# PwnIt 2 Patch 6 — Single campaign focus and softer palette

Patch 6 turns the PwnIt 2 shell into a more focused MVP experience.

## Changed files

- `src/components/Pwnit2Home.tsx`
- `src/components/Pwnit2CampaignCard.tsx`
- `src/components/HeaderNav.tsx`
- `src/lib/pwnit2Lifecycle.ts`
- `src/app/layout.tsx`
- `src/app/buy-credits/page.tsx`
- `docs/PWNIT_2_PATCH_6_SINGLE_CAMPAIGN_EARTH_TONES.md`
- `README-PWNIT-2-PATCH-6.txt`

## What changed

- Replaces the three static campaign examples with one focused Checkers voucher campaign.
- Softens the visual direction into warmer, dustier earth tones and muted sage accents.
- Keeps the PwnIt 2 brand base but removes the harsher bright orange/cyan treatment.
- Keeps the credits page in navigation, but still pauses live purchases until the PwnIt 2 wallet rules are implemented.
- Makes the build sequence more explicit: one campaign first, then database-backed state, then play and leaderboard integration, then the purchase-window experience.

## What did not change

- No database schema changes.
- No migration.
- No payment processor changes.
- No live paid-credit logic.
- No campaign ledger logic yet.
- No changes to the existing game logic yet.
