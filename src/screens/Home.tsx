import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { GOALS, calcForecast, calcNutrition } from '../calc';
import UpdateBanner from '../components/UpdateBanner';
import { Card, ProgressBar, Ring, Screen } from '../components/ui';
import { WEEKDAYS_SHORT, dateKey, humanDate, plural, weekKey, weekdayIndex } from '../dates';
import { buildPlan, doneSets, totalSets } from '../plan';
import { useStore } from '../store';
import { colors, font, space } from '../theme';
import { Profile } from '../types';

export default function Home({ profile, go }: { profile: Profile; go: (tab: 'food' | 'train') => void }) {
  const { data } = useStore();
  const n = calcNutrition(profile);
  const f = calcForecast(profile, n);
  const eaten = (data.food[dateKey()] ?? []).reduce((s, e) => s + e.kcal, 0);
  const left = n.target - eaten;

  const plan = buildPlan(profile);
  const week = data.progress[weekKey()];
  const today = plan.find((d) => d.weekday === weekdayIndex());
  const weekDone = plan.reduce((s, d) => s + doneSets(d, week), 0);
  const weekTotal = plan.reduce((s, d) => s + totalSets(d), 0);

  return (
    <Screen title={`Привет, ${profile.firstName}`} subtitle={humanDate()}>
      <UpdateBanner />
      <Pressable onPress={() => go('food')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
          <Ring value={eaten / n.target} size={128} stroke={12} color={left < 0 ? colors.danger : colors.accent}>
            <Text style={[font.h2, { fontSize: 24 }]}>{Math.abs(left)}</Text>
            <Text style={font.small}>{left >= 0 ? 'осталось' : 'перебор'}</Text>
          </Ring>
          <View style={{ flex: 1, gap: space.sm }}>
            <Text style={font.label}>Калории сегодня</Text>
            <Text style={font.h2}>
              {eaten} <Text style={font.small}>/ {n.target} ккал</Text>
            </Text>
            <Text style={font.small}>
              Б {n.protein} · Ж {n.fat} · У {n.carbs} г
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Добавить еду</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </View>
          </View>
        </Card>
      </Pressable>

      <Pressable onPress={() => go('train')}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={font.label}>Тренировка сегодня</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
          {today ? (
            <>
              <Text style={font.h2}>{today.title}</Text>
              <Text style={font.small}>
                {today.focus} · {today.exercises.length} {plural(today.exercises.length, 'упражнение', 'упражнения', 'упражнений')}
              </Text>
              <ProgressBar value={doneSets(today, week) / totalSets(today)} />
              <Text style={font.small}>
                Сделано {doneSets(today, week)} из {totalSets(today)} подходов
              </Text>
            </>
          ) : (
            <>
              <Text style={font.h2}>День отдыха</Text>
              <Text style={font.small}>Восстановление тоже часть прогресса. Погуляй и выспись.</Text>
            </>
          )}
        </Card>
      </Pressable>

      <Card>
        <Text style={font.label}>Неделя</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {WEEKDAYS_SHORT.map((w, i) => {
            const d = plan.find((p) => p.weekday === i);
            const v = d ? doneSets(d, week) / totalSets(d) : 0;
            const isToday = i === weekdayIndex();
            return (
              <View key={w} style={{ alignItems: 'center', gap: 6 }}>
                <Ring value={v} size={36} stroke={4} color={v >= 1 ? colors.accent : colors.blue}>
                  {d ? (
                    <Ionicons name={v >= 1 ? 'checkmark' : 'barbell-outline'} size={14} color={v >= 1 ? colors.accent : colors.muted} />
                  ) : null}
                </Ring>
                <Text style={{ color: isToday ? colors.accent : colors.muted, fontSize: 12, fontWeight: '700' }}>{w}</Text>
              </View>
            );
          })}
        </View>
        <ProgressBar value={weekTotal ? weekDone / weekTotal : 0} color={colors.blue} />
        <Text style={font.small}>
          {weekDone} из {weekTotal} подходов за неделю
        </Text>
      </Card>

      <Card>
        <Text style={font.label}>Цель · {GOALS[profile.goal].label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Text style={font.h2}>{profile.weight} кг</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.muted} />
          <Text style={[font.h2, { color: colors.accent }]}>{profile.targetWeight} кг</Text>
        </View>
        <Text style={font.small}>
          {f
            ? `Примерно ${f.weeks} ${plural(f.weeks, 'неделя', 'недели', 'недель')} при темпе ${f.kgPerWeek} кг в неделю`
            : 'Держи норму калорий и тренируйся по плану'}
        </Text>
      </Card>
    </Screen>
  );
}
