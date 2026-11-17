import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './src/FixedDigits';
import { RestPanel } from './src/RestPanel';
import { useStopwatch } from './src/useStopwatch';


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
  const { isRunning, elapsed, start, pause, reset, rest } = useStopwatch();
  const { main, cs } = format(elapsed);
  const isIdle = !isRunning && elapsed === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.timeRow}>
        <FixedDigits text={main} style={styles.time} fontSize={styles.time.fontSize} />
        <FixedDigits text={`.${cs}`} style={styles.cs} fontSize={styles.cs.fontSize} />
      </View>

      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reiniciar"
          disabled={isIdle}
          onPress={reset}
          style={({ pressed }) => [
            styles.button,
            styles.secondary,
            isIdle && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryText}>Reiniciar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pausar' : 'Iniciar'}
          onPress={isRunning ? pause : start}
          style={({ pressed }) => [
            styles.button,
            isRunning ? styles.pause : styles.start,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.primaryText, { color: isRunning ? '#FF9F0A' : '#30D158' }]}>
            {isRunning ? 'Pausar' : isIdle ? 'Iniciar' : 'Reanudar'}
          </Text>
        </Pressable>
      </View>

      {rest.supported && <RestPanel {...rest} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  status: {
    color: '#8E8E93',
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: {
    color: '#fff',
    fontSize: 80,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  cs: {
    color: '#8E8E93',
    fontSize: 40,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 64,
  },
  button: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: '#333336' },
  start: { backgroundColor: '#0A2A12' },
  pause: { backgroundColor: '#332005' },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  secondaryText: { color: '#fff', fontSize: 17 },
  primaryText: { fontSize: 17, fontWeight: '600' },
  hint: {
    color: '#636366',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 48,
  },
});
