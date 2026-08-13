import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Farm-Fin',
  description: 'Farm Financial Management',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

