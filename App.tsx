import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModeTabs } from './src/ModeTabs';
import { RestView } from './src/RestView';
import { SeriesView } from './src/SeriesView';
import { SettingsProvider, useColors, useT, useThemedStyles } from './src/settings';
import { SettingsView } from './src/SettingsView';
import { StopwatchView } from './src/StopwatchView';
import { type Colors, pressedStyle, space, TOUCH_MIN } from './src/theme';
import { useStopwatch } from './src/useStopwatch';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SettingsProvider>
        <Screen />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

/**
 * Tres modos, una cosa en pantalla cada uno: Cronómetro, Descanso y Series. Siguen funcionando
 * en segundo plano (y desde la notificación) aunque se esté viendo otro. La pestaña abierta se
 * guarda en nativo y decide qué hace el botón ⏳/✓ de la notificación.
 */
function Screen() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const [showSettings, setShowSettings] = useState(false);
  const { isRunning, elapsed, start, pause, reset, rest, series, mode, setMode } = useStopwatch();
  const seriesInProgress = series.active && series.done < series.target;

  // Botón "atrás" de Android: cierra Ajustes en lugar de salir de la app.
  useEffect(() => {
    if (!showSettings) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowSettings(false);
      return true;
    });
    return () => sub.remove();
  }, [showSettings]);

  const gear = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('settings.open')}
      onPress={() => setShowSettings(true)}
      style={({ pressed }) => [styles.gear, pressed && pressedStyle]}
    >
      <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
    </Pressable>
  );

  const stopwatch = <StopwatchView isRunning={isRunning} elapsed={elapsed} start={start} pause={pause} reset={reset} />;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
      ]}
    >
      {showSettings ? (
        <SettingsView onClose={() => setShowSettings(false)} />
      ) : rest.supported ? (
        <>
          <View style={styles.header}>
            <View style={styles.tabs}>
              <ModeTabs
                mode={mode}
                onChange={setMode}
                dots={{
                  stopwatch: isRunning ? colors.start : null,
                  rest: rest.remaining > 0 ? colors.rest : null,
                  series: seriesInProgress ? colors.text : null,
                }}
              />
            </View>
            {gear}
          </View>
          {mode === 'stopwatch' && stopwatch}
          {mode === 'rest' && <RestView {...rest} />}
          {mode === 'series' && (
            <SeriesView
              {...series}
              setsOptions={series.options}
              setSetsOptions={series.setOptions}
              restDurationMs={rest.durationMs}
              setRestDuration={rest.setDuration}
              restOptions={rest.options}
              setRestOptions={rest.setOptions}
              skipRest={rest.cancel}
            />
          )}
        </>
      ) : (
        // Módulo nativo sin descanso (build antiguo): solo el cronómetro.
        <>
          <View style={[styles.header, styles.headerEnd]}>{gear}</View>
          {stopwatch}
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  headerEnd: { justifyContent: 'flex-end' },
  tabs: { flex: 1 },
  gear: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
  },
});
