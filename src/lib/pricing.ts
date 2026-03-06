export type TierKey = "PWN_LITE" | "PWN_PLUS" | "PWN_MAX";

// MVP assumption: 1 credit = R1
export const ZAR_PER_CREDIT = 1;

export function tierKeyFromTierNumber(tier: number): TierKey {
  if (tier <= 1) return "PWN_LITE";
  if (tier === 2) return "PWN_PLUS";
  return "PWN_MAX";
}

// Current commercial rule: 100% of paid credits spent on THIS item become discount.
export function discountPctForTierKey(_: TierKey): number {
  return 100;
}

export function itemPriceCredits(prizeValueZAR: number): number {
  return Math.max(0, Math.ceil((prizeValueZAR || 0) / ZAR_PER_CREDIT));
}

export function formatZARFromCredits(credits: number): string {
  return `R${Number(credits || 0).toLocaleString("en-ZA")}`;
}

/**
 * Discount is based on paid credits already spent playing THIS item.
 * The discount is item-specific and can never exceed the item value.
 */
export function buyPriceAfterSpend(params: {
  prizeValueZAR: number;
  tierNumber?: number;
  spentCredits: number;
}) {
  const price = itemPriceCredits(params.prizeValueZAR);
  const tierKey = tierKeyFromTierNumber(Number(params.tierNumber ?? 3));
  const discountPct = discountPctForTierKey(tierKey);

  const spent = Math.max(0, Math.floor(params.spentCredits || 0));
  const appliedDiscount = Math.min(price, spent);
  const payCredits = Math.max(0, price - appliedDiscount);

  return {
    tierKey,
    discountPct,
    priceCredits: price,
    spentCredits: spent,
    discountCredits: spent,
    appliedDiscount,
    payCredits,
  };
}

export function tierLabel(k: TierKey) {
  if (k === "PWN_LITE") return "Pwn Lite";
  if (k === "PWN_PLUS") return "Pwn Plus";
  return "Pwn Max";
}
