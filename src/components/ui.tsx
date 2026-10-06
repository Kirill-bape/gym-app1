import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, font, radius, space } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {title ? (
        <View>
          {subtitle ? <Text style={font.small}>{subtitle}</Text> : null}
          <Text style={font.h1}>{title}</Text>
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: IconName;
}) {
  const bg = variant === 'primary' ? colors.accent : variant === 'danger' ? 'transparent' : colors.cardAlt;
  const fg = variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 },
        variant === 'danger' && { borderWidth: 1, borderColor: colors.danger },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, suffix, ...props }: TextInputProps & { label: string; suffix?: string }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text style={font.label}>{label}</Text>
      <View style={styles.input}>
        <TextInput placeholderTextColor={colors.muted} style={styles.inputText} {...props} />
        {suffix ? <Text style={font.small}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Option({
  title,
  hint,
  icon,
  selected,
  onPress,
}: {
  title: string;
  hint?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      {icon ? (
        <View style={[styles.optionIcon, selected && { backgroundColor: colors.accent }]}>
          <Ionicons name={icon} size={22} color={selected ? colors.onAccent : colors.text} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={font.h3}>{title}</Text>
        {hint ? <Text style={[font.small, { marginTop: 2 }]}>{hint}</Text> : null}
      </View>
      <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={selected ? colors.accent : colors.border} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, dot }: { label: string; active: boolean; onPress: () => void; dot?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
      <Text style={{ color: active ? colors.onAccent : colors.text, fontWeight: '700' }}>{label}</Text>
      {dot !== undefined ? <View style={[styles.dot, { backgroundColor: !dot ? 'transparent' : active ? colors.onAccent : colors.accent }]} /> : null}
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.accent, height = 8 }: { value: number; color?: string; height?: number }) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.cardAlt, overflow: 'hidden' }}>
      <View style={{ width: `${v * 100}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

export function Ring({
  value,
  size = 160,
  stroke = 14,
  color = colors.accent,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Stat({ label, value, color = colors.text }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[font.h3, { color }]}>{value}</Text>
      <Text style={font.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    height: 54,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.xl,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    height: 54,
    gap: space.sm,
  },
  inputText: { flex: 1, minWidth: 0, color: colors.text, fontSize: 17 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.accent },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
});
