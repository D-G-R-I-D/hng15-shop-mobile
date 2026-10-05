import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Centered, Muted, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatKobo } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function ShopScreen() {
  const t = useTheme();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api<{ products: Product[] }>('/api/products');
      setProducts(data.products);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products');
    }
  }, []);

  useEffect(() => {
    api<{ products: Product[] }>('/api/products')
      .then((d) => setProducts(d.products))
      .catch((e: Error) => setError(e.message));
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!products) {
    return (
      <Centered>
        {error ? (
          <>
            <Muted style={{ textAlign: 'center' }}>{error}</Muted>
            <Button title="Try again" variant="outline" onPress={load} />
          </>
        ) : (
          <ActivityIndicator color={t.text} />
        )}
      </Centered>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.background }}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.three }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Title style={{ fontSize: 34 }}>Oja</Title>
            <Muted style={{ fontSize: 16 }}>
              Well-made everyday things. Pay on delivery, free over ₦50,000.
            </Muted>
          </View>
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: '/product/[slug]', params: { slug: item.slug } }} asChild>
            <Pressable style={styles.card} accessibilityLabel={`${item.name}, ${formatKobo(item.priceKobo)}`}>
              <View style={[styles.imageWrap, { backgroundColor: t.surface }]}>
                <Image source={item.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                {item.stock === 0 && (
                  <Text style={[styles.badge, { backgroundColor: t.text, color: t.onPrimary }]}>Sold out</Text>
                )}
              </View>
              <Muted style={styles.category}>{item.category.toUpperCase()}</Muted>
              <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.price, { color: t.text }]}>{formatKobo(item.priceKobo)}</Text>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.three, gap: Spacing.four, paddingBottom: 120 },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  card: { flex: 1, gap: 2 },
  imageWrap: { aspectRatio: 1, borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.two },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  category: { fontSize: 11, letterSpacing: 0.5 },
  name: { fontSize: 15, fontWeight: '500' },
  price: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
