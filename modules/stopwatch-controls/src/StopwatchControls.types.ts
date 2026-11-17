export type StopwatchState = {
  isRunning: boolean;
  /** Epoch (ms) en que empezó la tanda actual. Solo válido si isRunning. */
  startedAt: number;
  /** Milisegundos acumulados de tandas anteriores. */
  accumulatedMs: number;
  /** Epoch (ms) en que termina el descanso en curso; 0 = sin descanso. */
  restEndsAt?: number;
  /** Duración elegida para los descansos. */
  restDurationMs?: number;
  /** Hay un ejercicio en marcha en la pestaña Series (false = configurando). */
  exerciseActive?: boolean;
  /** Series hechas del ejercicio actual. */
  sets?: number;
  /** Series objetivo del ejercicio. */
  setsTarget?: number;
  /** Pestaña abierta; decide qué hace el botón ⏳/✓ de la notificación. */
  mode?: AppMode;
};

export type AppMode = 'stopwatch' | 'rest' | 'series';

export type LanguageSetting = 'system' | 'es' | 'en';

/** Ajustes del usuario. Viven en nativo (la notificación y los avisos los usan con la app cerrada). */
export type AppSettings = {
  language: LanguageSetting;
  /** Vibración de confirmación al tocar los controles. */
  hapticsEnabled: boolean;
  /** Vibración del aviso de fin de descanso / ejercicio. */
  alertVibration: boolean;
  /** Sonido del aviso de fin de descanso / ejercicio. */
  alertSound: boolean;
};

/** Listas editables por el usuario: duraciones de descanso (ms) y número de series. */
export type Presets = { rest: number[]; sets: number[] };

export type StopwatchControlsEvents = {
  onChange: (state: StopwatchState) => void;
};
