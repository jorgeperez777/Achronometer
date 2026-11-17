/**
 * Textos de la app en español e inglés. Los de la notificación y los avisos están en los recursos
 * nativos (modules/stopwatch-controls/android/src/main/res/values*), porque se generan también con
 * la app cerrada.
 *
 * Parámetros con {nombre}. Plurales: claves `_one` / `_other` con `plural()`.
 */

export type Lang = 'es' | 'en';

const es = {
  'tabs.stopwatch': 'Cronómetro',
  'tabs.rest': 'Descanso',
  'tabs.series': 'Series',
  'tabs.running': '{label}, en marcha',

  'settings.open': 'Ajustes',
  'settings.title': 'Ajustes',
  'settings.back': 'Volver',
  'settings.language': 'Idioma',
  'settings.langSystem': 'Del sistema ({current})',
  'settings.vibration': 'Vibración',
  'settings.vibTouch': 'Al tocar los controles',
  'settings.vibTouchHint': 'Confirma cada toque sin mirar, también en la pantalla de bloqueo.',
  'settings.vibAlert': 'Al terminar el descanso',
  'settings.vibAlertHint': 'También al completar un ejercicio.',
  'settings.sound': 'Sonido',
  'settings.soundAlert': 'Al terminar el descanso',
  'settings.soundHint': 'Usa el sonido de notificaciones del teléfono y respeta el modo silencio.',
  'settings.androidOnly': 'Disponible en Android.',

  'stopwatch.start': 'Iniciar',
  'stopwatch.pause': 'Pausar',
  'stopwatch.resume': 'Reanudar',
  'stopwatch.reset': 'Reiniciar',
  'stopwatch.resetA11y': 'Reiniciar cronómetro',

  'rest.resting': 'Descansando',
  'rest.duration': 'Duración',
  'rest.start': 'Descansar',
  'rest.startA11y': 'Descansar {duration}',
  'rest.skip': 'Saltar descanso',

  'series.newTitle': 'Nuevo ejercicio',
  'series.newHint': 'Elige cuántas series vas a hacer y cuánto descansas entre ellas.',
  'series.sets': 'Series',
  'series.restBetween': 'Descanso entre series',
  'series.start': 'Empezar',
  'series.startA11y': 'Empezar ejercicio de {sets}',
  'series.complete': '¡Ejercicio completado!',
  'series.change': 'Cambiar series o descanso',
  'series.next': 'Siguiente ejercicio',
  'series.nextA11y': 'Siguiente ejercicio: {sets}, descanso {rest}',
  'series.rest': 'Descanso',
  'series.upNext': 'Siguiente: serie {n} de {total}',
  'series.undo': 'Deshacer serie',
  'series.startNow': 'Empezar serie {n} ya',
  'series.startNowA11y': 'Saltar descanso y empezar la serie {n}',
  'series.set': 'Serie',
  'series.of': 'de {total}',
  'series.doHint': 'Haz tu serie y pulsa el botón al terminar.',
  'series.summary': '{sets} · descanso {rest}',
  'series.end': 'Terminar ejercicio',
  'series.finished': 'Terminé la serie',
  'series.finishedA11y': 'Terminé la serie {n}',
  'series.dotsA11y': '{done} de {total} series hechas',
  'series.done_one': '{n} serie hecha',
  'series.done_other': '{n} series hechas',

  'count.sets_one': '{n} serie',
  'count.sets_other': '{n} series',
  'count.min_one': '{n} minuto',
  'count.min_other': '{n} minutos',
  'count.sec_one': '{n} segundo',
  'count.sec_other': '{n} segundos',

  'picker.edit': 'Editar',
  'picker.done': 'Listo',
  'picker.editA11y': 'Editar {title}',
  'picker.doneA11y': 'Terminar de editar {title}',
  'picker.removeA11y': 'Borrar {item}',
  'picker.lockedA11y': '{item}, seleccionado: no se puede borrar',
  'picker.help': 'Toca una opción para borrarla. La seleccionada no se puede borrar.',
  'picker.addRest': 'Añadir un descanso',
  'picker.addSets': 'Añadir un número de series',
  'picker.full': 'Lista llena: caben {max}',

  'sheet.restTitle': 'Nuevo descanso',
  'sheet.setsTitle': 'Nuevo número de series',
  'sheet.restRange': 'Entre {min} segundos y {max} minutos.',
  'sheet.setsRange': 'Entre {min} y {max} series.',
  'sheet.minutes': 'Minutos',
  'sheet.seconds': 'Segundos',
  'sheet.sets': 'Series',
  'sheet.willAdd': 'Se añadirá {value}',
  'sheet.cancel': 'Cancelar',
  'sheet.add': 'Añadir',
  'sheet.close': 'Cerrar',

  'err.emptyRest': 'Escribe los minutos, los segundos o ambos.',
  'err.emptySets': 'Escribe cuántas series.',
  'err.digits': 'Usa solo números enteros, sin signos ni decimales.',
  'err.seconds': 'Los segundos van de 0 a 59.',
  'err.minRest': 'El descanso mínimo es de {s} segundos.',
  'err.maxRest': 'El descanso máximo es de {m} minutos.',
  'err.setsRange': 'Elige entre {min} y {max} series.',
  'err.duplicate': '{value} ya está en la lista.',
  'err.full': 'Caben {max} opciones como máximo. Borra una primero.',
} as const;

export type TKey = keyof typeof es;

const en: Record<TKey, string> = {
  'tabs.stopwatch': 'Stopwatch',
  'tabs.rest': 'Rest',
  'tabs.series': 'Sets',
  'tabs.running': '{label}, running',

  'settings.open': 'Settings',
  'settings.title': 'Settings',
  'settings.back': 'Back',
  'settings.language': 'Language',
  'settings.langSystem': 'System ({current})',
  'settings.vibration': 'Vibration',
  'settings.vibTouch': 'When tapping the controls',
  'settings.vibTouchHint': 'Confirms each tap without looking, also on the lock screen.',
  'settings.vibAlert': 'When a rest ends',
  'settings.vibAlertHint': 'Also when an exercise is complete.',
  'settings.sound': 'Sound',
  'settings.soundAlert': 'When a rest ends',
  'settings.soundHint': "Uses the phone's notification sound and respects silent mode.",
  'settings.androidOnly': 'Available on Android.',

  'stopwatch.start': 'Start',
  'stopwatch.pause': 'Pause',
  'stopwatch.resume': 'Resume',
  'stopwatch.reset': 'Reset',
  'stopwatch.resetA11y': 'Reset stopwatch',

  'rest.resting': 'Resting',
  'rest.duration': 'Duration',
  'rest.start': 'Rest',
  'rest.startA11y': 'Rest for {duration}',
  'rest.skip': 'Skip rest',

  'series.newTitle': 'New exercise',
  'series.newHint': "Choose how many sets you'll do and how long you rest between them.",
  'series.sets': 'Sets',
  'series.restBetween': 'Rest between sets',
  'series.start': 'Start',
  'series.startA11y': 'Start exercise with {sets}',
  'series.complete': 'Exercise complete!',
  'series.change': 'Change sets or rest',
  'series.next': 'Next exercise',
  'series.nextA11y': 'Next exercise: {sets}, rest {rest}',
  'series.rest': 'Rest',
  'series.upNext': 'Up next: set {n} of {total}',
  'series.undo': 'Undo set',
  'series.startNow': 'Start set {n} now',
  'series.startNowA11y': 'Skip rest and start set {n}',
  'series.set': 'Set',
  'series.of': 'of {total}',
  'series.doHint': 'Do your set and tap the button when you finish.',
  'series.summary': '{sets} · rest {rest}',
  'series.end': 'End exercise',
  'series.finished': 'Finished set',
  'series.finishedA11y': 'Finished set {n}',
  'series.dotsA11y': '{done} of {total} sets done',
  'series.done_one': '{n} set done',
  'series.done_other': '{n} sets done',

  'count.sets_one': '{n} set',
  'count.sets_other': '{n} sets',
  'count.min_one': '{n} minute',
  'count.min_other': '{n} minutes',
  'count.sec_one': '{n} second',
  'count.sec_other': '{n} seconds',

  'picker.edit': 'Edit',
  'picker.done': 'Done',
  'picker.editA11y': 'Edit {title}',
  'picker.doneA11y': 'Finish editing {title}',
  'picker.removeA11y': 'Delete {item}',
  'picker.lockedA11y': "{item}, selected: can't be deleted",
  'picker.help': "Tap an option to delete it. The selected one can't be deleted.",
  'picker.addRest': 'Add a rest time',
  'picker.addSets': 'Add a number of sets',
  'picker.full': 'List full: {max} max',

  'sheet.restTitle': 'New rest time',
  'sheet.setsTitle': 'New number of sets',
  'sheet.restRange': 'Between {min} seconds and {max} minutes.',
  'sheet.setsRange': 'Between {min} and {max} sets.',
  'sheet.minutes': 'Minutes',
  'sheet.seconds': 'Seconds',
  'sheet.sets': 'Sets',
  'sheet.willAdd': 'Will add {value}',
  'sheet.cancel': 'Cancel',
  'sheet.add': 'Add',
  'sheet.close': 'Close',

  'err.emptyRest': 'Enter minutes, seconds or both.',
  'err.emptySets': 'Enter how many sets.',
  'err.digits': 'Use whole numbers only, no signs or decimals.',
  'err.seconds': 'Seconds go from 0 to 59.',
  'err.minRest': 'The minimum rest is {s} seconds.',
  'err.maxRest': 'The maximum rest is {m} minutes.',
  'err.setsRange': 'Choose between {min} and {max} sets.',
  'err.duplicate': '{value} is already in the list.',
  'err.full': "There's room for {max} options. Delete one first.",
};

const DICTS: Record<Lang, Record<TKey, string>> = { es, en };

/** Nombre de cada idioma en su propio idioma (no se traduce). */
export const LANGUAGE_NAMES: Record<Lang, string> = { es: 'Español', en: 'English' };

export type Params = Record<string, string | number>;
export type T = (key: TKey, params?: Params) => string;

export function translate(lang: Lang, key: TKey, params?: Params) {
  const text = DICTS[lang][key];
  return params ? text.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`)) : text;
}

/** Para claves con `_one` / `_other`: elige según n y pasa n como parámetro. */
export function plural(t: T, base: 'series.done' | 'count.sets' | 'count.min' | 'count.sec', n: number, params?: Params) {
  return t(`${base}_${n === 1 ? 'one' : 'other'}` as TKey, { n, ...params });
}

/** "1 minuto 30 segundos" / "1 minute 30 seconds" (para lectores de pantalla). */
export function speakDuration(t: T, ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (m) parts.push(plural(t, 'count.min', m));
  if (s || !m) parts.push(plural(t, 'count.sec', s));
  return parts.join(' ');
}
