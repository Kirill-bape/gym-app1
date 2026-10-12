import { z } from 'zod';

// Что нейросеть возвращает по фото еды
export const FoodEstimateSchema = z.object({
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

export const SYSTEM_PROMPT = `Ты помогаешь человеку вести дневник питания. По фото определи, что за еда, оцени вес каждой позиции в граммах и её калорийность, а затем сумму калорий и белков, жиров и углеводов для всего, что на фото.
Пиши по-русски. В title — короткое понятное название приёма пищи, например «Гречка с курицей».
Если размер порции по фото понять сложно, исходи из обычной порции для взрослого и в note коротко напиши, что лучше уточнить. Учитывай масло и соусы, если их видно.
Если на фото нет еды, поставь is_food = false, а все числа — 0.`;

// Для моделей без строгого формата ответа: описываем поля словами
export const JSON_PROMPT = `Ответь только JSON-объектом без пояснений, с полями: is_food (true или false), title (строка), items (массив объектов с полями name, grams, kcal), total_kcal, protein_g, fat_g, carbs_g (числа), confidence ("low", "medium" или "high"), note (строка).`;

export function userPrompt(hint: string): string {
  return hint.trim() ? `Посчитай калории. Уточнение: ${hint.trim()}` : 'Посчитай калории.';
}

// JSON Schema для структурированного ответа Ollama
export const FOOD_JSON_SCHEMA = (() => {
  const { $schema: _, ...schema } = z.toJSONSchema(FoodEstimateSchema) as Record<string, unknown>;
  return schema;
})();

// Локальные модели иногда пишут числа строкой или пропускают поля: приводим ответ к нужному виду
const num = z.coerce.number().catch(0);
const LenientSchema = z.object({
  is_food: z.union([z.boolean(), z.string().transform((s) => s.trim().toLowerCase() !== 'false')]).catch(true),
  title: z.string().catch('Приём пищи'),
  items: z.array(z.object({ name: z.string().catch('Блюдо'), grams: num, kcal: num })).catch([]),
  total_kcal: num,
  protein_g: num,
  fat_g: num,
  carbs_g: num,
  confidence: z.enum(['low', 'medium', 'high']).catch('low'),
  note: z.string().catch(''),
});

export function parseEstimate(text: string): FoodEstimate | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    // ответ в ```json ... ``` или с текстом вокруг
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      raw = JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
  const parsed = LenientSchema.safeParse(raw);
  if (!parsed.success) return null;
  const estimate = parsed.data;
  if (!estimate.total_kcal && estimate.items.length) {
    estimate.total_kcal = estimate.items.reduce((s, i) => s + i.kcal, 0);
  }
  return estimate;
}
