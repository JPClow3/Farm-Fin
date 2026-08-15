import { OverheadExpenseItem } from '@/lib/types';

// Baseline overhead fallback items used by cost apportionment (rateio) when no
// real overhead payables are found for the farm/season.
export const DEFAULT_OVERHEAD_EXPENSES: OverheadExpenseItem[] = [
  {
    id: 'ovh-001',
    description: 'Arrendamento de Terras Agrícolas - Área Sede / Parceria',
    category: 'Arrendamento & Terras',
    amount: 450000,
    source: 'payable',
    supplierName: 'Imobiliária & Terras Rurais MT',
    dueDate: '2026-04-30',
    included: true,
  },
  {
    id: 'ovh-002',
    description: 'Seguro Multirrisco Lavoura & Clima (Safra 25/26)',
    category: 'Seguro Agrícola',
    amount: 140000,
    source: 'payable',
    supplierName: 'Porto Seguro Agro / MAPFRE',
    dueDate: '2025-11-15',
    included: true,
  },
  {
    id: 'ovh-003',
    description: 'Energia Elétrica Alta Tensão - Pivôs Centrais & Sede',
    category: 'Energia & Utilidades',
    amount: 88500,
    source: 'payable',
    supplierName: 'Energisa Mato Grosso',
    dueDate: '2026-01-20',
    included: true,
  },
  {
    id: 'ovh-004',
    description: 'Despesas Administrativas, Sede, Internet Starlink & TI',
    category: 'Administração & Escritório',
    amount: 96500,
    source: 'payable',
    supplierName: 'Gestão Agro & Telecom',
    dueDate: '2026-02-10',
    included: true,
  },
  {
    id: 'ovh-005',
    description: 'Honorários de Consultoria Agronômica & Contabilidade Rural',
    category: 'Consultoria & Serviços',
    amount: 60000,
    source: 'payable',
    supplierName: 'AgroContábil Auditores',
    dueDate: '2026-03-15',
    included: true,
  },
];
