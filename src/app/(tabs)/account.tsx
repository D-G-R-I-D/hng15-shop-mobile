import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignInPrompt } from '@/components/sign-in-prompt';
import { Button, Muted, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, formatKobo, shortOrderId } from '@/lib/format';
import type { Order } from '@/lib/types';

export default function AccountScreen() {
  const t = useTheme();
  const { status, user, token, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  // Refetch whenever the tab is shown, so a just-placed order appears.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api<{ orders: Order[] }>('/api/orders', { token })
        .then((d) => setOrders(d.orders))
        .catch(() => {});
    }, [token]),
  );

  if (status !== 'signed-in') {
    return (
      <SignInPrompt
        title="Welcome to Oja"
        message="Sign in with the same Google account you use on the website."
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <FlatList
        data={orders ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ gap: Spacing.four, marginBottom: Spacing.three }}>
            <View style={styles.profile}>
              {user?.image ? <Image source={user.image} style={styles.avatar} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: t.text }]}>{user?.name ?? 'Signed in'}</Text>
                <Muted>{user?.email}</Muted>
              </View>
            </View>
            <Title style={{ fontSize: 22 }}>Your orders</Title>
          </View>
        }
        ListEmptyComponent={<Muted>{orders ? 'No orders yet.' : 'Loading…'}</Muted>}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: t.line }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.order, { opacity: pressed ? 0.6 : 1 }]}>
            <View>
              <Text style={[styles.orderId, { color: t.text }]}>#{shortOrderId(item.id)}</Text>
              <Muted>{formatDate(item.createdAt)}</Muted>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.orderId, { color: t.text }]}>{formatKobo(item.totalKobo)}</Text>
              <Muted style={{ textTransform: 'capitalize' }}>{item.status}</Muted>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <View style={{ marginTop: Spacing.five }}>
            <Button title="Sign out" variant="outline" onPress={signOut} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, paddingBottom: 140 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  name: { fontSize: 18, fontWeight: '600' },
  order: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.three },
  orderId: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
