import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { colors, font, space } from '../theme';
import { AppUpdate, checkForUpdate } from '../update';
import { Card } from './ui';

// Плашка «Есть новая версия»: ссылка ведёт на свежий APK в GitHub Releases
export default function UpdateBanner() {
  const [update, setUpdate] = useState<AppUpdate | null>(null);

  useEffect(() => {
    let alive = true;
    checkForUpdate().then((u) => alive && setUpdate(u));
    return () => {
      alive = false;
    };
  }, []);

  if (!update) return null;
  return (
    <Pressable onPress={() => Linking.openURL(update.url)}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderColor: colors.accent }}>
        <Ionicons name="arrow-down-circle" size={32} color={colors.accent} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={font.h3}>Вышла новая версия</Text>
          <Text style={font.small}>Нажми, чтобы скачать и установить. Твои данные сохранятся.</Text>
        </View>
      </Card>
    </Pressable>
  );
}
