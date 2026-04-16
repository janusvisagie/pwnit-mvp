export const TARGET_PAID_PLAYS = 100;
export const DAILY_FREE_CREDITS = 30;

export function playCostForPrize(prizeValueZAR: number) {
  const value = Math.max(0, Number(prizeValueZAR || 0));
  return Math.max(1, Math.ceil(value / 100));
}

export function resolvePlayCostCredits(item: { playCostCredits?: number | null; prizeValueZAR: number }) {
  const explicit = Number(item.playCostCredits ?? 0);
  return explicit > 0 ? explicit : playCostForPrize(item.prizeValueZAR);
}

export function activationTargetCreditsForItem(item: {
  activationGoalEntries?: number | null;
  playCostCredits?: number | null;
  prizeValueZAR: number;
  allowedSubsidyCredits?: number | null;
}) {
  const playCost = resolvePlayCostCredits(item);
  const targetEntries = Math.max(1, Number(item.activationGoalEntries ?? TARGET_PAID_PLAYS));
  const subsidy = Math.max(0, Number(item.allowedSubsidyCredits ?? 0));
  return Math.max(playCost, targetEntries * playCost - subsidy);
}

export function activationProgress(currentCredits: number, targetCredits: number) {
  const current = Math.max(0, Number(currentCredits || 0));
  const target = Math.max(1, Number(targetCredits || 1));
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  return { current, target, pct };
}

export function activationStageLabel(pct: number) {
  if (pct >= 100) return "Activated";
  if (pct >= 80) return "Almost there";
  if (pct >= 45) return "Building";
  return "Getting started";
}
