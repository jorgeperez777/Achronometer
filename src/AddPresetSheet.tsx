import { type ComponentRef, type Ref, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { plural } from './i18n';
import { addSorted, formatDuration, MAX_REST_MS, MAX_SETS, MIN_REST_MS, MIN_SETS, validateRest, validateSets } from './presets';
import { useT } from './settings';
import { colors, pressedStyle, radius, space, TOUCH_MIN } from './theme';

type Props = {
  visible: boolean;
  kind: 'rest' | 'sets';
  existing: number[];
  onCancel: () => void;
  /** Valor añadido y la lista nueva ya ordenada. */
  onAdd: (value: number, list: number[]) => void;
};

/**
 * Hoja inferior para añadir una opción propia. Valida mientras se escribe: el error aparece
 * debajo de los campos y "Añadir" queda desactivado hasta que el valor es válido. El error
 * solo se muestra después de que el usuario haya escrito algo (no al abrir la hoja).
 */
export function AddPresetSheet({ visible, kind, existing, onCancel, onAdd }: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [a, setA] = useState(''); // minutos | series
  const [b, setB] = useState(''); // segundos
  const [touched, setTouched] = useState(false);
  const secondsRef = useRef<InputRef>(null);

  useEffect(() => {
    if (visible) {
      setA('');
      setB('');
      setTouched(false);
    }
  }, [visible]);

  const result = kind === 'rest' ? validateRest(a, b, existing) : validateSets(a, existing);
  const showError = touched && !result.ok;
  const preview = result.ok ? (kind === 'rest' ? formatDuration(result.value) : plural(t, 'count.sets', result.value)) : null;

  const submit = () => {
    setTouched(true);
    if (result.ok) onAdd(result.value, addSorted(existing, result.value));
  };

  const change = (setter: (v: string) => void) => (v: string) => {
    setTouched(true);
    setter(v);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={t('sheet.close')} accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <Text style={styles.title} accessibilityRole="header">
            {t(kind === 'rest' ? 'sheet.restTitle' : 'sheet.setsTitle')}
          </Text>
          <Text style={styles.subtitle}>
            {kind === 'rest'
              ? t('sheet.restRange', { min: MIN_REST_MS / 1000, max: MAX_REST_MS / 60_000 })
              : t('sheet.setsRange', { min: MIN_SETS, max: MAX_SETS })}
          </Text>

          <View style={styles.fields}>
            {kind === 'rest' ? (
              <>
                <Field
                  label={t('sheet.minutes')}
                  value={a}
                  onChangeText={change(setA)}
                  autoFocus
                  invalid={showError}
                  returnKeyType="next"
                  onSubmitEditing={() => secondsRef.current?.focus()}
                />
                <Text style={styles.colon}>:</Text>
                <Field
                  ref={secondsRef}
                  label={t('sheet.seconds')}
                  value={b}
                  onChangeText={change(setB)}
                  invalid={showError}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              </>
            ) : (
              <Field label={t('sheet.sets')} value={a} onChangeText={change(setA)} autoFocus invalid={showError} returnKeyType="done" onSubmitEditing={submit} />
            )}
          </View>

          {/* Línea reservada: error o vista previa (sin saltos de altura). */}
          <Text
            style={[styles.message, showError ? styles.error : styles.preview]}
            accessibilityLiveRegion="polite"
          >
            {showError && !result.ok ? t(result.error, result.params) : preview ? t('sheet.willAdd', { value: preview }) : ' '}
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && pressedStyle]}
            >
              <Text style={styles.cancelText}>{t('sheet.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !result.ok }}
              disabled={!result.ok}
              onPress={submit}
              style={({ pressed }) => [styles.button, styles.add, !result.ok && styles.disabled, pressed && pressedStyle]}
            >
              <Text style={styles.addText}>{t('sheet.add')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type InputRef = ComponentRef<typeof TextInput>;

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  invalid: boolean;
  autoFocus?: boolean;
  returnKeyType: 'next' | 'done';
  onSubmitEditing: () => void;
  ref?: Ref<InputRef>;
};

function Field({ label, value, onChangeText, invalid, autoFocus, returnKeyType, onSubmitEditing, ref }: FieldProps) {
  return (
    <View style={styles.field}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={2}
        autoFocus={autoFocus}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        placeholder="0"
        placeholderTextColor="#48484A"
        accessibilityLabel={label}
        style={[styles.input, invalid && styles.inputInvalid]}
        selectionColor={colors.rest}
      />
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#000000B3' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '600' },
  subtitle: { color: colors.textMuted, fontSize: 15, marginTop: space.xs },
  fields: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: space.sm, marginTop: space.lg },
  field: { alignItems: 'center' },
  input: {
    width: 96,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.surfaceRaised,
    color: colors.text,
    fontSize: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputInvalid: { borderColor: colors.danger },
  fieldLabel: { color: colors.textMuted, fontSize: 13, marginTop: space.xs },
  colon: { color: colors.text, fontSize: 36, lineHeight: 72 },
  message: { fontSize: 15, textAlign: 'center', marginTop: space.md, minHeight: 40 },
  error: { color: colors.danger },
  preview: { color: colors.textMuted },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  button: { flex: 1, height: TOUCH_MIN + 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.surfaceRaised },
  cancelText: { color: colors.text, fontSize: 17 },
  add: { backgroundColor: colors.rest },
  addText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
