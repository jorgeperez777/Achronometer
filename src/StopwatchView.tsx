import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FixedDigits } from './FixedDigits';
import { CONTROLS_HEIGHT, ModeLayout } from './ModeLayout';
import { useT } from './settings';
import { colors, pressedStyle, space } from './theme';

function format(ms: number) {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60) % 60;
  const h = Math.floor(totalS / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    main: h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`,
    cs: pad(cs),
  };
}

type Props = {
  isRunning: boolean;
  elapsed: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

/** Modo cronómetro: el tiempo y dos botones. */
export function StopwatchView({ isRunning, elapsed, start, pause, reset }: Props) {
  const t = useT();
  const { main, cs } = format(elapsed);
  const isIdle = !isRunning && elapsed === 0;
  const primaryLabel = t(isRunning ? 'stopwatch.pause' : isIdle ? 'stopwatch.start' : 'stopwatch.resume');

  return (
    <ModeLayout
      display={
        <View style={styles.timeRow}>
          <FixedDigits text={main} style={styles.time} fontSize={TIME_SIZE} />
          <FixedDigits text={`.${cs}`} style={styles.cs} fontSize={CS_SIZE} />
        </View>
      }
      controls={
        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('stopwatch.resetA11y')}
            disabled={isIdle}
            onPress={reset}
            style={({ pressed }) => [styles.button, styles.secondary, isIdle && styles.disabled, pressed && pressedStyle]}
          >
            <Text style={styles.secondaryText}>{t('stopwatch.reset')}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            onPress={isRunning ? pause : start}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: isRunning ? colors.pauseBg : colors.startBg },
              pressed && pressedStyle,
            ]}
          >
            <Text style={[styles.primaryText, { color: isRunning ? colors.pause : colors.start }]}>
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

const TIME_SIZE = 80;
const CS_SIZE = 40;

const styles = StyleSheet.create({
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { color: colors.text, fontSize: TIME_SIZE, fontWeight: '200', fontVariant: ['tabular-nums'] },
  cs: { color: colors.textMuted, fontSize: CS_SIZE, fontWeight: '200', fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.sm },
  button: {
    width: CONTROLS_HEIGHT,
    height: CONTROLS_HEIGHT,
    borderRadius: CONTROLS_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.surface },
  disabled: { opacity: 0.4 },
  secondaryText: { color: colors.text, fontSize: 16 },
  primaryText: { fontSize: 16, fontWeight: '600' },
});
