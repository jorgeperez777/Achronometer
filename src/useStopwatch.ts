import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

import StopwatchControls, { type AppMode, type Presets, type StopwatchState } from '../modules/stopwatch-controls';
import { DEFAULT_REST_PRESETS_MS, DEFAULT_SETS_PRESETS } from './presets';

export function elapsedMs(s: StopwatchState, now = Date.now()) {
  return s.accumulatedMs + (s.isRunning ? Math.max(0, now - s.startedAt) : 0);
}

export function restRemainingMs(s: StopwatchState, now = Date.now()) {
  return s.restEndsAt ? Math.max(0, s.restEndsAt - now) : 0;
}

const DEFAULT_SETS_TARGET = 4;
const DEFAULT_REST_MS = 90_000;

/** Descanso y series existen en el módulo nativo (Android e iOS). */
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
      if (status === 'active') {
        setState(StopwatchControls.getState());
        // Por si se quitó la notificación mientras la app estaba en segundo plano.
        StopwatchControls.refreshNotification?.();
      }
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

  const startExercise = useCallback(async () => {
    if (!StopwatchControls.startExercise) return;
    await ensureAndroidNotificationPermission();
    setState(await StopwatchControls.startExercise());
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
  const endExercise = useCallback(async () => {
    if (StopwatchControls.endExercise) setState(await StopwatchControls.endExercise());
  }, []);
  const setSetsTarget = useCallback(async (t: number) => {
    if (StopwatchControls.setSetsTarget) setState(await StopwatchControls.setSetsTarget(t));
  }, []);

  // Listas editables (duraciones y series). Viven en nativo; aquí se reflejan.
  const [presets, setPresetsState] = useState<Presets>(
    () => StopwatchControls.getPresets?.() ?? { rest: DEFAULT_REST_PRESETS_MS, sets: DEFAULT_SETS_PRESETS },
  );
  const savePresets = useCallback(async (next: Presets) => {
    setPresetsState(next); // optimista
    if (StopwatchControls.setPresets) setPresetsState(await StopwatchControls.setPresets(next.rest, next.sets));
  }, []);
  const presetsRef = useRef(presets);
  presetsRef.current = presets;
  const setRestPresets = useCallback((rest: number[]) => savePresets({ ...presetsRef.current, rest }), [savePresets]);
  const setSetsPresets = useCallback((sets: number[]) => savePresets({ ...presetsRef.current, sets }), [savePresets]);

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
      active: state.exerciseActive ?? false,
      done: state.sets ?? 0,
      target: state.setsTarget ?? DEFAULT_SETS_TARGET,
      restRemaining: restRemainingMs(state, now),
      start: startExercise,
      complete: completeSet,
      undo: undoSet,
      end: endExercise,
      setTarget: setSetsTarget,
      options: presets.sets,
      setOptions: setSetsPresets,
    },
    rest: {
      supported: restSupported,
      remaining: restRemainingMs(state, now),
      durationMs: state.restDurationMs ?? DEFAULT_REST_MS,
      start: startRest,
      cancel: cancelRest,
      setDuration: setRestDuration,
      options: presets.rest,
      setOptions: setRestPresets,
    },
  };
}
