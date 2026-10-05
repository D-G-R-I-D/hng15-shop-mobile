import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Muted, Row } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatKobo } from '@/lib/format';
import type { Order, ShippingField } from '@/lib/types';

const FIELDS: { name: ShippingField; label: string; props?: Partial<React.ComponentProps<typeof TextInput>> }[] = [
  { name: 'fullName', label: 'Full name', props: { autoComplete: 'name', textContentType: 'name' } },
  { name: 'phone', label: 'Phone number', props: { keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber' } },
  { name: 'address', label: 'Street address', props: { autoComplete: 'street-address', textContentType: 'fullStreetAddress' } },
  { name: 'city', label: 'City', props: { textContentType: 'addressCity' } },
  { name: 'state', label: 'State', props: { textContentType: 'addressState' } },
];

export default function CheckoutScreen() {
  const t = useTheme();
  const { token, user } = useAuth();
  const { cart, refresh } = useCart();
  const [values, setValues] = useState<Record<ShippingField, string>>({
    fullName: user?.name ?? '',
    phone: '',
    address: '',
    city: '',
    state: 'Lagos',
  });
  const [errors, setErrors] = useState<Partial<Record<ShippingField, string>>>({});
  const [placing, setPlacing] = useState(false);

  async function placeOrder() {
    setPlacing(true);
    setErrors({});
    try {
      const { order } = await api<{ order: Order }>('/api/checkout', { method: 'POST', body: values, token });
      await refresh();
      router.dismissAll();
      router.push({ pathname: '/orders/[id]', params: { id: order.id, placed: '1' } });
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        setErrors(e.fieldErrors);
      } else {
        Alert.alert('Could not place order', e instanceof Error ? e.message : 'Please try again.');
        await refresh();
      }
    } finally {
      setPlacing(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text style={[styles.label, { color: t.text }]}>Email</Text>
          <Muted>{user?.email} — your confirmation is sent here.</Muted>
        </View>

        {FIELDS.map(({ name, label, props }) => (
          <View key={name} style={{ gap: 6 }}>
            <Text style={[styles.label, { color: t.text }]}>{label}</Text>
            <TextInput
              value={values[name]}
              onChangeText={(text) => setValues((v) => ({ ...v, [name]: text }))}
              style={[
                styles.input,
                { color: t.text, backgroundColor: t.surface, borderColor: errors[name] ? t.accent : t.line },
              ]}
              placeholderTextColor={t.muted}
              accessibilityLabel={label}
              {...props}
            />
            {errors[name] && <Text style={{ color: t.accent, fontSize: 13 }}>{errors[name]}</Text>}
          </View>
        ))}

        <Card>
          <Text style={[styles.label, { color: t.text }]}>Payment</Text>
          <Muted>Pay on delivery — cash or transfer when your order arrives.</Muted>
        </Card>

        {cart && (
          <Card>
            {cart.lines.map((l) => (
              <Row key={l.productId} label={`${l.name} × ${l.quantity}`} value={formatKobo(l.priceKobo * l.quantity)} />
            ))}
            <View style={{ height: 1, backgroundColor: t.line, marginVertical: 4 }} />
            <Row label="Delivery" value={cart.shippingKobo === 0 ? 'Free' : formatKobo(cart.shippingKobo)} />
            <Row label="Total" value={formatKobo(cart.totalKobo)} bold />
          </Card>
        )}

        <Button
          title={cart ? `Place order · ${formatKobo(cart.totalKobo)}` : 'Place order'}
          onPress={placeOrder}
          loading={placing}
          disabled={!cart || cart.lines.length === 0}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five * 2 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
});
