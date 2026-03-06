export type TierKey = "PWN_STANDARD";

export const ZAR_PER_CREDIT = 1;

export function tierKeyFromTierNumber(_tier: number): TierKey {
  return "PWN_STANDARD";
}

export function discountPctForTierKey(_k: TierKey): number {
  return 100;
}

export function itemPriceCredits(prizeValueZAR: number): number {
  return Math.max(0, Math.ceil((prizeValueZAR || 0) / ZAR_PER_CREDIT));
}

export function buyPriceAfterSpend(params: {
  prizeValueZAR: number;
  tierNumber: number;
  spentCredits: number;
}) {
  const price = itemPriceCredits(params.prizeValueZAR);
  const tierKey = tierKeyFromTierNumber(params.tierNumber);
  const discountPct = discountPctForTierKey(tierKey);

  const spent = Math.max(0, Math.floor(params.spentCredits || 0));
  const discountCredits = spent;
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

export function tierLabel(_k: TierKey) {
  return "Standard";
}
