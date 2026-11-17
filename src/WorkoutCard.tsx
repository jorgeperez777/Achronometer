import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './FixedDigits';
import { colors, pressedStyle, radius, space, TOUCH_MIN } from './theme';
import { REST_PRESETS_MS } from './useStopwatch';

/** m:ss redondeando hacia arriba (una cuenta atrás no debe mostrar 0:00 mientras queda tiempo). */
function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = {
  rest: {
    remaining: number;
    durationMs: number;
    start: () => void;
    cancel: () => void;
    setDuration: (ms: number) => void;
  };
  sets: {
    count: number;
    add: (delta: number) => void;
    reset: () => void;
  };
};

/**
 * Tarjeta del ejercicio actual: serie en curso + descanso. Va abajo, al alcance del pulgar.
 * El número grande es la duración elegida y, durante el descanso, la cuenta atrás en el mismo
 * sitio: la pantalla no cambia de forma al empezar o terminar un descanso.
 */
export function WorkoutCard({ rest, sets }: Props) {
  const resting = rest.remaining > 0;
  const currentSet = sets.count + 1;

  return (
    <View style={styles.card}>
      {/* Serie */}
      <View style={styles.setRow}>
        <View
          style={styles.setInfo}
          accessible
          accessibilityLabel={`Serie ${currentSet}. ${sets.count} completadas`}
        >
          <Text style={styles.sectionLabel}>Serie</Text>
          <Text style={styles.setNumber}>{currentSet}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Nuevo ejercicio: volver a la serie 1"
          disabled={sets.count === 0}
          onPress={sets.reset}
          hitSlop={12}
          style={({ pressed }) => [styles.link, sets.count === 0 && styles.invisible, pressed && pressedStyle]}
        >
          <Text style={styles.linkText}>Nuevo ejercicio</Text>
        </Pressable>

        <View style={styles.stepper}>
          <StepButton label="−" a11y="Quitar una serie" disabled={sets.count === 0} onPress={() => sets.add(-1)} />
          <StepButton label="+" a11y="Añadir una serie" onPress={() => sets.add(1)} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Descanso */}
      <Text style={[styles.sectionLabel, styles.centered, resting && { color: colors.rest }]}>
        {resting ? 'Descansando' : 'Descanso'}
      </Text>
      <View style={styles.countdownBox}>
        <FixedDigits
          text={formatCountdown(resting ? rest.remaining : rest.durationMs)}
          style={[styles.countdown, resting && { color: colors.rest }]}
          fontSize={COUNTDOWN_SIZE}
        />
      </View>

      <View style={[styles.segmented, resting && styles.dimmed]} accessibilityRole="radiogroup">
        {REST_PRESETS_MS.map((ms) => {
          const selected = ms === rest.durationMs;
          return (
            <Pressable
              key={ms}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: resting }}
              accessibilityLabel={`Descanso de ${ms / 1000} segundos`}
              disabled={resting}
              hitSlop={{ top: 4, bottom: 4 }}
              onPress={() => rest.setDuration(ms)}
              style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && pressedStyle]}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {formatCountdown(ms)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={resting ? 'Saltar descanso' : `Serie ${currentSet} hecha. Descansar ${rest.durationMs / 1000} segundos`}
        onPress={resting ? rest.cancel : rest.start}
        style={({ pressed }) => [styles.primary, resting && styles.primaryResting, pressed && pressedStyle]}
      >
        <Text style={styles.primaryText}>{resting ? 'Saltar descanso' : 'Serie hecha · Descansar'}</Text>
      </Pressable>
    </View>
  );
}

function StepButton({ label, a11y, disabled, onPress }: { label: string; a11y: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.step, disabled && styles.dimmed, pressed && pressedStyle]}
    >
      <Text style={styles.stepText}>{label}</Text>
    </Pressable>
  );
}

const COUNTDOWN_SIZE = 64;

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.md,
    paddingTop: space.md,
  },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  setInfo: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  setNumber: { color: colors.text, fontSize: 28, fontWeight: '600', fontVariant: ['tabular-nums'] },
  link: { flex: 1, paddingVertical: space.xs },
  linkText: { color: colors.rest, fontSize: 15 },
  invisible: { opacity: 0 },
  stepper: { flexDirection: 'row', gap: space.sm },
  step: {
    width: TOUCH_MIN,
    height: TOUCH_MIN,
    borderRadius: TOUCH_MIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  stepText: { color: colors.text, fontSize: 24, lineHeight: 28 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3A3A3C', marginVertical: space.md },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  centered: { textAlign: 'center' },
  countdownBox: { alignItems: 'center', marginTop: space.xs, marginBottom: space.md },
  countdown: { color: colors.text, fontSize: COUNTDOWN_SIZE, fontWeight: '300' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: space.xs,
    gap: space.xs,
    marginBottom: space.md,
  },
  segment: {
    flex: 1,
    height: 40,
    borderRadius: radius.md - space.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { backgroundColor: colors.surfaceRaised },
  segmentText: { color: colors.textMuted, fontSize: 16, fontVariant: ['tabular-nums'] },
  segmentTextSelected: { color: colors.text, fontWeight: '600' },
  dimmed: { opacity: 0.35 },
  primary: {
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rest,
  },
  primaryResting: { backgroundColor: colors.surfaceRaised },
  primaryText: { color: colors.text, fontSize: 18, fontWeight: '600' },
});
