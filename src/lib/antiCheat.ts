export type AttemptFlags = { latencyHigh?: boolean; outlier?: boolean; impossible?: boolean };

export function flagAttempt(params: { scoreMs: number; rttMs: number }): AttemptFlags {
  const f: AttemptFlags = {};
  if (params.rttMs > 350) f.latencyHigh = true;
  if (params.scoreMs < 60) f.impossible = true;
  if (params.scoreMs > 2500) f.outlier = true;
  return f;
}

export function flagsToString(f: AttemptFlags): string | null {
  const keys = Object.entries(f).filter(([,v]) => v).map(([k]) => k);
  return keys.length ? keys.join(",") : null;
}
