// src/lib/playCost.ts
export function playCostForPrize(prizeValueZAR: number) {
  const v = Math.max(0, Number(prizeValueZAR || 0));

  if (v <= 1000) return 1;
  if (v <= 2500) return 2;
  if (v <= 5000) return 3;
  if (v <= 10000) return 5;
  if (v <= 20000) return 8;
  return 12;
}