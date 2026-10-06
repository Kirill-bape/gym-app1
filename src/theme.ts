export const colors = {
  bg: '#0E0F12',
  card: '#181A1F',
  cardAlt: '#20232A',
  border: '#2A2D35',
  text: '#F5F6F7',
  muted: '#8B909A',
  accent: '#C6F432',
  onAccent: '#0E0F12',
  blue: '#6C8CFF',
  orange: '#FF9F43',
  pink: '#FF6B9A',
  danger: '#FF5C5C',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const font = {
  h1: { fontSize: 30, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.muted, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
};
