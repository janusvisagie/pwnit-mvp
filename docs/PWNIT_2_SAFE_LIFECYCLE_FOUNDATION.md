# PwnIt 2.0 Patch 1 — Safe Campaign Lifecycle Foundation

This patch adds a safe, non-monetary campaign lifecycle foundation for PwnIt 2.0.

## Lifecycle

1. `FUNDING`
   - The campaign is listed.
   - Verified engagement contributes to activation.
   - Campaign value does not grow before activation.

2. `COUNTDOWN`
   - Activation has been reached.
   - Countdown is running.
   - Players may continue free skill attempts.

3. `CLOSED`
   - Countdown has ended.
   - Leaderboard is frozen.
   - Final recognition can be shown.

4. `ARCHIVED`
   - Review window has ended.
   - Campaign is historical.

## Engagement sources

The helper module supports these safe engagement sources:

- `SKILL_ATTEMPT`
- `UNIQUE_PARTICIPANT`
- `VERIFIED_REFERRAL`
- `SURVEY_RESPONSE`
- `ADMIN_ADJUSTMENT`

## Files added

- `src/lib/pwnit2Lifecycle.ts`
- `src/app/pwnit-2/page.tsx`
- `docs/PWNIT_2_SAFE_LIFECYCLE_FOUNDATION.md`
- `README-PWNIT-2-PATCH-1.txt`

## Notes

This foundation intentionally avoids paid plays, cash-equivalent discounts, purchasable voucher mechanics, and automatic prize fulfilment. It gives the project a clean lifecycle base that can be reviewed safely before deeper implementation work.
