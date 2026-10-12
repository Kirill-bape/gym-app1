import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { Platform } from 'react-native';
import { z } from 'zod';
import { FoodPhotoError } from './errors';

// Оценка калорий по фото еды через Claude.
// Ключ API вводит сам пользователь в профиле, он хранится только на телефоне.

const FoodEstimateSchema = z.object({
  is_food: z.boolean(),
  title: z.string(),
  items: z.array(z.object({ name: z.string(), grams: z.number(), kcal: z.number() })),
  total_kcal: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  carbs_g: z.number(),
  confidence: z.enum(['low', 'medium', 'high']),
  note: z.string(),
});

export type FoodEstimate = z.infer<typeof FoodEstimateSchema>;

const SYSTEM = `Ты помогаешь человеку вести дневник питания. По фото определи, что за еда, оцени вес каждой позиции в граммах и её калорийность, а затем сумму калорий и белков, жиров и углеводов для всего, что на фото.
Пиши по-русски. В title — короткое понятное название приёма пищи, например «Гречка с курицей».
Если размер порции по фото понять сложно, исходи из обычной порции для взрослого и в note коротко напиши, что лучше уточнить. Учитывай масло и соусы, если их видно.
Если на фото нет еды, поставь is_food = false, а все числа — 0.`;

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
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(FoodEstimateSchema) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpegBase64 } },
            { type: 'text', text: hint.trim() ? `Посчитай калории. Уточнение: ${hint.trim()}` : 'Посчитай калории.' },
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
