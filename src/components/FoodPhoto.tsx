import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodEstimate, FoodPhotoError, PROVIDER_NAMES, activeModel, aiErrorText, estimateFoodPhoto, isAiReady } from '../ai';
import { CameraDeniedError, PickedPhoto, pickFoodPhoto } from '../photo';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Button, Card, Field } from './ui';

type State =
  | { kind: 'idle' }
  | { kind: 'picked'; photo: PickedPhoto }
  | { kind: 'loading'; photo: PickedPhoto }
  | { kind: 'done'; photo: PickedPhoto; result: FoodEstimate; source: string }
  | { kind: 'error'; photo: PickedPhoto | null; message: string; openSettings?: boolean };

const CONFIDENCE = { low: 'примерно', medium: 'средняя точность', high: 'высокая точность' };

// Фото еды → оценка калорий и БЖУ → запись в дневник
export default function FoodPhoto({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { ai, addFood } = useStore();
  const ready = isAiReady(ai);
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [hint, setHint] = useState('');
  const [kcal, setKcal] = useState('');

  const reset = () => {
    setState({ kind: 'idle' });
    setHint('');
    setKcal('');
  };

  const pick = async (source: 'camera' | 'library') => {
    try {
      const photo = await pickFoodPhoto(source);
      if (photo) setState({ kind: 'picked', photo });
    } catch (e) {
      const message = e instanceof CameraDeniedError ? 'Нет доступа к камере. Разреши его в настройках телефона.' : 'Не получилось открыть фото.';
      setState({ kind: 'error', photo: null, message });
    }
  };

  const analyze = async (photo: PickedPhoto) => {
    if (!isAiReady(ai)) return;
    setState({ kind: 'loading', photo });
    try {
      const result = await estimateFoodPhoto(ai, photo.base64, hint);
      setKcal(String(Math.round(result.total_kcal)));
      setState({ kind: 'done', photo, result, source: `${PROVIDER_NAMES[ai.provider]} · ${activeModel(ai)}` });
    } catch (e) {
      const reason = e instanceof FoodPhotoError ? e.reason : 'other';
      // Для непонятных ошибок показываем текст, чтобы его можно было прислать скриншотом
      const detail = reason === 'other' && e instanceof Error ? ` ${e.message}` : '';
      setState({
        kind: 'error',
        photo,
        message: aiErrorText(reason, ai.provider) + detail,
        openSettings: reason === 'auth' || reason === 'forbidden' || reason === 'model',
      });
    }
  };

  const save = (result: FoodEstimate) => {
    const value = Math.round(Number(kcal.replace(',', '.')));
    if (!(value > 0)) return;
    // Если поправил калории вручную, БЖУ меняем в той же пропорции
    const k = result.total_kcal > 0 ? value / result.total_kcal : 1;
    addFood(result.title, value, {
      protein: Math.round(result.protein_g * k),
      fat: Math.round(result.fat_g * k),
      carbs: Math.round(result.carbs_g * k),
    });
    reset();
  };

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={styles.icon}>
          <Ionicons name="camera" size={20} color={colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={font.h3}>Калории по фото</Text>
          <Text style={font.small}>Сфоткай тарелку, и нейросеть оценит калории и БЖУ</Text>
        </View>
      </View>

      {!ready ? (
        <>
          <Text style={font.small}>Чтобы это заработало, один раз выбери нейросеть в профиле. Есть бесплатные варианты.</Text>
          <Button title="Настроить в профиле" variant="secondary" icon="settings-outline" onPress={onOpenSettings} />
        </>
      ) : state.kind === 'idle' ? (
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ flex: 1 }}>
            <Button title="Камера" icon="camera-outline" onPress={() => pick('camera')} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Галерея" icon="images-outline" variant="secondary" onPress={() => pick('library')} />
          </View>
        </View>
      ) : null}

      {ready && state.kind !== 'idle' && state.photo ? <Image source={{ uri: state.photo.uri }} style={styles.preview} resizeMode="cover" /> : null}

      {ready && state.kind === 'picked' ? (
        <>
          <Field label="Уточнение (необязательно)" value={hint} onChangeText={setHint} placeholder="Например: порция 300 г, жарено на масле" />
          <Button title="Посчитать калории" icon="sparkles-outline" onPress={() => analyze(state.photo)} />
          <Pressable onPress={reset} hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={{ color: colors.muted, fontWeight: '600' }}>Выбрать другое фото</Text>
          </Pressable>
        </>
      ) : null}

      {ready && state.kind === 'loading' ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={[font.body, { flex: 1 }]}>
            {ai.provider === 'ollama-local'
              ? 'Считаю на твоём компьютере… первый раз может занять минуту'
              : 'Считаю калории… обычно 10–30 секунд'}
          </Text>
        </View>
      ) : null}

      {ready && state.kind === 'done' ? (
        state.result.is_food ? (
          <Result
            result={state.result}
            source={state.source}
            kcal={kcal}
            setKcal={setKcal}
            onSave={() => save(state.result)}
            onCancel={reset}
          />
        ) : (
          <>
            <Text style={font.body}>На фото не видно еды. Попробуй сфотографировать тарелку поближе.</Text>
            <Button title="Другое фото" variant="secondary" onPress={reset} />
          </>
        )
      ) : null}

      {state.kind === 'error' ? (
        <>
          <Text style={[font.body, { color: colors.orange }]}>{state.message}</Text>
          {state.openSettings ? <Button title="Открыть профиль" variant="secondary" onPress={onOpenSettings} /> : null}
          {state.photo && ready ? (
            <Button title="Попробовать ещё раз" onPress={() => analyze(state.photo!)} />
          ) : (
            <Button title="Понятно" variant="secondary" onPress={reset} />
          )}
          {state.photo ? (
            <Pressable onPress={reset} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Text style={{ color: colors.muted, fontWeight: '600' }}>Отмена</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function Result({
  result,
  source,
  kcal,
  setKcal,
  onSave,
  onCancel,
}: {
  result: FoodEstimate;
  source: string;
  kcal: string;
  setKcal: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Text style={font.h2}>{result.title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
        <View style={styles.badge}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{CONFIDENCE[result.confidence]}</Text>
        </View>
        <Text style={font.small}>
          Б {Math.round(result.protein_g)} · Ж {Math.round(result.fat_g)} · У {Math.round(result.carbs_g)} г
        </Text>
      </View>
      {result.items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Text style={[font.body, { flex: 1 }]}>{item.name}</Text>
          <Text style={font.small}>{Math.round(item.grams)} г</Text>
          <Text style={[font.body, { fontWeight: '700', minWidth: 80, textAlign: 'right' }]} numberOfLines={1}>
            {Math.round(item.kcal)} ккал
          </Text>
        </View>
      ))}
      {result.note ? <Text style={[font.small, { fontStyle: 'italic' }]}>{result.note}</Text> : null}
      <Text style={[font.small, { fontSize: 11 }]}>Посчитано: {source}</Text>
      <Field label="Калории (можно поправить)" value={kcal} onChangeText={setKcal} keyboardType="number-pad" suffix="ккал" />
      <Button title="Добавить в дневник" icon="add" onPress={onSave} disabled={!(Number(kcal) > 0)} />
      <Pressable onPress={onCancel} hitSlop={8} style={{ alignSelf: 'center' }}>
        <Text style={{ color: colors.muted, fontWeight: '600' }}>Отмена</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.cardAlt },
  badge: { backgroundColor: colors.cardAlt, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 4 },
});
