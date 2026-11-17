import { NativeModule, requireNativeModule } from 'expo';

import type { AppMode, StopwatchControlsEvents, StopwatchState } from './StopwatchControls.types';

declare class StopwatchControlsModule extends NativeModule<StopwatchControlsEvents> {
  getState(): StopwatchState;
  start(): Promise<StopwatchState>;
  pause(): Promise<StopwatchState>;
  reset(): Promise<StopwatchState>;
  /** Solo Android. */
  refreshNotification?(): void;
  /** Temporizador de descanso. Solo Android (de momento). */
  startRest?(): Promise<StopwatchState>;
  cancelRest?(): Promise<StopwatchState>;
  setRestDuration?(ms: number): Promise<StopwatchState>;
  /** Series. Solo Android (de momento). */
  completeSet?(): Promise<StopwatchState>;
  undoSet?(): Promise<StopwatchState>;
  nextExercise?(): Promise<StopwatchState>;
  setSetsTarget?(target: number): Promise<StopwatchState>;
  setMode?(mode: AppMode): Promise<StopwatchState>;
}

export default requireNativeModule<StopwatchControlsModule>('StopwatchControls');
