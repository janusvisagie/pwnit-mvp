// src/lib/pwnit2Growth.ts
//
// Voucher growth for the PwnIt 2 campaign.
//
// Business rules (from the PwnIt 2 brief):
//   - The voucher value does NOT grow before activation. Growth is gated to the
//     COUNTDOWN (ACTIVATED) phase and onward, never during FUNDING.
//   - Growth is a conservative slice of the *expected unredeemed* paid-play
//     discount, so the same paid rand is never double-counted as both full user
//     discount AND voucher growth AND platform revenue.
//   - ZAR_PER_CREDIT is 1 in this codebase, so paid credits collected == rand.
//
// Formula:
//   expectedBreakage = paidCollectedZAR * expectedBreakagePct   (rand we expect to go unredeemed)
//   growth           = expectedBreakage * growthReleasePercent  (the slice we release into the voucher)
//   growth           = min(growth, maxGrowthZAR?)               (optional safety cap)
//   currentValue     = baseValueZAR + floor(growth)
//
// Defaults (0.6 * 0.3 = 0.18) release ~18% of paid spend into the voucher,
// which stays well under expected breakage. Tune via env as real redemption
// data arrives.

export type Pwnit2GrowthConfig = {
  baseValueZAR: number;
  paidCollectedZAR: number;
  expectedBreakagePct: number;
  growthReleasePercent: number;
  maxGrowthZAR: number | null;
  /** Growth only applies once the campaign has activated. */
  activated: boolean;
};

export type Pwnit2GrowthResult = {
  baseValueZAR: number;
  currentValueZAR: number;
  growthZAR: number;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function computeVoucherValue(config: Pwnit2GrowthConfig): Pwnit2GrowthResult {
  const base = Math.max(0, Math.floor(config.baseValueZAR || 0));

  // Hard gate: no growth before activation.
  if (!config.activated) {
    return { baseValueZAR: base, currentValueZAR: base, growthZAR: 0 };
  }

  const paid = Math.max(0, Number(config.paidCollectedZAR || 0));
  const expectedBreakage = paid * clamp01(config.expectedBreakagePct);
  const rawGrowth = expectedBreakage * Math.max(0, Number(config.growthReleasePercent || 0));
  const cappedGrowth =
    config.maxGrowthZAR != null ? Math.min(rawGrowth, Math.max(0, config.maxGrowthZAR)) : rawGrowth;

  const growthZAR = Math.max(0, Math.floor(cappedGrowth));

  return {
    baseValueZAR: base,
    currentValueZAR: base + growthZAR,
    growthZAR,
  };
}

export function pwnit2GrowthConfigFromEnv(params: {
  baseValueZAR: number;
  paidCollectedZAR: number;
  activated: boolean;
}): Pwnit2GrowthConfig {
  const maxGrowthRaw = process.env.PWNIT2_MAX_GROWTH_ZAR ?? process.env.PWNIT2_MAX_GROWTH_AMOUNT;
  return {
    baseValueZAR: params.baseValueZAR,
    paidCollectedZAR: params.paidCollectedZAR,
    activated: params.activated,
    expectedBreakagePct: Number(process.env.PWNIT2_EXPECTED_BREAKAGE_PERCENT ?? "0.6"),
    growthReleasePercent: Number(process.env.PWNIT2_GROWTH_RELEASE_PERCENT ?? "0.3"),
    maxGrowthZAR: maxGrowthRaw != null && maxGrowthRaw !== "" ? Number(maxGrowthRaw) : null,
  };
}
