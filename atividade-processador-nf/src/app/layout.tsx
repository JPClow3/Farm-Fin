import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Processador de PDF de Nota Fiscal (Contas a Pagar) — Atividade 1° Etapa',
  description: 'Demonstração de extração com Mistral OCR e classificação semântica de despesas em formato JSON.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
