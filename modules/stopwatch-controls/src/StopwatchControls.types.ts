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
  /** Series hechas del ejercicio actual. Solo Android (de momento). */
  sets?: number;
  /** Series objetivo del ejercicio. Solo Android (de momento). */
  setsTarget?: number;
  /** Pestaña abierta; decide qué hace el botón ⏳/✓ de la notificación. Solo Android. */
  mode?: AppMode;
};

export type AppMode = 'stopwatch' | 'rest' | 'series';

export type StopwatchControlsEvents = {
  onChange: (state: StopwatchState) => void;
};
