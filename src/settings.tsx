import { useLocales } from 'expo-localization';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import StopwatchControls, { type AppSettings, type LanguageSetting } from '../modules/stopwatch-controls';
import { type Lang, translate, type T } from './i18n';

const DEFAULTS: AppSettings = {
  language: 'system',
  hapticsEnabled: true,
  alertVibration: true,
  alertSound: true,
};

type Ctx = {
  settings: AppSettings;
  update: (patch: Partial<AppSettings>) => void;
  /** Idioma efectivo (resuelto "system" → es/en). */
  lang: Lang;
  /** Idioma del teléfono, ya reducido a es/en. */
  systemLang: Lang;
  t: T;
  /** El nativo guarda los ajustes (Android e iOS). */
  nativeSettings: boolean;
};

const SettingsContext = createContext<Ctx | null>(null);

/**
 * Ajustes del usuario (viven en nativo para que la notificación y los avisos los respeten con la
 * app cerrada) + idioma efectivo y función de traducción.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => StopwatchControls.getSettings?.() ?? DEFAULTS);
  // Reactivo: si el usuario cambia el idioma del teléfono, la app lo sigue.
  const locales = useLocales();
  // Misma regla que el nativo: español si el teléfono está en español; si no, inglés.
  const systemLang: Lang = locales[0]?.languageCode === 'es' ? 'es' : 'en';
  const lang: Lang = settings.language === 'system' ? systemLang : settings.language;

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...patch })); // optimista
    if (StopwatchControls.setSettings) setSettings(await StopwatchControls.setSettings(patch));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      settings,
      update,
      lang,
      systemLang,
      t: (key, params) => translate(lang, key, params),
      nativeSettings: typeof StopwatchControls.setSettings === 'function',
    }),
    [settings, update, lang, systemLang],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings fuera de SettingsProvider');
  return ctx;
}

/** Atajo para los componentes que solo necesitan traducir. */
export function useT() {
  return useSettings().t;
}

export type { LanguageSetting };
