'use client';

import styles from '@/app/atividades/processador-nf/processador-nf.module.css';

export const notaFieldId = (field: string) => `nf-${field.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

export function NotaErrorSummary({
  errors,
  cadastroOnly = false,
}: {
  errors: Record<string, string>;
  cadastroOnly?: boolean;
}) {
  const entries = Object.entries(errors).filter(
    ([field]) => !cadastroOnly || field.startsWith('fornecedor.') || field === 'produtos'
  );
  if (!entries.length) return null;
  return (
    <div className={styles.fieldErrors} role="alert">
      <p>Corrija os campos indicados:</p>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${notaFieldId(field)}`}
              onClick={(event) => {
                event.preventDefault();
                const target = document.getElementById(notaFieldId(field));
                target?.focus({ preventScroll: true });
                target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }}
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
