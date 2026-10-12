import type { AiProvider } from './config';

export type FoodPhotoErrorReason =
  | 'auth' // ключ неверный
  | 'forbidden' // у ключа нет доступа или сервис недоступен в этой стране
  | 'billing' // на балансе нет денег
  | 'limit' // слишком много запросов или кончился бесплатный лимит
  | 'busy' // сервер перегружен или упал
  | 'network' // нет связи с сервером или компьютером
  | 'timeout' // сервер не ответил вовремя
  | 'model' // модель не найдена или не понимает фото
  | 'refusal' // модель отказалась отвечать по этому фото
  | 'other';

export class FoodPhotoError extends Error {
  constructor(
    public reason: FoodPhotoErrorReason,
    message?: string,
  ) {
    super(message ?? reason);
  }
}

// Тексты ошибок для пользователя
export function aiErrorText(reason: FoodPhotoErrorReason, provider: AiProvider): string {
  const local = provider === 'ollama-local';
  const cloud = provider === 'ollama-cloud';
  switch (reason) {
    case 'auth':
      return cloud ? 'Ключ Ollama не подошёл. Проверь его в профиле.' : 'Ключ не подошёл. Проверь его в профиле.';
    case 'forbidden':
      return cloud
        ? 'Ollama не пускает к этой модели. Проверь ключ или выбери другую модель в профиле.'
        : 'Anthropic не принял запрос: у ключа нет доступа или сервис не работает в твоей стране.';
    case 'billing':
      return 'На балансе Anthropic закончились деньги. Пополни его в Claude Console (раздел Billing).';
    case 'limit':
      if (cloud) return 'Бесплатный лимит Ollama Cloud пока исчерпан. Попробуй позже или переключись на Ollama на компьютере.';
      if (local) return 'Ollama на компьютере занята другим запросом. Подожди немного.';
      return 'Слишком много запросов подряд. Подожди минуту.';
    case 'busy':
      return local ? 'Ollama на компьютере выдала ошибку. Перезапусти её и попробуй ещё раз.' : 'Сервер нейросети сейчас перегружен. Попробуй через минуту.';
    case 'network':
      return local
        ? 'Не достучался до компьютера с Ollama. Проверь, что он включён, Ollama запущена и открыта для Wi-Fi, а телефон в той же сети.'
        : 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.';
    case 'timeout':
      return local
        ? 'Компьютер не ответил вовремя. Первый запуск модели бывает долгим, попробуй ещё раз.'
        : 'Сервер не ответил вовремя. Попробуй ещё раз.';
    case 'model':
      return local
        ? 'Модель не найдена или не понимает фото. Выбери в профиле модель с фото, например gemma4.'
        : 'Модель не найдена или не понимает фото. Проверь название модели в профиле.';
    case 'refusal':
      return 'Не получилось распознать это фото. Попробуй другое.';
    default:
      return 'Что-то пошло не так.';
  }
}
