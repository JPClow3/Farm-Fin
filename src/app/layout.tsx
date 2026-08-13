import type { Metadata } from 'next';
import { ToastProvider } from '../context/ToastContext';
import { FarmProvider } from '../context/FarmContext';
import { AppLayout } from '../components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: 'Farm-Fin — Gestão Financeira para o Agronegócio',
  description:
    'Sistema completo de gestão financeira rural para produtores, gestores e contadores agrícolas.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <FarmProvider>
            <AppLayout>{children}</AppLayout>
          </FarmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
