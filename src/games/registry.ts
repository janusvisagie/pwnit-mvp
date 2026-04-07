
import type { GameType } from "./types";

import ClueLadderGame from "./clue-ladder/ClueLadderGame";
import CodebreakerGame from "./codebreaker/CodebreakerGame";
import FlashCountGame from "./flash-count/FlashCountGame";
import HiddenPairMemoryGame from "./hidden-pair-memory/HiddenPairMemoryGame";
import NumberMemoryGame from "./number-memory/NumberMemoryGame";
import ProgressiveMosaicGame from "./progressive-mosaic/ProgressiveMosaicGame";
import QuickStopGame from "./quick-stop/QuickStopGame";
import RouteBuilderGame from "./route-builder/RouteBuilderGame";
import RuleLockGame from "./rule-lock/RuleLockGame";
import SafePathFogGame from "./safe-path-fog/SafePathFogGame";
import SequenceRestoreGame from "./sequence-restore/SequenceRestoreGame";
import SignalHuntGame from "./signal-hunt/SignalHuntGame";
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
    case "CLUE_LADDER":
      return ClueLadderGame;
    case "CODEBREAKER":
      return CodebreakerGame;
    case "HIDDEN_PAIR_MEMORY":
      return HiddenPairMemoryGame;
    case "PROGRESSIVE_MOSAIC":
      return ProgressiveMosaicGame;
    case "RULE_LOCK":
      return RuleLockGame;
    case "TRANSFORM_MEMORY":
      return TransformMemoryGame;
    case "SAFE_PATH_FOG":
      return SafePathFogGame;
    case "SEQUENCE_RESTORE":
      return SequenceRestoreGame;
    case "SIGNAL_HUNT":
      return SignalHuntGame;
    case "MOVING_ZONE":
    case "TRACE_RUN":
    default:
      return TargetGridGame;
  }
}
