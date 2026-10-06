import { Exercise, Goal, Profile, WorkoutDay } from './types';

type Kind = 'main' | 'acc' | 'core';
type Item = [name: string, kind: Kind, reps?: string];

const T: Record<string, { title: string; focus: string; items: Item[] }> = {
  fullA: {
    title: 'Всё тело A',
    focus: 'Ноги, грудь, спина',
    items: [
      ['Приседания со штангой', 'main'],
      ['Жим штанги лёжа', 'main'],
      ['Тяга верхнего блока', 'acc'],
      ['Жим гантелей сидя', 'acc'],
      ['Планка', 'core', '45 сек'],
    ],
  },
  fullB: {
    title: 'Всё тело B',
    focus: 'Задняя поверхность, спина, плечи',
    items: [
      ['Румынская тяга', 'main'],
      ['Жим гантелей на наклонной скамье', 'main'],
      ['Тяга штанги в наклоне', 'acc'],
      ['Выпады с гантелями', 'acc'],
      ['Скручивания', 'core', '15'],
    ],
  },
  fullC: {
    title: 'Всё тело C',
    focus: 'Ноги, руки, пресс',
    items: [
      ['Жим ногами', 'main'],
      ['Отжимания на брусьях', 'acc'],
      ['Тяга горизонтального блока', 'acc'],
      ['Подъём штанги на бицепс', 'acc'],
      ['Подъём ног в висе', 'core', '12'],
    ],
  },
  upperA: {
    title: 'Верх тела A',
    focus: 'Грудь, спина, плечи, руки',
    items: [
      ['Жим штанги лёжа', 'main'],
      ['Тяга штанги в наклоне', 'main'],
      ['Жим гантелей сидя', 'acc'],
      ['Тяга верхнего блока', 'acc'],
      ['Подъём штанги на бицепс', 'acc'],
      ['Разгибание рук на блоке', 'acc'],
    ],
  },
  lowerA: {
    title: 'Низ тела A',
    focus: 'Квадрицепсы, ягодицы, пресс',
    items: [
      ['Приседания со штангой', 'main'],
      ['Румынская тяга', 'main'],
      ['Выпады с гантелями', 'acc'],
      ['Сгибание ног в тренажёре', 'acc'],
      ['Подъём на носки', 'acc'],
      ['Планка', 'core', '45 сек'],
    ],
  },
  upperB: {
    title: 'Верх тела B',
    focus: 'Верх груди, широчайшие, плечи',
    items: [
      ['Жим гантелей на наклонной скамье', 'main'],
      ['Тяга гантели одной рукой', 'main'],
      ['Разведение гантелей в стороны', 'acc'],
      ['Тяга горизонтального блока', 'acc'],
      ['Молотки с гантелями', 'acc'],
      ['Отжимания на брусьях', 'acc'],
    ],
  },
  lowerB: {
    title: 'Низ тела B',
    focus: 'Ноги, поясница, пресс',
    items: [
      ['Жим ногами', 'main'],
      ['Гиперэкстензия', 'acc'],
      ['Разгибание ног в тренажёре', 'acc'],
      ['Сгибание ног в тренажёре', 'acc'],
      ['Подъём на носки', 'acc'],
      ['Скручивания', 'core', '15'],
    ],
  },
  push: {
    title: 'Жим',
    focus: 'Грудь, плечи, трицепс',
    items: [
      ['Жим штанги лёжа', 'main'],
      ['Жим гантелей на наклонной скамье', 'acc'],
      ['Жим гантелей сидя', 'acc'],
      ['Разведение гантелей в стороны', 'acc'],
      ['Разгибание рук на блоке', 'acc'],
    ],
  },
  pull: {
    title: 'Тяга',
    focus: 'Спина, бицепс',
    items: [
      ['Подтягивания / тяга верхнего блока', 'main'],
      ['Тяга штанги в наклоне', 'main'],
      ['Тяга горизонтального блока', 'acc'],
      ['Тяга каната к лицу', 'acc'],
      ['Подъём штанги на бицепс', 'acc'],
    ],
  },
  legs: {
    title: 'Ноги',
    focus: 'Квадрицепсы, ягодицы, бицепс бедра',
    items: [
      ['Приседания со штангой', 'main'],
      ['Румынская тяга', 'main'],
      ['Жим ногами', 'acc'],
      ['Сгибание ног в тренажёре', 'acc'],
      ['Подъём на носки', 'acc'],
      ['Подъём ног в висе', 'core', '12'],
    ],
  },
};

// Какие тренировки и в какие дни недели (0 = Пн)
const SCHEDULE: Record<number, [number, string][]> = {
  2: [[0, 'fullA'], [3, 'fullB']],
  3: [[0, 'fullA'], [2, 'fullB'], [4, 'fullC']],
  4: [[0, 'upperA'], [1, 'lowerA'], [3, 'upperB'], [4, 'lowerB']],
  5: [[0, 'push'], [1, 'pull'], [2, 'legs'], [3, 'upperB'], [4, 'lowerA']],
  6: [[0, 'push'], [1, 'pull'], [2, 'legs'], [3, 'push'], [4, 'pull'], [5, 'legs']],
};

// Подходы × повторения в зависимости от цели
const SCHEME: Record<Goal, Record<Kind, [number, string]>> = {
  gain: { main: [4, '8'], acc: [3, '10–12'], core: [3, ''] },
  lose: { main: [4, '12'], acc: [3, '15'], core: [3, ''] },
  keep: { main: [3, '10'], acc: [3, '12'], core: [3, ''] },
};

export function buildPlan(p: Pick<Profile, 'goal' | 'daysPerWeek'>): WorkoutDay[] {
  const days = Math.min(6, Math.max(2, p.daysPerWeek));
  return SCHEDULE[days].map(([weekday, key]) => {
    const t = T[key];
    const exercises: Exercise[] = t.items.map(([name, kind, reps], i) => {
      const [sets, schemeReps] = SCHEME[p.goal][kind];
      return { id: `d${weekday}-${i}`, name, sets, reps: reps ?? schemeReps };
    });
    if (p.goal === 'lose') {
      exercises.push({ id: `d${weekday}-cardio`, name: 'Кардио: дорожка в гору или велотренажёр', sets: 1, reps: '25 мин' });
    }
    return { weekday, title: t.title, focus: t.focus, exercises };
  });
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
