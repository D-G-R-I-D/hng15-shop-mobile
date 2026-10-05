import { ActivityIndicator, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const t = useTheme();
  const primary = variant === 'primary';
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: t.text }
          : { borderWidth: 1, borderColor: t.line, backgroundColor: t.surface },
        { opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? t.onPrimary : t.text} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? t.onPrimary : t.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[styles.title, { color: t.text }, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const t = useTheme();
  return <Text style={[{ color: t.muted, fontSize: 14 }, style]}>{children}</Text>;
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const t = useTheme();
  const style: TextStyle = { color: bold ? t.text : t.muted, fontSize: bold ? 16 : 14, fontWeight: bold ? '700' : '400' };
  return (
    <View style={styles.row}>
      <Text style={style}>{label}</Text>
      <Text style={[style, { color: t.text, fontVariant: ['tabular-nums'] }]}>{value}</Text>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>{children}</View>
  );
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  title: { fontFamily: Fonts.display, fontSize: 28, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  card: { borderWidth: 1, borderRadius: 20, padding: Spacing.three, gap: Spacing.two },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
});
