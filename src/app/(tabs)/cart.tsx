import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInPrompt } from '@/components/sign-in-prompt';
import { Button, Card, Centered, Muted, Row, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatKobo } from '@/lib/format';
import type { CartLine } from '@/lib/types';

const FREE_SHIPPING_KOBO = 50_000_00;

export default function CartScreen() {
  const t = useTheme();
  const { status } = useAuth();
  const { cart, live, refresh, setQuantity, remove } = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (status !== 'signed-in') {
    return (
      <SignInPrompt
        title="Sign in to see your cart"
        message="Your cart is saved to your account, so anything you add on the website shows up here instantly."
      />
    );
  }
  if (!cart) {
    return (
      <Centered>
        <ActivityIndicator color={t.text} />
      </Centered>
    );
  }

  async function change(line: CartLine, quantity: number) {
    setBusy(line.productId);
    try {
      if (quantity <= 0) await remove(line.productId);
      else await setQuantity(line.productId, quantity);
    } catch (e) {
      Alert.alert('Could not update cart', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  }

  const toFree = FREE_SHIPPING_KOBO - cart.subtotalKobo;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <FlatList
        data={cart.lines}
        keyExtractor={(l) => l.productId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Title>Your cart</Title>
            <View style={styles.liveRow}>
              <View style={[styles.dot, { backgroundColor: live ? '#16a34a' : t.muted }]} />
              <Muted style={{ fontSize: 13 }}>
                {live ? 'Live — synced with the website' : 'Connecting to live sync…'}
              </Muted>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: Spacing.five, gap: Spacing.three }}>
            <Muted style={{ fontSize: 16 }}>Your cart is empty. Items you add on the website appear here too.</Muted>
            <Button title="Browse products" variant="outline" onPress={() => router.navigate('/')} />
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.line }} />}
        renderItem={({ item }) => (
          <View style={[styles.line, { opacity: busy === item.productId ? 0.5 : 1 }]}>
            <Pressable
              onPress={() => router.push({ pathname: '/product/[slug]', params: { slug: item.slug } })}
              style={[styles.thumb, { backgroundColor: t.surface }]}>
              <Image source={item.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" />
            </Pressable>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: t.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Muted>{formatKobo(item.priceKobo)} each</Muted>
              <View style={styles.controls}>
                <Stepper label="−" onPress={() => change(item, item.quantity - 1)} disabled={busy !== null} />
                <Text style={[styles.qty, { color: t.text }]}>{item.quantity}</Text>
                <Stepper
                  label="+"
                  onPress={() => change(item, item.quantity + 1)}
                  disabled={busy !== null || item.quantity >= item.stock}
                />
                <Text onPress={() => change(item, 0)} style={[styles.remove, { color: t.muted }]}>
                  Remove
                </Text>
              </View>
            </View>
            <Text style={[styles.lineTotal, { color: t.text }]}>{formatKobo(item.priceKobo * item.quantity)}</Text>
          </View>
        )}
        ListFooterComponent={
          cart.lines.length > 0 ? (
            <View style={{ gap: Spacing.three, marginTop: Spacing.three }}>
              <Card>
                <Row label="Subtotal" value={formatKobo(cart.subtotalKobo)} />
                <Row label="Delivery" value={cart.shippingKobo === 0 ? 'Free' : formatKobo(cart.shippingKobo)} />
                <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />
                <Row label="Total" value={formatKobo(cart.totalKobo)} bold />
              </Card>
              {toFree > 0 && <Muted>Add {formatKobo(toFree)} more for free delivery.</Muted>}
              <Button title="Checkout" onPress={() => router.push('/checkout')} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function Stepper({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Increase quantity' : 'Decrease quantity'}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.stepper, { borderColor: t.line, opacity: disabled ? 0.4 : 1 }]}>
      <Text style={{ color: t.text, fontSize: 18, lineHeight: 20 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, paddingBottom: 140 },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.three },
  thumb: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  name: { fontSize: 15, fontWeight: '500' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 4 },
  stepper: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center', fontSize: 15, fontVariant: ['tabular-nums'] },
  remove: { marginLeft: Spacing.two, fontSize: 13, textDecorationLine: 'underline' },
  lineTotal: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
