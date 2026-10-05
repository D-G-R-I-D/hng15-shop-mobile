import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, API_URL, ApiError } from './api';
import type { User } from './types';

const TOKEN_KEY = 'oja.session_token';

type AuthState = {
  status: 'loading' | 'signed-out' | 'signed-in';
  token: string | null;
  user: User | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Call when the API rejects the token (expired or revoked). */
  handleUnauthorized: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

function base64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createPkcePair() {
  const bytes = Crypto.getRandomBytes(32);
  const verifier = base64Url(btoa(String.fromCharCode(...bytes)));
  const challenge = base64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    }),
  );
  return { verifier, challenge };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  const clear = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('signed-out');
  }, []);

  // Restore a saved session on launch.
  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!saved) return setStatus('signed-out');
      try {
        const me = await api<{ user: User }>('/api/me', { token: saved });
        setToken(saved);
        setUser(me.user);
        setStatus('signed-in');
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await clear();
        else {
          // Offline: keep the token, the screens will retry.
          setToken(saved);
          setStatus('signed-in');
        }
      }
    })();
  }, [clear]);

  /**
   * Opens the website's Google sign-in in the system browser, so the phone
   * signs in to the very same account as the website. The site returns a
   * one-time code that we exchange (with our PKCE verifier) for a token.
   */
  const signIn = useCallback(async () => {
    const { verifier, challenge } = await createPkcePair();
    const redirectUri = Linking.createURL('auth');
    const url =
      `${API_URL}/mobile/auth?redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_challenge=${challenge}`;

    const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
    if (result.type !== 'success') return;

    const code = Linking.parse(result.url).queryParams?.code;
    if (typeof code !== 'string') throw new Error('Sign-in did not return a code.');

    const session = await api<{ token: string; user: User }>('/api/mobile/token', {
      method: 'POST',
      body: { code, codeVerifier: verifier },
    });
    await SecureStore.setItemAsync(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(async () => {
    if (token) await api('/api/mobile/logout', { method: 'POST', token }).catch(() => {});
    await clear();
  }, [token, clear]);

  const value = useMemo<AuthState>(
    () => ({ status, token, user, signIn, signOut, handleUnauthorized: () => void clear() }),
    [status, token, user, signIn, signOut, clear],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
