"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Phase = "idle" | "wait" | "go" | "done" | "error";
type GameType = "REACTION" | "TIMING";

const PRACTICE_KEY = "makeityours_practice_default";
const GAME_KEY = "makeityours_game_default";

export function PlayClient({
  itemId,
  costCredits,
  initialBalance,
}: {
  itemId: string;
  costCredits: number;
  initialBalance: number;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("Press Start. When it says GO, click as fast as you can.");
  const [score, setScore] = useState<number | null>(null);

  const [practice, setPractice] = useState<boolean>(false);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [bestToday, setBestToday] = useState<number | null>(null);
  const [bestPractice, setBestPractice] = useState<number | null>(null);

  const [game, setGame] = useState<GameType>("REACTION");

  const goAtRef = useRef<number | null>(null);
  const rttRef = useRef<number>(0);

  // For Reaction: deterministic “GO after 1200ms”
  const delayMs = useMemo(() => 1200, []);

  // For Timing game:
  // start a timer at GO, user tries click at targetMs (5s)
  const timingStartRef = useRef<number | null>(null);
  const timingTargetMs = 5000;

  // Persist settings
  useEffect(() => {
    try {
      const v = localStorage.getItem(PRACTICE_KEY);
      if (v === "1") setPractice(true);
      if (v === "0") setPractice(false);

      const g = localStorage.getItem(GAME_KEY) as GameType | null;
      if (g === "REACTION" || g === "TIMING") setGame(g);
    } catch {}
  }, []);

  function setPracticePersist(v: boolean) {
    setPractice(v);
    try { localStorage.setItem(PRACTICE_KEY, v ? "1" : "0"); } catch {}
  }

  function setGamePersist(v: GameType) {
    setGame(v);
    try { localStorage.setItem(GAME_KEY, v); } catch {}
  }

  function resetUiForGame(nextGame: GameType) {
    setPhase("idle");
    setScore(null);
    setMsg(
      nextGame === "REACTION"
        ? "Press Start. When it says GO, click as fast as you can."
        : "Press Start. When it says GO, click when the timer hits exactly 5.000s."
    );
  }

  async function start() {
    if (!practice && balance < costCredits) {
      setPhase("error");
      setMsg(`Not enough credits. You have ${balance}, but this attempt costs ${costCredits}.`);
      return;
    }

    setScore(null);

    // Session ping (keep your MVP)
    const t0 = performance.now();
    try {
      const res = await fetch("/api/game/session", { method: "POST", body: JSON.stringify({ itemId }) });
      await res.json();
    } catch {}
    const t1 = performance.now();
    rttRef.current = Math.round(t1 - t0);

    setPhase("wait");
    setMsg("WAIT...");

    goAtRef.current = performance.now() + delayMs;

    window.setTimeout(() => {
      setPhase("go");

      if (game === "REACTION") {
        setMsg("GO!");
      } else {
        timingStartRef.current = performance.now();
        setMsg("GO! Click at 5.000s");
      }
    }, delayMs);
  }

  async function click() {
    if (phase !== "go") return;

    const now = performance.now();

    let computedScoreMs = 0;

    if (game === "REACTION") {
      const goAt = goAtRef.current;
      if (!goAt) return;
      computedScoreMs = Math.max(0, Math.round(now - goAt));
    } else {
      const startAt = timingStartRef.current;
      if (!startAt) return;
      const elapsed = now - startAt;
      computedScoreMs = Math.max(0, Math.round(Math.abs(elapsed - timingTargetMs)));
    }

    setScore(computedScoreMs);
    setPhase("done");

    // PRACTICE
    if (practice) {
      setBestPractice((prev) => (prev === null ? computedScoreMs : Math.min(prev, computedScoreMs)));
      setMsg(`Practice recorded: ${computedScoreMs}ms. (Not submitted)`);
      return;
    }

    // REAL
    setMsg(`Recorded: ${computedScoreMs}ms. Submitting...`);

    const res = await fetch("/api/game/attempt", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId,
        scoreMs: computedScoreMs,
        rttMs: rttRef.current,
        clientSentAt: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      setPhase("error");
      setMsg("Submission failed (insufficient credits or server error).");
      return;
    }

    const data = await res.json();
    setBestToday(typeof data.bestScoreMs === "number" ? data.bestScoreMs : null);
    if (typeof data.balance === "number") setBalance(data.balance);

    setMsg(`Submitted. Best score today: ${data.bestScoreMs ?? "—"}ms. Credits left: ${data.balance ?? "—"}.`);
  }

  const canStart = practice || balance >= costCredits;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 18, padding: 16, background: "#fff" }}>
      {/* Top controls */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Game picker */}
          <div style={{ fontSize: 13, color: "#111" }}>
            Game:&nbsp;
            <select
              value={game}
              onChange={(e) => {
                const g = e.target.value as GameType;
                setGamePersist(g);
                resetUiForGame(g);
              }}
              style={{ padding: "6px 8px", borderRadius: 10, border: "1px solid #ddd", fontWeight: 800 }}
            >
              <option value="REACTION">Reaction (fast click)</option>
              <option value="TIMING">Timing (hit 5.000s)</option>
            </select>
          </div>

          {/* Practice */}
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={practice}
              onChange={(e) => {
                setPracticePersist(e.target.checked);
                resetUiForGame(game);
              }}
            />
            <span style={{ fontSize: 13, color: "#111", fontWeight: 800 }}>
              Practice mode
            </span>
          </label>

          <div style={{ fontSize: 13, color: "#333" }}>
            Mode:{" "}
            <b style={{ color: practice ? "#0f172a" : "#ff0033" }}>
              {practice ? "Practice" : "Real"}
            </b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "#333" }}>
            Credits: <b style={{ fontVariantNumeric: "tabular-nums" }}>{balance}</b>
          </div>
          <div style={{ fontSize: 13, color: "#333" }}>
            Cost: <b style={{ fontVariantNumeric: "tabular-nums" }}>{costCredits}</b>/attempt
          </div>
        </div>
      </div>

      {/* Game area */}
      <div
        onClick={click}
        style={{
          marginTop: 12,
          height: 240,
          borderRadius: 16,
          border: practice ? "2px solid #111" : "2px solid #ff0033",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 900,
          userSelect: "none",
          cursor: phase === "go" ? "pointer" : "default",
          background: phase === "go" ? (practice ? "#111" : "#ff0033") : "#fff",
          color: phase === "go" ? "#fff" : "#111",
          textAlign: "center",
          padding: 16,
          lineHeight: 1.25,
        }}
      >
        {msg}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={start}
          disabled={phase === "wait" || phase === "go" || !canStart}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            background: canStart ? "#111" : "#888",
            color: "#fff",
            cursor: canStart ? "pointer" : "not-allowed",
            fontWeight: 900,
          }}
        >
          Start
        </button>

        {!practice && balance < costCredits ? (
          <Link
            href={`/buy-credits?return=/play/${itemId}`}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #111",
              textDecoration: "none",
              color: "#111",
              display: "inline-flex",
              alignItems: "center",
              fontWeight: 900,
              background: "#fff",
            }}
          >
            Top up & play again →
          </Link>
        ) : null}

        <Link
          href={`/item/${itemId}`}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            textDecoration: "none",
            color: "#111",
            display: "inline-flex",
            alignItems: "center",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          Back to item
        </Link>

        <Link
          href={`/item/${itemId}/leaderboard`}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #111",
            textDecoration: "none",
            color: "#111",
            display: "inline-flex",
            alignItems: "center",
            background: "#fff",
            fontWeight: 900,
          }}
        >
          View winners
        </Link>
      </div>

      {/* Footer info */}
      <div style={{ marginTop: 10, color: "#666", fontSize: 12, lineHeight: 1.5 }}>
        Anti-cheat MVP: server timestamping + RTT capture, flag impossible scores.
        {practice ? (
          <div style={{ marginTop: 6 }}>Practice: not submitted, no credits spent.</div>
        ) : (
          <div style={{ marginTop: 6 }}>Real: recorded + costs credits.</div>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: "#333" }}>
        {score !== null ? (
          <div>Your last score: <b style={{ fontVariantNumeric: "tabular-nums" }}>{score}ms</b></div>
        ) : null}
        {bestPractice !== null ? (
          <div>Best practice today: <b style={{ fontVariantNumeric: "tabular-nums" }}>{bestPractice}ms</b></div>
        ) : null}
        {bestToday !== null ? (
          <div>Best real score today: <b style={{ fontVariantNumeric: "tabular-nums" }}>{bestToday}ms</b></div>
        ) : null}
      </div>
    </div>
  );
}
