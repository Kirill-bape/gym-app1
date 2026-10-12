import { EXERCISES, ExerciseKey } from './exercises';
import { Exercise, Goal, Profile, WorkoutDay } from './types';

type Kind = 'main' | 'acc' | 'core';
type Item = [key: ExerciseKey, kind: Kind, reps?: string];

const T: Record<string, { title: string; focus: string; items: Item[] }> = {
  fullA: {
    title: 'Всё тело A',
    focus: 'Ноги, грудь, спина',
    items: [
      ['squat', 'main'],
      ['bench', 'main'],
      ['lat_pulldown', 'acc'],
      ['db_shoulder_press', 'acc'],
      ['plank', 'core', '45 сек'],
    ],
  },
  fullB: {
    title: 'Всё тело B',
    focus: 'Задняя поверхность, спина, плечи',
    items: [
      ['rdl', 'main'],
      ['incline_db_press', 'main'],
      ['bent_row', 'acc'],
      ['db_lunge', 'acc'],
      ['crunch', 'core', '15'],
    ],
  },
  fullC: {
    title: 'Всё тело C',
    focus: 'Ноги, руки, пресс',
    items: [
      ['leg_press', 'main'],
      ['dips', 'acc'],
      ['seated_row', 'acc'],
      ['barbell_curl', 'acc'],
      ['hanging_leg_raise', 'core', '12'],
    ],
  },
  upperA: {
    title: 'Верх тела A',
    focus: 'Грудь, спина, плечи, руки',
    items: [
      ['bench', 'main'],
      ['bent_row', 'main'],
      ['db_shoulder_press', 'acc'],
      ['lat_pulldown', 'acc'],
      ['barbell_curl', 'acc'],
      ['pushdown', 'acc'],
    ],
  },
  lowerA: {
    title: 'Низ тела A',
    focus: 'Квадрицепсы, ягодицы, пресс',
    items: [
      ['squat', 'main'],
      ['rdl', 'main'],
      ['db_lunge', 'acc'],
      ['leg_curl', 'acc'],
      ['calf_raise', 'acc'],
      ['plank', 'core', '45 сек'],
    ],
  },
  upperB: {
    title: 'Верх тела B',
    focus: 'Верх груди, широчайшие, плечи',
    items: [
      ['incline_db_press', 'main'],
      ['one_arm_row', 'main'],
      ['lateral_raise', 'acc'],
      ['seated_row', 'acc'],
      ['hammer_curl', 'acc'],
      ['dips', 'acc'],
    ],
  },
  lowerB: {
    title: 'Низ тела B',
    focus: 'Ноги, поясница, пресс',
    items: [
      ['leg_press', 'main'],
      ['hyperextension', 'acc'],
      ['leg_extension', 'acc'],
      ['leg_curl', 'acc'],
      ['calf_raise', 'acc'],
      ['crunch', 'core', '15'],
    ],
  },
  push: {
    title: 'Жим',
    focus: 'Грудь, плечи, трицепс',
    items: [
      ['bench', 'main'],
      ['incline_db_press', 'acc'],
      ['db_shoulder_press', 'acc'],
      ['lateral_raise', 'acc'],
      ['pushdown', 'acc'],
    ],
  },
  pull: {
    title: 'Тяга',
    focus: 'Спина, бицепс',
    items: [
      ['pullup', 'main'],
      ['bent_row', 'main'],
      ['seated_row', 'acc'],
      ['face_pull', 'acc'],
      ['barbell_curl', 'acc'],
    ],
  },
  legs: {
    title: 'Ноги',
    focus: 'Квадрицепсы, ягодицы, бицепс бедра',
    items: [
      ['squat', 'main'],
      ['rdl', 'main'],
      ['leg_press', 'acc'],
      ['leg_curl', 'acc'],
      ['calf_raise', 'acc'],
      ['hanging_leg_raise', 'core', '12'],
    ],
  },
};

// Порядок тренировок: i-й выбранный день недели получает i-ю тренировку
const ROTATION: Record<number, string[]> = {
  2: ['fullA', 'fullB'],
  3: ['fullA', 'fullB', 'fullC'],
  4: ['upperA', 'lowerA', 'upperB', 'lowerB'],
  5: ['push', 'pull', 'legs', 'upperB', 'lowerA'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
};

export const MIN_DAYS = 2;
export const MAX_DAYS = 6;

// Дни по умолчанию для старых профилей и подсказки в анкете (0 = Пн)
export const DEFAULT_DAYS: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
};

// Подходы × повторения в зависимости от цели
const SCHEME: Record<Goal, Record<Kind, [number, string]>> = {
  gain: { main: [4, '8'], acc: [3, '10–12'], core: [3, ''] },
  lose: { main: [4, '12'], acc: [3, '15'], core: [3, ''] },
  keep: { main: [3, '10'], acc: [3, '12'], core: [3, ''] },
};

export function getTrainingDays(p: Pick<Profile, 'daysPerWeek' | 'trainingDays'>): number[] {
  const days = p.trainingDays;
  if (days && days.length >= MIN_DAYS && days.length <= MAX_DAYS) return [...days].sort((a, b) => a - b);
  return DEFAULT_DAYS[Math.min(MAX_DAYS, Math.max(MIN_DAYS, p.daysPerWeek))];
}

export function buildPlan(p: Pick<Profile, 'goal' | 'daysPerWeek' | 'trainingDays'>): WorkoutDay[] {
  const days = getTrainingDays(p);
  const rotation = ROTATION[days.length];
  return days.map((weekday, i) => {
    const t = T[rotation[i]];
    const exercises: Exercise[] = t.items.map(([key, kind, reps], idx) => {
      const [sets, schemeReps] = SCHEME[p.goal][kind];
      return { id: `d${weekday}-${idx}`, key, name: EXERCISES[key].name, sets, reps: reps ?? schemeReps };
    });
    if (p.goal === 'lose') {
      exercises.push({ id: `d${weekday}-cardio`, key: 'cardio', name: EXERCISES.cardio.name, sets: 1, reps: '25 мин' });
    }
    return { weekday, title: t.title, focus: t.focus, exercises };
  });
}

// Тренировки всего тела лучше не ставить подряд: мышцам нужен день на восстановление
export function hasBackToBackFullBody(days: number[]): boolean {
  if (days.length > 3) return false;
  const sorted = [...days].sort((a, b) => a - b);
  return sorted.some((d, i) => i > 0 && d - sorted[i - 1] === 1);
}

export function totalSets(day: WorkoutDay): number {
  return day.exercises.reduce((s, e) => s + e.sets, 0);
}

export function doneSets(day: WorkoutDay, progress: Record<string, number> | undefined): number {
  if (!progress) return 0;
  return day.exercises.reduce((s, e) => s + Math.min(e.sets, progress[e.id] ?? 0), 0);
}

export function formatReps(e: Exercise): string {
  return `${e.sets} × ${e.reps}`;
}
