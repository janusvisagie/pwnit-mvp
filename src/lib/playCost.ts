// src/lib/playCost.ts

export const COVERAGE_RATIO = 0.95;

export function playCostForPrize(prizeValueZAR: number) {
  const v = Math.max(0, Number(prizeValueZAR || 0));

  if (v <= 1200) return 5;
  if (v <= 3500) return 10;
  return 25;
}

export function activationTargetPaidCredits(prizeValueZAR: number, coverageRatio: number = COVERAGE_RATIO) {
  return Math.max(1, Math.ceil(Math.max(0, Number(prizeValueZAR || 0)) * coverageRatio));
}

export function activationProgress(prizeValueZAR: number, paidCreditsSpent: number, coverageRatio: number = COVERAGE_RATIO) {
  const target = activationTargetPaidCredits(prizeValueZAR, coverageRatio);
  const current = Math.max(0, Number(paidCreditsSpent || 0));
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  return { current, target, pct };
}

export function activationStageLabel(pct: number) {
  if (pct >= 100) return "Ready to activate";
  if (pct >= 80) return "Almost there";
  if (pct >= 45) return "Building";
  return "Getting started";
}
