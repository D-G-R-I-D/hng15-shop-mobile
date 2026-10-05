import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Centered, Muted, Row, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatKobo, shortOrderId } from '@/lib/format';
import type { Order, OrderItem } from '@/lib/types';

export default function OrderScreen() {
  const t = useTheme();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const { token } = useAuth();
  const [data, setData] = useState<{ order: Order; items: OrderItem[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ order: Order; items: OrderItem[] }>(`/api/orders/${id}`, { token })
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id, token]);

  if (!data) {
    return <Centered>{error ? <Muted>{error}</Muted> : <ActivityIndicator color={t.text} />}</Centered>;
  }
  const { order, items } = data;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {placed && (
        <Card>
          <Title style={{ fontSize: 24 }}>Thank you for your order!</Title>
          <Muted style={{ fontSize: 15 }}>
            {order.confirmationSentAt
              ? `A confirmation email is on its way to ${order.email}.`
              : 'Your order is saved. The confirmation email could not be sent just now.'}
          </Muted>
        </Card>
      )}

      <View style={{ gap: 2 }}>
        <Text style={[styles.heading, { color: t.text }]}>Order #{shortOrderId(order.id)}</Text>
        <Muted>
          Placed {formatDate(order.createdAt)} · <Text style={{ textTransform: 'capitalize' }}>{order.status}</Text>
        </Muted>
      </View>

      <Card>
        {items.map((item) => (
          <Row key={item.id} label={`${item.name} × ${item.quantity}`} value={formatKobo(item.unitPriceKobo * item.quantity)} />
        ))}
        <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />
        <Row label="Subtotal" value={formatKobo(order.subtotalKobo)} />
        <Row label="Delivery" value={order.shippingKobo === 0 ? 'Free' : formatKobo(order.shippingKobo)} />
        <Row label="Total" value={formatKobo(order.totalKobo)} bold />
      </Card>

      <Card>
        <Text style={[styles.label, { color: t.text }]}>Delivering to</Text>
        <Muted style={{ lineHeight: 21 }}>
          {order.fullName}
          {'\n'}
          {order.address}
          {'\n'}
          {order.city}, {order.state}
          {'\n'}
          {order.phone}
        </Muted>
        <Muted>Payment: on delivery</Muted>
      </Card>

      {placed && <Button title="Continue shopping" variant="outline" onPress={() => router.navigate('/')} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five * 2 },
  heading: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600' },
});
