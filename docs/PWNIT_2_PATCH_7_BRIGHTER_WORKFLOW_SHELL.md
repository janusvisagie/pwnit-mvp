# PwnIt 2 Patch 7 — Brighter Workflow Shell

Patch 7 keeps the PwnIt 2 branch moving forward without wiring the old payment flow into the new model.

## Changes

- Restores a brighter PwnIt look after the muted earth-tone version.
- Replaces the harsh amber/orange with softer coral and peach accents.
- Keeps the one-voucher campaign focus.
- Adds Credits back to the primary navigation.
- Replaces the legacy `/buy-credits` redirect with a PwnIt 2 credits-status placeholder.
- Keeps the shell non-transactional while the PwnIt 2 workflow is being converted.

## Files changed

- `src/components/Pwnit2Home.tsx`
- `src/components/Pwnit2CampaignCard.tsx`
- `src/components/HeaderNav.tsx`
- `src/app/buy-credits/page.tsx`

## Notes

This patch does not enable checkout, paid credits, voucher redemption, or discount accounting. It keeps the visible UX structure in place and prepares the branch for the next larger block: a database-backed single campaign.
