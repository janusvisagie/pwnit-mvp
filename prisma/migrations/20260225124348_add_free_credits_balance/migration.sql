-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "referralCode" TEXT NOT NULL,
    "paidCreditsBalance" INTEGER NOT NULL DEFAULT 0,
    "freeCreditsBalance" INTEGER NOT NULL DEFAULT 0,
    "alias" TEXT,
    "aliasSetByUser" BOOLEAN NOT NULL DEFAULT false,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "referredById" TEXT,
    "isSubscriber" BOOLEAN NOT NULL DEFAULT false,
    "lastDailyCreditsDayKey" TEXT,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeValueZAR" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "shortDesc" TEXT,
    "productUrl" TEXT,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "activationGoalEntries" INTEGER NOT NULL,
    "countdownMinutes" INTEGER NOT NULL DEFAULT 60,
    "opensAt" DATETIME NOT NULL,
    "closesAt" DATETIME,
    "publishedAt" DATETIME,
    "subscriberOnly" BOOLEAN NOT NULL DEFAULT false,
    "gameKey" TEXT
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "scoreMs" INTEGER NOT NULL,
    "flags" TEXT,
    "clientSentAt" DATETIME,
    "serverReceivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attempt_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerTx" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "memo" TEXT,
    CONSTRAINT "LedgerTx_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "zarAmount" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "providerRef" TEXT,
    CONSTRAINT "CreditPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "scoreMs" INTEGER NOT NULL,
    "alias" TEXT NOT NULL,
    CONSTRAINT "Winner_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Winner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ItemPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "listPriceZAR" INTEGER NOT NULL,
    "discountZAR" INTEGER NOT NULL,
    "payZAR" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    CONSTRAINT "ItemPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ItemPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_alias_key" ON "User"("alias");

-- CreateIndex
CREATE INDEX "Attempt_itemId_dayKey_idx" ON "Attempt"("itemId", "dayKey");

-- CreateIndex
CREATE INDEX "Attempt_userId_itemId_dayKey_idx" ON "Attempt"("userId", "itemId", "dayKey");

-- CreateIndex
CREATE INDEX "LedgerTx_userId_createdAt_idx" ON "LedgerTx"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Winner_itemId_dayKey_idx" ON "Winner"("itemId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_itemId_userId_dayKey_key" ON "Winner"("itemId", "userId", "dayKey");

-- CreateIndex
CREATE INDEX "ItemPurchase_userId_createdAt_idx" ON "ItemPurchase"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ItemPurchase_itemId_dayKey_idx" ON "ItemPurchase"("itemId", "dayKey");
