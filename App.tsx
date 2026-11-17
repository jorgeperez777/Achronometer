import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { type Mode, ModeTabs } from './src/ModeTabs';
import { RestView } from './src/RestView';
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
 * Dos modos, una cosa en pantalla cada uno: Cronómetro y Descanso. Ambos siguen funcionando
 * en segundo plano (y desde la notificación) aunque se esté viendo el otro.
 */
function Screen() {
  const insets = useSafeAreaInsets();
  const { isRunning, elapsed, start, pause, reset, rest } = useStopwatch();
  // Si al abrir la app hay un descanso en curso, se muestra ese modo.
  const [mode, setMode] = useState<Mode>(() => (rest.remaining > 0 ? 'rest' : 'stopwatch'));

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
            stopwatchActive={isRunning}
            restActive={rest.remaining > 0}
          />
          {mode === 'stopwatch' ? stopwatch : <RestView {...rest} />}
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
