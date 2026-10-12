import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Ключ Anthropic API хранится только на этом устройстве: в защищённом хранилище телефона,
// а в веб-версии (она нужна только для предпросмотра) — в хранилище браузера.
const KEY = 'forma_anthropic_api_key';

export async function loadApiKey(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

export async function saveApiKey(value: string): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.setItem(KEY, value);
  return SecureStore.setItemAsync(KEY, value);
}

export async function deleteApiKey(): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(KEY);
  return SecureStore.deleteItemAsync(KEY);
}
