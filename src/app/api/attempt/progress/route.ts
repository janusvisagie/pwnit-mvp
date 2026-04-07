
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { getCurrentActor, getRequestIp, hashForRateLimit } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rateLimit";
import { ensureCurrentRound, syncRoundLifecycle } from "@/lib/rounds";

const CODEBREAKER_CODE_LENGTH = 4;

function clampInt(value: unknown, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function gradeCodebreakerGuess(guess: number[], solution: number[]) {
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < solution.length; i += 1) {
    if (guess[i] === solution[i]) exact += 1;
    else if (solution.includes(guess[i]!)) misplaced += 1;
  }
  return { exact, misplaced };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const attemptId = String(body?.attemptId || "").trim();

    if (!attemptId) {
      return NextResponse.json({ ok: false, error: "Missing attemptId" }, { status: 400 });
    }

    const actor = await getCurrentActor();
    const user = actor.user;
    const subject = `${user.id}:${actor.bucketKey}:${hashForRateLimit(getRequestIp())}:${attemptId}`;
    const rate = await consumeRateLimit({
      scope: "attempt_progress",
      subject,
      limit: 90,
      windowMs: 5 * 60 * 1000,
    });

    if (!rate.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many in-game actions. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const session = await (prisma as any).attemptSession.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        userId: true,
        itemId: true,
        roundId: true,
        gameKey: true,
        status: true,
        challengeJson: true,
        verificationJson: true,
        expiresAt: true,
      },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ ok: false, error: "Attempt session not found" }, { status: 404 });
    }

    if (session.status !== "ISSUED") {
      return NextResponse.json({ ok: false, error: "This attempt session is no longer active." }, { status: 409 });
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await (prisma as any).attemptSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED", verificationJson: { reason: "expired_before_progress" } },
      });
      return NextResponse.json({ ok: false, error: "This attempt session expired. Start a new run." }, { status: 409 });
    }

    const round = await ensureCurrentRound(session.itemId);
    if (!round || round.id !== session.roundId) {
      return NextResponse.json({ ok: false, error: "Round changed. Start a fresh run." }, { status: 409 });
    }

    const synced = await syncRoundLifecycle(session.itemId);
    const currentState = synced?.state ?? round.state;
    if (!["BUILDING", "ACTIVATED"].includes(currentState)) {
      return NextResponse.json({ ok: false, error: "This prize is not accepting plays right now." }, { status: 409 });
    }

    if (session.gameKey === "codebreaker") {
      const challenge = session.challengeJson as any;
      const progress = (session.verificationJson as any) ?? {};
      const guess = Array.isArray(body?.guess)
        ? body.guess.map((value: unknown) => clampInt(value, 0, 9))
        : [];

      if (
        !Array.isArray(challenge?.solution) ||
        !Array.isArray(challenge?.digitPool) ||
        guess.length !== Number(challenge?.codeLength || CODEBREAKER_CODE_LENGTH) ||
        new Set(guess).size !== guess.length ||
        guess.some((digit: number) => !challenge.digitPool.includes(digit))
      ) {
        return NextResponse.json({ ok: false, error: "Invalid guess payload." }, { status: 422 });
      }

      const rows = Array.isArray(progress.rows) ? [...progress.rows] : [];
      if (rows.length >= Number(challenge?.maxGuesses || 6) || progress.solved) {
        return NextResponse.json({ ok: false, error: "This codebreaker run is already complete." }, { status: 409 });
      }

      const graded = gradeCodebreakerGuess(guess, challenge.solution);
      const nextRows = [...rows, { value: guess, exact: graded.exact, misplaced: graded.misplaced }];
      const solved = graded.exact === guess.length;
      const exhausted = nextRows.length >= Number(challenge?.maxGuesses || 6);

      const nextProgress = {
        rows: nextRows,
        solved,
        exhausted,
        guessCount: nextRows.length,
        completedAt: solved || exhausted ? new Date().toISOString() : null,
      };

      await (prisma as any).attemptSession.update({
        where: { id: session.id },
        data: { verificationJson: nextProgress },
      });

      return NextResponse.json({
        ok: true,
        game: "codebreaker",
        rows: nextRows,
        exact: graded.exact,
        misplaced: graded.misplaced,
        solved,
        exhausted,
        remainingGuesses: Math.max(0, Number(challenge?.maxGuesses || 6) - nextRows.length),
      });
    }

    if (session.gameKey === "hidden-pair-memory") {
      const challenge = session.challengeJson as any;
      const progress = (session.verificationJson as any) ?? {};
      const picks = Array.isArray(body?.picks)
        ? body.picks.map((value: unknown) => clampInt(value, -1, 99)).filter((value: number) => value >= 0)
        : [];

      if (!Array.isArray(challenge?.deck) || picks.length !== 2 || picks[0] === picks[1]) {
        return NextResponse.json({ ok: false, error: "Invalid flip payload." }, { status: 422 });
      }

      const boardSize = challenge.deck.length;
      if (picks.some((index: number) => index < 0 || index >= boardSize)) {
        return NextResponse.json({ ok: false, error: "Flip indices are out of range." }, { status: 422 });
      }

      const matchedIndices = Array.isArray(progress.matchedIndices)
        ? progress.matchedIndices.map((value: unknown) => clampInt(value, -1, boardSize)).filter((value: number) => value >= 0)
        : [];

      if (progress.completed || progress.turnCount >= Number(challenge?.maxTurns || 10)) {
        return NextResponse.json({ ok: false, error: "This memory run is already complete." }, { status: 409 });
      }

      if (matchedIndices.includes(picks[0]) || matchedIndices.includes(picks[1])) {
        return NextResponse.json({ ok: false, error: "One of those cards is already matched." }, { status: 409 });
      }

      const firstSymbol = String(challenge.deck[picks[0]]);
      const secondSymbol = String(challenge.deck[picks[1]]);
      const match = firstSymbol === secondSymbol;

      const matchedSet = new Set<number>(matchedIndices);
      if (match) {
        matchedSet.add(picks[0]);
        matchedSet.add(picks[1]);
      }

      const history = Array.isArray(progress.history) ? [...progress.history] : [];
      history.push({ picks, match });

      const nextTurnCount = clampInt(progress.turnCount, 0, Number(challenge?.maxTurns || 10)) + 1;
      const nextMatched = [...matchedSet].sort((a, b) => a - b);
      const completed = nextMatched.length === boardSize;
      const exhausted = nextTurnCount >= Number(challenge?.maxTurns || 10) && !completed;

      const nextProgress = {
        matchedIndices: nextMatched,
        turnCount: nextTurnCount,
        history,
        completed,
        exhausted,
        completedAt: completed || exhausted ? new Date().toISOString() : null,
      };

      await (prisma as any).attemptSession.update({
        where: { id: session.id },
        data: { verificationJson: nextProgress },
      });

      return NextResponse.json({
        ok: true,
        game: "hidden-pair-memory",
        reveal: {
          picks,
          symbols: [firstSymbol, secondSymbol],
          match,
        },
        matchedIndices: nextMatched,
        turnCount: nextTurnCount,
        completed,
        exhausted,
        remainingTurns: Math.max(0, Number(challenge?.maxTurns || 10) - nextTurnCount),
      });
    }

    return NextResponse.json({ ok: false, error: "This game does not use per-move server progress." }, { status: 409 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) || "Server error" }, { status: 500 });
  }
}
