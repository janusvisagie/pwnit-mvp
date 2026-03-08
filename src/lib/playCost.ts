import { activationTargetForItem } from "@/lib/rounds";

export function playCostForPrize(prizeValueZAR: number) {
  const v = Math.max(0, Number(prizeValueZAR || 0));
  if (v <= 1000) return 5;
  if (v <= 2500) return 10;
  if (v <= 4500) return 15;
  return 20;
}

export function activationTargetPaidCredits(prizeValueZAR: number) {
  return activationTargetForItem({ prizeValueZAR, landedCostZAR: prizeValueZAR, allowedSubsidyCredits: 0 });
}

export function activationProgress(prizeValueZAR: number, paidCreditsSpent: number) {
  const target = activationTargetPaidCredits(prizeValueZAR);
  const current = Math.max(0, Number(paidCreditsSpent || 0));
  const pct = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
  return { current, target, pct };
}

export function activationStageLabel(pct: number) {
  if (pct >= 100) return "Activated";
  if (pct >= 85) return "Almost there";
  if (pct >= 60) return "Heating up";
  if (pct >= 25) return "Building";
  return "Starting";
}
