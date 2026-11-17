import { NativeModule, requireNativeModule } from 'expo';

import type { StopwatchControlsEvents, StopwatchState } from './StopwatchControls.types';

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
  /** Contador de series. Solo Android (de momento). */
  addSets?(delta: number): Promise<StopwatchState>;
  resetSets?(): Promise<StopwatchState>;
}

export default requireNativeModule<StopwatchControlsModule>('StopwatchControls');
