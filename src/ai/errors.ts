export type FoodPhotoErrorReason =
  | 'auth' // ключ неверный
  | 'forbidden' // ключ без доступа или сервис недоступен в этой стране
  | 'billing' // на балансе Anthropic нет денег
  | 'limit' // слишком много запросов
  | 'busy' // сервер перегружен
  | 'network' // нет интернета
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
export const AI_ERROR_TEXT: Record<FoodPhotoErrorReason, string> = {
  auth: 'Ключ не подошёл. Проверь его в профиле.',
  forbidden: 'Anthropic не принял запрос: у ключа нет доступа или сервис не работает в твоей стране.',
  billing: 'На балансе Anthropic закончились деньги. Пополни его в Claude Console (раздел Billing).',
  limit: 'Слишком много запросов подряд. Подожди минуту.',
  busy: 'Сервер ИИ сейчас перегружен. Попробуй через минуту.',
  network: 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.',
  refusal: 'Не получилось распознать это фото. Попробуй другое.',
  other: 'Что-то пошло не так.',
};
