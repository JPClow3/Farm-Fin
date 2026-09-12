'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Farm,
  Field,
  CropSeason,
  Supplier,
  Customer,
  BankAccount,
  Payable,
  Receivable,
  StockItem,
  StockMovement,
  Machinery,
  Employee,
  BankStatementItem,
  AgroKPIs,
} from '../lib/types';

import {
  getFarms,
  createFarm,
  getFields,
  createField,
  getCropSeasons,
  createCropSeason,
  getSuppliers,
  createSupplier,
  getCustomers,
  createCustomer,
} from '../actions/farm';
import {
  getPayables,
  createPayable,
  updatePayable as updatePayableAction,
  approvePayableAction,
  rejectPayableAction,
  payPayableAction,
  deletePayable as deletePayableAction,
  getReceivables,
  createReceivable,
  updateReceivable as updateReceivableAction,
  receiveReceivableAction,
  deleteReceivable as deleteReceivableAction,
  fixPriceReceivableAction,
  settleBarterContractAction,
  linkBarterPayableAction,
} from '../actions/finance';
import { getBankAccounts, getBankStatements, matchStatementAction } from '../actions/banking';
import {
  getStockItems,
  createStockItem,
  getStockMovements,
  addStockMovementAction,
  createStockEntryAction,
  createStockExitAction,
} from '../actions/stock';
import { getTodayDateString } from '../lib/dateUtils';
import { useToast } from './ToastContext';
import {
  getMachinery,
  createMachinery,
  updateMachinery as updateMachineryAction,
  deleteMachinery as deleteMachineryAction,
} from '../actions/machinery';
import {
  getEmployees,
  createEmployee,
  updateEmployee as updateEmployeeAction,
  deleteEmployee as deleteEmployeeAction,
} from '../actions/employees';

export type GlobalPeriodFilterType =
  'safra' | 'mes_atual' | 'proximos_30_dias' | 'trimestre' | 'ano_atual' | 'personalizado';

export interface CustomDateRange {
  startDate: string;
  endDate: string;
}

export interface PeriodInfo {
  type: GlobalPeriodFilterType;
  startDate: string;
  endDate: string;
  label: string;
}

interface FarmContextData {
  // Active Selection
  activeFarmId: string;
  setActiveFarmId: (id: string) => void;
  activeFarm: Farm;
  activeSeasonId: string;
  setActiveSeasonId: (id: string) => void;
  activeSeason: CropSeason;
  periodFilter: GlobalPeriodFilterType;
  setPeriodFilter: (filter: GlobalPeriodFilterType) => void;
  customDateRange: CustomDateRange;
  setCustomDateRange: (range: CustomDateRange) => void;
  currentPeriodInfo: PeriodInfo;
  isLoading: boolean;

  // Collections
  farms: Farm[];
  fields: Field[];
  activeFields: Field[];
  seasons: CropSeason[];
  suppliers: Supplier[];
  customers: Customer[];
  bankAccounts: BankAccount[];
  payables: Payable[];
  activePayables: Payable[];
  activeSeasonPayables: Payable[];
  periodFilteredPayables: Payable[];
  receivables: Receivable[];
  activeReceivables: Receivable[];
  activeSeasonReceivables: Receivable[];
  periodFilteredReceivables: Receivable[];
  stockItems: StockItem[];
  activeStockItems: StockItem[];
  stockMovements: StockMovement[];
  activeStockMovements: StockMovement[];
  machinery: Machinery[];
  activeMachinery: Machinery[];
  employees: Employee[];
  activeEmployees: Employee[];
  bankStatements: BankStatementItem[];

  // Mutators
  addPayable: (data: Omit<Payable, 'id'> & { installmentsCount?: number }) => Promise<void>;
  updatePayable: (id: string, data: Partial<Payable>) => Promise<void>;
  approvePayable: (id: string, approverName?: string) => Promise<void>;
  rejectPayable: (id: string, reason: string, approverName?: string) => Promise<void>;
  payPayable: (
    id: string,
    bankAccountId: string,
    paidAmount: number,
    paymentDate?: string
  ) => Promise<void>;
  deletePayable: (id: string) => Promise<void>;
  addReceivable: (data: Omit<Receivable, 'id'> & { installmentsCount?: number }) => Promise<void>;
  updateReceivable: (id: string, data: Partial<Receivable>) => Promise<void>;
  receiveReceivable: (id: string, bankAccountId: string, receivedDate?: string) => Promise<void>;
  deleteReceivable: (id: string) => Promise<void>;
  fixPriceReceivable: (id: string, unitPrice: number, fixingDate?: string) => Promise<void>;
  settleBarterContract: (
    receivableId: string,
    payableId?: string,
    settlementDate?: string,
    notes?: string
  ) => Promise<void>;
  linkBarterPayable: (receivableId: string, payableId: string) => Promise<void>;
  addStockItem: (item: Omit<StockItem, 'id'>) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>;
  matchStatement: (statementId: string, transactionIds: string | string[]) => Promise<void>;
  addField: (field: Omit<Field, 'id'>) => Promise<void>;
  addFarm: (farm: Omit<Farm, 'id'>) => Promise<void>;
  addCropSeason: (season: Omit<CropSeason, 'id'>) => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  addMachinery: (machinery: Omit<Machinery, 'id'>) => Promise<void>;
  updateMachinery: (id: string, data: Partial<Machinery>) => Promise<void>;
  deleteMachinery: (id: string) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadFromDB: () => Promise<void>;

  // Calculated Agro KPIs
  kpis: AgroKPIs;
}

const PREF_FARM_KEY = 'farmfin_pref_farm_id';
const PREF_SEASON_KEY = 'farmfin_pref_season_id';
const PREF_PERIOD_KEY = 'farmfin_pref_period_filter';
const PREF_CUSTOM_RANGE_KEY = 'farmfin_pref_custom_range';

const FarmContext = createContext<FarmContextData>({} as FarmContextData);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [seasons, setSeasons] = useState<CropSeason[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [payables, setPayables] = useState<Payable[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [machinery, setMachinery] = useState<Machinery[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bankStatements, setBankStatements] = useState<BankStatementItem[]>([]);

  const [activeFarmId, setActiveFarmIdState] = useState<string>('');
  const [activeSeasonId, setActiveSeasonIdState] = useState<string>('');
  const [periodFilter, setPeriodFilterState] = useState<GlobalPeriodFilterType>('safra');
  const [customDateRange, setCustomDateRangeState] = useState<CustomDateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Preference persistence helpers
  const setActiveFarmId = useCallback((id: string) => {
    setActiveFarmIdState(id);
    try {
      localStorage.setItem(PREF_FARM_KEY, id);
    } catch {}
  }, []);

  const setActiveSeasonId = useCallback((id: string) => {
    setActiveSeasonIdState(id);
    try {
      localStorage.setItem(PREF_SEASON_KEY, id);
    } catch {}
  }, []);

  const setPeriodFilter = useCallback((filter: GlobalPeriodFilterType) => {
    setPeriodFilterState(filter);
    try {
      localStorage.setItem(PREF_PERIOD_KEY, filter);
    } catch {}
  }, []);

  const setCustomDateRange = useCallback((range: CustomDateRange) => {
    setCustomDateRangeState(range);
    try {
      localStorage.setItem(PREF_CUSTOM_RANGE_KEY, JSON.stringify(range));
    } catch {}
  }, []);

  // Initial Load from DB via Server Actions (Single Source of Truth)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        fetchedFarms,
        fetchedFields,
        fetchedSeasons,
        fetchedSuppliers,
        fetchedCustomers,
        fetchedBankAccounts,
        fetchedPayables,
        fetchedReceivables,
        fetchedStockItems,
        fetchedStockMovements,
        fetchedMachinery,
        fetchedEmployees,
        fetchedBankStatements,
      ] = await Promise.all([
        getFarms(),
        getFields(),
        getCropSeasons(),
        getSuppliers(),
        getCustomers(),
        getBankAccounts(),
        getPayables(),
        getReceivables(),
        getStockItems(),
        getStockMovements(),
        getMachinery(),
        getEmployees(),
        getBankStatements(),
      ]);

      setFarms(fetchedFarms);
      setFields(fetchedFields);
      setSeasons(fetchedSeasons);
      setSuppliers(fetchedSuppliers);
      setCustomers(fetchedCustomers);
      setBankAccounts(fetchedBankAccounts);
      setPayables(fetchedPayables);
      setReceivables(fetchedReceivables);
      setStockItems(fetchedStockItems);
      setStockMovements(fetchedStockMovements);
      setMachinery(fetchedMachinery);
      setEmployees(fetchedEmployees);
      setBankStatements(fetchedBankStatements);

      // Determine active farm dynamically
      let initialFarmId = '';
      try {
        const savedFarmId = localStorage.getItem(PREF_FARM_KEY);
        if (savedFarmId && fetchedFarms.some((f) => f.id === savedFarmId)) {
          initialFarmId = savedFarmId;
        }
      } catch {}
      if (!initialFarmId && fetchedFarms.length > 0) {
        initialFarmId = fetchedFarms[0].id;
      }
      setActiveFarmIdState(initialFarmId);

      // Determine active season dynamically
      let initialSeasonId = '';
      try {
        const savedSeasonId = localStorage.getItem(PREF_SEASON_KEY);
        if (savedSeasonId && fetchedSeasons.some((s) => s.id === savedSeasonId)) {
          initialSeasonId = savedSeasonId;
        }
      } catch {}
      if (!initialSeasonId && fetchedSeasons.length > 0) {
        const currentSeason = fetchedSeasons.find((s) => s.isCurrent) || fetchedSeasons[0];
        initialSeasonId = currentSeason.id;
      }
      setActiveSeasonIdState(initialSeasonId);

      // Determine saved period filter
      try {
        const savedPeriod = localStorage.getItem(PREF_PERIOD_KEY) as GlobalPeriodFilterType;
        if (
          savedPeriod &&
          [
            'safra',
            'mes_atual',
            'proximos_30_dias',
            'trimestre',
            'ano_atual',
            'personalizado',
          ].includes(savedPeriod)
        ) {
          setPeriodFilterState(savedPeriod);
        }
        const savedRange = localStorage.getItem(PREF_CUSTOM_RANGE_KEY);
        if (savedRange) {
          setCustomDateRangeState(JSON.parse(savedRange));
        }
      } catch {}
    } catch (error) {
      console.error('[FarmContext] Error loading initial state from DB:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Active Entities
  const activeFarm = useMemo(() => {
    return (
      farms.find((f) => f.id === activeFarmId) ||
      farms[0] || {
        id: 'default-farm',
        name: 'Fazenda Santa Fé',
        location: 'Sorriso - MT',
        totalArea: 2400,
        carNumber: 'MT-5107909-ABCD.1234',
        active: true,
      }
    );
  }, [farms, activeFarmId]);

  const activeSeason = useMemo(() => {
    return (
      seasons.find((s) => s.id === activeSeasonId) ||
      seasons[0] || {
        id: 'default-season',
        name: 'Safra 2025/2026',
        startDate: '2025-09-15',
        endDate: '2026-06-30',
        isCurrent: true,
      }
    );
  }, [seasons, activeSeasonId]);

  const currentPeriodInfo = useMemo<PeriodInfo>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    if (periodFilter === 'safra') {
      return {
        type: 'safra',
        startDate: activeSeason?.startDate || `${currentYear}-01-01`,
        endDate: activeSeason?.endDate || `${currentYear}-12-31`,
        label: activeSeason?.name || 'Safra Atual',
      };
    }

    if (periodFilter === 'mes_atual') {
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
      const monthNames = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ];
      return {
        type: 'mes_atual',
        startDate: startOfMonth,
        endDate: endOfMonth,
        label: `Mês Atual (${monthNames[currentMonth]}/${currentYear})`,
      };
    }

    if (periodFilter === 'proximos_30_dias') {
      const today = now.toISOString().split('T')[0];
      const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return {
        type: 'proximos_30_dias',
        startDate: today,
        endDate: future,
        label: 'Próximos 30 Dias',
      };
    }

    if (periodFilter === 'trimestre') {
      const quarter = Math.floor(currentMonth / 3);
      const startQuarter = new Date(currentYear, quarter * 3, 1).toISOString().split('T')[0];
      const endQuarter = new Date(currentYear, quarter * 3 + 3, 0).toISOString().split('T')[0];
      return {
        type: 'trimestre',
        startDate: startQuarter,
        endDate: endQuarter,
        label: `${quarter + 1}º Trimestre/${currentYear}`,
      };
    }

    if (periodFilter === 'ano_atual') {
      return {
        type: 'ano_atual',
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`,
        label: `Ano Calendário ${currentYear}`,
      };
    }

    // Personalizado
    return {
      type: 'personalizado',
      startDate: customDateRange.startDate,
      endDate: customDateRange.endDate,
      label: `Personalizado (${customDateRange.startDate} até ${customDateRange.endDate})`,
    };
  }, [periodFilter, activeSeason, customDateRange]);

  const activeFields = useMemo(() => {
    return fields.filter((f) => f.farmId === activeFarmId);
  }, [fields, activeFarmId]);

  const activePayables = useMemo(() => {
    return payables.filter((p) => p.farmId === activeFarmId);
  }, [payables, activeFarmId]);

  const activeSeasonPayables = useMemo(() => {
    return payables.filter((p) => {
      if (p.farmId !== activeFarmId) return false;
      if (p.cropSeasonId && activeSeasonId && p.cropSeasonId === activeSeasonId) return true;
      if (!p.cropSeasonId && activeSeason?.startDate && activeSeason?.endDate) {
        return p.dueDate >= activeSeason.startDate && p.dueDate <= activeSeason.endDate;
      }
      return true;
    });
  }, [payables, activeFarmId, activeSeasonId, activeSeason]);

  const periodFilteredPayables = useMemo(() => {
    if (periodFilter === 'safra') return activeSeasonPayables;
    return activePayables.filter((p) => {
      const d = p.dueDate || p.paymentDate;
      if (!d) return true;
      return d >= currentPeriodInfo.startDate && d <= currentPeriodInfo.endDate;
    });
  }, [periodFilter, activeSeasonPayables, activePayables, currentPeriodInfo]);

  const activeReceivables = useMemo(() => {
    return receivables.filter((r) => r.farmId === activeFarmId);
  }, [receivables, activeFarmId]);

  const activeSeasonReceivables = useMemo(() => {
    return receivables.filter((r) => {
      if (r.farmId !== activeFarmId) return false;
      if (r.cropSeasonId && activeSeasonId && r.cropSeasonId === activeSeasonId) return true;
      if (!r.cropSeasonId && activeSeason?.startDate && activeSeason?.endDate) {
        return r.dueDate >= activeSeason.startDate && r.dueDate <= activeSeason.endDate;
      }
      return true;
    });
  }, [receivables, activeFarmId, activeSeasonId, activeSeason]);

  const periodFilteredReceivables = useMemo(() => {
    if (periodFilter === 'safra') return activeSeasonReceivables;
    return activeReceivables.filter((r) => {
      const d = r.dueDate || r.receivedDate;
      if (!d) return true;
      return d >= currentPeriodInfo.startDate && d <= currentPeriodInfo.endDate;
    });
  }, [periodFilter, activeSeasonReceivables, activeReceivables, currentPeriodInfo]);

  const activeStockItems = useMemo(() => {
    return stockItems.filter((s) => s.farmId === activeFarmId);
  }, [stockItems, activeFarmId]);

  const activeStockMovements = useMemo(() => {
    return stockMovements.filter((m) => m.farmId === activeFarmId);
  }, [stockMovements, activeFarmId]);

  const activeMachinery = useMemo(() => {
    return machinery.filter((m) => m.farmId === activeFarmId);
  }, [machinery, activeFarmId]);

  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.farmId === activeFarmId);
  }, [employees, activeFarmId]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalBankBalance = bankAccounts.reduce((sum, b) => sum + b.balance, 0);

    const pendingPayables = activePayables.filter(
      (p) => p.status === 'pendente' || p.status === 'vencido'
    );
    const totalPendingPayables = pendingPayables.reduce((sum, p) => sum + p.amount, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const overduePayables = activePayables.filter(
      (p) => p.status === 'vencido' || (p.status === 'pendente' && p.dueDate < todayStr)
    );
    const totalOverduePayables = overduePayables.reduce((sum, p) => sum + p.amount, 0);

    const dueTodayPayables = activePayables.filter(
      (p) => (p.status === 'pendente' || p.status === 'vencido') && p.dueDate === todayStr
    );
    const totalDueTodayPayables = dueTodayPayables.reduce((sum, p) => sum + p.amount, 0);

    const dueIn3DaysPayables = activePayables.filter((p) => {
      if (p.status === 'pago' || p.status === 'cancelado') return false;
      const pParts = p.dueDate.split('-');
      const tParts = todayStr.split('-');
      if (pParts.length === 3 && tParts.length === 3) {
        const pUtc = Date.UTC(
          parseInt(pParts[0], 10),
          parseInt(pParts[1], 10) - 1,
          parseInt(pParts[2], 10)
        );
        const tUtc = Date.UTC(
          parseInt(tParts[0], 10),
          parseInt(tParts[1], 10) - 1,
          parseInt(tParts[2], 10)
        );
        const diff = Math.round((pUtc - tUtc) / (1000 * 60 * 60 * 24));
        return diff >= 1 && diff <= 3;
      }
      return false;
    });
    const totalDueIn3DaysPayables = dueIn3DaysPayables.reduce((sum, p) => sum + p.amount, 0);

    const dueIn7DaysPayables = activePayables.filter((p) => {
      if (p.status === 'pago' || p.status === 'cancelado') return false;
      const pParts = p.dueDate.split('-');
      const tParts = todayStr.split('-');
      if (pParts.length === 3 && tParts.length === 3) {
        const pUtc = Date.UTC(
          parseInt(pParts[0], 10),
          parseInt(pParts[1], 10) - 1,
          parseInt(pParts[2], 10)
        );
        const tUtc = Date.UTC(
          parseInt(tParts[0], 10),
          parseInt(tParts[1], 10) - 1,
          parseInt(tParts[2], 10)
        );
        const diff = Math.round((pUtc - tUtc) / (1000 * 60 * 60 * 24));
        return diff >= 4 && diff <= 7;
      }
      return false;
    });
    const totalDueIn7DaysPayables = dueIn7DaysPayables.reduce((sum, p) => sum + p.amount, 0);

    const pendingApprovalPayables = activePayables.filter(
      (p) =>
        p.requiresApproval &&
        p.approvalStatus !== 'aprovado' &&
        p.status !== 'pago' &&
        p.status !== 'cancelado'
    );

    const pendingReceivables = activeReceivables.filter((r) => r.status === 'pendente');
    const totalPendingReceivables = pendingReceivables.reduce((sum, r) => sum + r.totalAmount, 0);

    const paidThisMonth = activePayables
      .filter((p) => p.status === 'pago')
      .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);

    const receivedThisMonth = activeReceivables
      .filter((r) => r.status === 'pago')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const estimatedCropRevenue = activeReceivables.reduce((sum, r) => sum + r.totalAmount, 0);
    const estimatedCropCost = activePayables.reduce((sum, p) => sum + p.amount, 0);
    const estimatedCropMargin =
      estimatedCropRevenue > 0
        ? ((estimatedCropRevenue - estimatedCropCost) / estimatedCropRevenue) * 100
        : 0;

    const totalArea = activeFarm ? activeFarm.totalArea : 1;
    const averageCostPerHectare = estimatedCropCost / (totalArea || 1);

    const lowStockCount = activeStockItems.filter((s) => s.quantity <= s.minQuantity).length;
    const pendingReconciliationCount = bankStatements.filter((s) => !s.matched).length;

    return {
      totalBankBalance,
      totalPendingPayables,
      totalOverduePayables,
      totalDueTodayPayables,
      totalDueIn3DaysPayables,
      totalDueIn7DaysPayables,
      totalPendingReceivables,
      totalReceivedThisMonth: receivedThisMonth,
      totalPaidThisMonth: paidThisMonth,
      estimatedCropRevenue,
      estimatedCropCost,
      estimatedCropMargin,
      averageCostPerHectare,
      lowStockCount,
      overduePayablesCount: overduePayables.length,
      dueTodayPayablesCount: dueTodayPayables.length,
      dueIn3DaysPayablesCount: dueIn3DaysPayables.length,
      dueIn7DaysPayablesCount: dueIn7DaysPayables.length,
      pendingApprovalPayablesCount: pendingApprovalPayables.length,
      pendingReconciliationCount,
    };
  }, [bankAccounts, activePayables, activeReceivables, activeStockItems, activeFarm, bankStatements]);

  // Mutators with direct Server Action persistence (Single Source of Truth)

  const addPayable = useCallback(
    async (data: Omit<Payable, 'id'> & { installmentsCount?: number }) => {
      const tempId = `temp-${Date.now()}`;
      setPayables((prev) => [{ ...data, id: tempId } as Payable, ...prev]);
      try {
        const created = await createPayable(data);
        setPayables((prev) => prev.map((p) => (p.id === tempId ? created : p)));
      } catch (err) {
        setPayables((prev) => prev.filter((p) => p.id !== tempId));
        addToast({
          type: 'danger',
          title: 'Erro ao Lançar Conta',
          message: 'Não foi possível salvar o lançamento. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => addPayable(data) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const updatePayable = useCallback(
    async (id: string, data: Partial<Payable>) => {
      let previous: Payable | undefined;
      setPayables((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            previous = p;
            return { ...p, ...data };
          }
          return p;
        })
      );
      try {
        await updatePayableAction(id, data);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          setPayables((prev) => prev.map((p) => (p.id === id ? snapshot : p)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Salvar',
          message: 'Não foi possível salvar as alterações da conta. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => updatePayable(id, data) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const approvePayable = useCallback(
    async (id: string, approverName: string = 'Diretoria Financeira') => {
      const today = new Date().toISOString().split('T')[0];
      let previous: Payable | undefined;
      setPayables((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            previous = p;
            return {
              ...p,
              approvalStatus: 'aprovado',
              approvedBy: approverName,
              approvedAt: today,
            };
          }
          return p;
        })
      );
      try {
        await approvePayableAction(id, approverName);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          setPayables((prev) => prev.map((p) => (p.id === id ? snapshot : p)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Aprovar',
          message: 'Não foi possível aprovar a conta. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => approvePayable(id, approverName) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const rejectPayable = useCallback(
    async (id: string, reason: string, approverName: string = 'Diretoria Financeira') => {
      const today = new Date().toISOString().split('T')[0];
      let previous: Payable | undefined;
      setPayables((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            previous = p;
            return {
              ...p,
              approvalStatus: 'rejeitado',
              status: 'cancelado',
              rejectionReason: reason,
              approvedBy: approverName,
              approvedAt: today,
            };
          }
          return p;
        })
      );
      try {
        await rejectPayableAction(id, reason, approverName);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          setPayables((prev) => prev.map((p) => (p.id === id ? snapshot : p)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Rejeitar',
          message: 'Não foi possível rejeitar a conta. Tente novamente.',
          action: {
            label: 'Tentar novamente',
            onClick: () => rejectPayable(id, reason, approverName),
          },
        });
        throw err;
      }
    },
    [addToast]
  );

  const payPayable = useCallback(
    async (id: string, bankAccountId: string, paidAmount: number, paymentDate?: string) => {
      const pDate = paymentDate || new Date().toISOString().split('T')[0];
      let previousPayable: Payable | undefined;
      let previousBankBalance: number | undefined;

      // Optimistic update
      setPayables((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            previousPayable = p;
            return {
              ...p,
              status: 'pago',
              paidAmount,
              paymentDate: pDate,
              bankAccountId,
            };
          }
          return p;
        })
      );

      setBankAccounts((prev) =>
        prev.map((b) => {
          if (b.id === bankAccountId) {
            previousBankBalance = b.balance;
            return { ...b, balance: b.balance - paidAmount };
          }
          return b;
        })
      );

      try {
        // Persist to server
        await payPayableAction(id, bankAccountId, paidAmount, pDate);
      } catch (err) {
        if (previousPayable) {
          const snapshot = previousPayable;
          setPayables((prev) => prev.map((p) => (p.id === id ? snapshot : p)));
        }
        if (previousBankBalance !== undefined) {
          const snapshotBalance = previousBankBalance;
          setBankAccounts((prev) =>
            prev.map((b) => (b.id === bankAccountId ? { ...b, balance: snapshotBalance } : b))
          );
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Registrar Pagamento',
          message: 'A baixa não pôde ser confirmada no banco. Tente novamente.',
          action: {
            label: 'Tentar novamente',
            onClick: () => payPayable(id, bankAccountId, paidAmount, pDate),
          },
        });
        throw err;
      }
    },
    [addToast]
  );

  const deletePayable = useCallback(
    async (id: string) => {
      let previous: Payable | undefined;
      let previousIndex = -1;
      setPayables((prev) => {
        previousIndex = prev.findIndex((p) => p.id === id);
        previous = prev[previousIndex];
        return prev.filter((p) => p.id !== id);
      });
      try {
        await deletePayableAction(id);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          const idx = previousIndex;
          setPayables((prev) => {
            const next = [...prev];
            next.splice(Math.min(idx, next.length), 0, snapshot);
            return next;
          });
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Excluir',
          message: 'Não foi possível excluir o lançamento. Tente novamente.',
        });
        throw err;
      }
    },
    [addToast]
  );

  const addReceivable = useCallback(
    async (data: Omit<Receivable, 'id'> & { installmentsCount?: number }) => {
      const tempId = `temp-${Date.now()}`;
      setReceivables((prev) => [{ ...data, id: tempId } as Receivable, ...prev]);
      try {
        const created = await createReceivable(data);
        setReceivables((prev) => prev.map((r) => (r.id === tempId ? created : r)));
      } catch (err) {
        setReceivables((prev) => prev.filter((r) => r.id !== tempId));
        addToast({
          type: 'danger',
          title: 'Erro ao Lançar Recebimento',
          message: 'Não foi possível salvar o contrato. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => addReceivable(data) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const updateReceivable = useCallback(
    async (id: string, data: Partial<Receivable>) => {
      let previous: Receivable | undefined;
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            previous = r;
            return { ...r, ...data };
          }
          return r;
        })
      );
      try {
        await updateReceivableAction(id, data);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          setReceivables((prev) => prev.map((r) => (r.id === id ? snapshot : r)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Salvar',
          message: 'Não foi possível salvar as alterações do contrato. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => updateReceivable(id, data) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const receiveReceivable = useCallback(
    async (id: string, bankAccountId: string, receivedDate?: string) => {
      const rDate = receivedDate || new Date().toISOString().split('T')[0];
      const target = receivables.find((r) => r.id === id);
      const amountReceived = target ? target.totalAmount : 0;

      let previousReceivable: Receivable | undefined;
      let previousBankBalance: number | undefined;

      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            previousReceivable = r;
            return {
              ...r,
              status: 'pago',
              receivedDate: rDate,
              bankAccountId,
            };
          }
          return r;
        })
      );

      if (amountReceived > 0) {
        setBankAccounts((prev) =>
          prev.map((b) => {
            if (b.id === bankAccountId) {
              previousBankBalance = b.balance;
              return { ...b, balance: b.balance + amountReceived };
            }
            return b;
          })
        );
      }

      try {
        await receiveReceivableAction(id, bankAccountId, rDate, amountReceived);
      } catch (err) {
        if (previousReceivable) {
          const snapshot = previousReceivable;
          setReceivables((prev) => prev.map((r) => (r.id === id ? snapshot : r)));
        }
        if (previousBankBalance !== undefined) {
          const snapshotBalance = previousBankBalance;
          setBankAccounts((prev) =>
            prev.map((b) => (b.id === bankAccountId ? { ...b, balance: snapshotBalance } : b))
          );
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Confirmar Recebimento',
          message: 'O crédito não pôde ser confirmado no banco. Tente novamente.',
          action: {
            label: 'Tentar novamente',
            onClick: () => receiveReceivable(id, bankAccountId, rDate),
          },
        });
        throw err;
      }
    },
    [receivables, addToast]
  );

  const deleteReceivable = useCallback(
    async (id: string) => {
      let previous: Receivable | undefined;
      let previousIndex = -1;
      setReceivables((prev) => {
        previousIndex = prev.findIndex((r) => r.id === id);
        previous = prev[previousIndex];
        return prev.filter((r) => r.id !== id);
      });
      try {
        await deleteReceivableAction(id);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          const idx = previousIndex;
          setReceivables((prev) => {
            const next = [...prev];
            next.splice(Math.min(idx, next.length), 0, snapshot);
            return next;
          });
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Excluir',
          message: 'Não foi possível excluir o recebimento. Tente novamente.',
        });
        throw err;
      }
    },
    [addToast]
  );

  const fixPriceReceivable = useCallback(
    async (id: string, unitPrice: number, fixingDate?: string) => {
      let previous: Receivable | undefined;
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            previous = r;
            const rawQty = r.quantity !== undefined && r.quantity > 0 ? r.quantity : r.bagsQuantity;
            const newTotal = rawQty > 0 ? rawQty * unitPrice : unitPrice;
            return {
              ...r,
              unitPrice,
              totalAmount: newTotal,
              priceFixingStatus: 'fixado',
            };
          }
          return r;
        })
      );
      try {
        await fixPriceReceivableAction(id, unitPrice, fixingDate);
      } catch (err) {
        if (previous) {
          const snapshot = previous;
          setReceivables((prev) => prev.map((r) => (r.id === id ? snapshot : r)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Fixar Preço',
          message: 'Não foi possível confirmar a fixação de preço. Tente novamente.',
          action: {
            label: 'Tentar novamente',
            onClick: () => fixPriceReceivable(id, unitPrice, fixingDate),
          },
        });
        throw err;
      }
    },
    [addToast]
  );

  const settleBarterContract = useCallback(
    async (receivableId: string, payableId?: string, settlementDate?: string, notes?: string) => {
      const sDate = settlementDate || new Date().toISOString().split('T')[0];

      let previousReceivable: Receivable | undefined;
      let previousPayable: Payable | undefined;

      // Optimistically update receivable
      let targetPayableId = payableId;
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === receivableId) {
            previousReceivable = r;
            if (!targetPayableId && r.linkedPayableId) {
              targetPayableId = r.linkedPayableId;
            }
            return {
              ...r,
              status: 'pago',
              barterStatus: 'liquidado',
              receivedDate: sDate,
            };
          }
          return r;
        })
      );

      // Optimistically update linked payable if available
      if (targetPayableId) {
        setPayables((prev) =>
          prev.map((p) => {
            if (p.id === targetPayableId) {
              previousPayable = p;
              return {
                ...p,
                status: 'pago',
                isBarter: true,
                barterStatus: 'liquidado',
                paymentDate: sDate,
                paidAmount: p.amount,
              };
            }
            return p;
          })
        );
      }

      try {
        await settleBarterContractAction(receivableId, targetPayableId, sDate, notes);
      } catch (err) {
        if (previousReceivable) {
          const snapshot = previousReceivable;
          setReceivables((prev) => prev.map((r) => (r.id === receivableId ? snapshot : r)));
        }
        if (previousPayable) {
          const snapshot = previousPayable;
          setPayables((prev) => prev.map((p) => (p.id === targetPayableId ? snapshot : p)));
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Liquidar Barter',
          message: 'Não foi possível confirmar a liquidação da operação. Tente novamente.',
          action: {
            label: 'Tentar novamente',
            onClick: () => settleBarterContract(receivableId, payableId, sDate, notes),
          },
        });
        throw err;
      }
    },
    [addToast]
  );

  const linkBarterPayable = useCallback(
    async (receivableId: string, payableId: string) => {
      setReceivables((prev) =>
        prev.map((r) =>
          r.id === receivableId
            ? {
                ...r,
                linkedPayableId: payableId,
                barterStatus: 'vinculado',
                contractType: 'Barter Insumos',
              }
            : r
        )
      );
      setPayables((prev) =>
        prev.map((p) =>
          p.id === payableId
            ? { ...p, linkedReceivableId: receivableId, isBarter: true, barterStatus: 'vinculado' }
            : p
        )
      );
      try {
        await linkBarterPayableAction(receivableId, payableId);
      } catch (err) {
        setReceivables((prev) =>
          prev.map((r) =>
            r.id === receivableId
              ? { ...r, linkedPayableId: undefined, barterStatus: 'aberto' }
              : r
          )
        );
        setPayables((prev) =>
          prev.map((p) =>
            p.id === payableId
              ? { ...p, linkedReceivableId: undefined, isBarter: false, barterStatus: 'nenhum' }
              : p
          )
        );
        addToast({
          type: 'danger',
          title: 'Erro ao Vincular',
          message: 'Não foi possível vincular o contrato barter. Tente novamente.',
        });
        throw err;
      }
    },
    [addToast]
  );

  const addStockItem = useCallback(
    async (item: Omit<StockItem, 'id'>) => {
      const existing = stockItems.find(
        (s) =>
          s.farmId === item.farmId && s.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );

      const incomingQty = Number(item.quantity) || 0;
      const incomingPrice = Number(item.unitPrice ?? item.averageCost) || 0;
      const entryDate = item.createdAt ? String(item.createdAt).slice(0, 10) : getTodayDateString();

      if (existing) {
        const currentQty = Number(existing.quantity) || 0;
        const currentAvgCost = Number(existing.averageCost) || 0;
        const totalQty = currentQty + incomingQty;
        const totalCost = currentQty * currentAvgCost + incomingQty * incomingPrice;
        const newAvgCost =
          totalQty > 0 ? parseFloat((totalCost / totalQty).toFixed(2)) : incomingPrice;
        const previousItem = existing;

        setStockItems((prev) =>
          prev.map((s) =>
            s.id === existing.id
              ? {
                  ...s,
                  quantity: totalQty,
                  averageCost: newAvgCost,
                  lastSupplier: item.lastSupplier || s.lastSupplier,
                  batchNumber: item.batchNumber || s.batchNumber,
                  location: item.location || s.location,
                  expiryDate: item.expiryDate || s.expiryDate,
                }
              : s
          )
        );

        const tempMovementId = `temp-mov-${Date.now()}`;
        const newMovement: StockMovement = {
          id: tempMovementId,
          farmId: item.farmId,
          stockItemId: existing.id,
          itemName: existing.name,
          type: 'entrada',
          quantity: incomingQty,
          unit: existing.unit,
          date: entryDate,
          documentNumber: item.documentNumber || 'NF-e',
          batchNumber: item.batchNumber || existing.batchNumber || 'LT-PADRAO',
          location: item.location || existing.location || 'Galpão Principal',
          totalCost: parseFloat((incomingQty * incomingPrice).toFixed(2)),
        };
        setStockMovements((prev) => [newMovement, ...prev]);

        try {
          await createStockEntryAction({
            farmId: item.farmId,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: incomingQty,
            unitPrice: incomingPrice,
            minQuantity: item.minQuantity,
            supplierName: item.lastSupplier || undefined,
            documentNumber: item.documentNumber || undefined,
            batchNumber: item.batchNumber || undefined,
            location: item.location || undefined,
            expiryDate: item.expiryDate || undefined,
            date: entryDate,
          });
        } catch (err) {
          setStockItems((prev) => prev.map((s) => (s.id === existing.id ? previousItem : s)));
          setStockMovements((prev) => prev.filter((m) => m.id !== tempMovementId));
          addToast({
            type: 'danger',
            title: 'Erro ao Registrar Entrada',
            message: 'Não foi possível salvar a entrada de estoque. Tente novamente.',
            action: { label: 'Tentar novamente', onClick: () => addStockItem(item) },
          });
          throw err;
        }
      } else {
        const tempId = `temp-${Date.now()}`;
        const tempMovementId = `temp-mov-${Date.now()}`;
        setStockItems((prev) => [{ ...item, id: tempId } as StockItem, ...prev]);

        const newMovement: StockMovement = {
          id: tempMovementId,
          farmId: item.farmId,
          stockItemId: tempId,
          itemName: item.name,
          type: 'entrada',
          quantity: incomingQty,
          unit: item.unit,
          date: entryDate,
          documentNumber: item.documentNumber || 'NF-e',
          batchNumber: item.batchNumber || 'LT-PADRAO',
          location: item.location || 'Galpão Principal',
          totalCost: parseFloat((incomingQty * incomingPrice).toFixed(2)),
        };
        setStockMovements((prev) => [newMovement, ...prev]);

        try {
          const created = await createStockItem(item);
          setStockItems((prev) => prev.map((s) => (s.id === tempId ? created : s)));
          setStockMovements((prev) =>
            prev.map((m) => (m.id === tempMovementId ? { ...m, stockItemId: created.id } : m))
          );
        } catch (err) {
          setStockItems((prev) => prev.filter((s) => s.id !== tempId));
          setStockMovements((prev) => prev.filter((m) => m.id !== tempMovementId));
          addToast({
            type: 'danger',
            title: 'Erro ao Cadastrar Insumo',
            message: 'Não foi possível salvar o novo insumo. Tente novamente.',
            action: { label: 'Tentar novamente', onClick: () => addStockItem(item) },
          });
          throw err;
        }
      }
    },
    [stockItems, addToast]
  );

  const addStockMovement = useCallback(
    async (movement: Omit<StockMovement, 'id'>) => {
      const tempId = `temp-mov-${Date.now()}`;
      setStockMovements((prev) => [{ ...movement, id: tempId }, ...prev]);

      let previousStockItem: StockItem | undefined;
      setStockItems((prev) =>
        prev.map((item) => {
          if (item.id === movement.stockItemId) {
            previousStockItem = item;
            const delta = movement.type === 'entrada' ? movement.quantity : -movement.quantity;
            const newQty = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
            };
          }
          return item;
        })
      );

      try {
        const created = await addStockMovementAction(movement);
        setStockMovements((prev) => prev.map((m) => (m.id === tempId ? created : m)));
      } catch (err) {
        setStockMovements((prev) => prev.filter((m) => m.id !== tempId));
        if (previousStockItem) {
          const snapshot = previousStockItem;
          setStockItems((prev) =>
            prev.map((item) => (item.id === movement.stockItemId ? snapshot : item))
          );
        }
        addToast({
          type: 'danger',
          title: 'Erro ao Registrar Movimentação',
          message: 'Não foi possível salvar a movimentação de estoque. Tente novamente.',
          action: { label: 'Tentar novamente', onClick: () => addStockMovement(movement) },
        });
        throw err;
      }
    },
    [addToast]
  );

  const matchStatement = useCallback(
    async (statementId: string, transactionIds: string | string[]) => {
      const ids = Array.isArray(transactionIds) ? transactionIds : [transactionIds];
      setBankStatements((prev) =>
        prev.map((stmt) =>
          stmt.id === statementId
            ? {
                ...stmt,
                matched: true,
                matchedTransactionId: ids[0],
                matchedTransactionIds: ids,
                confidenceScore: 100,
              }
            : stmt
        )
      );
      await matchStatementAction(statementId, transactionIds);
    },
    []
  );

  const addField = useCallback(async (field: Omit<Field, 'id'>) => {
    const created = await createField(field);
    setFields((prev) => [...prev, created]);
  }, []);

  const addFarm = useCallback(
    async (farm: Omit<Farm, 'id'>) => {
      const created = await createFarm(farm);
      setFarms((prev) => [...prev, created]);
      if (!activeFarmId) {
        setActiveFarmId(created.id);
      }
    },
    [activeFarmId, setActiveFarmId]
  );

  const addCropSeason = useCallback(
    async (season: Omit<CropSeason, 'id'>) => {
      const created = await createCropSeason(season);
      setSeasons((prev) => [...prev, created]);
      if (created.isCurrent) {
        setActiveSeasonId(created.id);
      }
    },
    [setActiveSeasonId]
  );

  const addSupplier = useCallback(async (supplier: Omit<Supplier, 'id'>) => {
    const created = await createSupplier(supplier);
    setSuppliers((prev) => [...prev, created]);
  }, []);

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id'>) => {
    const created = await createCustomer(customer);
    setCustomers((prev) => [...prev, created]);
  }, []);

  const addMachinery = useCallback(async (item: Omit<Machinery, 'id'>) => {
    const created = await createMachinery(item);
    setMachinery((prev) => [...prev, created]);
  }, []);

  const updateMachinery = useCallback(async (id: string, data: Partial<Machinery>) => {
    const updated = await updateMachineryAction(id, data);
    setMachinery((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  }, []);

  const deleteMachinery = useCallback(async (id: string) => {
    await deleteMachineryAction(id);
    setMachinery((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addEmployee = useCallback(async (item: Omit<Employee, 'id'>) => {
    const created = await createEmployee(item);
    setEmployees((prev) => [created, ...prev]);
  }, []);

  const updateEmployee = useCallback(async (id: string, data: Partial<Employee>) => {
    const updated = await updateEmployeeAction(id, data);
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    await deleteEmployeeAction(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const resetToDefaults = useCallback(async () => {
    try {
      localStorage.removeItem(PREF_FARM_KEY);
      localStorage.removeItem(PREF_SEASON_KEY);
      localStorage.removeItem('farmfin_data_v1');
    } catch {}
    await loadData();
  }, [loadData]);

  return (
    <FarmContext.Provider
      value={{
        activeFarmId,
        setActiveFarmId,
        activeFarm,
        activeSeasonId,
        setActiveSeasonId,
        activeSeason,
        periodFilter,
        setPeriodFilter,
        customDateRange,
        setCustomDateRange,
        currentPeriodInfo,
        isLoading,
        farms,
        fields,
        activeFields,
        seasons,
        suppliers,
        customers,
        bankAccounts,
        payables,
        activePayables,
        activeSeasonPayables,
        periodFilteredPayables,
        receivables,
        activeReceivables,
        activeSeasonReceivables,
        periodFilteredReceivables,
        stockItems,
        activeStockItems,
        stockMovements,
        activeStockMovements,
        machinery,
        activeMachinery,
        employees,
        activeEmployees,
        bankStatements,
        addPayable,
        updatePayable,
        approvePayable,
        rejectPayable,
        payPayable,
        deletePayable,
        addReceivable,
        updateReceivable,
        receiveReceivable,
        deleteReceivable,
        fixPriceReceivable,
        settleBarterContract,
        linkBarterPayable,
        addStockItem,
        addStockMovement,
        matchStatement,
        addField,
        addFarm,
        addCropSeason,
        addSupplier,
        addCustomer,
        addMachinery,
        updateMachinery,
        deleteMachinery,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        resetToDefaults,
        reloadFromDB: loadData,
        kpis,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
