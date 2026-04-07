
export type GameType =
  | "MEMORY_SPRINT"
  | "QUICK_STOP"
  | "MOVING_ZONE"
  | "TRACE_RUN"
  | "FLASH_COUNT"
  | "TARGET_GRID"
  | "ROUTE_BUILDER"
  | "CODEBREAKER"
  | "HIDDEN_PAIR_MEMORY"
  | "RULE_LOCK"
  | "TRANSFORM_MEMORY"
  | "SEQUENCE_RESTORE"
  | "BALANCE_GRID"
  | "PATTERN_MATCH"
  | "SPOT_THE_MISSING"
  | "RAPID_MATH_RELAY"
  | "PROGRESSIVE_MOSAIC"
  | "CLUE_LADDER"
  | "SAFE_PATH_FOG"
  | "SIGNAL_HUNT";

export type GameResult = {
  scoreMs: number;
  meta?: Record<string, any>;
};

export type GameProps<TChallenge = any> = {
  onFinish: (result: GameResult) => void;
  disabled?: boolean;
  challenge?: TChallenge;
};
