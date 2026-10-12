import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ACTIVITY, GOALS, bmi, calcNutrition } from '../calc';
import AiSettingsCard from '../components/AiSettingsCard';
import { Button, Card, Field, Screen, Stat } from '../components/ui';
import { useStore } from '../store';
import { colors, font, space } from '../theme';
import { Profile } from '../types';
import { BUILD_NUMBER } from '../update';

export default function ProfileScreen({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  const { data, logWeight, resetAll } = useStore();
  const n = calcNutrition(profile);
  const [w, setW] = useState('');
  const wNum = parseFloat(w.replace(',', '.'));
  const canSave = wNum >= 30 && wNum <= 250;
  const history = [...data.weights].slice(-6).reverse();

  const confirmReset = () =>
    Alert.alert('Сбросить всё?', 'Профиль, питание, прогресс тренировок и настройки нейросети будут удалены с этого телефона.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <Screen title={`${profile.firstName} ${profile.lastName}`.trim()} subtitle="Профиль">
      <Card>
        <Text style={font.label}>Цель</Text>
        <Text style={font.h2}>{GOALS[profile.goal].label}</Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Рост" value={`${profile.height} см`} />
          <Stat label="Вес" value={`${profile.weight} кг`} />
          <Stat label="Цель" value={`${profile.targetWeight} кг`} color={colors.accent} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Возраст" value={`${profile.age}`} />
          <Stat label="ИМТ" value={`${bmi(profile)}`} />
          <Stat label="Тренировок" value={`${profile.daysPerWeek}/нед`} />
        </View>
        <Text style={font.small}>Активность: {ACTIVITY[profile.activity].label.toLowerCase()}</Text>
      </Card>

      <Card>
        <Text style={font.label}>Как считаются калории</Text>
        <Text style={font.small}>
          Базовый обмен по формуле Миффлина — Сан Жеора: {n.bmr} ккал. С учётом активности расход {n.tdee} ккал. Для твоей цели норма{' '}
          {n.target} ккал в день.
        </Text>
      </Card>

      <Card>
        <Text style={font.label}>Записать вес</Text>
        <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Field label="Сегодня" value={w} onChangeText={setW} keyboardType="decimal-pad" placeholder={String(profile.weight)} suffix="кг" />
          </View>
          <View style={{ width: 140 }}>
            <Button
              title="Сохранить"
              onPress={() => {
                logWeight(wNum);
                setW('');
              }}
              disabled={!canSave}
            />
          </View>
        </View>
        {history.map((h) => (
          <View key={h.date} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={font.small}>{h.date.split('-').reverse().join('.')}</Text>
            <Text style={font.body}>{h.weight} кг</Text>
          </View>
        ))}
      </Card>

      <AiSettingsCard />

      <Button title="Изменить данные и цель" variant="secondary" icon="create-outline" onPress={onEdit} />
      <Button title="Сбросить всё" variant="danger" onPress={confirmReset} />
      <Text style={[font.small, { textAlign: 'center', fontSize: 12 }]}>
        {BUILD_NUMBER ? `Форма · сборка ${BUILD_NUMBER}` : 'Форма · тестовая версия'}
      </Text>
    </Screen>
  );
}
