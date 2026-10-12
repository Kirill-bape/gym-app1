import { AiConfig, DEFAULT_CLOUD_MODEL, OLLAMA_CLOUD_URL, normalizeOllamaHost } from './config';
import { FoodPhotoError, FoodPhotoErrorReason } from './errors';
import { FOOD_JSON_SCHEMA, FoodEstimate, JSON_PROMPT, SYSTEM_PROMPT, parseEstimate, userPrompt } from './schema';

// Ollama: своя на компьютере (бесплатно, в той же Wi-Fi сети) или облако ollama.com (бесплатный тариф с лимитом).
// У обоих одинаковый API: POST /api/chat, картинки в base64 в поле images.

interface Target {
  base: string;
  headers: Record<string, string>;
  local: boolean;
}

function target(config: AiConfig): Target {
  if (config.provider === 'ollama-cloud') {
    return { base: OLLAMA_CLOUD_URL, headers: { Authorization: `Bearer ${config.ollamaKey ?? ''}` }, local: false };
  }
  return { base: normalizeOllamaHost(config.ollamaHost ?? ''), headers: {}, local: true };
}

function reasonFor(status: number, message: string): FoodPhotoErrorReason {
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 402 || status === 429) return 'limit';
  if (status === 404) return 'model';
  if (status === 400 && /image|vision|model/i.test(message)) return 'model';
  if (status >= 500) return 'busy';
  return 'other';
}

async function call(t: Target, path: string, body: object | undefined, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let status = 0;
  let text = '';
  try {
    const res = await fetch(t.base + path, {
      method: body ? 'POST' : 'GET',
      headers: body ? { ...t.headers, 'Content-Type': 'application/json' } : t.headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    status = res.status;
    text = await res.text();
  } catch (e) {
    throw new FoodPhotoError(controller.signal.aborted ? 'timeout' : 'network', e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // не JSON: значит, по этому адресу не Ollama или ошибка прокси
  }
  if (status < 200 || status >= 300) {
    const message = String(typeof data?.error === 'string' ? data.error : text).slice(0, 300);
    throw new FoodPhotoError(reasonFor(status, message), `${status} ${message}`.trim());
  }
  return data;
}

export async function estimateWithOllama(config: AiConfig, jpegBase64: string, hint: string): Promise<FoodEstimate> {
  const t = target(config);
  const model = config.provider === 'ollama-cloud' ? config.ollamaCloudModel || DEFAULT_CLOUD_MODEL : (config.ollamaLocalModel ?? '');
  const data = await call(
    t,
    '/api/chat',
    {
      model,
      stream: false,
      format: FOOD_JSON_SCHEMA,
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\n${JSON_PROMPT}` },
        { role: 'user', content: userPrompt(hint), images: [jpegBase64] },
      ],
    },
    // Компьютеру при первом запросе нужно загрузить модель в память
    t.local ? 240_000 : 120_000,
  );
  const content = String(data?.message?.content ?? '');
  const estimate = parseEstimate(content);
  if (!estimate) throw new FoodPhotoError('other', `Нейросеть ответила не по формату: ${content.slice(0, 120)}`);
  return estimate;
}

export interface OllamaModel {
  name: string;
  vision: boolean | null; // null — Ollama не сказала
}

export interface OllamaCloudCheck {
  models: string[]; // модели в облаке
  leftPercent: number | null; // сколько осталось бесплатного лимита, null — облако не сказало
  resetsAt: Date | null; // когда лимит обновится
}

function toDate(v: unknown): Date | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

const percent = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Ответ /api/balance: у новых тарифов остаток в долларах из месячной нормы,
// у старых — проценты лимита на сессию и на неделю (берём тот, что кончится раньше).
function parseBalance(data: any): Pick<OllamaCloudCheck, 'leftPercent' | 'resetsAt'> {
  const inc = data?.included;
  if (typeof inc?.balance_usd === 'number' && typeof inc?.allowance_usd === 'number' && inc.allowance_usd > 0) {
    return { leftPercent: percent((inc.balance_usd / inc.allowance_usd) * 100), resetsAt: toDate(inc.period?.until) };
  }
  const limits = [inc?.session, inc?.weekly].filter((l) => typeof l?.remaining_percent === 'number');
  if (limits.length) {
    const tightest = limits.reduce((a, b) => (b.remaining_percent < a.remaining_percent ? b : a));
    return { leftPercent: percent(tightest.remaining_percent), resetsAt: toDate(tightest.resets_at) };
  }
  return { leftPercent: null, resetsAt: null };
}

// Проверка ключа Ollama Cloud. Список моделей облако отдаёт и без ключа,
// поэтому ключ проверяем запросом остатка лимита: он бесплатный и без ключа не отвечает.
export async function checkOllamaCloud(config: AiConfig): Promise<OllamaCloudCheck> {
  const t = target(config);
  let balance: Pick<OllamaCloudCheck, 'leftPercent' | 'resetsAt'> = { leftPercent: null, resetsAt: null };
  try {
    balance = parseBalance(await call(t, '/api/balance', undefined, 15_000));
  } catch (e) {
    const reason = e instanceof FoodPhotoError ? e.reason : 'other';
    if (reason === 'auth' || reason === 'forbidden' || reason === 'network' || reason === 'timeout') throw e;
    // остаток временно недоступен: ключ это не опровергает
  }
  const models = (await listOllamaModels(config)).map((m) => m.name);
  return { models, ...balance };
}

// Список моделей. Для своей Ollama ещё узнаём, какие из них понимают фото.
export async function listOllamaModels(config: AiConfig): Promise<OllamaModel[]> {
  const t = target(config);
  let data: any;
  try {
    data = await call(t, '/api/tags', undefined, 15_000);
  } catch (e) {
    if (e instanceof FoodPhotoError && (e.reason === 'model' || e.reason === 'other') && t.local) {
      throw new FoodPhotoError('network', `По этому адресу нет Ollama (${e.message})`);
    }
    throw e;
  }
  const names: string[] = (Array.isArray(data?.models) ? data.models : [])
    .map((m: any) => m?.name ?? m?.model)
    .filter((n: unknown): n is string => typeof n === 'string');
  if (!t.local) return names.map((name) => ({ name, vision: null }));

  return Promise.all(
    names.map(async (name): Promise<OllamaModel> => {
      try {
        const info = await call(t, '/api/show', { model: name }, 15_000);
        const caps = info?.capabilities;
        const families = info?.details?.families;
        if (Array.isArray(caps)) return { name, vision: caps.includes('vision') };
        if (Array.isArray(families) && families.some((f: unknown) => f === 'clip' || f === 'mllama')) return { name, vision: true };
        return { name, vision: null };
      } catch {
        return { name, vision: null };
      }
    }),
  );
}
