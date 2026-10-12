import { AiConfig } from './config';
import { FoodPhotoError } from './errors';
import type { OllamaCloudCheck, OllamaModel } from './ollama';
import type { FoodEstimate } from './schema';

export * from './config';
export { FoodPhotoError, aiErrorText } from './errors';
export type { FoodPhotoErrorReason } from './errors';
export type { FoodEstimate, OllamaCloudCheck, OllamaModel };

// Клиенты нейросетей загружаются только при первом запросе: если с каким-то из них
// что-то не так на телефоне, сломается одна эта функция, а не запуск всего приложения.
async function load<T>(importer: () => Promise<T>): Promise<T> {
  try {
    return await importer();
  } catch (e) {
    throw new FoodPhotoError('other', e instanceof Error ? e.message : String(e));
  }
}

export async function estimateFoodPhoto(config: AiConfig, jpegBase64: string, hint: string): Promise<FoodEstimate> {
  if (config.provider === 'claude') {
    return (await load(() => import('./claude'))).estimateFoodPhoto(config.claudeKey ?? '', jpegBase64, hint);
  }
  return (await load(() => import('./ollama'))).estimateWithOllama(config, jpegBase64, hint);
}

// Бесплатная проверка ключа Claude: запрос списка моделей не тратит деньги с баланса
export async function checkClaudeKey(apiKey: string): Promise<void> {
  return (await load(() => import('./claude'))).checkApiKey(apiKey);
}

// Модели Ollama на компьютере: заодно проверяет его адрес
export async function listOllamaModels(config: AiConfig): Promise<OllamaModel[]> {
  return (await load(() => import('./ollama'))).listOllamaModels(config);
}

// Ключ Ollama Cloud, модели в облаке и остаток бесплатного лимита
export async function checkOllamaCloud(config: AiConfig): Promise<OllamaCloudCheck> {
  return (await load(() => import('./ollama'))).checkOllamaCloud(config);
}
