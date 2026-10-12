import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { calcNutrition } from '../calc';
import FoodPhoto from '../components/FoodPhoto';
import { Button, Card, Field, ProgressBar, Ring, Screen, Stat } from '../components/ui';
import { dateKey } from '../dates';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Macros, Profile } from '../types';

// [название, ккал, белки, жиры, углеводы]
const QUICK: [string, number, number, number, number][] = [
  ['Овсянка 60 г', 225, 8, 4, 36],
  ['Яйца, 2 шт', 155, 13, 11, 1],
  ['Куриная грудка 150 г', 165, 35, 2, 0],
  ['Гречка 200 г', 220, 8, 2, 40],
  ['Рис 200 г', 260, 5, 1, 57],
  ['Творог 5% 200 г', 240, 34, 10, 6],
  ['Протеин, порция', 120, 24, 2, 3],
  ['Банан', 105, 1, 0, 27],
  ['Яблоко', 80, 0, 0, 21],
];

export default function Nutrition({ profile, onOpenSettings }: { profile: Profile; onOpenSettings: () => void }) {
  const { data, addFood, removeFood } = useStore();
  const n = calcNutrition(profile);
  const entries = data.food[dateKey()] ?? [];
  const eaten = entries.reduce((s, e) => s + e.kcal, 0);
  const macros = entries.reduce<Macros>(
    (s, e) => (e.macros ? { protein: s.protein + e.macros.protein, fat: s.fat + e.macros.fat, carbs: s.carbs + e.macros.carbs } : s),
    { protein: 0, fat: 0, carbs: 0 },
  );
  const withoutMacros = entries.filter((e) => !e.macros).length;
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  const kcalNum = parseInt(kcal, 10);
  const canAdd = name.trim().length > 0 && kcalNum > 0 && kcalNum < 5000;
  const add = () => {
    if (!canAdd) return;
    addFood(name.trim(), kcalNum);
    setName('');
    setKcal('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title="Питание" subtitle="Сегодня">
        <Card style={{ alignItems: 'center' }}>
          <Ring value={eaten / n.target} size={180} color={eaten > n.target ? colors.danger : colors.accent}>
            <Text style={[font.h1, { fontSize: 36 }]}>{eaten}</Text>
            <Text style={font.small}>из {n.target} ккал</Text>
          </Ring>
          <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
            <Stat label="Расход" value={`${n.tdee}`} />
            <Stat label="Обмен (BMR)" value={`${n.bmr}`} />
            <Stat
              label={eaten > n.target ? 'Перебор' : 'Осталось'}
              value={`${Math.abs(n.target - eaten)}`}
              color={eaten > n.target ? colors.danger : colors.accent}
            />
          </View>
        </Card>

        <FoodPhoto onOpenSettings={onOpenSettings} />

        <Card>
          <Text style={font.label}>БЖУ за день</Text>
          <MacroRow label="Белки" eaten={macros.protein} target={n.protein} color={colors.blue} />
          <MacroRow label="Жиры" eaten={macros.fat} target={n.fat} color={colors.orange} />
          <MacroRow label="Углеводы" eaten={macros.carbs} target={n.carbs} color={colors.pink} />
          <Text style={font.small}>
            {withoutMacros > 0
              ? `БЖУ считается по фото и быстрым продуктам. Записей без БЖУ сегодня: ${withoutMacros}.`
              : 'Белок помогает сохранить мышцы на дефиците и растить их на наборе.'}
          </Text>
        </Card>

        <Card>
          <Text style={font.label}>Добавить</Text>
          <Field label="Что съел" value={name} onChangeText={setName} placeholder="Например, борщ" />
          <Field label="Калории" value={kcal} onChangeText={setKcal} keyboardType="number-pad" placeholder="350" suffix="ккал" />
          <Button title="Добавить" icon="add" onPress={add} disabled={!canAdd} />
          <Text style={[font.small, { marginTop: space.sm }]}>Быстро добавить</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm, alignItems: 'flex-start' }}>
            {QUICK.map(([qn, qk, protein, fat, carbs]) => (
              <Pressable
                key={qn}
                onPress={() => addFood(qn, qk, { protein, fat, carbs })}
                style={{ backgroundColor: colors.cardAlt, borderRadius: radius.md, paddingVertical: space.sm, paddingHorizontal: space.md }}
              >
                <Text style={[font.body, { fontWeight: '600' }]}>{qn}</Text>
                <Text style={font.small}>{qk} ккал</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Card>

        <Card>
          <Text style={font.label}>Съедено сегодня</Text>
          {entries.length === 0 ? (
            <Text style={font.small}>Пока пусто. Добавь первый приём пищи.</Text>
          ) : (
            [...entries].reverse().map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text style={[font.small, { width: 44 }]}>{e.time}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={font.body} numberOfLines={1}>
                    {e.name}
                  </Text>
                  {e.macros ? (
                    <Text style={[font.small, { fontSize: 12 }]}>
                      Б {e.macros.protein} · Ж {e.macros.fat} · У {e.macros.carbs}
                    </Text>
                  ) : null}
                </View>
                <Text style={[font.body, { fontWeight: '700' }]}>{e.kcal}</Text>
                <Pressable onPress={() => removeFood(e.id)} hitSlop={10}>
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))
          )}
        </Card>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function MacroRow({ label, eaten, target, color }: { label: string; eaten: number; target: number; color: string }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[font.body, { fontWeight: '600' }]}>{label}</Text>
        <Text style={font.small}>
          <Text style={{ color, fontWeight: '700' }}>{Math.round(eaten)}</Text> из {target} г
        </Text>
      </View>
      <ProgressBar value={target > 0 ? eaten / target : 0} color={color} height={6} />
    </View>
  );
}
