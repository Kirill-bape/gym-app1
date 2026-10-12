import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AiConfig } from './ai';

// Настройки нейросети и ключи хранятся только на этом устройстве: в защищённом хранилище телефона,
// а в веб-версии (она нужна только для предпросмотра) — в хранилище браузера.
const KEY = 'forma_ai_config';
const OLD_CLAUDE_KEY = 'forma_anthropic_api_key'; // версия 1.1 хранила только ключ Claude

const web = Platform.OS === 'web';
const getItem = (k: string) => (web ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k));
const setItem = (k: string, v: string) => (web ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v));
const deleteItem = (k: string) => (web ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k));

export async function loadAiConfig(): Promise<AiConfig | null> {
  const raw = await getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AiConfig;
    } catch {
      return null;
    }
  }
  const claudeKey = await getItem(OLD_CLAUDE_KEY);
  return claudeKey ? { provider: 'claude', claudeKey } : null;
}

export async function saveAiConfig(config: AiConfig | null): Promise<void> {
  if (config) await setItem(KEY, JSON.stringify(config));
  else await deleteItem(KEY);
  await deleteItem(OLD_CLAUDE_KEY);
}
