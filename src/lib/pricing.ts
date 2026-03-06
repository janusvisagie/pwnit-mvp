export const ZAR_PER_CREDIT = 1;

export function itemPriceCredits(prizeValueZAR: number) {
  return Math.max(0, Math.ceil((prizeValueZAR || 0) / ZAR_PER_CREDIT));
}

/**
 * MVP rule:
 * - Discount is 100% of PAID credits already spent playing THIS item
 * - Discount can never exceed the item price
 */
export function buyPriceAfterSpend(params: {
  prizeValueZAR: number;
  spentPaidCredits: number;
}) {
  const price = itemPriceCredits(params.prizeValueZAR);
  const spentPaidCredits = Math.max(0, Math.floor(params.spentPaidCredits || 0));
  const appliedDiscount = Math.min(price, spentPaidCredits);
  const payCredits = Math.max(0, price - appliedDiscount);

  return {
    priceCredits: price,
    spentPaidCredits,
    discountPct: 100,
    appliedDiscount,
    payCredits,
  };
}
