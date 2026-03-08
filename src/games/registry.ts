import type { GameType } from "./types";
import TapSpeedGame from "./tap-speed/TapSpeedGame";
import NumberMemoryGame from "./number-memory/NumberMemoryGame";
import TargetHoldGame from "./target-hold/TargetHoldGame";

export function getGameComponent(t: GameType) {
  switch (t) {
    case "MEMORY_SPRINT":
      return NumberMemoryGame;
    case "ZONE_HOLD":
      return TargetHoldGame;
    case "TAP_RUSH":
    default:
      return TapSpeedGame;
  }
}
