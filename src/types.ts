import type { ExerciseKey } from './exercises';

export type Goal = 'lose' | 'gain' | 'keep';
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'high' | 'extreme';

export interface Profile {
  firstName: string;
  lastName: string;
  goal: Goal;
  sex: Sex;
  age: number;
  height: number; // см
  weight: number; // кг
  targetWeight: number; // кг
  activity: Activity;
  daysPerWeek: number; // 2..6
  trainingDays?: number[]; // выбранные дни недели, 0 = Пн; нет у старых профилей
  createdAt: string;
}

export interface Macros {
  protein: number; // г
  fat: number; // г
  carbs: number; // г
}

export interface FoodEntry {
  id: string;
  name: string;
  kcal: number;
  time: string; // HH:MM
  macros?: Macros; // есть у записей с фото и быстрых продуктов
}

export interface Exercise {
  id: string;
  key: ExerciseKey;
  name: string;
  sets: number;
  reps: string; // "12", "8–10", "45 сек", "25 мин"
}

export interface WorkoutDay {
  weekday: number; // 0 = Пн … 6 = Вс
  title: string;
  focus: string;
  exercises: Exercise[];
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface AppData {
  profile: Profile | null;
  // дата YYYY-MM-DD -> записи еды
  food: Record<string, FoodEntry[]>;
  // ключ недели (дата понедельника) -> id упражнения -> сколько подходов сделано
  progress: Record<string, Record<string, number>>;
  weights: WeightEntry[];
}
