import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { Platform } from 'react-native';
import { CLAUDE_MODEL } from './config';
import { FoodPhotoError } from './errors';
import { FoodEstimate, FoodEstimateSchema, SYSTEM_PROMPT, userPrompt } from './schema';

// Оценка калорий по фото еды через Claude (платно, точнее всего).
// Ключ API вводит сам пользователь в профиле, он хранится только на телефоне.

function makeClient(apiKey: string) {
  // В вебе SDK требует явного согласия: ключ свой и лежит только в браузере пользователя.
  // Ответ короткий, поэтому запрос без стриминга (в React Native fetch его и не умеет).
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: Platform.OS === 'web', maxRetries: 1, timeout: 120_000 });
}

function toFoodPhotoError(e: unknown): FoodPhotoError {
  if (e instanceof FoodPhotoError) return e;
  if (e instanceof Anthropic.AuthenticationError) return new FoodPhotoError('auth', e.message);
  if (e instanceof Anthropic.PermissionDeniedError) return new FoodPhotoError('forbidden', e.message);
  if (e instanceof Anthropic.RateLimitError) return new FoodPhotoError('limit', e.message);
  if (e instanceof Anthropic.BadRequestError && /credit balance/i.test(e.message)) return new FoodPhotoError('billing', e.message);
  if (e instanceof Anthropic.InternalServerError) return new FoodPhotoError('busy', e.message);
  if (e instanceof Anthropic.APIConnectionError) return new FoodPhotoError('network', e.message);
  if (e instanceof Anthropic.APIError) return new FoodPhotoError('other', e.message);
  return new FoodPhotoError('other', e instanceof Error ? e.message : String(e));
}

export async function estimateFoodPhoto(apiKey: string, jpegBase64: string, hint: string): Promise<FoodEstimate> {
  try {
    const message = await makeClient(apiKey).beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(FoodEstimateSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } },
            { type: 'text', text: userPrompt(hint) },
          ],
        },
      ],
    });

    if (message.stop_reason === 'refusal') throw new FoodPhotoError('refusal');
    if (!message.parsed_output) throw new FoodPhotoError('other', `stop_reason: ${message.stop_reason}`);
    return message.parsed_output;
  } catch (e) {
    throw toFoodPhotoError(e);
  }
}

export async function checkApiKey(apiKey: string): Promise<void> {
  try {
    await makeClient(apiKey).models.list({ limit: 1 });
  } catch (e) {
    throw toFoodPhotoError(e);
  }
}
