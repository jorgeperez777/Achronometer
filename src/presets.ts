import type { Params, TKey } from './i18n';

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

/** Resultado de validar: el valor listo para guardar, o la clave de traducción del error. */
export type Validation<T> = { ok: true; value: T } | { ok: false; error: TKey; params?: Params };

const DIGITS = /^\d+$/;

/** m:ss (o h:mm:ss no hace falta: el máximo es 30:00). */
export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Valida un descanso escrito como minutos + segundos (campos de texto).
 * Un campo vacío cuenta como 0, pero no los dos a la vez.
 */
export function validateRest(minutesText: string, secondsText: string, existing: number[]): Validation<number> {
  const min = minutesText.trim();
  const sec = secondsText.trim();
  if (!min && !sec) return { ok: false, error: 'err.emptyRest' };
  if ((min && !DIGITS.test(min)) || (sec && !DIGITS.test(sec))) {
    return { ok: false, error: 'err.digits' };
  }
  const m = min ? Number(min) : 0;
  const s = sec ? Number(sec) : 0;
  if (s > 59) return { ok: false, error: 'err.seconds' };

  const ms = (m * 60 + s) * 1000;
  if (ms < MIN_REST_MS) return { ok: false, error: 'err.minRest', params: { s: MIN_REST_MS / 1000 } };
  if (ms > MAX_REST_MS) return { ok: false, error: 'err.maxRest', params: { m: MAX_REST_MS / 60_000 } };
  if (existing.includes(ms)) return { ok: false, error: 'err.duplicate', params: { value: formatDuration(ms) } };
  if (existing.length >= MAX_PRESETS) return { ok: false, error: 'err.full', params: { max: MAX_PRESETS } };
  return { ok: true, value: ms };
}

/** Valida un número de series escrito por el usuario. */
export function validateSets(text: string, existing: number[]): Validation<number> {
  const t = text.trim();
  if (!t) return { ok: false, error: 'err.emptySets' };
  if (!DIGITS.test(t)) return { ok: false, error: 'err.digits' };
  const n = Number(t);
  if (n < MIN_SETS || n > MAX_SETS) return { ok: false, error: 'err.setsRange', params: { min: MIN_SETS, max: MAX_SETS } };
  if (existing.includes(n)) return { ok: false, error: 'err.duplicate', params: { value: n } };
  if (existing.length >= MAX_PRESETS) return { ok: false, error: 'err.full', params: { max: MAX_PRESETS } };
  return { ok: true, value: n };
}

/** Añade y deja la lista ordenada. */
export function addSorted(list: number[], value: number) {
  return [...list, value].sort((a, b) => a - b);
}
