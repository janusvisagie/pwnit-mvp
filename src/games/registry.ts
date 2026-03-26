import type { GameType } from "./types";

import CodebreakerGame from "./codebreaker/CodebreakerGame";
import FlashCountGame from "./flash-count/FlashCountGame";
import NumberMemoryGame from "./number-memory/NumberMemoryGame";
import QuickStopGame from "./quick-stop/QuickStopGame";
import RouteBuilderGame from "./route-builder/RouteBuilderGame";
import RuleLockGame from "./rule-lock/RuleLockGame";
import SequenceRestoreGame from "./sequence-restore/SequenceRestoreGame";
import TargetGridGame from "./target-grid/TargetGridGame";
import TransformMemoryGame from "./transform-memory/TransformMemoryGame";

export function getGameComponent(t: GameType) {
  switch (t) {
    case "MEMORY_SPRINT":
      return NumberMemoryGame;
    case "QUICK_STOP":
      return QuickStopGame;
    case "FLASH_COUNT":
      return FlashCountGame;
    case "TARGET_GRID":
      return TargetGridGame;
    case "ROUTE_BUILDER":
      return RouteBuilderGame;
    case "CODEBREAKER":
      return CodebreakerGame;
    case "RULE_LOCK":
      return RuleLockGame;
    case "TRANSFORM_MEMORY":
      return TransformMemoryGame;
    case "SEQUENCE_RESTORE":
      return SequenceRestoreGame;
    case "MOVING_ZONE":
    case "TRACE_RUN":
    default:
      return TargetGridGame;
  }
}
