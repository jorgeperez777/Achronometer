import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModeTabs } from './src/ModeTabs';
import { RestView } from './src/RestView';
import { SeriesView } from './src/SeriesView';
import { StopwatchView } from './src/StopwatchView';
import { colors, space } from './src/theme';
import { useStopwatch } from './src/useStopwatch';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Screen />
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
  const { isRunning, elapsed, start, pause, reset, rest, series, mode, setMode } = useStopwatch();
  const seriesInProgress = series.done > 0 && series.done < series.target;

  const stopwatch = <StopwatchView isRunning={isRunning} elapsed={elapsed} start={start} pause={pause} reset={reset} />;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
      ]}
    >
      {rest.supported ? (
        <>
          <ModeTabs
            mode={mode}
            onChange={setMode}
            dots={{
              stopwatch: isRunning ? colors.start : null,
              rest: rest.remaining > 0 ? colors.rest : null,
              series: seriesInProgress ? colors.text : null,
            }}
          />
          {mode === 'stopwatch' && stopwatch}
          {mode === 'rest' && <RestView {...rest} />}
          {mode === 'series' && (
            <SeriesView
              {...series}
              restDurationMs={rest.durationMs}
              skipRest={rest.cancel}
              setTarget={series.setTarget}
            />
          )}
        </>
      ) : (
        // iOS (todavía sin descanso): solo el cronómetro.
        stopwatch
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
  },
});
