# PwnIt 2 Patch 9 — Database-backed campaign flow

This patch adds a database-backed single-campaign flow for the PwnIt 2 test branch.

## Included

- Live campaign API at `/api/pwnit-2/campaign`.
- Score submission API at `/api/pwnit-2/score`.
- Persistent leaderboard scores using the existing database.
- Activation transition after a configurable number of completed runs.
- Countdown transition after activation.
- Final status window after the countdown closes.
- User-facing status page at `/pwnit-2/status`.
- Cleaner Credits page copy for the current free test campaign.

## Environment knobs

Optional:

- `PWNIT2_ACTIVATION_PLAYS` defaults to `5`.
- `PWNIT2_COUNTDOWN_MINUTES` defaults to `30`.
- `PWNIT2_STATUS_WINDOW_HOURS` defaults to `24`.

## Not included

This patch does not enable payment collection, paid-credit purchasing, cash-equivalent discounts, purchase redemption, or prize payout automation.
