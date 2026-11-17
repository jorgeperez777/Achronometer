import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ModeLayout } from './ModeLayout';
import { PresetPicker } from './PresetPicker';
import { plural, speakDuration } from './i18n';
import { formatDuration } from './presets';
import { useT } from './settings';
import { colors, pressedStyle, radius, space } from './theme';

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
  setsOptions: number[];
  setSetsOptions: (options: number[]) => void;
  restOptions: number[];
  setRestOptions: (options: number[]) => void;
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
  const t = useT();
  const setsLabel = plural(t, 'count.sets', p.target);
  const resting = p.restRemaining > 0;
  const completed = p.active && p.done >= p.target;
  const next = p.done + 1;

  if (!p.active) {
    return (
      <ModeLayout
        display={
          <>
            <Text style={styles.title}>{t('series.newTitle')}</Text>
            <Text style={styles.hint}>{t('series.newHint')}</Text>

            <View style={styles.field}>
              <PresetPicker
                title={t('series.sets')}
                kind="sets"
                options={p.setsOptions}
                value={p.target}
                onSelect={p.setTarget}
                onChangeOptions={p.setSetsOptions}
                format={(n) => String(n)}
                speak={(n) => plural(t, 'count.sets', n)}
              />
            </View>
            <View style={styles.field}>
              <PresetPicker
                title={t('series.restBetween')}
                kind="rest"
                options={p.restOptions}
                value={p.restDurationMs}
                onSelect={p.setRestDuration}
                onChangeOptions={p.setRestOptions}
                format={formatDuration}
                speak={(ms) => speakDuration(t, ms)}
              />
            </View>
          </>
        }
        controls={<Primary label={t('series.start')} a11y={t('series.startA11y', { sets: setsLabel })} onPress={p.start} />}
      />
    );
  }

  if (completed) {
    return (
      <ModeLayout
        display={
          <>
            <Dots done={p.done} target={p.target} complete a11y={t('series.dotsA11y', { done: p.done, total: p.target })} />
            <Text style={[styles.title, styles.completeText]}>{t('series.complete')}</Text>
            <Text style={styles.hint}>{plural(t, 'series.done', p.target)}</Text>
            <Links>
              <Link label={t('series.change')} onPress={p.end} />
            </Links>
          </>
        }
        controls={
          <Primary
            label={t('series.next')}
            a11y={t('series.nextA11y', { sets: setsLabel, rest: speakDuration(t, p.restDurationMs) })}
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
            <Dots done={p.done} target={p.target} a11y={t('series.dotsA11y', { done: p.done, total: p.target })} />
            <Text style={[styles.label, { color: colors.rest }]}>{t('series.rest')}</Text>
            <Text style={[styles.huge, { color: colors.rest }]}>{formatCountdown(p.restRemaining)}</Text>
            <Text style={styles.hint}>{t('series.upNext', { n: next, total: p.target })}</Text>
            <Links>
              <Link label={t('series.undo')} onPress={p.undo} />
            </Links>
          </>
        }
        controls={
          <Primary
            label={t('series.startNow', { n: next })}
            a11y={t('series.startNowA11y', { n: next })}
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
          <Dots done={p.done} target={p.target} a11y={t('series.dotsA11y', { done: p.done, total: p.target })} />
          <Text style={styles.label}>{t('series.set')}</Text>
          <Text style={styles.huge}>{next}</Text>
          <Text style={styles.sub}>{t('series.of', { total: p.target })}</Text>
          <Text style={styles.hint}>{t('series.doHint')}</Text>
          <Text style={styles.summary}>
            {t('series.summary', { sets: setsLabel, rest: formatDuration(p.restDurationMs) })}
          </Text>
          <Links>
            {p.done > 0 && <Link label={t('series.undo')} onPress={p.undo} />}
            <Link label={t('series.end')} onPress={p.end} />
          </Links>
        </>
      }
      controls={<Primary label={t('series.finished')} a11y={t('series.finishedA11y', { n: next })} onPress={p.complete} />}
    />
  );
}

function Dots({ done, target, complete, a11y }: { done: number; target: number; complete?: boolean; a11y: string }) {
  return (
    <View style={styles.dots} accessible accessibilityLabel={a11y}>
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
  field: { alignSelf: 'stretch', marginTop: space.xl },
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
