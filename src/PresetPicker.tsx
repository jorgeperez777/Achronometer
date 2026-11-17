import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddPresetSheet } from './AddPresetSheet';
import { MAX_PRESETS } from './presets';
import { useT, useThemedStyles } from './settings';
import { type Colors, pressedStyle, radius, space, TOUCH_MIN } from './theme';

type Props = {
  /** Título del selector ("Descanso entre series"). */
  title: string;
  kind: 'rest' | 'sets';
  options: number[];
  value: number;
  onSelect: (value: number) => void;
  /** Guarda la lista nueva (ya validada y ordenada). */
  onChangeOptions: (options: number[]) => void;
  format: (value: number) => string;
  speak: (value: number) => string;
  disabled?: boolean;
};

/**
 * Chips seleccionables + chip "+" para añadir una opción propia. "Editar" muestra una ✕ en
 * cada chip para borrarla (no se puede borrar la seleccionada ni la última que quede).
 */
export function PresetPicker({ title, kind, options, value, onSelect, onChangeOptions, format, speak, disabled }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  // Si el valor guardado no está en la lista (p. ej. de una versión anterior), se muestra igual.
  const shown = options.includes(value) ? options : [...options, value].sort((a, b) => a - b);
  const canAdd = options.length < MAX_PRESETS;

  return (
    <View style={[styles.root, disabled && styles.dimmed]} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editing ? t('picker.doneA11y', { title }) : t('picker.editA11y', { title })}
          onPress={() => setEditing((e) => !e)}
          hitSlop={8}
          style={({ pressed }) => [styles.editButton, pressed && pressedStyle]}
        >
          <Text style={styles.editText}>{editing ? t('picker.done') : t('picker.edit')}</Text>
        </Pressable>
      </View>

      <View style={styles.chips} accessibilityRole={editing ? undefined : 'radiogroup'}>
        {shown.map((o) => {
          const selected = o === value;
          const removable = editing && !selected && options.length > 1;
          if (editing) {
            return (
              <Pressable
                key={o}
                accessibilityRole="button"
                accessibilityLabel={
                  removable ? t('picker.removeA11y', { item: speak(o) }) : selected ? t('picker.lockedA11y', { item: speak(o) }) : speak(o)
                }
                disabled={!removable}
                onPress={() => onChangeOptions(options.filter((x) => x !== o))}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, !removable && styles.chipLocked, pressed && pressedStyle]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{format(o)}</Text>
                {removable && <Text style={styles.remove}>✕</Text>}
              </Pressable>
            );
          }
          return (
            <Pressable
              key={o}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={speak(o)}
              onPress={() => onSelect(o)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && pressedStyle]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{format(o)}</Text>
            </Pressable>
          );
        })}

        {!editing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={canAdd ? t(kind === 'rest' ? 'picker.addRest' : 'picker.addSets') : t('picker.full', { max: MAX_PRESETS })}
            disabled={!canAdd}
            onPress={() => setAdding(true)}
            style={({ pressed }) => [styles.chip, styles.addChip, !canAdd && styles.dimmed, pressed && pressedStyle]}
          >
            <Text style={styles.addText}>+</Text>
          </Pressable>
        )}
      </View>

      {editing && (
        <Text style={styles.help}>{t('picker.help')}</Text>
      )}

      <AddPresetSheet
        visible={adding}
        kind={kind}
        existing={options}
        onCancel={() => setAdding(false)}
        onAdd={(v, list) => {
          setAdding(false);
          onChangeOptions(list);
          onSelect(v);
        }}
      />
    </View>
  );
}

const CHIP_H = TOUCH_MIN - space.xs;

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
  root: { alignSelf: 'stretch' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  title: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  editButton: { minHeight: 32, justifyContent: 'center' },
  editText: { color: colors.rest, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minWidth: 64,
    height: CHIP_H,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipSelected: { backgroundColor: colors.surfaceRaised, borderColor: colors.text },
  chipLocked: { opacity: 0.5 },
  chipText: { color: colors.textMuted, fontSize: 16, fontVariant: ['tabular-nums'] },
  chipTextSelected: { color: colors.text, fontWeight: '600' },
  remove: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  addChip: { borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  addText: { color: colors.rest, fontSize: 22, lineHeight: 26 },
  help: { color: colors.textMuted, fontSize: 13, marginTop: space.sm },
  dimmed: { opacity: 0.35 },
});
