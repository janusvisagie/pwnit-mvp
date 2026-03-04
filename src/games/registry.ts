import type { GameType } from "./types";
import ReactionGame from "./reaction/ReactionGame";
import PrecisionTimerGame from "./precision-timer/PrecisionTimerGame";
import RhythmHoldGame from "./rhythm-hold/RhythmHoldGame";

export function getGameComponent(t: GameType) {
  switch (t) {
    case "PRECISION_TIMER":
      return PrecisionTimerGame;
    case "RHYTHM_HOLD":
      return RhythmHoldGame;
    case "REACTION":
    default:
      return ReactionGame;
  }
}
