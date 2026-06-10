# PwnIt 2 — Proposed schema changes (REVIEW ONLY — do not apply yet)

This is the data-model proposal for the campaign lifecycle, audit ledgers, admin audit log, and
archive snapshot you requested. **Nothing here is applied.** It requires a Prisma migration, which
should only be run against the **pwnit-2** database, after a backup (see `DB_MIGRATION_AND_BACKUP.md`).

## Important: there is no `Campaign` model

In this codebase a "campaign" is an **`Item`** (the prize/voucher) plus its current **`ItemRound`**
(the live instance with the state machine). `CreditLedger` already exists. `Winner` and
`ItemPurchase` already exist. So I recommend **extending `ItemRound`** rather than adding a parallel
`Campaign` table — a second model would duplicate and fight the existing one.

### Status mapping (your lifecycle ➜ existing `ItemRound.state`)

`ItemRound.state` is a `String` today, with values: `BUILDING, FUNDING, ACTIVATED, CLOSED, REVIEW,
PUBLISHED, ARCHIVED` (and `EXPIRED` referenced in code). Proposed canonical mapping:

| Requested status        | ItemRound.state            | Notes |
|-------------------------|----------------------------|-------|
| DRAFT                   | `DRAFT` (new)              | not visible to users |
| WAITING_FOR_ACTIVATION  | `BUILDING` / `FUNDING`     | pre-activation; countdown not started |
| ACTIVE                  | `ACTIVATED`                | public "COUNTDOWN"; play allowed |
| CLOSED                  | `CLOSED`                   | attempts frozen; winner locked |
| PURCHASE_WINDOW         | `REVIEW` (+ `purchaseGraceEndsAt`) | public "STATUS_WINDOW"; buying/discount |
| EXPIRED                 | `EXPIRED` (formalize)      | discounts expire; ledger rows written |
| ARCHIVED                | `ARCHIVED`                 | frozen + hidden; snapshot created |
| CANCELLED               | `CANCELLED` (new)          | admin note required; refunds ledgered |

Keeping `state` a `String` (not a Prisma enum) matches the current code and avoids enum-migration
friction. The allowed set would be enforced in a small TS helper.

## 1) `ItemRound` — additive fields

```prisma
model ItemRound {
  // ... existing fields unchanged ...
  // already present: activatedAt, closesAt, purchaseGraceEndsAt, winnerUserId, state

  closedAt        DateTime?   // when state moved to CLOSED
  expiredAt       DateTime?   // when state moved to EXPIRED
  archivedAt      DateTime?   // when archived
  cancelledAt     DateTime?   // when cancelled
  winningScore    Int?        // locked winner's game score (scoreMs is on Winner)
  statusReason    String?     // admin note / reason for the last status change
}
```
(`purchaseWindowEndsAt` from your spec is already covered by the existing `purchaseGraceEndsAt`.)

## 2) `CreditLedger` — additive columns (table already exists)

Today it has: `id, createdAt, userId, itemId?, roundId?, kind (String), credits (Int), note?`.
Proposed additions (all nullable, so existing rows are fine):

```prisma
model CreditLedger {
  // ... existing fields unchanged ...
  balanceAfter Int?     // free+paid balance snapshot after this entry
  source       String?  // e.g. DUMMY_BUY_CREDITS, DAILY_TOPUP, ATTEMPT_SPEND
  attemptId    String?
  paymentId    String?
  adminUserId  String?
  reference    String?
}
```
`kind` stays the type field; expand its vocabulary to: `DAILY_FREE_ADD, PAID_CREDIT_PURCHASE,
CREDIT_SPEND_ATTEMPT, CREDIT_REFUND, ADMIN_ADJUSTMENT, EXPIRY, MIGRATION_INITIAL_BALANCE`.

## 3) `DiscountLedger` — NEW (campaign-specific)

> Note: discount is currently **computed** (sum of a user's paid credits on a campaign), not stored.
> Adding this ledger means the purchase/pricing path must **write** rows (earned/redeemed/expired)
> and read balances from the ledger — a real refactor, scheduled in Phase B below.

```prisma
model DiscountLedger {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  userId      String
  itemId      String          // campaign = Item (+ round)
  roundId     String?
  type        String          // DISCOUNT_EARNED | DISCOUNT_REDEEMED | DISCOUNT_EXPIRED | DISCOUNT_REFUNDED | ADMIN_ADJUSTMENT | MIGRATION_INITIAL_BALANCE
  amount      Int             // ZAR (1 credit = R1); +earned, -redeemed/-expired
  balanceAfter Int?
  source      String?
  attemptId   String?
  purchaseId  String?
  adminUserId String?
  reference   String?
  note        String?

  user  User       @relation(fields: [userId], references: [id])
  item  Item       @relation(fields: [itemId], references: [id])
  round ItemRound? @relation(fields: [roundId], references: [id])

  @@index([userId, itemId])
  @@index([itemId, type])
}
```

## 4) `AdminAuditLog` — NEW

```prisma
model AdminAuditLog {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  adminUserId String
  action      String   // CAMPAIGN_CREATED, CAMPAIGN_STATUS_CHANGED, WINNER_LOCKED, CAMPAIGN_ARCHIVED, CREDIT_ADJUSTED, DISCOUNT_ADJUSTED, ...
  entityType  String   // "ItemRound" | "User" | "CreditLedger" | ...
  entityId    String
  beforeJson  String?  // JSON snapshot before
  afterJson   String?  // JSON snapshot after
  reason      String?
  ipAddress   String?
  userAgent   String?

  @@index([adminUserId, createdAt])
  @@index([entityType, entityId])
}
```

## 5) `CampaignArchiveSnapshot` — NEW (frozen at archive time)

```prisma
model CampaignArchiveSnapshot {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  itemId                String
  roundId               String?
  archivedAt            DateTime
  finalStatus           String
  finalVoucherValueZAR  Int
  winnerUserId          String?
  winningScore          Int?
  finalLeaderboardJson  String   // JSON array of final leaderboard rows (MVP)
  totalPaidCreditsSpent Int      @default(0)
  totalFreeCreditsSpent Int      @default(0)
  totalDiscountEarned   Int      @default(0)
  totalDiscountRedeemed Int      @default(0)
  totalDiscountExpired  Int      @default(0)
  totalPurchases        Int      @default(0)
  archivedByUserId      String
  notes                 String?

  item  Item       @relation(fields: [itemId], references: [id])
  round ItemRound? @relation(fields: [roundId], references: [id])

  @@index([itemId])
}
```

New back-relations (`DiscountLedger[]`, `AdminAuditLog` has none, `CampaignArchiveSnapshot[]`) would
be added to `User`, `Item`, and `ItemRound` as needed.

## Admin identity

`User` has no `role` column, so admin = the `ADMIN_EMAILS` env var (already implemented in
`src/lib/admin.ts`, shipped in this patch). If you'd rather add `User.role`, that's a one-line
schema add we can fold into the same migration.

## Migration note

All of the above is **additive** (new nullable columns + new tables) — existing rows and the current
PwnIt 2 flow are unaffected. Apply via `prisma migrate` against the **pwnit-2** DB, after a backup.
