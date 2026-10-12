// Какая нейросеть считает калории по фото. Настройки и ключи хранятся только на телефоне.
export type AiProvider = 'ollama-cloud' | 'ollama-local' | 'claude';

export interface AiConfig {
  provider: AiProvider;
  claudeKey?: string;
  ollamaKey?: string; // ключ ollama.com для облачных моделей
  ollamaCloudModel?: string;
  ollamaHost?: string; // адрес компьютера с Ollama в Wi-Fi сети, например 192.168.1.5
  ollamaLocalModel?: string;
}

export const OLLAMA_CLOUD_URL = 'https://ollama.com';
export const DEFAULT_CLOUD_MODEL = 'gemma4:31b';
export const CLAUDE_MODEL = 'claude-opus-5-5';

export const PROVIDER_NAMES: Record<AiProvider, string> = {
  'ollama-cloud': 'Ollama Cloud',
  'ollama-local': 'Ollama на компьютере',
  claude: 'Claude',
};

export function isAiReady(config: AiConfig | null): config is AiConfig {
  if (!config) return false;
  if (config.provider === 'claude') return !!config.claudeKey;
  if (config.provider === 'ollama-cloud') return !!config.ollamaKey;
  return !!config.ollamaHost && !!config.ollamaLocalModel;
}

export function activeModel(config: AiConfig): string {
  if (config.provider === 'claude') return CLAUDE_MODEL;
  if (config.provider === 'ollama-cloud') return config.ollamaCloudModel || DEFAULT_CLOUD_MODEL;
  return config.ollamaLocalModel ?? '';
}

const OLLAMA_PORT = 11434;

// «192.168.1.5» → «http://192.168.1.5:11434»
export function normalizeOllamaHost(input: string): string {
  let s = input.trim().replace(/\/+$/, '');
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  const m = /^(http:\/\/)([^/:?#]+)(:\d+)?(.*)$/i.exec(s);
  if (m && !m[3]) s = `${m[1]}${m[2]}:${OLLAMA_PORT}${m[4]}`;
  return s;
}
