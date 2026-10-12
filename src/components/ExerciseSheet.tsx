import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EXERCISES, ExerciseInfo, videoSearchUrl } from '../exercises';
import { formatReps } from '../plan';
import { colors, font, radius, space } from '../theme';
import { Exercise } from '../types';
import { Button, Card } from './ui';

// Карточка упражнения: как выполнять, частые ошибки и фото начала и конца движения
export default function ExerciseSheet({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  return (
    <Modal visible={exercise !== null} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {exercise ? <Content exercise={exercise} onClose={onClose} /> : null}
    </Modal>
  );
}

function Content({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const info = EXERCISES[exercise.key];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl, gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
          <Text style={[font.h1, { flex: 1, fontSize: 26 }]}>{info.name}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Закрыть">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Motion images={info.images} />

        <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
          <Pill icon="repeat" text={formatReps(exercise)} />
          {exercise.key !== 'cardio' ? <Pill icon="timer-outline" text="отдых 60–90 сек" /> : null}
        </View>

        <Card>
          <Text style={font.label}>Работают мышцы</Text>
          <Text style={font.body}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Основные: </Text>
            {info.primary}
          </Text>
          {info.secondary ? (
            <Text style={font.body}>
              <Text style={{ color: colors.muted, fontWeight: '700' }}>Помогают: </Text>
              {info.secondary}
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text style={font.label}>Как выполнять</Text>
          {info.steps.map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <View style={styles.stepNum}>
                <Text style={{ color: colors.onAccent, fontWeight: '800', fontSize: 13 }}>{i + 1}</Text>
              </View>
              <Text style={[font.body, { flex: 1, lineHeight: 22 }]}>{step}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={font.label}>Частые ошибки</Text>
          {info.mistakes.map((m) => (
            <View key={m} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
              <Text style={[font.body, { flex: 1 }]}>{m}</Text>
            </View>
          ))}
        </Card>

        {info.tip ? (
          <Card style={{ borderColor: colors.accent }}>
            <View style={{ flexDirection: 'row', gap: space.md }}>
              <Ionicons name="bulb-outline" size={20} color={colors.accent} />
              <Text style={[font.body, { flex: 1, lineHeight: 22 }]}>{info.tip}</Text>
            </View>
          </Card>
        ) : null}

        <Button title="Видео с техникой на YouTube" icon="logo-youtube" variant="secondary" onPress={() => Linking.openURL(videoSearchUrl(exercise.key))} />
        <Text style={[font.small, { textAlign: 'center', fontSize: 11 }]}>Фото: Free Exercise DB, общественное достояние</Text>
      </ScrollView>
    </View>
  );
}

// Два фото (начало и конец движения) плавно сменяют друг друга, как короткая анимация
function Motion({ images }: { images: ExerciseInfo['images'] }) {
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(fade, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade]);

  return (
    <View style={styles.motion}>
      <Image source={images[0]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.Image source={images[1]} style={[StyleSheet.absoluteFill, { opacity: fade }]} resizeMode="cover" />
      <View style={styles.motionBadge}>
        <Ionicons name="play" size={12} color={colors.onAccent} />
        <Text style={{ color: colors.onAccent, fontSize: 12, fontWeight: '700' }}>начало → конец движения</Text>
      </View>
    </View>
  );
}

function Pill({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={[font.body, { fontWeight: '700' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  motion: { width: '100%', aspectRatio: 1.5, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.card },
  motionBadge: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 4,
  },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
});
