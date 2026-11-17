import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, TOUCH_MIN } from './theme';

export type Mode = 'stopwatch' | 'rest';

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
  /** El cronómetro está en marcha (punto verde en su pestaña). */
  stopwatchActive: boolean;
  /** Hay un descanso en curso (punto azul en su pestaña). */
  restActive: boolean;
};

/** Selector de modo. Un punto de color avisa si el otro modo sigue en marcha. */
export function ModeTabs({ mode, onChange, stopwatchActive, restActive }: Props) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      <Tab label="Cronómetro" selected={mode === 'stopwatch'} dot={stopwatchActive ? colors.start : null} onPress={() => onChange('stopwatch')} />
      <Tab label="Descanso" selected={mode === 'rest'} dot={restActive ? colors.rest : null} onPress={() => onChange('rest')} />
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
      <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{label}</Text>
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
    gap: 6,
  },
  tabSelected: { backgroundColor: colors.surfaceRaised },
  tabText: { color: colors.textMuted, fontSize: 16, fontWeight: '500' },
  tabTextSelected: { color: colors.text, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden' },
  dotSpace: { width: 8, height: 8 },
});
