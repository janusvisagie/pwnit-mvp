# PwnIt guest-first auth patch

This patch replaces the demo-user concept with:

- automatic guest sessions via middleware
- optional email sign-in with one-time codes
- account-only purchase / credit-buy routes
- daily free credits guarded by a stable browser bucket, so creating multiple emails on the same device/browser does not mint fresh daily free credits

## Files included

Only changed / new files are included in this patch ZIP.

## Apply steps

1. Copy the files into your repo, preserving paths.
2. Run:
   - `npx prisma generate`
   - `npx prisma db push`
3. Set the new env vars from `.env.example`.
4. Redeploy.

## Important behaviour change

- Guests can still browse and play.
- Sign-in is required for buying credits and buying items.
- A brand new email created on the same browser will not get another daily free-credit grant that day, because grants are bucketed per browser cookie as well as tracked per user.

## Known MVP limitation

If a returning user signs into an already-existing account from a guest browser, this patch signs them into that existing account but does not merge historical guest attempts into that account. For a first-time sign-up on the same browser, the current guest record is converted in place, so credits / discounts / history are preserved.

## Email sending

- In development, if `RESEND_API_KEY` is missing, the request-code API returns `devCode` so you can test without real email delivery.
- In production, `RESEND_API_KEY` should be set.
