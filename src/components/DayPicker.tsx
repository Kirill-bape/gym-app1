import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WEEKDAYS_SHORT, plural } from '../dates';
import { MAX_DAYS, MIN_DAYS, hasBackToBackFullBody } from '../plan';
import { colors, font, radius, space } from '../theme';

// Выбор дней тренировок: нажимаешь на дни недели, в которые пойдёшь в зал
export default function DayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const toggle = (day: number) => {
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    if (next.length <= MAX_DAYS) onChange(next.sort((a, b) => a - b));
  };
  const n = value.length;

  let hint = `${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')} в неделю`;
  if (n < MIN_DAYS) hint = `Выбери хотя бы ${MIN_DAYS} дня`;
  else if (n === MAX_DAYS) hint = `${n} тренировок — это максимум, один день нужен на отдых`;
  else if (hasBackToBackFullBody(value)) hint = `${hint}. Совет: оставь день отдыха между тренировками — так мышцы успеют восстановиться`;

  return (
    <View style={{ gap: space.md }}>
      <View style={styles.row}>
        {WEEKDAYS_SHORT.map((w, i) => {
          const on = value.includes(i);
          return (
            <Pressable
              key={w}
              onPress={() => toggle(i)}
              style={[styles.day, on && styles.dayOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <Text style={{ color: on ? colors.onAccent : colors.text, fontWeight: '700' }}>{w}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[font.small, n < MIN_DAYS && { color: colors.orange }]}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
