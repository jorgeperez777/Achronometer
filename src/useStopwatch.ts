import { useCallback, useEffect, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

import StopwatchControls, { type AppMode, type StopwatchState } from '../modules/stopwatch-controls';

export function elapsedMs(s: StopwatchState, now = Date.now()) {
  return s.accumulatedMs + (s.isRunning ? Math.max(0, now - s.startedAt) : 0);
}

export function restRemainingMs(s: StopwatchState, now = Date.now()) {
  return s.restEndsAt ? Math.max(0, s.restEndsAt - now) : 0;
}

/** Objetivos de series que ofrece la app. */
export const SETS_TARGET_OPTIONS = [3, 4, 5, 6];
const DEFAULT_SETS_TARGET = 4;

/** Duraciones de descanso que ofrece la app. */
export const REST_PRESETS_MS = [60_000, 90_000, 120_000, 180_000];
const DEFAULT_REST_MS = 90_000;

/** El temporizador de descanso solo está implementado en Android (de momento). */
export const restSupported = typeof StopwatchControls.startRest === 'function';

async function ensureAndroidNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  const perm = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  if (await PermissionsAndroid.check(perm)) return;
  const result = await PermissionsAndroid.request(perm);
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    StopwatchControls.refreshNotification?.();
  }
}

/**
 * El estado vive en nativo (para que los controles de la pantalla de bloqueo
 * funcionen con la app dormida). Aquí solo lo reflejamos y lo pintamos.
 */
export function useStopwatch() {
  const [state, setState] = useState<StopwatchState>(() => StopwatchControls.getState());
  const [now, setNow] = useState(Date.now());

  // Cambios hechos desde la pantalla de bloqueo / notificación.
  useEffect(() => {
    // Android: si el cronómetro tenía tiempo (p. ej. tras reinstalar o reiniciar
    // el teléfono), vuelve a mostrar la notificación con los controles.
    StopwatchControls.refreshNotification?.();
    const sub = StopwatchControls.addListener('onChange', setState);
    const appSub = AppState.addEventListener('change', (status) => {
      if (status === 'active') setState(StopwatchControls.getState());
    });
    return () => {
      sub.remove();
      appSub.remove();
    };
  }, []);

  // Nativo pone restEndsAt a 0 cuando salta la alarma de fin de descanso.
  const resting = (state.restEndsAt ?? 0) > 0;

  // Refresco de pantalla solo mientras corre el cronómetro (centésimas) o el descanso.
  useEffect(() => {
    if (!state.isRunning && !resting) return;
    const id = setInterval(() => setNow(Date.now()), state.isRunning ? 33 : 200);
    return () => clearInterval(id);
  }, [state.isRunning, resting]);

  const start = useCallback(async () => {
    await ensureAndroidNotificationPermission();
    setState(await StopwatchControls.start());
  }, []);
  const pause = useCallback(async () => setState(await StopwatchControls.pause()), []);
  const reset = useCallback(async () => setState(await StopwatchControls.reset()), []);

  const startRest = useCallback(async () => {
    if (!StopwatchControls.startRest) return;
    await ensureAndroidNotificationPermission();
    setNow(Date.now());
    setState(await StopwatchControls.startRest());
  }, []);
  const cancelRest = useCallback(async () => {
    if (StopwatchControls.cancelRest) setState(await StopwatchControls.cancelRest());
  }, []);
  const [mode, setModeState] = useState<AppMode>(
    () => state.mode ?? (restRemainingMs(state) > 0 ? 'rest' : 'stopwatch'),
  );
  const setMode = useCallback(async (m: AppMode) => {
    setModeState(m);
    // Series vive en la notificación desde la primera serie: hace falta el permiso.
    if (m === 'series') await ensureAndroidNotificationPermission();
    if (StopwatchControls.setMode) setState(await StopwatchControls.setMode(m));
  }, []);

  const completeSet = useCallback(async () => {
    if (!StopwatchControls.completeSet) return;
    await ensureAndroidNotificationPermission();
    setNow(Date.now());
    setState(await StopwatchControls.completeSet());
  }, []);
  const undoSet = useCallback(async () => {
    if (StopwatchControls.undoSet) setState(await StopwatchControls.undoSet());
  }, []);
  const nextExercise = useCallback(async () => {
    if (StopwatchControls.nextExercise) setState(await StopwatchControls.nextExercise());
  }, []);
  const setSetsTarget = useCallback(async (t: number) => {
    if (StopwatchControls.setSetsTarget) setState(await StopwatchControls.setSetsTarget(t));
  }, []);

  const setRestDuration = useCallback(async (ms: number) => {
    if (StopwatchControls.setRestDuration) setState(await StopwatchControls.setRestDuration(ms));
  }, []);

  return {
    isRunning: state.isRunning,
    elapsed: elapsedMs(state, state.isRunning ? now : undefined),
    start,
    pause,
    reset,
    mode,
    setMode,
    series: {
      supported: typeof StopwatchControls.completeSet === 'function',
      done: state.sets ?? 0,
      target: state.setsTarget ?? DEFAULT_SETS_TARGET,
      restRemaining: restRemainingMs(state, now),
      complete: completeSet,
      undo: undoSet,
      next: nextExercise,
      setTarget: setSetsTarget,
    },
    rest: {
      supported: restSupported,
      remaining: restRemainingMs(state, now),
      durationMs: state.restDurationMs ?? DEFAULT_REST_MS,
      start: startRest,
      cancel: cancelRest,
      setDuration: setRestDuration,
    },
  };
}
