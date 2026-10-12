import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DayPicker from '../components/DayPicker';
import ExerciseSheet from '../components/ExerciseSheet';
import { Button, Card, Chip, ProgressBar, Screen } from '../components/ui';
import { WEEKDAYS_FULL, WEEKDAYS_SHORT, plural, weekKey, weekdayIndex } from '../dates';
import { MAX_DAYS, MIN_DAYS, buildPlan, doneSets, formatReps, getTrainingDays, totalSets } from '../plan';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Exercise, Profile } from '../types';

export default function Workouts({ profile }: { profile: Profile }) {
  const { data, tapSet, setTrainingDays } = useStore();
  const plan = buildPlan(profile);
  const week = data.progress[weekKey()] ?? {};
  const [day, setDay] = useState(weekdayIndex());
  const [editDays, setEditDays] = useState<number[] | null>(null);
  const [opened, setOpened] = useState<Exercise | null>(null);
  const workout = plan.find((d) => d.weekday === day);

  const weekDone = plan.reduce((s, d) => s + doneSets(d, week), 0);
  const weekTotal = plan.reduce((s, d) => s + totalSets(d), 0);

  return (
    <Screen title="Тренировки" subtitle={`План на неделю · ${plan.length} ${plural(plan.length, 'день', 'дня', 'дней')} в зале`}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={font.label}>Прогресс недели</Text>
          <Text style={[font.small, { color: colors.accent, fontWeight: '700' }]}>{weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0}%</Text>
        </View>
        <ProgressBar value={weekTotal ? weekDone / weekTotal : 0} />
        <Text style={font.small}>
          {weekDone} из {weekTotal} подходов. Каждый понедельник неделя начинается заново.
        </Text>
      </Card>

      {editDays ? (
        <Card>
          <Text style={font.label}>В какие дни ходишь в зал?</Text>
          <DayPicker value={editDays} onChange={setEditDays} />
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Button title="Отмена" variant="secondary" onPress={() => setEditDays(null)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Сохранить"
                disabled={editDays.length < MIN_DAYS || editDays.length > MAX_DAYS}
                onPress={() => {
                  setTrainingDays(editDays);
                  setEditDays(null);
                }}
              />
            </View>
          </View>
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {WEEKDAYS_SHORT.map((w, i) => (
              <Chip key={w} label={w} active={day === i} dot={plan.some((d) => d.weekday === i)} onPress={() => setDay(i)} />
            ))}
          </View>
          <Pressable onPress={() => setEditDays(getTrainingDays(profile))} style={styles.editDays} hitSlop={6}>
            <Ionicons name="calendar-outline" size={16} color={colors.accent} />
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Изменить дни тренировок</Text>
          </Pressable>
        </>
      )}

      {workout ? (
        <>
          <View>
            <Text style={font.small}>
              {WEEKDAYS_FULL[day]}
              {day === weekdayIndex() ? ' · сегодня' : ''}
            </Text>
            <Text style={font.h2}>{workout.title}</Text>
            <Text style={font.small}>{workout.focus}</Text>
          </View>
          {workout.exercises.map((e, idx) => {
            const done = Math.min(e.sets, week[e.id] ?? 0);
            const complete = done >= e.sets;
            return (
              <Card key={e.id} style={complete && { borderColor: colors.accent }}>
                <Pressable onPress={() => setOpened(e)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={[styles.num, complete && { backgroundColor: colors.accent }]}>
                    {complete ? (
                      <Ionicons name="checkmark" size={18} color={colors.onAccent} />
                    ) : (
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{idx + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={font.h3}>{e.name}</Text>
                    <Text style={font.small}>{formatReps(e)}</Text>
                  </View>
                  <View style={styles.howTo}>
                    <Ionicons name="play-circle" size={16} color={colors.accent} />
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>Техника</Text>
                  </View>
                </Pressable>
                <View style={styles.sets}>
                  {Array.from({ length: e.sets }, (_, i) => {
                    const on = i < done;
                    return (
                      <Pressable key={i} onPress={() => tapSet(e.id, i)} style={[styles.set, on && styles.setOn]} hitSlop={4}>
                        <Text style={{ color: on ? colors.onAccent : colors.muted, fontWeight: '700', fontSize: 13 }}>{e.reps}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            );
          })}
          <Text style={[font.small, { textAlign: 'center' }]}>
            Нажми на упражнение, чтобы посмотреть технику. Нажми на подход, когда сделаешь его.
          </Text>
        </>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
          <Ionicons name="bed-outline" size={40} color={colors.muted} />
          <Text style={font.h2}>День отдыха</Text>
          <Text style={[font.small, { textAlign: 'center' }]}>Мышцы растут, пока ты отдыхаешь. Можно прогуляться или сделать растяжку.</Text>
        </Card>
      )}
      <ExerciseSheet exercise={opened} onClose={() => setOpened(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
  sets: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  set: {
    minWidth: 52,
    height: 40,
    paddingHorizontal: space.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  editDays: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: -space.sm },
  howTo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.cardAlt,
  },
});
