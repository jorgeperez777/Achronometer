import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModeLayout } from './ModeLayout';
import { Segmented } from './Segmented';
import { colors, pressedStyle, radius, space } from './theme';
import { REST_PRESETS_MS, SETS_TARGET_OPTIONS } from './useStopwatch';

function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

type Props = {
  active: boolean;
  done: number;
  target: number;
  restRemaining: number;
  restDurationMs: number;
  start: () => void;
  complete: () => void;
  undo: () => void;
  end: () => void;
  skipRest: () => void;
  setTarget: (t: number) => void;
  setRestDuration: (ms: number) => void;
};

/**
 * Modo series como flujo guiado, con un solo botón principal por paso:
 *   1. Configurar (series + descanso)  → "Empezar"
 *   2. En serie                        → "Terminé la serie"   (arranca el descanso)
 *   3. Descansando                     → "Empezar serie N ya" (salta el descanso)
 *   4. Completado                      → "Siguiente ejercicio"
 * El botón azul de la notificación hace lo mismo que el botón principal (✓ / ✕ / ⏭).
 */
export function SeriesView(p: Props) {
  const resting = p.restRemaining > 0;
  const completed = p.active && p.done >= p.target;
  const next = p.done + 1;

  if (!p.active) {
    return (
      <ModeLayout
        display={
          <>
            <Text style={styles.title}>Nuevo ejercicio</Text>
            <Text style={styles.hint}>Elige cuántas series vas a hacer y cuánto descansas entre ellas.</Text>

            <Text style={[styles.label, styles.fieldLabel]}>Series</Text>
            <Segmented
              options={SETS_TARGET_OPTIONS}
              value={p.target}
              onChange={p.setTarget}
              label={(t) => String(t)}
              a11yLabel={(t) => `${t} series`}
            />

            <Text style={[styles.label, styles.fieldLabel]}>Descanso entre series</Text>
            <Segmented
              options={REST_PRESETS_MS}
              value={p.restDurationMs}
              onChange={p.setRestDuration}
              label={formatCountdown}
              a11yLabel={(ms) => `${ms / 1000} segundos`}
            />
          </>
        }
        controls={<Primary label="Empezar" a11y={`Empezar ejercicio de ${p.target} series`} onPress={p.start} />}
      />
    );
  }

  if (completed) {
    return (
      <ModeLayout
        display={
          <>
            <Dots done={p.done} target={p.target} complete />
            <Text style={[styles.title, styles.completeText]}>¡Ejercicio completado!</Text>
            <Text style={styles.hint}>{p.target} series hechas</Text>
            <Links>
              <Link label="Cambiar series o descanso" onPress={p.end} />
            </Links>
          </>
        }
        controls={
          <Primary
            label="Siguiente ejercicio"
            a11y={`Siguiente ejercicio: ${p.target} series, descanso ${formatCountdown(p.restDurationMs)}`}
            onPress={p.start}
            bg={colors.startBg}
            fg={colors.start}
          />
        }
      />
    );
  }

  if (resting) {
    return (
      <ModeLayout
        display={
          <>
            <Dots done={p.done} target={p.target} />
            <Text style={[styles.label, { color: colors.rest }]}>Descanso</Text>
            <Text style={[styles.huge, { color: colors.rest }]}>{formatCountdown(p.restRemaining)}</Text>
            <Text style={styles.hint}>
              Siguiente: serie {next} de {p.target}
            </Text>
            <Links>
              <Link label="Deshacer serie" onPress={p.undo} />
            </Links>
          </>
        }
        controls={
          <Primary
            label={`Empezar serie ${next} ya`}
            a11y={`Saltar descanso y empezar la serie ${next}`}
            onPress={p.skipRest}
            bg={colors.surfaceRaised}
          />
        }
      />
    );
  }

  // En serie.
  return (
    <ModeLayout
      display={
        <>
          <Dots done={p.done} target={p.target} />
          <Text style={styles.label}>Serie</Text>
          <Text style={styles.huge}>{next}</Text>
          <Text style={styles.sub}>de {p.target}</Text>
          <Text style={styles.hint}>Haz tu serie y pulsa el botón al terminar.</Text>
          <Text style={styles.summary}>
            {p.target} series · descanso {formatCountdown(p.restDurationMs)}
          </Text>
          <Links>
            {p.done > 0 && <Link label="Deshacer serie" onPress={p.undo} />}
            <Link label="Terminar ejercicio" onPress={p.end} />
          </Links>
        </>
      }
      controls={<Primary label="Terminé la serie" a11y={`Terminé la serie ${next}`} onPress={p.complete} />}
    />
  );
}

function Dots({ done, target, complete }: { done: number; target: number; complete?: boolean }) {
  return (
    <View style={styles.dots} accessible accessibilityLabel={`${done} de ${target} series hechas`}>
      {Array.from({ length: target }, (_, i) => (
        <View key={i} style={[styles.dot, i < done && (complete ? styles.dotComplete : styles.dotDone)]} />
      ))}
    </View>
  );
}

function Primary({ label, a11y, onPress, bg = colors.rest, fg = colors.text }: { label: string; a11y: string; onPress: () => void; bg?: string; fg?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { backgroundColor: bg }, pressed && pressedStyle]}
    >
      <Text style={[styles.primaryText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

function Links({ children }: { children: ReactNode }) {
  return <View style={styles.links}>{children}</View>;
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.link, pressed && pressedStyle]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const DOT = 14;

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '600', textAlign: 'center' },
  completeText: { color: colors.start },
  hint: { color: colors.textMuted, fontSize: 16, textAlign: 'center', marginTop: space.sm, paddingHorizontal: space.lg },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fieldLabel: { alignSelf: 'flex-start', marginTop: space.xl, marginBottom: space.sm },
  huge: { color: colors.text, fontSize: 104, fontWeight: '200', lineHeight: 116, fontVariant: ['tabular-nums'] },
  sub: { color: colors.textMuted, fontSize: 18 },
  summary: { color: colors.textMuted, fontSize: 14, marginTop: space.lg, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 10, marginBottom: space.lg },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, borderColor: '#48484A' },
  dotDone: { backgroundColor: colors.rest, borderColor: colors.rest },
  dotComplete: { backgroundColor: colors.start, borderColor: colors.start },
  links: { flexDirection: 'row', gap: space.lg, marginTop: space.lg },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: space.xs },
  linkText: { color: colors.rest, fontSize: 15 },
  primary: { height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 18, fontWeight: '600' },
});
