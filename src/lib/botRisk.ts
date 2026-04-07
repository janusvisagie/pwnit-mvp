
import { prisma } from "@/lib/db";

const DEFAULT_RECAPTCHA_REVIEW_THRESHOLD = Number(process.env.PWNIT_RECAPTCHA_REVIEW_THRESHOLD ?? 0.35);
const DEFAULT_CF_BOT_REVIEW_THRESHOLD = Number(process.env.PWNIT_CF_BOT_REVIEW_THRESHOLD ?? 30);
const DEFAULT_INTERACTION_REVIEW_THRESHOLD = Number(process.env.PWNIT_INTERACTION_REVIEW_THRESHOLD ?? 0.35);

const MIN_HUMAN_MS: Record<string, number> = {
  codebreaker: 3500,
  "rule-lock": 2800,
  "transform-memory": 2600,
  "sequence-restore": 2200,
  "balance-grid": 2000,
  "pattern-match": 1800,
  "spot-the-missing": 1600,
  "rapid-math-relay": 2800,
  "route-builder": 2400,
};

function asPositiveNumber(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function readForwardedCloudflareBotScore(request: Request) {
  const headers = request.headers;
  const raw =
    headers.get("x-pwnit-cf-bot-score") ||
    headers.get("cf-bot-score") ||
    headers.get("x-cf-bot-score") ||
    null;
  const score = asPositiveNumber(raw);
  if (score == null) return null;
  return Math.max(1, Math.min(99, Math.round(score)));
}

export function isRecaptchaEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptchaScore({
  token,
  remoteIp,
  expectedAction,
}: {
  token?: string | null;
  remoteIp?: string | null;
  expectedAction?: string | null;
}) {
  if (!isRecaptchaEnabled()) {
    return { ok: true as const, skipped: true as const, score: null as number | null };
  }

  const secret = String(process.env.RECAPTCHA_SECRET_KEY || "").trim();
  const responseToken = String(token || "").trim();
  if (!secret || !responseToken) {
    return { ok: false as const, skipped: false as const, error: "missing_recaptcha_token", score: null as number | null };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", responseToken);
  if (remoteIp) form.set("remoteip", remoteIp);

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const data: any = await response.json().catch(() => null);
  const score = typeof data?.score === "number" ? data.score : null;
  const action = typeof data?.action === "string" ? data.action : null;
  const hostname = typeof data?.hostname === "string" ? data.hostname : null;
  if (!response.ok || !data?.success) {
    const codes = Array.isArray(data?.["error-codes"]) ? data["error-codes"].join(",") : "recaptcha_verification_failed";
    return { ok: false as const, skipped: false as const, error: codes, score, action, hostname };
  }

  if (expectedAction && action && action !== expectedAction) {
    return { ok: false as const, skipped: false as const, error: `unexpected_action:${action}`, score, action, hostname };
  }

  return { ok: true as const, skipped: false as const, score, action, hostname };
}

export async function shouldRequireTurnstileForCompetitiveStart({
  userId,
  itemId,
}: {
  userId: string;
  itemId: string;
}) {
  const ifEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
  if (!ifEnabled) {
    return { required: false, reason: null, recentStarts: 0, recentAttempts: 0, totalAttempts: 0 };
  }

  const since10m = new Date(Date.now() - 10 * 60 * 1000);
  const since3m = new Date(Date.now() - 3 * 60 * 1000);

  const [totalAttempts, recentStarts, recentAttempts] = await Promise.all([
    prisma.attempt.count({ where: { userId } }),
    (prisma as any).attemptSession.count({ where: { userId, issuedAt: { gte: since10m } } }),
    prisma.attempt.count({ where: { userId, createdAt: { gte: since3m }, itemId } }),
  ]);

  if (totalAttempts === 0) {
    return { required: true, reason: "first_competitive_play", recentStarts, recentAttempts, totalAttempts };
  }

  if (recentStarts >= 5 || recentAttempts >= 4) {
    return { required: true, reason: "suspicious_burst", recentStarts, recentAttempts, totalAttempts };
  }

  return { required: false, reason: null, recentStarts, recentAttempts, totalAttempts };
}

function inferActionCount(meta: Record<string, any>) {
  const candidates = [
    meta.actionCount,
    meta.guessesUsed,
    meta.revealCount,
    meta.matchesFound,
    Array.isArray(meta.guessLog) ? meta.guessLog.length : null,
    Array.isArray(meta.flipLog) ? meta.flipLog.length : null,
    Array.isArray(meta.moveLog) ? meta.moveLog.length : null,
    Array.isArray(meta.revealLog) ? meta.revealLog.length : null,
  ];

  for (const value of candidates) {
    const n = asPositiveNumber(value);
    if (n != null && n > 0) return n;
  }
  return 0;
}

function estimateInteractionScore({
  gameKey,
  meta,
  verificationFlags,
  serverElapsedMs,
  recentStarts,
}: {
  gameKey: string;
  meta: Record<string, any>;
  verificationFlags: Record<string, any>;
  serverElapsedMs: number;
  recentStarts: number;
}) {
  const minHumanMs = MIN_HUMAN_MS[gameKey] ?? 1800;
  const clientElapsedMs =
    asPositiveNumber(meta.elapsedMs) ??
    asPositiveNumber(meta.clientElapsedMs) ??
    asPositiveNumber(verificationFlags.elapsedMs) ??
    serverElapsedMs;
  const actionCount = inferActionCount(meta);
  const varianceMs = asPositiveNumber(meta.varianceMs) ?? asPositiveNumber(verificationFlags.varianceMs);
  const msPerAction = actionCount > 0 ? clientElapsedMs / actionCount : clientElapsedMs;

  let score = 0.8;
  if (clientElapsedMs < minHumanMs) score -= 0.45;
  if (actionCount > 0 && msPerAction < 160) score -= 0.25;
  if (varianceMs != null && varianceMs < 18) score -= 0.2;
  if (recentStarts >= 8) score -= 0.1;

  return {
    score: Math.max(0, Math.min(1, Number(score.toFixed(2)))),
    minHumanMs,
    clientElapsedMs,
    actionCount,
    msPerAction: Number(msPerAction.toFixed(1)),
    varianceMs,
  };
}

export async function evaluateCompetitiveAttemptRisk({
  request,
  gameKey,
  userId,
  itemId,
  meta,
  verificationFlags,
  serverElapsedMs,
}: {
  request: Request;
  gameKey: string;
  userId: string;
  itemId: string;
  meta: Record<string, any>;
  verificationFlags: Record<string, any>;
  serverElapsedMs: number;
}) {
  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
  const since10m = new Date(Date.now() - 10 * 60 * 1000);
  const [recentStarts, recentFinishes, recaptcha] = await Promise.all([
    (prisma as any).attemptSession.count({ where: { userId, itemId, issuedAt: { gte: since10m } } }),
    prisma.attempt.count({ where: { userId, itemId, createdAt: { gte: since10m } } }),
    verifyRecaptchaScore({ token: String(meta.recaptchaToken || ""), remoteIp, expectedAction: "competitive_finish" }),
  ]);

  const cfBotScore = readForwardedCloudflareBotScore(request);
  const interaction = estimateInteractionScore({
    gameKey,
    meta,
    verificationFlags,
    serverElapsedMs,
    recentStarts,
  });

  const reasons: string[] = [];
  if (cfBotScore != null && cfBotScore < DEFAULT_CF_BOT_REVIEW_THRESHOLD) reasons.push("LOW_CF_BOT_SCORE");
  if (typeof recaptcha.score === "number" && recaptcha.score < DEFAULT_RECAPTCHA_REVIEW_THRESHOLD) reasons.push("LOW_RECAPTCHA_SCORE");
  if (interaction.score < DEFAULT_INTERACTION_REVIEW_THRESHOLD) reasons.push("LOW_INTERACTION_SCORE");
  if (interaction.clientElapsedMs < interaction.minHumanMs) reasons.push("SUPERHUMAN_DURATION");
  if (recentStarts >= 8 || recentFinishes >= 8) reasons.push("BURST_PLAY_PATTERN");

  return {
    reviewRequired: reasons.length > 0,
    reasons,
    cfBotScore,
    recaptcha: {
      ok: recaptcha.ok,
      skipped: recaptcha.skipped,
      score: recaptcha.score,
      action: (recaptcha as any).action ?? null,
      error: (recaptcha as any).error ?? null,
    },
    interactionScore: interaction.score,
    telemetry: {
      serverElapsedMs,
      clientElapsedMs: interaction.clientElapsedMs,
      actionCount: interaction.actionCount,
      msPerAction: interaction.msPerAction,
      varianceMs: interaction.varianceMs,
      minHumanMs: interaction.minHumanMs,
      recentStarts,
      recentFinishes,
    },
  };
}

export function parseAttemptFlags(flags: string | null | undefined) {
  if (!flags) return null;
  try {
    return JSON.parse(flags);
  } catch {
    return null;
  }
}

export function attemptNeedsReview(flags: string | null | undefined) {
  const parsed = parseAttemptFlags(flags);
  return Boolean(parsed?.risk?.reviewRequired);
}
