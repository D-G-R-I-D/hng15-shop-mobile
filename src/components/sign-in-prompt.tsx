import { useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/lib/auth';

import { Button, Centered, Muted, Title } from './ui';

export function SignInPrompt({ title, message }: { title: string; message: string }) {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);

  async function onPress() {
    setBusy(true);
    try {
      await signIn();
    } catch (error) {
      Alert.alert('Sign-in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <Title style={{ textAlign: 'center' }}>{title}</Title>
      <Muted style={{ textAlign: 'center', fontSize: 16 }}>{message}</Muted>
      <Button title="Continue with Google" onPress={onPress} loading={busy} />
      <Muted style={{ textAlign: 'center', fontSize: 12 }}>
        Uses the same account as the Oja website.
      </Muted>
    </Centered>
  );
}
