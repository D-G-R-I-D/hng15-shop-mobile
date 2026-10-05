import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Centered, Muted, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatKobo } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function ProductScreen() {
  const t = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { status, signIn } = useAuth();
  const { cart, add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api<{ product: Product }>(`/api/products/${slug}`)
      .then((d) => setProduct(d.product))
      .catch((e: Error) => setError(e.message));
  }, [slug]);

  if (!product) {
    return <Centered>{error ? <Muted>{error}</Muted> : <ActivityIndicator color={t.text} />}</Centered>;
  }

  const inCart = cart?.lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const soldOut = product.stock === 0;
  const atLimit = inCart >= product.stock;

  async function onAdd() {
    if (!product) return;
    setAdding(true);
    try {
      if (status !== 'signed-in') await signIn();
      else await add(product.id);
    } catch (e) {
      Alert.alert('Could not add to cart', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: t.background }}>
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.imageWrap, { backgroundColor: t.surface }]}>
          <Image source={product.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        </View>
        <Muted style={{ letterSpacing: 0.5 }}>{product.category.toUpperCase()}</Muted>
        <Title>{product.name}</Title>
        <Text style={[styles.price, { color: t.text }]}>{formatKobo(product.priceKobo)}</Text>
        <Muted style={{ fontSize: 16, lineHeight: 24 }}>{product.description}</Muted>
      </ScrollView>

      <View style={[styles.footer, { borderColor: t.line }]}>
        <Button
          title={
            soldOut
              ? 'Sold out'
              : status !== 'signed-in'
                ? 'Sign in to add to cart'
                : atLimit
                  ? 'All available stock is in your cart'
                  : 'Add to cart'
          }
          onPress={onAdd}
          loading={adding}
          disabled={soldOut || (status === 'signed-in' && atLimit)}
        />
        {inCart > 0 && (
          <Text onPress={() => router.navigate('/cart')} style={[styles.inCart, { color: t.accent }]}>
            {inCart} in your cart · View cart
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.five },
  imageWrap: { aspectRatio: 1, borderRadius: 24, overflow: 'hidden', marginBottom: Spacing.two },
  price: { fontSize: 22, fontVariant: ['tabular-nums'] },
  footer: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  inCart: { textAlign: 'center', fontWeight: '500' },
});
