import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, pressedStyle, radius, space } from './theme';

type Props<T> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: (value: T) => string;
  a11yLabel: (value: T) => string;
  /** Deshabilita una opción concreta. */
  isDisabled?: (value: T) => boolean;
  /** Deshabilita todo el control. */
  disabled?: boolean;
};

/** Selector segmentado (radio group) con celdas de 40 dp y área táctil de 48 dp. */
export function Segmented<T extends string | number>({ options, value, onChange, label, a11yLabel, isDisabled, disabled }: Props<T>) {
  return (
    <View style={[styles.segmented, disabled && styles.dimmed]} accessibilityRole="radiogroup">
      {options.map((o) => {
        const selected = o === value;
        const off = disabled || (isDisabled?.(o) ?? false);
        return (
          <Pressable
            key={String(o)}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: off }}
            accessibilityLabel={a11yLabel(o)}
            disabled={off}
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => onChange(o)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              off && !disabled && styles.dimmed,
              pressed && pressedStyle,
            ]}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{label(o)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
  text: { color: colors.textMuted, fontSize: 16, fontVariant: ['tabular-nums'] },
  textSelected: { color: colors.text, fontWeight: '600' },
  dimmed: { opacity: 0.35 },
});
