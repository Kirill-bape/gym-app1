import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dateKey, timeNow, weekKey } from './dates';
import { AppData, FoodEntry, Profile } from './types';

const KEY = 'forma:data:v1';
const EMPTY: AppData = { profile: null, food: {}, progress: {}, weights: [] };

interface Store {
  data: AppData;
  ready: boolean;
  saveProfile: (p: Profile) => void;
  addFood: (name: string, kcal: number) => void;
  removeFood: (id: string) => void;
  tapSet: (exerciseId: string, setIndex: number) => void;
  logWeight: (weight: number) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setData({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      data,
      ready,
      saveProfile: (p) =>
        update((d) => {
          const weights = d.weights.length ? d.weights : [{ date: dateKey(), weight: p.weight }];
          return { ...d, profile: p, weights };
        }),
      addFood: (name, kcal) =>
        update((d) => {
          const day = dateKey();
          const entry: FoodEntry = { id: `${Date.now()}`, name, kcal, time: timeNow() };
          return { ...d, food: { ...d.food, [day]: [...(d.food[day] ?? []), entry] } };
        }),
      removeFood: (id) =>
        update((d) => {
          const day = dateKey();
          return { ...d, food: { ...d.food, [day]: (d.food[day] ?? []).filter((e) => e.id !== id) } };
        }),
      // Нажатие на кружок подхода: отмечает все подходы до него; повторное нажатие на последний снимает его
      tapSet: (exerciseId, setIndex) =>
        update((d) => {
          const wk = weekKey();
          const week = d.progress[wk] ?? {};
          const done = week[exerciseId] ?? 0;
          const next = done === setIndex + 1 ? setIndex : setIndex + 1;
          return { ...d, progress: { ...d.progress, [wk]: { ...week, [exerciseId]: next } } };
        }),
      logWeight: (weight) =>
        update((d) => {
          const today = dateKey();
          const weights = [...d.weights.filter((w) => w.date !== today), { date: today, weight }];
          return { ...d, weights, profile: d.profile ? { ...d.profile, weight } : null };
        }),
      resetAll: () => update(() => EMPTY),
    }),
    [data, ready, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
