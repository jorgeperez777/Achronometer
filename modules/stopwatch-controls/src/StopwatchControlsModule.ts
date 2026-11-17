import { NativeModule, requireNativeModule } from 'expo';

import type { StopwatchControlsEvents, StopwatchState } from './StopwatchControls.types';

declare class StopwatchControlsModule extends NativeModule<StopwatchControlsEvents> {
  getState(): StopwatchState;
  start(): Promise<StopwatchState>;
  pause(): Promise<StopwatchState>;
  reset(): Promise<StopwatchState>;
  /** Solo Android. */
  refreshNotification?(): void;
}

export default requireNativeModule<StopwatchControlsModule>('StopwatchControls');
