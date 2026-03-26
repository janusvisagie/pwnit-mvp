export type GameType =
  | "MEMORY_SPRINT"
  | "QUICK_STOP"
  | "MOVING_ZONE"
  | "TRACE_RUN"
  | "FLASH_COUNT"
  | "TARGET_GRID"
  | "ROUTE_BUILDER"
  | "CODEBREAKER"
  | "RULE_LOCK"
  | "TRANSFORM_MEMORY"
  | "SEQUENCE_RESTORE";

export type GameResult = {
  scoreMs: number;
  meta?: Record<string, any>;
};

export type GameProps = {
  onFinish: (result: GameResult) => void;
  disabled?: boolean;
};
