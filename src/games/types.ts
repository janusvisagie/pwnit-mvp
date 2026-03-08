export type GameType =
  | "MEMORY_SPRINT"
  | "QUICK_STOP"
  | "MOVING_ZONE"
  | "TRACE_RUN"
  | "BURST_MATCH"
  | "TARGET_GRID";

export type GameResult = {
  scoreMs: number; // lower is better, regardless of the mini-game's visual metaphor
  meta?: Record<string, any>;
};

export type GameProps = {
  onFinish: (result: GameResult) => void;
  disabled?: boolean;
};
