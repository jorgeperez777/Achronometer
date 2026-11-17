import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from './theme';

/**
 * Esqueleto común de los dos modos: el número grande centrado y los controles abajo, al alcance
 * del pulgar y a la misma altura en ambos modos (cambiar de pestaña no mueve los botones).
 */
export function ModeLayout({ display, controls }: { display: ReactNode; controls: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.display}>{display}</View>
      <View style={styles.controls}>{controls}</View>
    </View>
  );
}

/** Alto del área de controles: el de los botones redondos del cronómetro. */
export const CONTROLS_HEIGHT = 88;

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'stretch' },
  display: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controls: { height: CONTROLS_HEIGHT, justifyContent: 'center', marginBottom: space.sm },
});
