import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AppMode } from '../modules/stopwatch-controls';
import { colors, radius, space, TOUCH_MIN } from './theme';

export type Mode = AppMode;

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  /** Punto de color por pestaña si ese modo sigue en marcha (null = nada). */
  dots: Record<Mode, string | null>;
};

const TABS: { mode: Mode; label: string }[] = [
  { mode: 'stopwatch', label: 'Cronómetro' },
  { mode: 'rest', label: 'Descanso' },
  { mode: 'series', label: 'Series' },
];

/** Selector de modo. Un punto de color avisa si otro modo sigue en marcha. */
export function ModeTabs({ mode, onChange, dots }: Props) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {TABS.map((t) => (
        <Tab key={t.mode} label={t.label} selected={mode === t.mode} dot={dots[t.mode]} onPress={() => onChange(t.mode)} />
      ))}
    </View>
  );
}

function Tab({ label, selected, dot, onPress }: { label: string; selected: boolean; dot: string | null; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={dot ? `${label}, en marcha` : label}
      onPress={onPress}
      style={[styles.tab, selected && styles.tabSelected]}
    >
      <Text style={[styles.tabText, selected && styles.tabTextSelected]} numberOfLines={1}>
        {label}
      </Text>
      {/* Reserva siempre el hueco del punto para que el texto no se mueva. */}
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : <View style={styles.dotSpace} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.xs,
    gap: space.xs,
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN - space.xs,
    borderRadius: radius.md - space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  tabSelected: { backgroundColor: colors.surfaceRaised },
  tabText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  tabTextSelected: { color: colors.text, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 3.5, overflow: 'hidden' },
  dotSpace: { width: 7, height: 7 },
});
