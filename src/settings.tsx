import { useLocales } from 'expo-localization';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import StopwatchControls, { type AppSettings, type LanguageSetting, type ThemeSetting } from '../modules/stopwatch-controls';
import { type Lang, translate, type T } from './i18n';
import { type Colors, darkColors, lightColors } from './theme';

const DEFAULTS: AppSettings = {
  language: 'system',
  theme: 'system',
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
  /** Tema efectivo (resuelto "system" → dark/light) y su paleta. */
  scheme: 'dark' | 'light';
  colors: Colors;
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

  // Tema: con "system" sigue al teléfono (reactivo). Appearance.setColorScheme hace que los
  // controles nativos (teclado, interruptores, hojas) usen también el tema elegido.
  const theme: ThemeSetting = settings.theme ?? 'system';
  useEffect(() => {
    Appearance.setColorScheme(theme === 'system' ? 'unspecified' : theme);
  }, [theme]);
  const osScheme = useColorScheme();
  const scheme: 'dark' | 'light' = theme === 'system' ? (osScheme === 'light' ? 'light' : 'dark') : theme;

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
      scheme,
      colors: scheme === 'light' ? lightColors : darkColors,
    }),
    [settings, update, lang, systemLang, scheme],
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

/** Paleta del tema activo. */
export function useColors() {
  return useSettings().colors;
}

/**
 * Estilos que dependen del tema. `factory` debe estar definida a nivel de módulo (estable):
 * solo se recalcula al cambiar de tema.
 */
export function useThemedStyles<S>(factory: (c: Colors) => S): S {
  const colors = useColors();
  return useMemo(() => factory(colors), [factory, colors]);
}

export type { LanguageSetting, ThemeSetting };
