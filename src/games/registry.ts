import type { GameType } from "./types";
import NumberMemoryGame from "./number-memory/NumberMemoryGame";
import QuickStopGame from "./quick-stop/QuickStopGame";
import MovingZoneGame from "./moving-zone/MovingZoneGame";
import TraceRunGame from "./trace-run/TraceRunGame";
import BurstMatchGame from "./burst-match/BurstMatchGame";
import TargetGridGame from "./target-grid/TargetGridGame";

export function getGameComponent(t: GameType) {
  switch (t) {
    case "MEMORY_SPRINT":
      return NumberMemoryGame;
    case "QUICK_STOP":
      return QuickStopGame;
    case "MOVING_ZONE":
      return MovingZoneGame;
    case "TRACE_RUN":
      return TraceRunGame;
    case "BURST_MATCH":
      return BurstMatchGame;
    case "TARGET_GRID":
    default:
      return TargetGridGame;
  }
}
