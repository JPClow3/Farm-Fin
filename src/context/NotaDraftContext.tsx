'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ExtractedInvoiceData } from '@/lib/mistralInvoiceAgent';
import type { InvoiceReview } from '@/lib/invoiceQuality';
import type { CadastroNotaResultado, LancamentoResultado } from '@/lib/administrativo';

interface NotaDraft {
  file: File | null;
  data: ExtractedInvoiceData | null;
  ocrReview: InvoiceReview | null;
  cadastro: CadastroNotaResultado | null;
  lancamento: LancamentoResultado | null;
  saving: 'cadastros' | 'lancamento' | null;
}

const emptyDraft: NotaDraft = {
  file: null,
  data: null,
  ocrReview: null,
  cadastro: null,
  lancamento: null,
  saving: null,
};

const NotaDraftContext = createContext<{
  draft: NotaDraft;
  updateDraft: (patch: Partial<NotaDraft>) => void;
} | null>(null);

/** Session-only draft: PDFs never enter localStorage and logout unmounts this provider. */
export function NotaDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState(emptyDraft);
  const updateDraft = useCallback((patch: Partial<NotaDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    if (!draft.file || draft.lancamento) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [draft.file, draft.lancamento]);

  const value = useMemo(() => ({ draft, updateDraft }), [draft, updateDraft]);
  return <NotaDraftContext.Provider value={value}>{children}</NotaDraftContext.Provider>;
}

export function useNotaDraft() {
  const context = useContext(NotaDraftContext);
  if (!context) throw new Error('NotaDraftProvider ausente');
  return context;
}
