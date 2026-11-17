import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './FixedDigits';
import { ModeLayout } from './ModeLayout';
import { colors, pressedStyle, radius, space } from './theme';
import { REST_PRESETS_MS } from './useStopwatch';

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

/**
 * Modo descanso: la duración elegida, que se convierte en la cuenta atrás en el mismo sitio,
 * el selector de duración y un solo botón.
 */
export function RestView({ remaining, durationMs, start, cancel, setDuration }: Props) {
  const resting = remaining > 0;

  return (
    <ModeLayout
      display={
        <>
          {/* El hueco de la etiqueta se reserva siempre para que el número no salte. */}
          <Text style={[styles.label, !resting && styles.invisible]}>Descansando</Text>
          <FixedDigits
            text={formatCountdown(resting ? remaining : durationMs)}
            style={[styles.countdown, resting && { color: colors.rest }]}
            fontSize={COUNTDOWN_SIZE}
          />

          <View style={[styles.segmented, resting && styles.dimmed]} accessibilityRole="radiogroup">
            {REST_PRESETS_MS.map((ms) => {
              const selected = ms === durationMs;
              return (
                <Pressable
                  key={ms}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: resting }}
                  accessibilityLabel={`${ms / 1000} segundos`}
                  disabled={resting}
                  hitSlop={{ top: 4, bottom: 4 }}
                  onPress={() => setDuration(ms)}
                  style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && pressedStyle]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{formatCountdown(ms)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      }
      controls={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resting ? 'Saltar descanso' : `Descansar ${durationMs / 1000} segundos`}
          onPress={resting ? cancel : start}
          style={({ pressed }) => [styles.primary, resting && styles.primaryResting, pressed && pressedStyle]}
        >
          <Text style={styles.primaryText}>{resting ? 'Saltar descanso' : 'Descansar'}</Text>
        </Pressable>
      }
    />
  );
}

const COUNTDOWN_SIZE = 96;

const styles = StyleSheet.create({
  label: {
    color: colors.rest,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  invisible: { opacity: 0 },
  countdown: { color: colors.text, fontSize: COUNTDOWN_SIZE, fontWeight: '200' },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.xs,
    gap: space.xs,
    marginTop: space.xl,
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
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.rest,
  },
  primaryResting: { backgroundColor: colors.surfaceRaised },
  primaryText: { color: colors.text, fontSize: 18, fontWeight: '600' },
});
