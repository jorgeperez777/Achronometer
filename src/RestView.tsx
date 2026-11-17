import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './FixedDigits';
import { ModeLayout } from './ModeLayout';
import { PresetPicker } from './PresetPicker';
import { speakDuration } from './i18n';
import { formatDuration } from './presets';
import { useT } from './settings';
import { colors, pressedStyle, radius, space } from './theme';

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
  options: number[];
  setOptions: (options: number[]) => void;
};

/**
 * Modo descanso: la duración elegida, que se convierte en la cuenta atrás en el mismo sitio,
 * el selector de duración y un solo botón.
 */
export function RestView({ remaining, durationMs, start, cancel, setDuration, options, setOptions }: Props) {
  const t = useT();
  const resting = remaining > 0;

  return (
    <ModeLayout
      display={
        <>
          {/* El hueco de la etiqueta se reserva siempre para que el número no salte. */}
          <Text style={[styles.label, !resting && styles.invisible]}>{t('rest.resting')}</Text>
          <FixedDigits
            text={formatCountdown(resting ? remaining : durationMs)}
            style={[styles.countdown, resting && { color: colors.rest }]}
            fontSize={COUNTDOWN_SIZE}
          />

          <View style={styles.selector}>
            <PresetPicker
              title={t('rest.duration')}
              kind="rest"
              options={options}
              value={durationMs}
              onSelect={setDuration}
              onChangeOptions={setOptions}
              format={formatDuration}
              speak={(ms) => speakDuration(t, ms)}
              disabled={resting}
            />
          </View>
        </>
      }
      controls={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={resting ? t('rest.skip') : t('rest.startA11y', { duration: speakDuration(t, durationMs) })}
          onPress={resting ? cancel : start}
          style={({ pressed }) => [styles.primary, resting && styles.primaryResting, pressed && pressedStyle]}
        >
          <Text style={styles.primaryText}>{resting ? t('rest.skip') : t('rest.start')}</Text>
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
  selector: { alignSelf: 'stretch', marginTop: space.xl },
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
