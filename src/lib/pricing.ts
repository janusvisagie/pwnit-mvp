// src/lib/pricing.ts

export type TierKey = "PWN_LITE" | "PWN_PLUS" | "PWN_MAX";

// MVP assumption (keep simple): 1 credit = R1
export const ZAR_PER_CREDIT = 1;

export function tierKeyFromTierNumber(tier: number): TierKey {
  if (tier <= 1) return "PWN_LITE";
  if (tier === 2) return "PWN_PLUS";
  return "PWN_MAX";
}

// ✅ Higher tier => higher discount on “money already spent”
export function discountPctForTierKey(k: TierKey): number {
  if (k === "PWN_LITE") return 50;
  if (k === "PWN_PLUS") return 75;
  return 100; // PWN_MAX
}

export function itemPriceCredits(prizeValueZAR: number): number {
  return Math.max(0, Math.ceil((prizeValueZAR || 0) / ZAR_PER_CREDIT));
}

/**
 * Discount is based on credits already spent playing THIS item.
 * discountCredits = spentCredits * discountPct
 * finalPay = price - min(price, discountCredits)
 */
export function buyPriceAfterSpend(params: {
  prizeValueZAR: number;
  tierNumber: number;
  spentCredits: number;
}) {
  const price = itemPriceCredits(params.prizeValueZAR);
  const tierKey = tierKeyFromTierNumber(params.tierNumber);
  const discountPct = discountPctForTierKey(tierKey);

  const spent = Math.max(0, Math.floor(params.spentCredits || 0));
  const discountCredits = Math.floor((spent * discountPct) / 100);

  const appliedDiscount = Math.min(price, discountCredits);
  const payCredits = Math.max(0, price - appliedDiscount);

  return {
    tierKey,
    discountPct,
    priceCredits: price,
    spentCredits: spent,
    discountCredits,
    appliedDiscount,
    payCredits,
  };
}

export function tierLabel(k: TierKey) {
  if (k === "PWN_LITE") return "Pwn Lite";
  if (k === "PWN_PLUS") return "Pwn Plus";
  return "Pwn Max";
}
