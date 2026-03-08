export type TierKey = "PWN_VALUE" | "PWN_ASPIRE" | "PWN_HERO";

export const ZAR_PER_CREDIT = 1;

export function tierKeyFromTierNumber(tier: number): TierKey {
  if (tier <= 1) return "PWN_VALUE";
  if (tier === 2) return "PWN_ASPIRE";
  return "PWN_HERO";
}

export function discountPctForTierKey(_: TierKey): number {
  return 100;
}

export function itemPriceCredits(prizeValueZAR: number): number {
  return Math.max(0, Math.ceil((prizeValueZAR || 0) / ZAR_PER_CREDIT));
}

export function formatZARFromCredits(credits: number): string {
  return `R${Number(credits || 0).toLocaleString("en-ZA")}`;
}

export function buyPriceAfterSpend(params: {
  prizeValueZAR: number;
  tierNumber?: number;
  spentCredits: number;
  walletCredits?: number;
}) {
  const price = itemPriceCredits(params.prizeValueZAR);
  const tierKey = tierKeyFromTierNumber(Number(params.tierNumber ?? 3));
  const discountPct = discountPctForTierKey(tierKey);

  const spent = Math.max(0, Math.floor(params.spentCredits || 0));
  const playDiscountCredits = Math.min(price, spent);
  const newPriceCredits = Math.max(0, price - playDiscountCredits);
  const walletCredits = Math.max(0, Math.floor(params.walletCredits || 0));
  const walletAppliedCredits = Math.min(newPriceCredits, walletCredits);
  const topUpCredits = Math.max(0, newPriceCredits - walletAppliedCredits);

  return {
    tierKey,
    discountPct,
    priceCredits: price,
    spentCredits: spent,
    playDiscountCredits,
    newPriceCredits,
    walletAppliedCredits,
    topUpCredits,
  };
}

export function tierLabel(k: TierKey) {
  if (k === "PWN_VALUE") return "Pwn Value";
  if (k === "PWN_ASPIRE") return "Pwn Aspire";
  return "Pwn Hero";
}

export function costCreditsForTier(tier: number) {
  if (tier <= 1) return 5;
  if (tier === 2) return 10;
  return 20;
}
