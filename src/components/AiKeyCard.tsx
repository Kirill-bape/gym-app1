import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text, View } from 'react-native';
import { AI_ERROR_TEXT, FoodPhotoError, checkApiKey } from '../ai';
import { useStore } from '../store';
import { colors, font, space } from '../theme';
import { Button, Card, Field } from './ui';

const KEYS_PAGE = 'https://platform.claude.com/settings/keys';

const STEPS = [
  'Открой Claude Console (кнопка ниже) и зарегистрируйся.',
  'В разделе Billing пополни баланс, например на $5. Одно фото стоит примерно 1–3 цента.',
  'В разделе API Keys нажми Create Key и скопируй ключ.',
  'Вставь ключ в поле ниже.',
];

// Ключ Claude для калорий по фото: как получить, проверка и хранение только на телефоне
export default function AiKeyCard() {
  const { aiKey, setAiKey } = useStore();
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const key = input.trim();
  const looksValid = key.length >= 20 && !/\s/.test(key);

  const save = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await checkApiKey(key);
      setAiKey(key);
      setInput('');
    } catch (e) {
      const reason = e instanceof FoodPhotoError ? e.reason : 'other';
      if (reason === 'network' || reason === 'busy' || reason === 'limit') {
        // Проверить сейчас не вышло, но сам ключ может быть верным
        setAiKey(key);
        setInput('');
        setMessage('Ключ сохранён, но проверить его не получилось: нет связи с сервером.');
      } else if (reason === 'auth') {
        setMessage('Ключ не подошёл. Скопируй его ещё раз целиком.');
      } else {
        setMessage(AI_ERROR_TEXT[reason] + (reason === 'other' && e instanceof Error ? ` ${e.message}` : ''));
      }
    } finally {
      setChecking(false);
    }
  };

  const remove = () =>
    Alert.alert('Удалить ключ?', 'Калории по фото перестанут работать, пока не добавишь ключ снова.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          setAiKey(null);
          setMessage(null);
        },
      },
    ]);

  return (
    <Card>
      <Text style={font.label}>Калории по фото</Text>
      {aiKey ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
            <Text style={[font.h3, { flex: 1 }]}>Ключ подключён</Text>
            <Text style={font.small}>…{aiKey.slice(-4)}</Text>
          </View>
          <Text style={font.small}>
            Фото еды распознаёт ИИ Claude. Ключ хранится только на этом телефоне. Одно фото стоит примерно 1–3 цента с твоего баланса.
          </Text>
          {message ? <Text style={[font.small, { color: colors.orange }]}>{message}</Text> : null}
          <Button title="Удалить ключ" variant="danger" onPress={remove} />
        </>
      ) : (
        <>
          <Text style={font.small}>Фото еды распознаёт ИИ Claude. Для этого нужен личный ключ, его делают один раз:</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <Text style={[font.body, { color: colors.accent, fontWeight: '800', width: 16 }]}>{i + 1}</Text>
              <Text style={[font.body, { flex: 1 }]}>{step}</Text>
            </View>
          ))}
          <Button title="Открыть Claude Console" variant="secondary" icon="open-outline" onPress={() => Linking.openURL(KEYS_PAGE)} />
          <Field
            label="Ключ"
            value={input}
            onChangeText={setInput}
            placeholder="sk-ant-…"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {message ? <Text style={[font.small, { color: colors.orange }]}>{message}</Text> : null}
          {checking ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'center' }}>
              <ActivityIndicator color={colors.accent} />
              <Text style={font.body}>Проверяю ключ…</Text>
            </View>
          ) : (
            <Button title="Проверить и сохранить" icon="key-outline" onPress={save} disabled={!looksValid} />
          )}
          <Text style={[font.small, { fontSize: 12 }]}>Ключ хранится только на этом телефоне и отправляется только в Anthropic.</Text>
        </>
      )}
    </Card>
  );
}
