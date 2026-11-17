export type StopwatchState = {
  isRunning: boolean;
  /** Epoch (ms) en que empezó la tanda actual. Solo válido si isRunning. */
  startedAt: number;
  /** Milisegundos acumulados de tandas anteriores. */
  accumulatedMs: number;
  /** Epoch (ms) en que termina el descanso en curso; 0 = sin descanso. Solo Android (de momento). */
  restEndsAt?: number;
  /** Duración elegida para los descansos. Solo Android (de momento). */
  restDurationMs?: number;
  /** Series completadas del ejercicio actual (cada descanso iniciado suma una). Solo Android. */
  sets?: number;
};

export type StopwatchControlsEvents = {
  onChange: (state: StopwatchState) => void;
};
