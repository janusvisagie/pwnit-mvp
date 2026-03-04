export type GameType = "REACTION" | "PRECISION_TIMER" | "RHYTHM_HOLD";

export type GameResult = {
  scoreMs: number;     // lower is better
  meta?: Record<string, any>;
};

export type GameProps = {
  onFinish: (result: GameResult) => void;
  disabled?: boolean;
};
