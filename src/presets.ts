/**
 * Listas editables (duraciones de descanso y número de series) y validación de lo que escribe
 * el usuario. Los límites coinciden con los que aplica el nativo (StopwatchStore).
 */

export const DEFAULT_REST_PRESETS_MS = [60_000, 90_000, 120_000, 180_000];
export const DEFAULT_SETS_PRESETS = [3, 4, 5, 6];

export const MAX_PRESETS = 8;
export const MIN_REST_MS = 5_000;
export const MAX_REST_MS = 30 * 60_000;
export const MIN_SETS = 1;
export const MAX_SETS = 20;

/** Resultado de validar: el valor listo para guardar, o el mensaje de error para mostrar. */
export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

const DIGITS = /^\d+$/;

/** m:ss (o h:mm:ss no hace falta: el máximo es 30:00). */
export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Texto para lectores de pantalla: "1 minuto 30 segundos". */
export function speakDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts = [];
  if (m) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
  if (s || !m) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
  return parts.join(' ');
}

/**
 * Valida un descanso escrito como minutos + segundos (campos de texto).
 * Un campo vacío cuenta como 0, pero no los dos a la vez.
 */
export function validateRest(minutesText: string, secondsText: string, existing: number[]): Validation<number> {
  const min = minutesText.trim();
  const sec = secondsText.trim();
  if (!min && !sec) return { ok: false, error: 'Escribe los minutos, los segundos o ambos.' };
  if ((min && !DIGITS.test(min)) || (sec && !DIGITS.test(sec))) {
    return { ok: false, error: 'Usa solo números enteros, sin signos ni decimales.' };
  }
  const m = min ? Number(min) : 0;
  const s = sec ? Number(sec) : 0;
  if (s > 59) return { ok: false, error: 'Los segundos van de 0 a 59.' };

  const ms = (m * 60 + s) * 1000;
  if (ms < MIN_REST_MS) return { ok: false, error: `El descanso mínimo es de ${MIN_REST_MS / 1000} segundos.` };
  if (ms > MAX_REST_MS) return { ok: false, error: `El descanso máximo es de ${MAX_REST_MS / 60_000} minutos.` };
  if (existing.includes(ms)) return { ok: false, error: `${formatDuration(ms)} ya está en la lista.` };
  if (existing.length >= MAX_PRESETS) return { ok: false, error: `Caben ${MAX_PRESETS} opciones como máximo. Borra una primero.` };
  return { ok: true, value: ms };
}

/** Valida un número de series escrito por el usuario. */
export function validateSets(text: string, existing: number[]): Validation<number> {
  const t = text.trim();
  if (!t) return { ok: false, error: 'Escribe cuántas series.' };
  if (!DIGITS.test(t)) return { ok: false, error: 'Usa solo números enteros, sin signos ni decimales.' };
  const n = Number(t);
  if (n < MIN_SETS || n > MAX_SETS) return { ok: false, error: `Elige entre ${MIN_SETS} y ${MAX_SETS} series.` };
  if (existing.includes(n)) return { ok: false, error: `${n} ya está en la lista.` };
  if (existing.length >= MAX_PRESETS) return { ok: false, error: `Caben ${MAX_PRESETS} opciones como máximo. Borra una primero.` };
  return { ok: true, value: n };
}

/** Añade y deja la lista ordenada. */
export function addSorted(list: number[], value: number) {
  return [...list, value].sort((a, b) => a - b);
}
