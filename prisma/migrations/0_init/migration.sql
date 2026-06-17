-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "passwordSetAt" TIMESTAMP(3),
    "alias" TEXT,
    "referralCode" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "aliasSetByUser" BOOLEAN NOT NULL DEFAULT false,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "freeCreditsBalance" INTEGER NOT NULL DEFAULT 0,
    "paidCreditsBalance" INTEGER NOT NULL DEFAULT 0,
    "referralDiscountBalanceZAR" INTEGER NOT NULL DEFAULT 0,
    "referralRewardPreference" TEXT NOT NULL DEFAULT 'CREDITS',
    "lastDailyCreditsDayKey" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "prizeType" TEXT NOT NULL,
    "prizeValueZAR" INTEGER NOT NULL DEFAULT 0,
    "landedCostZAR" INTEGER NOT NULL DEFAULT 0,
    "allowedSubsidyCredits" INTEGER NOT NULL DEFAULT 0,
    "playCostCredits" INTEGER NOT NULL DEFAULT 5,
    "fundingWindowHours" INTEGER NOT NULL DEFAULT 168,
    "purchaseGraceHours" INTEGER NOT NULL DEFAULT 24,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "shortDesc" TEXT,
    "productUrl" TEXT,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "activationGoalEntries" INTEGER NOT NULL DEFAULT 100,
    "countdownMinutes" INTEGER NOT NULL DEFAULT 30,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "subscriberOnly" BOOLEAN NOT NULL DEFAULT false,
    "gameKey" TEXT,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRound" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "itemId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'BUILDING',
    "fundingStartsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fundingEndsAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "purchaseGraceEndsAt" TIMESTAMP(3),
    "activationTargetCredits" INTEGER NOT NULL DEFAULT 0,
    "paidCreditsCollected" INTEGER NOT NULL DEFAULT 0,
    "verifiedSubscriberCreditsCollected" INTEGER NOT NULL DEFAULT 0,
    "freeCreditsCollected" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "winnerUserId" TEXT,
    "winningScore" INTEGER,
    "closedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "statusReason" TEXT,

    CONSTRAINT "ItemRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "dayKey" TEXT NOT NULL,
    "costCredits" INTEGER NOT NULL DEFAULT 0,
    "freeUsed" INTEGER NOT NULL DEFAULT 0,
    "paidUsed" INTEGER NOT NULL DEFAULT 0,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "scoreMs" INTEGER NOT NULL,
    "flags" TEXT,
    "clientSentAt" TIMESTAMP(3),
    "serverReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "gameKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "challengeJson" JSONB NOT NULL,
    "verificationJson" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "AttemptSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "dayKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "scoreMs" INTEGER NOT NULL,
    "alias" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'ITEM',
    "rewardCredits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPurchase" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "priceCredits" INTEGER NOT NULL,
    "spentCredits" INTEGER NOT NULL,
    "discountPct" INTEGER NOT NULL,
    "discountCredits" INTEGER NOT NULL,
    "payCredits" INTEGER NOT NULL,
    "tierKey" TEXT NOT NULL,

    CONSTRAINT "ItemPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "roundId" TEXT,
    "kind" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "note" TEXT,
    "balanceAfter" INTEGER,
    "source" TEXT,
    "attemptId" TEXT,
    "paymentId" TEXT,
    "adminUserId" TEXT,
    "reference" TEXT,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyFreeBucketGrant" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bucketKey" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "userId" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyFreeBucketGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginCode" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "bucketKey" TEXT,
    "ipHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "LoginCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "code" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredUserId" TEXT,
    "referredBucketKey" TEXT,
    "sharedItemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "referrerRewardCredits" INTEGER NOT NULL DEFAULT 10,
    "referrerRewardType" TEXT NOT NULL DEFAULT 'CREDITS',
    "referredRewardCredits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "surveyKey" TEXT NOT NULL,
    "userId" TEXT,
    "bucketKey" TEXT NOT NULL,
    "answersJson" JSONB NOT NULL,
    "rewardCredits" INTEGER NOT NULL DEFAULT 0,
    "rewardedAt" TIMESTAMP(3),

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateLimit" (
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "subjectKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "DiscountLedger" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER,
    "source" TEXT,
    "attemptId" TEXT,
    "purchaseId" TEXT,
    "adminUserId" TEXT,
    "reference" TEXT,
    "note" TEXT,

    CONSTRAINT "DiscountLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignArchiveSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "roundId" TEXT,
    "archivedAt" TIMESTAMP(3) NOT NULL,
    "finalStatus" TEXT NOT NULL,
    "finalVoucherValueZAR" INTEGER NOT NULL DEFAULT 0,
    "winnerUserId" TEXT,
    "winningScore" INTEGER,
    "finalLeaderboardJson" TEXT NOT NULL,
    "totalPaidCreditsSpent" INTEGER NOT NULL DEFAULT 0,
    "totalFreeCreditsSpent" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountEarned" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountRedeemed" INTEGER NOT NULL DEFAULT 0,
    "totalDiscountExpired" INTEGER NOT NULL DEFAULT 0,
    "totalPurchases" INTEGER NOT NULL DEFAULT 0,
    "archivedByUserId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "CampaignArchiveSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ItemRound_itemId_state_idx" ON "ItemRound"("itemId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "ItemRound_itemId_sequence_key" ON "ItemRound"("itemId", "sequence");

-- CreateIndex
CREATE INDEX "Attempt_itemId_dayKey_idx" ON "Attempt"("itemId", "dayKey");

-- CreateIndex
CREATE INDEX "Attempt_userId_dayKey_idx" ON "Attempt"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "Attempt_itemId_dayKey_userId_idx" ON "Attempt"("itemId", "dayKey", "userId");

-- CreateIndex
CREATE INDEX "Attempt_roundId_itemId_idx" ON "Attempt"("roundId", "itemId");

-- CreateIndex
CREATE INDEX "AttemptSession_userId_itemId_status_idx" ON "AttemptSession"("userId", "itemId", "status");

-- CreateIndex
CREATE INDEX "AttemptSession_itemId_roundId_status_idx" ON "AttemptSession"("itemId", "roundId", "status");

-- CreateIndex
CREATE INDEX "AttemptSession_expiresAt_idx" ON "AttemptSession"("expiresAt");

-- CreateIndex
CREATE INDEX "Winner_itemId_dayKey_idx" ON "Winner"("itemId", "dayKey");

-- CreateIndex
CREATE INDEX "Winner_userId_dayKey_idx" ON "Winner"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "Winner_roundId_rank_idx" ON "Winner"("roundId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_itemId_dayKey_userId_key" ON "Winner"("itemId", "dayKey", "userId");

-- CreateIndex
CREATE INDEX "ItemPurchase_itemId_dayKey_idx" ON "ItemPurchase"("itemId", "dayKey");

-- CreateIndex
CREATE INDEX "ItemPurchase_userId_dayKey_idx" ON "ItemPurchase"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "ItemPurchase_roundId_userId_idx" ON "ItemPurchase"("roundId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPurchase_itemId_dayKey_userId_key" ON "ItemPurchase"("itemId", "dayKey", "userId");

-- CreateIndex
CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditLedger_roundId_kind_idx" ON "CreditLedger"("roundId", "kind");

-- CreateIndex
CREATE INDEX "DailyFreeBucketGrant_userId_dayKey_idx" ON "DailyFreeBucketGrant"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "DailyFreeBucketGrant_dayKey_idx" ON "DailyFreeBucketGrant"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "DailyFreeBucketGrant_bucketKey_dayKey_key" ON "DailyFreeBucketGrant"("bucketKey", "dayKey");

-- CreateIndex
CREATE INDEX "LoginCode_email_createdAt_idx" ON "LoginCode"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginCode_bucketKey_createdAt_idx" ON "LoginCode"("bucketKey", "createdAt");

-- CreateIndex
CREATE INDEX "LoginCode_ipHash_createdAt_idx" ON "LoginCode"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "Referral_code_idx" ON "Referral"("code");

-- CreateIndex
CREATE INDEX "Referral_referrerUserId_createdAt_idx" ON "Referral"("referrerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Referral_referredUserId_createdAt_idx" ON "Referral"("referredUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Referral_sharedItemId_createdAt_idx" ON "Referral"("sharedItemId", "createdAt");

-- CreateIndex
CREATE INDEX "Referral_status_createdAt_idx" ON "Referral"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredBucketKey_key" ON "Referral"("referredBucketKey");

-- CreateIndex
CREATE INDEX "SurveyResponse_userId_createdAt_idx" ON "SurveyResponse"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyKey_bucketKey_key" ON "SurveyResponse"("surveyKey", "bucketKey");

-- CreateIndex
CREATE INDEX "ApiRateLimit_scope_subjectKey_windowStart_idx" ON "ApiRateLimit"("scope", "subjectKey", "windowStart");

-- CreateIndex
CREATE INDEX "ApiRateLimit_expiresAt_idx" ON "ApiRateLimit"("expiresAt");

-- CreateIndex
CREATE INDEX "DiscountLedger_userId_itemId_roundId_idx" ON "DiscountLedger"("userId", "itemId", "roundId");

-- CreateIndex
CREATE INDEX "DiscountLedger_itemId_type_idx" ON "DiscountLedger"("itemId", "type");

-- CreateIndex
CREATE INDEX "DiscountLedger_roundId_type_idx" ON "DiscountLedger"("roundId", "type");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "CampaignArchiveSnapshot_itemId_idx" ON "CampaignArchiveSnapshot"("itemId");

-- CreateIndex
CREATE INDEX "CampaignArchiveSnapshot_roundId_idx" ON "CampaignArchiveSnapshot"("roundId");

-- AddForeignKey
ALTER TABLE "ItemRound" ADD CONSTRAINT "ItemRound_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSession" ADD CONSTRAINT "AttemptSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSession" ADD CONSTRAINT "AttemptSession_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSession" ADD CONSTRAINT "AttemptSession_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPurchase" ADD CONSTRAINT "ItemPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPurchase" ADD CONSTRAINT "ItemPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPurchase" ADD CONSTRAINT "ItemPurchase_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyFreeBucketGrant" ADD CONSTRAINT "DailyFreeBucketGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountLedger" ADD CONSTRAINT "DiscountLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountLedger" ADD CONSTRAINT "DiscountLedger_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountLedger" ADD CONSTRAINT "DiscountLedger_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignArchiveSnapshot" ADD CONSTRAINT "CampaignArchiveSnapshot_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignArchiveSnapshot" ADD CONSTRAINT "CampaignArchiveSnapshot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "ItemRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

