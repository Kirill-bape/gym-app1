import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconName } from './src/components/ui';
import Home from './src/screens/Home';
import Nutrition from './src/screens/Nutrition';
import Onboarding from './src/screens/Onboarding';
import ProfileScreen from './src/screens/Profile';
import Workouts from './src/screens/Workouts';
import { StoreProvider, useStore } from './src/store';
import { colors, space } from './src/theme';

type Tab = 'home' | 'food' | 'train' | 'profile';

const TABS: { key: Tab; label: string; icon: IconName; iconOn: IconName }[] = [
  { key: 'home', label: 'Главная', icon: 'home-outline', iconOn: 'home' },
  { key: 'train', label: 'Тренировки', icon: 'barbell-outline', iconOn: 'barbell' },
  { key: 'food', label: 'Питание', icon: 'restaurant-outline', iconOn: 'restaurant' },
  { key: 'profile', label: 'Профиль', icon: 'person-outline', iconOn: 'person' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { data, ready } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [editing, setEditing] = useState(false);
  const insets = useSafeAreaInsets();

  if (!ready) {
    return (
      <View style={[styles.fill, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const profile = data.profile;
  if (!profile || editing) {
    return <Onboarding initial={profile} onDone={() => setEditing(false)} />;
  }

  return (
    <View style={styles.fill}>
      <View style={{ flex: 1 }}>
        {tab === 'home' && <Home profile={profile} go={setTab} />}
        {tab === 'food' && <Nutrition profile={profile} onOpenSettings={() => setTab('profile')} />}
        {tab === 'train' && <Workouts profile={profile} />}
        {tab === 'profile' && <ProfileScreen profile={profile} onEdit={() => setEditing(true)} />}
      </View>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + space.sm }]}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
              <Ionicons name={on ? t.iconOn : t.icon} size={24} color={on ? colors.accent : colors.muted} />
              <Text style={{ fontSize: 11, fontWeight: '600', color: on ? colors.accent : colors.muted }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: space.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
});
