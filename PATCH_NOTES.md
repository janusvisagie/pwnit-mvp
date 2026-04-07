
# PwnIt security hardening patch

This patch does four things:

1. Adds a concrete 6-game replacement design spec under `docs/PWNIT_REPLACEMENT_GAME_SET_V2.md`.
2. Adds Cloudflare Turnstile to login/register and to first or bursty competitive play starts.
3. Adds optional score-based risk review support from either reCAPTCHA v3 or forwarded Cloudflare bot scores.
4. Places suspicious podium rounds into `REVIEW` instead of auto-publishing winners.

## New environment variables

Set whichever of these you want to use:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=

# Optional thresholds
PWNIT_RECAPTCHA_REVIEW_THRESHOLD=0.35
PWNIT_CF_BOT_REVIEW_THRESHOLD=30
PWNIT_INTERACTION_REVIEW_THRESHOLD=0.35
```

## Deployment notes

- Turnstile is enforced only when both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` are set.
- reCAPTCHA scoring is used only when both `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` are set.
- Cloudflare bot score review works only if you forward the score to origin, for example as `x-pwnit-cf-bot-score`.

## Recommended Cloudflare forwarding

If you have Cloudflare Bot Management, forward `cf.bot_management.score` to origin as a request header such as `x-pwnit-cf-bot-score` via a Worker or equivalent edge logic.

## Files changed

- `docs/PWNIT_REPLACEMENT_GAME_SET_V2.md`
- `src/components/TurnstileWidget.tsx`
- `src/lib/turnstile.ts`
- `src/lib/botRisk.ts`
- `src/app/login/LoginClient.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/attempt/start/route.ts`
- `src/app/api/attempt/finish/route.ts`
- `src/app/play/[itemId]/_components/GameHost.tsx`
- `src/lib/rounds.ts`
- `src/lib/settle.ts`
- `src/app/admin/page.tsx`

## Apply

1. Unzip into the repo root and overwrite the existing files.
2. Set the environment variables you want to use.
3. Commit and redeploy.

No Prisma migration is required for this patch.
