import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './FixedDigits';
import { REST_PRESETS_MS } from './useStopwatch';

const BLUE = '#0A84FF';

/** m:ss redondeando hacia arriba (una cuenta atrás no debe mostrar 0:00 mientras queda tiempo). */
function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = {
  remaining: number;
  durationMs: number;
  start: () => void;
  cancel: () => void;
  setDuration: (ms: number) => void;
};

/** Temporizador de descanso entre series: elegir duración, iniciar y ver la cuenta atrás. */
export function RestPanel({ remaining, durationMs, start, cancel, setDuration }: Props) {
  if (remaining > 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.label}>Descanso</Text>
        <FixedDigits text={formatCountdown(remaining)} style={styles.countdown} fontSize={styles.countdown.fontSize} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar descanso"
          onPress={cancel}
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.presets}>
        {REST_PRESETS_MS.map((ms) => {
          const selected = ms === durationMs;
          return (
            <Pressable
              key={ms}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${ms / 1000} segundos`}
              onPress={() => setDuration(ms)}
              style={({ pressed }) => [styles.preset, selected && styles.presetSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                {formatCountdown(ms)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Iniciar descanso de ${durationMs / 1000} segundos`}
        onPress={start}
        style={({ pressed }) => [styles.startRest, pressed && styles.pressed]}
      >
        <Text style={styles.startRestText}>Descanso · {formatCountdown(durationMs)}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignSelf: 'stretch', alignItems: 'center', marginTop: 24, minHeight: 132 },
  label: {
    color: BLUE,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  countdown: { color: BLUE, fontSize: 56, fontWeight: '300' },
  cancel: {
    marginTop: 8,
    paddingHorizontal: 28,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  cancelText: { color: '#fff', fontSize: 16 },
  presets: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  preset: {
    minWidth: 64,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#1C1C1E',
  },
  presetSelected: { backgroundColor: '#0A84FF26', borderColor: BLUE },
  presetText: { color: '#8E8E93', fontSize: 16, fontVariant: ['tabular-nums'] },
  presetTextSelected: { color: BLUE, fontWeight: '600' },
  startRest: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A2440',
  },
  startRestText: { color: BLUE, fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.7 },
});
