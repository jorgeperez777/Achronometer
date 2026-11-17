import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  count: number;
  add: (delta: number) => void;
  reset: () => void;
};

/**
 * Series completadas del ejercicio actual. Se suman solas al iniciar un descanso
 * (también desde la pantalla de bloqueo); aquí solo se corrigen a mano.
 */
export function SetsCounter({ count, add, reset }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <RoundButton label="−" a11y="Quitar una serie" disabled={count === 0} onPress={() => add(-1)} />
        <View style={styles.center} accessible accessibilityLabel={`${count} series completadas`}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.label}>{count === 1 ? 'serie' : 'series'}</Text>
        </View>
        <RoundButton label="+" a11y="Añadir una serie" onPress={() => add(1)} />
      </View>

      {/* Ocupa siempre su espacio para que el resto de la pantalla no salte. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo ejercicio: poner las series a cero"
        disabled={count === 0}
        onPress={reset}
        hitSlop={8}
        style={({ pressed }) => [styles.newExercise, count === 0 && styles.hidden, pressed && styles.pressed]}
      >
        <Text style={styles.newExerciseText}>Nuevo ejercicio</Text>
      </Pressable>
    </View>
  );
}

function RoundButton({
  label,
  a11y,
  disabled,
  onPress,
}: {
  label: string;
  a11y: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.round, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text style={styles.roundText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  center: { alignItems: 'center', minWidth: 72 },
  count: { color: '#fff', fontSize: 40, fontWeight: '300', fontVariant: ['tabular-nums'] },
  label: { color: '#8E8E93', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  roundText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  newExercise: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
  newExerciseText: { color: '#0A84FF', fontSize: 15 },
  hidden: { opacity: 0 },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
});
