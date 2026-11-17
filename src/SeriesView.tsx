import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CONTROLS_HEIGHT, ModeLayout } from './ModeLayout';
import { colors, pressedStyle, radius, space } from './theme';
import { SETS_TARGET_OPTIONS } from './useStopwatch';

function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = {
  done: number;
  target: number;
  restRemaining: number;
  restDurationMs: number;
  complete: () => void;
  undo: () => void;
  next: () => void;
  skipRest: () => void;
  setTarget: (t: number) => void;
};

/**
 * Modo series: en qué serie vas de cuántas. "Serie hecha" arranca el descanso (con la duración
 * elegida en la pestaña Descanso); tras la última avisa de que el ejercicio está completo.
 * Lo mismo se hace desde la notificación con el botón ✓ mientras esta pestaña esté abierta.
 */
export function SeriesView({ done, target, restRemaining, restDurationMs, complete, undo, next, skipRest, setTarget }: Props) {
  const resting = restRemaining > 0;
  const completed = done >= target;
  const current = Math.min(done + 1, target);

  const primary = resting
    ? { label: 'Saltar descanso', a11y: 'Saltar descanso', onPress: skipRest, bg: colors.surfaceRaised, fg: colors.text }
    : completed
      ? { label: 'Siguiente', a11y: 'Siguiente ejercicio', onPress: next, bg: colors.startBg, fg: colors.start }
      : { label: 'Serie hecha', a11y: `Serie ${current} hecha`, onPress: complete, bg: colors.rest, fg: colors.text };

  return (
    <ModeLayout
      display={
        <>
          <View
            style={styles.dots}
            accessible
            accessibilityLabel={`${done} de ${target} series hechas`}
          >
            {Array.from({ length: target }, (_, i) => (
              <View key={i} style={[styles.dot, i < done && (completed ? styles.dotComplete : styles.dotDone)]} />
            ))}
          </View>

          {completed ? (
            <>
              <Text style={[styles.big, styles.completeText]}>Completado</Text>
              <Text style={styles.sub}>{target} de {target} series</Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>Serie</Text>
              <Text style={styles.huge}>{current}</Text>
              <Text style={styles.sub}>de {target}</Text>
            </>
          )}

          {/* Línea reservada: cuenta atrás si se descansa; si no, qué descanso viene después. */}
          <Text style={[styles.restLine, resting && styles.restLineActive]}>
            {resting
              ? `Descanso ${formatCountdown(restRemaining)}`
              : completed
                ? ' '
                : `Descanso tras la serie: ${formatCountdown(restDurationMs)}`}
          </Text>

          <Text style={[styles.label, styles.targetLabel]}>Objetivo</Text>
          <View style={styles.segmented} accessibilityRole="radiogroup">
            {SETS_TARGET_OPTIONS.map((t) => {
              const selected = t === target;
              const disabled = t < done; // no se puede bajar de las ya hechas
              return (
                <Pressable
                  key={t}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled }}
                  accessibilityLabel={`${t} series`}
                  disabled={disabled}
                  hitSlop={{ top: 4, bottom: 4 }}
                  onPress={() => setTarget(t)}
                  style={({ pressed }) => [
                    styles.segment,
                    selected && styles.segmentSelected,
                    disabled && styles.dimmed,
                    pressed && pressedStyle,
                  ]}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      }
      controls={
        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Deshacer la última serie"
            disabled={done === 0}
            onPress={undo}
            style={({ pressed }) => [styles.button, styles.secondary, done === 0 && styles.disabled, pressed && pressedStyle]}
          >
            <Text style={styles.secondaryText}>Deshacer</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primary.a11y}
            onPress={primary.onPress}
            style={({ pressed }) => [styles.button, { backgroundColor: primary.bg }, pressed && pressedStyle]}
          >
            <Text style={[styles.primaryText, { color: primary.fg }]} numberOfLines={2}>
              {primary.label}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

const DOT = 14;

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 10, marginBottom: space.lg },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: '#48484A' },
  dotDone: { backgroundColor: colors.rest, borderColor: colors.rest },
  dotComplete: { backgroundColor: colors.start, borderColor: colors.start },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  huge: { color: colors.text, fontSize: 112, fontWeight: '200', lineHeight: 124, fontVariant: ['tabular-nums'] },
  big: { fontSize: 44, fontWeight: '300', marginTop: space.lg },
  completeText: { color: colors.start },
  sub: { color: colors.textMuted, fontSize: 18 },
  restLine: { color: colors.textMuted, fontSize: 16, marginTop: space.md, fontVariant: ['tabular-nums'] },
  restLineActive: { color: colors.rest, fontSize: 20, fontWeight: '600' },
  targetLabel: { marginTop: space.xl, marginBottom: space.sm },
  segmented: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.xs,
    gap: space.xs,
  },
  segment: { flex: 1, height: 40, borderRadius: radius.md - space.xs, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.surfaceRaised },
  segmentText: { color: colors.textMuted, fontSize: 16, fontVariant: ['tabular-nums'] },
  segmentTextSelected: { color: colors.text, fontWeight: '600' },
  dimmed: { opacity: 0.35 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.sm },
  button: {
    width: CONTROLS_HEIGHT,
    height: CONTROLS_HEIGHT,
    borderRadius: CONTROLS_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xs,
  },
  secondary: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  secondaryText: { color: colors.text, fontSize: 16 },
  primaryText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
