import { Activity, Goal, Profile } from './types';

export const ACTIVITY: Record<Activity, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Сидячий', hint: 'Учёба или офис, почти без движения' },
  light: { factor: 1.375, label: 'Лёгкий', hint: 'Немного хожу пешком, 1–2 активности в неделю' },
  moderate: { factor: 1.55, label: 'Средний', hint: 'Много хожу, спорт 3–4 раза в неделю' },
  high: { factor: 1.725, label: 'Высокий', hint: 'Спорт почти каждый день' },
  extreme: { factor: 1.9, label: 'Очень высокий', hint: 'Физическая работа + тренировки' },
};

export const GOALS: Record<Goal, { label: string; hint: string; icon: string }> = {
  lose: { label: 'Сбросить вес', hint: 'Дефицит калорий, больше повторений и кардио', icon: 'flame' },
  gain: { label: 'Набрать мышцы', hint: 'Небольшой профицит, тяжёлые базовые упражнения', icon: 'barbell' },
  keep: { label: 'Быть в форме', hint: 'Поддержание веса, сила и выносливость', icon: 'heart' },
};

const KCAL_PER_KG = 7700;

export interface Nutrition {
  bmr: number;
  tdee: number;
  target: number;
  delta: number; // target - tdee (минус = дефицит)
  protein: number; // г
  fat: number; // г
  carbs: number; // г
}

// Формула Миффлина — Сан Жеора
export function calcBmr(p: Pick<Profile, 'sex' | 'weight' | 'height' | 'age'>): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return Math.round(p.sex === 'male' ? base + 5 : base - 161);
}

export function calcNutrition(p: Profile): Nutrition {
  const bmr = calcBmr(p);
  const tdee = Math.round(bmr * ACTIVITY[p.activity].factor);
  let target = tdee;
  if (p.goal === 'lose') {
    const floor = Math.max(bmr, p.sex === 'male' ? 1500 : 1200);
    target = Math.max(tdee - 500, floor);
  } else if (p.goal === 'gain') {
    target = tdee + 300;
  }
  target = Math.round(target / 10) * 10;

  const proteinPerKg = p.goal === 'keep' ? 1.6 : p.goal === 'gain' ? 1.8 : 2.0;
  const protein = Math.round(p.weight * proteinPerKg);
  const fat = Math.round(p.weight * (p.sex === 'female' ? 1.0 : 0.9));
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4));

  return { bmr, tdee, target, delta: target - tdee, protein, fat, carbs };
}

export interface Forecast {
  kgPerWeek: number;
  weeks: number;
}

// Сколько недель до желаемого веса при текущем дефиците/профиците
export function calcForecast(p: Profile, n: Nutrition): Forecast | null {
  const diff = p.targetWeight - p.weight;
  if (Math.abs(diff) < 0.5 || n.delta === 0) return null;
  if (Math.sign(diff) !== Math.sign(n.delta)) return null;
  const kgPerWeek = (Math.abs(n.delta) * 7) / KCAL_PER_KG;
  return { kgPerWeek: Math.round(kgPerWeek * 100) / 100, weeks: Math.ceil(Math.abs(diff) / kgPerWeek) };
}

export function bmi(p: Profile): number {
  const h = p.height / 100;
  return Math.round((p.weight / (h * h)) * 10) / 10;
}
