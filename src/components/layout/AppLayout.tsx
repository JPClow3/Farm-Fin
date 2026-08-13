'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ClayModal } from '../ui/ClayModal';
import { ClayInput } from '../ui/ClayInput';
import { ClaySelect } from '../ui/ClaySelect';
import { ClayButton } from '../ui/ClayButton';
import { useFarm } from '../../context/FarmContext';
import { useToast } from '../../context/ToastContext';
import { getTodayDateString } from '../../lib/dateUtils';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickNewOpen, setIsQuickNewOpen] = useState(false);
  const [quickType, setQuickType] = useState<'pagar' | 'receber'>('pagar');

  const {
    activeFarmId,
    activeSeasonId,
    suppliers,
    customers,
    activeFields,
    addPayable,
    addReceivable,
  } = useFarm();
  const { addToast } = useToast();

  // If on auth page (login/register), render children cleanly without dashboard layout
  if (pathname?.startsWith('/login') || pathname?.startsWith('/register')) {
    return <>{children}</>;
  }

  // Quick form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => getTodayDateString());
  const [entityId, setEntityId] = useState('');
  const [fieldId, setFieldId] = useState('');
  const [category, setCategory] = useState('Insumos > Fertilizantes');

  const handleSaveQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) {
      addToast({ type: 'warning', title: 'Atenção', message: 'Preencha os campos obrigatórios.' });
      return;
    }

    const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.')) || 0;

    if (quickType === 'pagar') {
      const selectedSupplier = suppliers.find((s) => s.id === entityId) || suppliers[0];
      addPayable({
        farmId: activeFarmId,
        cropSeasonId: activeSeasonId,
        fieldId: fieldId || undefined,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        category: category || 'Despesas Operacionais',
        description,
        amount: numAmount,
        dueDate,
        status: 'pendente',
        installments: '1/1',
        hasAttachment: false,
      });
      addToast({
        type: 'success',
        title: 'Conta Lançada!',
        message: `R$ ${numAmount.toLocaleString('pt-BR')} a pagar para ${selectedSupplier.name}.`,
      });
    } else {
      const selectedCustomer = customers.find((c) => c.id === entityId) || customers[0];
      addReceivable({
        farmId: activeFarmId,
        cropSeasonId: activeSeasonId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        crop: 'Soja',
        description,
        bagsQuantity: Math.round(numAmount / 138),
        unitPrice: 138.0,
        totalAmount: numAmount,
        dueDate,
        status: 'pendente',
        contractType: 'Venda Spot',
      });
      addToast({
        type: 'success',
        title: 'Recebimento Lançado!',
        message: `R$ ${numAmount.toLocaleString('pt-BR')} a receber de ${selectedCustomer.name}.`,
      });
    }

    // Reset and close
    setDescription('');
    setAmount('');
    setIsQuickNewOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenQuickNew={() => setIsQuickNewOpen(true)}
      />
      <main className="app-main">{children}</main>

      {/* Quick Launch Modal */}
      <ClayModal
        isOpen={isQuickNewOpen}
        onClose={() => setIsQuickNewOpen(false)}
        title="Novo Lançamento Rápido"
        subtitle="Adicione rapidamente uma conta a pagar ou a receber na safra ativa"
      >
        <form onSubmit={handleSaveQuick} className="flex-col" style={{ gap: 'var(--space-4)' }}>
          <div className="flex-row" style={{ gap: 'var(--space-2)' }}>
            <ClayButton
              type="button"
              variant={quickType === 'pagar' ? 'primary' : 'ghost'}
              size="sm"
              style={{ flex: 1 }}
              onClick={() => setQuickType('pagar')}
            >
              💳 Conta a Pagar (Despesa)
            </ClayButton>
            <ClayButton
              type="button"
              variant={quickType === 'receber' ? 'primary' : 'ghost'}
              size="sm"
              style={{ flex: 1 }}
              onClick={() => setQuickType('receber')}
            >
              💰 Conta a Receber (Receita)
            </ClayButton>
          </div>

          <ClayInput
            label="Descrição do Lançamento"
            placeholder={
              quickType === 'pagar'
                ? 'Ex: Fertilizante Yara NPK Talhão 01'
                : 'Ex: Venda de Soja Lote Bunge'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="form-grid-2">
            <ClayInput
              label="Valor (R$)"
              placeholder="0,00"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <ClayInput
              label="Data de Vencimento"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          {quickType === 'pagar' ? (
            <>
              <div className="form-grid-2">
                <ClaySelect
                  label="Fornecedor"
                  options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                  value={entityId || (suppliers[0]?.id ?? '')}
                  onChange={(e) => setEntityId(e.target.value)}
                />
                <ClaySelect
                  label="Categoria Financeira"
                  options={[
                    { value: 'Insumos > Fertilizantes', label: 'Insumos > Fertilizantes' },
                    { value: 'Insumos > Defensivos', label: 'Insumos > Defensivos' },
                    { value: 'Insumos > Sementes', label: 'Insumos > Sementes' },
                    {
                      value: 'Combustíveis e Lubrificantes',
                      label: 'Combustíveis e Lubrificantes',
                    },
                    { value: 'Manutenção de Maquinário', label: 'Manutenção de Maquinário' },
                    { value: 'Despesas Administrativas', label: 'Despesas Administrativas' },
                  ]}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <ClaySelect
                label="Talhão Vinculado (Opcional)"
                options={[
                  { value: '', label: 'Rateio Geral da Fazenda' },
                  ...activeFields.map((f) => ({ value: f.id, label: `${f.name} (${f.area} ha)` })),
                ]}
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
              />
            </>
          ) : (
            <ClaySelect
              label="Cliente / Comprador"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              value={entityId || (customers[0]?.id ?? '')}
              onChange={(e) => setEntityId(e.target.value)}
            />
          )}

          <div className="modal__footer">
            <ClayButton type="button" variant="ghost" onClick={() => setIsQuickNewOpen(false)}>
              Cancelar
            </ClayButton>
            <ClayButton type="submit" variant="primary">
              Salvar Lançamento
            </ClayButton>
          </div>
        </form>
      </ClayModal>
    </div>
  );
};
