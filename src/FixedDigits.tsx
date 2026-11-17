import { StyleSheet, Text, TextStyle, useWindowDimensions, View } from 'react-native';

// Ancho de cada celda de dígito, en "em" (proporción del fontSize).
const DIGIT_EM = 0.62;

/**
 * Pinta cada dígito en una celda de ancho fijo para que el número no "tiemble".
 * `fontVariant: ['tabular-nums']` no basta: algunas fuentes de sistema (p. ej. la de Motorola)
 * no tienen dígitos tabulares y lo ignoran, así que el ancho cambiaba con cada dígito y la fila,
 * centrada, se desplazaba.
 */
export function FixedDigits({ text, style, fontSize }: { text: string; style: TextStyle; fontSize: number }) {
  const { fontScale } = useWindowDimensions();
  const width = fontSize * DIGIT_EM * fontScale;
  return (
    <View style={styles.digits} accessible accessibilityLabel={text}>
      {text.split('').map((ch, i) => (
        <Text
          key={i}
          style={[style, /\d/.test(ch) && { width, textAlign: 'center' }]}
          importantForAccessibility="no"
        >
          {ch}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  digits: { flexDirection: 'row', alignItems: 'baseline' },
});
