import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import type { LanguageSetting } from '../modules/stopwatch-controls';
import { LANGUAGE_NAMES } from './i18n';
import { useSettings } from './settings';
import { colors, pressedStyle, radius, space, TOUCH_MIN } from './theme';

/** Pantalla de ajustes: idioma, vibración (al tocar / aviso) y sonido del aviso. */
export function SettingsView({ onClose }: { onClose: () => void }) {
  const { settings, update, t, systemLang, nativeSettings } = useSettings();

  const languages: { value: LanguageSetting; label: string }[] = [
    { value: 'system', label: t('settings.langSystem', { current: LANGUAGE_NAMES[systemLang] }) },
    { value: 'es', label: LANGUAGE_NAMES.es },
    { value: 'en', label: LANGUAGE_NAMES.en },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.back')}
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => [styles.back, pressed && pressedStyle]}
        >
          <Ionicons name="chevron-back" size={26} color={colors.rest} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          {t('settings.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t('settings.language')}>
          <View accessibilityRole="radiogroup">
            {languages.map((l, i) => {
              const selected = settings.language === l.value;
              return (
                <Pressable
                  key={l.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => update({ language: l.value })}
                  style={({ pressed }) => [styles.row, i > 0 && styles.rowDivider, pressed && pressedStyle]}
                >
                  <Text style={styles.rowText}>{l.label}</Text>
                  {selected && <Ionicons name="checkmark" size={22} color={colors.rest} />}
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title={t('settings.vibration')} footer={nativeSettings ? undefined : t('settings.androidOnly')}>
          <SwitchRow
            label={t('settings.vibTouch')}
            hint={t('settings.vibTouchHint')}
            value={settings.hapticsEnabled}
            onChange={(v) => update({ hapticsEnabled: v })}
            disabled={!nativeSettings}
          />
          <SwitchRow
            label={t('settings.vibAlert')}
            hint={t('settings.vibAlertHint')}
            value={settings.alertVibration}
            onChange={(v) => update({ alertVibration: v })}
            disabled={!nativeSettings}
            divider
          />
        </Section>

        <Section title={t('settings.sound')} footer={nativeSettings ? undefined : t('settings.androidOnly')}>
          <SwitchRow
            label={t('settings.soundAlert')}
            hint={t('settings.soundHint')}
            value={settings.alertSound}
            onChange={(v) => update({ alertSound: v })}
            disabled={!nativeSettings}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, footer, children }: { title: string; footer?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
}

function SwitchRow({
  label,
  hint,
  value,
  onChange,
  disabled,
  divider,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  divider?: boolean;
}) {
  return (
    // Toda la fila es pulsable (no solo el interruptor): blanco táctil grande.
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      accessibilityHint={hint}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [styles.row, styles.switchRow, divider && styles.rowDivider, disabled && styles.disabled, pressed && pressedStyle]}
    >
      <View style={styles.switchText}>
        <Text style={styles.rowText}>{label}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceRaised, true: colors.rest }}
        thumbColor={colors.text}
        importantForAccessibility="no"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignSelf: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH_MIN, gap: space.xs },
  back: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center', marginLeft: -space.sm },
  title: { color: colors.text, fontSize: 22, fontWeight: '600' },
  content: { paddingBottom: space.xl },
  section: { marginTop: space.lg },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: space.sm,
    marginLeft: space.xs,
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: space.md },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#3A3A3C' },
  rowText: { color: colors.text, fontSize: 17 },
  switchRow: { paddingVertical: space.sm + 4, gap: space.md },
  switchText: { flex: 1 },
  hint: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  footer: { color: colors.textMuted, fontSize: 13, marginTop: space.sm, marginLeft: space.xs },
  disabled: { opacity: 0.4 },
});
