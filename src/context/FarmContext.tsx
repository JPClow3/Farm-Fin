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
  BankStatementItem,
  AgroKPIs,
} from '../lib/types';

import {
  getFarms,
  createFarm,
  getFields,
  createField,
  getCropSeasons,
  getSuppliers,
  getCustomers,
} from '../actions/farm';
import {
  getPayables,
  createPayable,
  updatePayable as updatePayableAction,
  payPayableAction,
  deletePayable as deletePayableAction,
  getReceivables,
  createReceivable,
  updateReceivable as updateReceivableAction,
  receiveReceivableAction,
  deleteReceivable as deleteReceivableAction,
} from '../actions/finance';
import { getBankAccounts, getBankStatements, matchStatementAction } from '../actions/banking';
import {
  getStockItems,
  createStockItem,
  getStockMovements,
  addStockMovementAction,
} from '../actions/stock';
import {
  getMachinery,
  createMachinery,
  deleteMachinery as deleteMachineryAction,
} from '../actions/machinery';

interface FarmContextData {
  // Active Selection
  activeFarmId: string;
  setActiveFarmId: (id: string) => void;
  activeFarm: Farm;
  activeSeasonId: string;
  setActiveSeasonId: (id: string) => void;
  activeSeason: CropSeason;
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
  receivables: Receivable[];
  activeReceivables: Receivable[];
  stockItems: StockItem[];
  activeStockItems: StockItem[];
  stockMovements: StockMovement[];
  activeStockMovements: StockMovement[];
  machinery: Machinery[];
  activeMachinery: Machinery[];
  bankStatements: BankStatementItem[];

  // Mutators
  addPayable: (data: Omit<Payable, 'id'> & { installmentsCount?: number }) => Promise<void>;
  updatePayable: (id: string, data: Partial<Payable>) => Promise<void>;
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
  addStockItem: (item: Omit<StockItem, 'id'>) => Promise<void>;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => Promise<void>;
  matchStatement: (statementId: string, transactionId: string) => Promise<void>;
  addField: (field: Omit<Field, 'id'>) => Promise<void>;
  addFarm: (farm: Omit<Farm, 'id'>) => Promise<void>;
  addMachinery: (machinery: Omit<Machinery, 'id'>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reloadFromDB: () => Promise<void>;

  // Calculated Agro KPIs
  kpis: AgroKPIs;
}

const PREF_FARM_KEY = 'farmfin_pref_farm_id';
const PREF_SEASON_KEY = 'farmfin_pref_season_id';

const FarmContext = createContext<FarmContextData>({} as FarmContextData);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const [bankStatements, setBankStatements] = useState<BankStatementItem[]>([]);

  const [activeFarmId, setActiveFarmIdState] = useState<string>('');
  const [activeSeasonId, setActiveSeasonIdState] = useState<string>('');
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

  const activeFields = useMemo(() => {
    return fields.filter((f) => f.farmId === activeFarmId);
  }, [fields, activeFarmId]);

  const activePayables = useMemo(() => {
    return payables.filter((p) => p.farmId === activeFarmId);
  }, [payables, activeFarmId]);

  const activeReceivables = useMemo(() => {
    return receivables.filter((r) => r.farmId === activeFarmId);
  }, [receivables, activeFarmId]);

  const activeStockItems = useMemo(() => {
    return stockItems.filter((s) => s.farmId === activeFarmId);
  }, [stockItems, activeFarmId]);

  const activeStockMovements = useMemo(() => {
    return stockMovements.filter((m) => m.farmId === activeFarmId);
  }, [stockMovements, activeFarmId]);

  const activeMachinery = useMemo(() => {
    return machinery.filter((m) => m.farmId === activeFarmId);
  }, [machinery, activeFarmId]);

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
      (p) => p.status === 'pendente' && p.dueDate === todayStr
    );
    const totalDueTodayPayables = dueTodayPayables.reduce((sum, p) => sum + p.amount, 0);

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

    return {
      totalBankBalance,
      totalPendingPayables,
      totalOverduePayables,
      totalDueTodayPayables,
      totalPendingReceivables,
      totalReceivedThisMonth: receivedThisMonth,
      totalPaidThisMonth: paidThisMonth,
      estimatedCropRevenue,
      estimatedCropCost,
      estimatedCropMargin,
      averageCostPerHectare,
      lowStockCount,
      overduePayablesCount: overduePayables.length,
    };
  }, [bankAccounts, activePayables, activeReceivables, activeStockItems, activeFarm]);

  // Mutators with direct Server Action persistence (Single Source of Truth)

  const addPayable = useCallback(
    async (data: Omit<Payable, 'id'> & { installmentsCount?: number }) => {
      const created = await createPayable(data);
      setPayables((prev) => [created, ...prev]);
    },
    []
  );

  const updatePayable = useCallback(async (id: string, data: Partial<Payable>) => {
    setPayables((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    await updatePayableAction(id, data);
  }, []);

  const payPayable = useCallback(
    async (id: string, bankAccountId: string, paidAmount: number, paymentDate?: string) => {
      const pDate = paymentDate || new Date().toISOString().split('T')[0];
      // Optimistic update
      setPayables((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'pago',
                paidAmount,
                paymentDate: pDate,
                bankAccountId,
              }
            : p
        )
      );

      setBankAccounts((prev) =>
        prev.map((b) => (b.id === bankAccountId ? { ...b, balance: b.balance - paidAmount } : b))
      );

      // Persist to server
      await payPayableAction(id, bankAccountId, paidAmount, pDate);
    },
    []
  );

  const deletePayable = useCallback(async (id: string) => {
    setPayables((prev) => prev.filter((p) => p.id !== id));
    await deletePayableAction(id);
  }, []);

  const addReceivable = useCallback(
    async (data: Omit<Receivable, 'id'> & { installmentsCount?: number }) => {
      const created = await createReceivable(data);
      setReceivables((prev) => [created, ...prev]);
    },
    []
  );

  const updateReceivable = useCallback(async (id: string, data: Partial<Receivable>) => {
    setReceivables((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    await updateReceivableAction(id, data);
  }, []);

  const receiveReceivable = useCallback(
    async (id: string, bankAccountId: string, receivedDate?: string) => {
      const rDate = receivedDate || new Date().toISOString().split('T')[0];
      const target = receivables.find((r) => r.id === id);
      const amountReceived = target ? target.totalAmount : 0;

      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === id) {
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
          prev.map((b) =>
            b.id === bankAccountId ? { ...b, balance: b.balance + amountReceived } : b
          )
        );
      }

      await receiveReceivableAction(id, bankAccountId, rDate, amountReceived);
    },
    [receivables]
  );

  const deleteReceivable = useCallback(async (id: string) => {
    setReceivables((prev) => prev.filter((r) => r.id !== id));
    await deleteReceivableAction(id);
  }, []);

  const addStockItem = useCallback(async (item: Omit<StockItem, 'id'>) => {
    const created = await createStockItem(item);
    setStockItems((prev) => [created, ...prev]);
  }, []);

  const addStockMovement = useCallback(async (movement: Omit<StockMovement, 'id'>) => {
    const created = await addStockMovementAction(movement);
    setStockMovements((prev) => [created, ...prev]);

    setStockItems((prev) =>
      prev.map((item) => {
        if (item.id === movement.stockItemId) {
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
  }, []);

  const matchStatement = useCallback(async (statementId: string, transactionId: string) => {
    setBankStatements((prev) =>
      prev.map((stmt) =>
        stmt.id === statementId
          ? {
              ...stmt,
              matched: true,
              matchedTransactionId: transactionId,
              confidenceScore: 100,
            }
          : stmt
      )
    );
    await matchStatementAction(statementId, transactionId);
  }, []);

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

  const addMachinery = useCallback(async (item: Omit<Machinery, 'id'>) => {
    const created = await createMachinery(item);
    setMachinery((prev) => [...prev, created]);
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
        receivables,
        activeReceivables,
        stockItems,
        activeStockItems,
        stockMovements,
        activeStockMovements,
        machinery,
        activeMachinery,
        bankStatements,
        addPayable,
        updatePayable,
        payPayable,
        deletePayable,
        addReceivable,
        updateReceivable,
        receiveReceivable,
        deleteReceivable,
        addStockItem,
        addStockMovement,
        matchStatement,
        addField,
        addFarm,
        addMachinery,
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
