import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getEnabledAuthMethods } from '@/lib/authMethods';
import { LoginScreen } from './LoginScreen';

export const metadata: Metadata = {
  title: 'Entrar • Farm-Fin',
};

// Os métodos disponíveis dependem dos segredos do servidor
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen methods={getEnabledAuthMethods()} />
    </Suspense>
  );
}
