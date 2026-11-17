import { useCallback, useEffect, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';

import StopwatchControls, { type StopwatchState } from '../modules/stopwatch-controls';

export function elapsedMs(s: StopwatchState, now = Date.now()) {
  return s.accumulatedMs + (s.isRunning ? Math.max(0, now - s.startedAt) : 0);
}

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

  // Refresco de pantalla solo mientras corre.
  useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => setNow(Date.now()), 33);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const start = useCallback(async () => {
    await ensureAndroidNotificationPermission();
    setState(await StopwatchControls.start());
  }, []);
  const pause = useCallback(async () => setState(await StopwatchControls.pause()), []);
  const reset = useCallback(async () => setState(await StopwatchControls.reset()), []);

  return {
    isRunning: state.isRunning,
    elapsed: elapsedMs(state, state.isRunning ? now : undefined),
    start,
    pause,
    reset,
  };
}
