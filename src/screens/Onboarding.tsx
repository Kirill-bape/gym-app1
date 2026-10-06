import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACTIVITY, GOALS, calcForecast, calcNutrition } from '../calc';
import { Button, Card, Chip, Field, Option, ProgressBar, Stat } from '../components/ui';
import { WEEKDAYS_SHORT, plural } from '../dates';
import { buildPlan, formatReps } from '../plan';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Activity, Goal, Profile, Sex } from '../types';

const STEPS = 8; // 0 — приветствие, 7 — итог

const num = (s: string) => {
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

export default function Onboarding({ initial, onDone }: { initial?: Profile | null; onDone?: () => void }) {
  const insets = useSafeAreaInsets();
  const { saveProfile } = useStore();
  const [step, setStep] = useState(initial ? 1 : 0);

  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [goal, setGoal] = useState<Goal | null>(initial?.goal ?? null);
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [age, setAge] = useState(initial ? String(initial.age) : '');
  const [height, setHeight] = useState(initial ? String(initial.height) : '');
  const [weight, setWeight] = useState(initial ? String(initial.weight) : '');
  const [targetWeight, setTargetWeight] = useState(initial ? String(initial.targetWeight) : '');
  const [activity, setActivity] = useState<Activity | null>(initial?.activity ?? null);
  const [days, setDays] = useState(initial?.daysPerWeek ?? 3);

  const valid = [
    true,
    firstName.trim().length > 0,
    goal !== null,
    sex !== null && num(age) >= 12 && num(age) <= 90,
    num(height) >= 120 && num(height) <= 230 && num(weight) >= 30 && num(weight) <= 250 && num(targetWeight) >= 30 && num(targetWeight) <= 250,
    activity !== null,
    days >= 2 && days <= 6,
    true,
  ];

  const profile: Profile | null = useMemo(() => {
    if (!goal || !sex || !activity) return null;
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      goal,
      sex,
      age: Math.round(num(age)),
      height: Math.round(num(height)),
      weight: num(weight),
      targetWeight: num(targetWeight),
      activity,
      daysPerWeek: days,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
  }, [firstName, lastName, goal, sex, age, height, weight, targetWeight, activity, days, initial]);

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else if (profile) {
      saveProfile(profile);
      onDone?.();
    }
  };
  const back = () => {
    if (step > (initial ? 1 : 0)) setStep(step - 1);
    else onDone?.();
  };

  if (step === 0) return <Welcome onStart={next} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + space.md, paddingHorizontal: space.lg, gap: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Pressable onPress={back} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <ProgressBar value={step / (STEPS - 1)} height={6} />
          </View>
          <Text style={font.small}>
            {step}/{STEPS - 1}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <Title title="Как тебя зовут?" hint="Так приложение будет к тебе обращаться" />
            <Field label="Имя" value={firstName} onChangeText={setFirstName} placeholder="Кирилл" autoFocus />
            <Field label="Фамилия" value={lastName} onChangeText={setLastName} placeholder="Необязательно" />
          </>
        )}

        {step === 2 && (
          <>
            <Title title="Какая у тебя цель?" hint="От цели зависят калории и программа тренировок" />
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <Option
                key={g}
                title={GOALS[g].label}
                hint={GOALS[g].hint}
                icon={GOALS[g].icon as never}
                selected={goal === g}
                onPress={() => setGoal(g)}
              />
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <Title title="Немного о тебе" hint="Нужно, чтобы правильно посчитать обмен веществ" />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <SexCard label="Мужской" icon="male" active={sex === 'male'} onPress={() => setSex('male')} />
              <SexCard label="Женский" icon="female" active={sex === 'female'} onPress={() => setSex('female')} />
            </View>
            <Field label="Возраст" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="20" suffix="лет" />
          </>
        )}

        {step === 4 && (
          <>
            <Title title="Параметры" hint="Вес можно будет обновлять в профиле" />
            <Field label="Рост" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="180" suffix="см" />
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <Field label="Текущий вес" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="85" suffix="кг" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Желаемый вес" value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" placeholder="78" suffix="кг" />
              </View>
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Title title="Насколько ты активен?" hint="Не считая будущих тренировок в зале" />
            {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
              <Option key={a} title={ACTIVITY[a].label} hint={ACTIVITY[a].hint} selected={activity === a} onPress={() => setActivity(a)} />
            ))}
          </>
        )}

        {step === 6 && (
          <>
            <Title title="Сколько раз в неделю готов ходить в зал?" hint="Новичкам лучше начать с 3 раз" />
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              {[2, 3, 4, 5, 6].map((d) => (
                <View key={d} style={{ flex: 1 }}>
                  <Chip label={String(d)} active={days === d} onPress={() => setDays(d)} />
                </View>
              ))}
            </View>
            <Card>
              <Text style={font.label}>Дни тренировок</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {WEEKDAYS_SHORT.map((w, i) => {
                  const on = buildPlan({ goal: goal ?? 'keep', daysPerWeek: days }).some((d) => d.weekday === i);
                  return (
                    <View key={w} style={[styles.dayDot, on && { backgroundColor: colors.accent }]}>
                      <Text style={{ color: on ? colors.onAccent : colors.muted, fontWeight: '700', fontSize: 12 }}>{w}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {step === 7 && profile && <Summary profile={profile} />}
      </ScrollView>

      <View style={{ padding: space.lg, paddingBottom: insets.bottom + space.lg }}>
        <Button title={step === STEPS - 1 ? 'Поехали!' : 'Дальше'} onPress={next} disabled={!valid[step]} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.xl, paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
        <View style={styles.logo}>
          <Ionicons name="barbell" size={44} color={colors.onAccent} />
        </View>
        <Text style={[font.h1, { fontSize: 44 }]}>Форма</Text>
        <Text style={[font.body, { color: colors.muted, fontSize: 18, lineHeight: 26 }]}>
          Личный план тренировок и питания. Ответь на несколько вопросов, и мы посчитаем калории и составим программу на неделю.
        </Text>
        <View style={{ gap: space.md, marginTop: space.lg }}>
          {[
            ['flame', 'Норма калорий под твою цель'],
            ['calendar', 'Программа на неделю с подходами'],
            ['trending-down', 'Прогноз, когда дойдёшь до цели'],
          ].map(([icon, text]) => (
            <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Ionicons name={icon as never} size={20} color={colors.accent} />
              <Text style={font.body}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
      <Button title="Начать" onPress={onStart} icon="arrow-forward" />
    </View>
  );
}

function Title({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ gap: space.xs, marginBottom: space.sm }}>
      <Text style={font.h1}>{title}</Text>
      {hint ? <Text style={[font.body, { color: colors.muted }]}>{hint}</Text> : null}
    </View>
  );
}

function SexCard({ label, icon, active, onPress }: { label: string; icon: 'male' | 'female'; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.sex, active && { borderColor: colors.accent }]}>
      <Ionicons name={icon} size={32} color={active ? colors.accent : colors.muted} />
      <Text style={font.h3}>{label}</Text>
    </Pressable>
  );
}

function Summary({ profile }: { profile: Profile }) {
  const n = calcNutrition(profile);
  const f = calcForecast(profile, n);
  const plan = buildPlan(profile);
  return (
    <>
      <Title title={`${profile.firstName}, всё готово`} hint="Вот твой стартовый план. Его можно поменять в любой момент." />
      <Card style={{ backgroundColor: colors.accent, borderColor: colors.accent }}>
        <Text style={[font.label, { color: colors.onAccent }]}>Норма в день</Text>
        <Text style={{ fontSize: 44, fontWeight: '800', color: colors.onAccent }}>{n.target} ккал</Text>
        <Text style={{ color: colors.onAccent }}>
          {n.delta < 0 ? `Дефицит ${-n.delta} ккал от расхода ${n.tdee}` : n.delta > 0 ? `Профицит ${n.delta} ккал к расходу ${n.tdee}` : `Равно твоему расходу ${n.tdee} ккал`}
        </Text>
      </Card>
      <Card>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Белки" value={`${n.protein} г`} color={colors.blue} />
          <Stat label="Жиры" value={`${n.fat} г`} color={colors.orange} />
          <Stat label="Углеводы" value={`${n.carbs} г`} color={colors.pink} />
        </View>
      </Card>
      {f ? (
        <Card>
          <Text style={font.label}>Прогноз</Text>
          <Text style={font.h2}>
            ≈ {f.weeks} {plural(f.weeks, 'неделя', 'недели', 'недель')} до {profile.targetWeight} кг
          </Text>
          <Text style={font.small}>Темп около {f.kgPerWeek} кг в неделю, если держать норму калорий.</Text>
        </Card>
      ) : null}
      <Card>
        <Text style={font.label}>Тренировки · {plan.length} в неделю</Text>
        {plan.map((d) => (
          <View key={d.weekday} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <View style={[styles.dayDot, { backgroundColor: colors.accent }]}>
              <Text style={{ color: colors.onAccent, fontWeight: '700', fontSize: 12 }}>{WEEKDAYS_SHORT[d.weekday]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={font.h3}>{d.title}</Text>
              <Text style={font.small} numberOfLines={1}>
                {d.exercises[0].name} {formatReps(d.exercises[0])} и ещё {d.exercises.length - 1}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 84, height: 84, borderRadius: radius.lg, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sex: {
    flex: 1,
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dayDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center' },
});
