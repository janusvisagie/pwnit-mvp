# PwnIt canonical activation + referral ruleset (updated)

This patch is cumulative and is intended to replace the earlier patches from today.

## Core rules locked in

- Daily free credits remain **30**.
- Unlimited **practice mode** remains available on all items.
- Listed credits per play are seeded so that each item sits at about **100 paid-play equivalents** to activate.
- **Checkers Voucher** keeps the existing internal `clue-ladder` key for safety, but the user-facing label becomes **Number Chain**.
- Activation is now shown as a visible stacked bar:
  - **Player activity**
  - **Verified subscribers**
  - **Remaining**
- Verified-subscriber contribution goes to the **specific shared item only**.
- Qualified referral reward is now a **user choice**:
  - **10 bonus credits** (default-highlighted)
  - **R10 referral discount**
- Referral discount stays visible as a **separate wallet bucket**.
- Monthly referral leaderboard remains visible.

## Exact seeded play costs

- Fuel Voucher: **3 credits / play**
- Checkers Voucher: **5 credits / play**
- Takealot Voucher: **10 credits / play**
- Sony WH-1000XM5: **20 credits / play**
- Nintendo Switch OLED: **35 credits / play**
- GoPro HERO13 Black: **65 credits / play**

The helper now resolves play cost from either the seeded `playCostCredits` or `ceil(prizeValueZAR / 100)` as fallback.

## Exact seeded activation targets

Patch formula:

`activationTargetCredits = max(playCostCredits, activationGoalEntries * playCostCredits - allowedSubsidyCredits)`

With `activationGoalEntries = 100` and `allowedSubsidyCredits = 0`, the default seeded targets are:

- Fuel Voucher: **300**
- Checkers Voucher: **500**
- Takealot Voucher: **1000**
- Sony WH-1000XM5: **2000**
- Nintendo Switch OLED: **3500**
- GoPro HERO13 Black: **6500**

## Important clarification on public activation vs internal economics

The public activation bar now measures:

`player activity credits + verified subscriber credits`

Where:
- `player activity credits = paid credits spent + free credits spent on registered plays`
- `verified subscriber credits = +10 for each qualified referral on the specific shared item`

This keeps the user-facing system easy to understand while still allowing you to monitor real commercial performance separately from activation momentum.

## Premium-item daily free-credit rule

The patch removes the old “one protected registered attempt even if you only have 1 free credit left” idea.

Instead, it now does this:

- If an item’s listed play cost is **more than 30**,
- and the user still has their **full 30 free credits available**,
- the registered play can be charged at **30** for that attempt.

So the premium-item behaviour becomes:

- GoPro listed cost = **65**
- If free balance is **30 or more**, one registered attempt can still go through for **30**
- After that, the normal listed play cost applies again

This avoids the exploit case where someone spends down to 1 free credit and then still claims a 65-credit play.

## Qualified referral rule

A referral qualifies when the invited user:

- arrives through the invite link / saved invite code
- signs up / is no longer a guest
- completes a first real registered play

When qualified:

- **+10 verified subscriber credits** are added to the specific shared prize
- the referrer receives the reward type currently selected in their referral hub:
  - **10 bonus credits**, or
  - **R10 referral discount**

## Buy-now plumbing in this patch

This patch now wires referral discount into the actual buy route at:

- `src/app/api/item/[ItemId]/buy/route.ts`

Mechanics:

1. Existing gameplay discount is calculated first by the current pricing helper.
2. Referral discount wallet is then applied on top.
3. Only the remaining amount is paid via wallet/top-up.
4. Referral discount wallet is decremented and logged when used.

## Funding / timing

Seed defaults in this patch:

- funding window = **168 hours** for all items
- countdown after activation = **30 minutes**
- purchase grace = **24 hours**

If a building round reaches funding end without activating:

- the round is refunded
- paid credits are returned
- failed-round consolation logic still runs

## Files included

- `prisma/schema.prisma`
- `prisma/seed.mjs`
- `src/lib/playCost.ts`
- `src/lib/rounds.ts`
- `src/lib/referrals.ts`
- `src/app/api/referrals/apply/route.ts`
- `src/app/api/referrals/preference/route.ts`
- `src/app/api/attempt/finish/route.ts`
- `src/app/api/item/[ItemId]/buy/route.ts`
- `src/app/api/item/buy/route.ts`
- `src/app/page.tsx`
- `src/components/ItemCard.tsx`
- `src/app/item/[id]/page.tsx`
- `src/components/InviteFriendsModal.tsx`
- `src/components/ReferralPanel.tsx`
- `src/components/ReferralCapture.tsx`
- `src/app/referrals/page.tsx`

## Apply

1. Extract into the repo root.
2. Run `npm run db:push`
3. Run `npm run db:seed`

Because the schema and seed are updated, reseeding is required for the intended test state.
