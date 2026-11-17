import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FixedDigits } from './src/FixedDigits';
import { colors, pressedStyle, space } from './src/theme';
import { useStopwatch } from './src/useStopwatch';
import { WorkoutCard } from './src/WorkoutCard';

function format(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60) % 60;
  const h = Math.floor(totalS / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    main: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`,
    cs: pad(cs),
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Screen />
    </SafeAreaProvider>
  );
}

/**
 * Arriba: el tiempo total del entreno. Abajo, al alcance del pulgar: la tarjeta del ejercicio
 * (series + descanso), que es lo que se toca entre series.
 */
function Screen() {
  const insets = useSafeAreaInsets();
  const { isRunning, elapsed, start, pause, reset, rest, sets } = useStopwatch();
  const { main, cs } = format(elapsed);
  const isIdle = !isRunning && elapsed === 0;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md },
      ]}
    >
      <View style={styles.stopwatch}>
        <Text style={styles.sectionLabel}>Entreno</Text>
        <View style={styles.timeRow}>
          <FixedDigits text={main} style={styles.time} fontSize={TIME_SIZE} />
          <FixedDigits text={`.${cs}`} style={styles.cs} fontSize={CS_SIZE} />
        </View>

        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reiniciar entreno"
            disabled={isIdle}
            onPress={reset}
            style={({ pressed }) => [styles.button, styles.secondary, isIdle && styles.disabled, pressed && pressedStyle]}
          >
            <Text style={styles.secondaryText}>Reiniciar</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRunning ? 'Pausar' : isIdle ? 'Iniciar' : 'Reanudar'}
            onPress={isRunning ? pause : start}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: isRunning ? colors.pauseBg : colors.startBg },
              pressed && pressedStyle,
            ]}
          >
            <Text style={[styles.primaryText, { color: isRunning ? colors.pause : colors.start }]}>
              {isRunning ? 'Pausar' : isIdle ? 'Iniciar' : 'Reanudar'}
            </Text>
          </Pressable>
        </View>
      </View>

      {rest.supported && <WorkoutCard rest={rest} sets={sets} />}
    </View>
  );
}

const TIME_SIZE = 72;
const CS_SIZE = 36;
const BUTTON = 84;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: space.md,
  },
  stopwatch: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.xs },
  time: { color: colors.text, fontSize: TIME_SIZE, fontWeight: '200', fontVariant: ['tabular-nums'] },
  cs: { color: colors.textMuted, fontSize: CS_SIZE, fontWeight: '200', fontVariant: ['tabular-nums'] },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: space.lg,
    paddingHorizontal: space.sm,
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  secondaryText: { color: colors.text, fontSize: 16 },
  primaryText: { fontSize: 16, fontWeight: '600' },
});
