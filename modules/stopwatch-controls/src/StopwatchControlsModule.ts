import { NativeModule, requireNativeModule } from 'expo';

import type { AppMode, AppSettings, Presets, StopwatchControlsEvents, StopwatchState } from './StopwatchControls.types';

declare class StopwatchControlsModule extends NativeModule<StopwatchControlsEvents> {
  getState(): StopwatchState;
  start(): Promise<StopwatchState>;
  pause(): Promise<StopwatchState>;
  reset(): Promise<StopwatchState>;
  /** Vuelve a mostrar la notificación / Live Activity si hay algo en marcha. */
  refreshNotification?(): void;
  /** Temporizador de descanso. */
  startRest?(): Promise<StopwatchState>;
  cancelRest?(): Promise<StopwatchState>;
  setRestDuration?(ms: number): Promise<StopwatchState>;
  /** Series. */
  startExercise?(): Promise<StopwatchState>;
  completeSet?(): Promise<StopwatchState>;
  undoSet?(): Promise<StopwatchState>;
  endExercise?(): Promise<StopwatchState>;
  setSetsTarget?(target: number): Promise<StopwatchState>;
  setMode?(mode: AppMode): Promise<StopwatchState>;
  /** Listas editables. */
  getPresets?(): Presets;
  setPresets?(rest: number[], sets: number[]): Promise<Presets>;
  /** Ajustes. */
  getSettings?(): AppSettings;
  setSettings?(patch: Partial<AppSettings>): Promise<AppSettings>;
}

export default requireNativeModule<StopwatchControlsModule>('StopwatchControls');
