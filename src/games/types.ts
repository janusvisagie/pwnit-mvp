export type GameType = "TAP_RUSH" | "MEMORY_SPRINT" | "ZONE_HOLD";

export type GameResult = {
  scoreMs: number;
  meta?: Record<string, any>;
};

export type GameProps = {
  onFinish: (result: GameResult) => void;
  disabled?: boolean;
};
