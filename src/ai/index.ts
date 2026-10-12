import type { FoodEstimate } from './claude';
import { AI_ERROR_TEXT, FoodPhotoError } from './errors';

export type { FoodEstimate };
export { AI_ERROR_TEXT, FoodPhotoError };
export type { FoodPhotoErrorReason } from './errors';

// SDK загружается только при первом запросе: если с ним что-то не так на телефоне,
// сломается одна эта функция, а не запуск всего приложения.
async function load() {
  try {
    return await import('./claude');
  } catch (e) {
    throw new FoodPhotoError('other', e instanceof Error ? e.message : String(e));
  }
}

export async function estimateFoodPhoto(apiKey: string, jpegBase64: string, hint: string): Promise<FoodEstimate> {
  return (await load()).estimateFoodPhoto(apiKey, jpegBase64, hint);
}

// Бесплатная проверка ключа: запрос списка моделей не тратит деньги с баланса
export async function checkApiKey(apiKey: string): Promise<void> {
  return (await load()).checkApiKey(apiKey);
}
