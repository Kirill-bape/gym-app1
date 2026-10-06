const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 0 = понедельник … 6 = воскресенье
export function weekdayIndex(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

// Ключ недели: дата понедельника этой недели
export function weekKey(d: Date = new Date()): string {
  const monday = new Date(d);
  monday.setDate(d.getDate() - weekdayIndex(d));
  return dateKey(monday);
}

export function timeNow(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export function humanDate(d: Date = new Date()): string {
  return `${WEEKDAYS_FULL[weekdayIndex(d)]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
