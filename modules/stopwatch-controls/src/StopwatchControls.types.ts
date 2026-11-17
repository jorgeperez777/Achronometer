export type StopwatchState = {
  isRunning: boolean;
  /** Epoch (ms) en que empezó la tanda actual. Solo válido si isRunning. */
  startedAt: number;
  /** Milisegundos acumulados de tandas anteriores. */
  accumulatedMs: number;
};

export type StopwatchControlsEvents = {
  onChange: (state: StopwatchState) => void;
};
