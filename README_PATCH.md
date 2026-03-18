# Referral + Survey patch

This patch adds:

- `/?ref=CODE` referral capture via middleware cookie
- a `/referrals` page with share link, manual code entry, and referral history
- automatic referral crediting after the referred player completes their first real play
- a `/feedback` page with an optional survey that rewards credits once per browser/account
- Prisma schema additions for `Referral` and `SurveyResponse`
- `/api/referrals/apply` and `/api/surveys/submit`
- `/api/me` hook-in so referral rewards can settle during normal UI refreshes

## Files included

- `prisma/schema.prisma`
- `src/lib/referrals.ts`
- `src/lib/survey.ts`
- `src/app/api/me/route.ts`
- `src/app/api/referrals/apply/route.ts`
- `src/app/api/surveys/submit/route.ts`
- `src/app/referrals/page.tsx`
- `src/app/feedback/page.tsx`
- `src/components/ReferralPanel.tsx`
- `src/components/FeedbackSurveyForm.tsx`
- `src/middleware.ts`

## Apply steps

1. Copy the files into your repo.
2. Run:

```bash
npx prisma generate
npx prisma db push
```

3. Restart local dev or redeploy.

## Notes

- Referral rewards are set to **20 credits for the referrer** and **10 credits for the new player**.
- The reward is triggered when the referred player completes their **first real play**.
- For anti-abuse, this version is bucket-based: the first referral captured for a browser bucket wins, and the survey reward is one per survey per browser bucket.
- This patch does **not** modify your custom `HeaderNav` component because that file was not part of the earlier patch bundles. The new pages are available at `/referrals` and `/feedback` immediately.
