import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { api, ApiError } from './api';
import { useAuth } from './auth';
import type { Cart } from './types';

type Realtime = { url: string; key: string; channel: string };

type CartState = {
  cart: Cart | null;
  /** True while connected to live updates from the website. */
  live: boolean;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, handleUnauthorized } = useAuth();
  // Keyed by token so a previous account's cart is never shown after sign-out.
  const [loaded, setLoaded] = useState<{ token: string; cart: Cart } | null>(null);
  const cart = token && loaded?.token === token ? loaded.cart : null;
  const [live, setLive] = useState(false);

  const call = useCallback(
    async (path: string, method = 'GET', body?: unknown) => {
      if (!token) return;
      try {
        setLoaded({ token, cart: await api<Cart>(path, { method, body, token }) });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) handleUnauthorized();
        throw error;
      }
    },
    [token, handleUnauthorized],
  );

  const refresh = useCallback(() => call('/api/cart').catch(() => {}), [call]);

  // Load the cart on sign-in.
  useEffect(() => {
    if (!token) return;
    let active = true;
    api<Cart>('/api/cart', { token })
      .then((c) => active && setLoaded({ token, cart: c }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token]);

  // Live sync: the server pings this user's private channel whenever the
  // cart changes on any device (website or phone); we then refetch.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let cleanup = () => {};

    api<{ realtime: Realtime | null }>('/api/me', { token })
      .then(({ realtime }) => {
        if (cancelled || !realtime) return;
        const supabase = createClient(realtime.url, realtime.key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const channel = supabase
          .channel(realtime.channel)
          .on('broadcast', { event: 'cart_changed' }, () => void refresh())
          .subscribe((status) => setLive(status === 'SUBSCRIBED'));
        cleanup = () => {
          setLive(false);
          void supabase.removeChannel(channel);
        };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [token, refresh]);

  // Catch up on anything missed while the app was in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<CartState>(
    () => ({
      cart,
      live,
      refresh,
      add: (productId, quantity = 1) => call('/api/cart', 'POST', { productId, quantity }),
      setQuantity: (productId, quantity) => call(`/api/cart/${productId}`, 'PATCH', { quantity }),
      remove: (productId) => call(`/api/cart/${productId}`, 'DELETE'),
    }),
    [cart, live, refresh, call],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
