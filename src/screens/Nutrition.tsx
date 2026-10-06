import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { calcNutrition } from '../calc';
import { Button, Card, Field, Ring, Screen, Stat } from '../components/ui';
import { dateKey } from '../dates';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Profile } from '../types';

const QUICK: [string, number][] = [
  ['Овсянка 60 г', 225],
  ['Яйца, 2 шт', 155],
  ['Куриная грудка 150 г', 165],
  ['Гречка 200 г', 220],
  ['Рис 200 г', 260],
  ['Творог 5% 200 г', 240],
  ['Протеин, порция', 120],
  ['Банан', 105],
  ['Яблоко', 80],
];

export default function Nutrition({ profile }: { profile: Profile }) {
  const { data, addFood, removeFood } = useStore();
  const n = calcNutrition(profile);
  const entries = data.food[dateKey()] ?? [];
  const eaten = entries.reduce((s, e) => s + e.kcal, 0);
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

        <Card>
          <Text style={font.label}>Цель по БЖУ на день</Text>
          <View style={{ flexDirection: 'row' }}>
            <Stat label="Белки" value={`${n.protein} г`} color={colors.blue} />
            <Stat label="Жиры" value={`${n.fat} г`} color={colors.orange} />
            <Stat label="Углеводы" value={`${n.carbs} г`} color={colors.pink} />
          </View>
          <Text style={font.small}>Белок помогает сохранить мышцы на дефиците и растить их на наборе.</Text>
        </Card>

        <Card>
          <Text style={font.label}>Добавить</Text>
          <Field label="Что съел" value={name} onChangeText={setName} placeholder="Например, борщ" />
          <Field label="Калории" value={kcal} onChangeText={setKcal} keyboardType="number-pad" placeholder="350" suffix="ккал" />
          <Button title="Добавить" icon="add" onPress={add} disabled={!canAdd} />
          <Text style={[font.small, { marginTop: space.sm }]}>Быстро добавить</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: space.sm, alignItems: 'flex-start' }}>
            {QUICK.map(([qn, qk]) => (
              <Pressable
                key={qn}
                onPress={() => addFood(qn, qk)}
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
                <Text style={[font.body, { flex: 1 }]} numberOfLines={1}>
                  {e.name}
                </Text>
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
