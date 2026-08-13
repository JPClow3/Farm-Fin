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
  INITIAL_FARMS,
  INITIAL_FIELDS,
  INITIAL_SEASONS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_PAYABLES,
  INITIAL_RECEIVABLES,
  INITIAL_STOCK,
  INITIAL_MOVEMENTS,
  INITIAL_MACHINERY,
  INITIAL_STATEMENTS,
} from '../lib/mockData';

interface FarmContextData {
  // Active Selection
  activeFarmId: string;
  setActiveFarmId: (id: string) => void;
  activeFarm: Farm;
  activeSeasonId: string;
  setActiveSeasonId: (id: string) => void;
  activeSeason: CropSeason;

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
  addPayable: (data: Omit<Payable, 'id'>) => void;
  payPayable: (id: string, bankAccountId: string, paidAmount: number, paymentDate: string) => void;
  deletePayable: (id: string) => void;
  addReceivable: (data: Omit<Receivable, 'id'>) => void;
  receiveReceivable: (id: string, bankAccountId: string, receivedDate: string) => void;
  deleteReceivable: (id: string) => void;
  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id'>) => void;
  matchStatement: (statementId: string, transactionId: string) => void;
  addField: (field: Omit<Field, 'id'>) => void;
  addFarm: (farm: Omit<Farm, 'id'>) => void;
  addMachinery: (machinery: Omit<Machinery, 'id'>) => void;
  resetToDefaults: () => void;

  // Calculated Agro KPIs
  kpis: {
    totalBankBalance: number;
    totalPendingPayables: number;
    totalOverduePayables: number;
    totalDueTodayPayables: number;
    totalPendingReceivables: number;
    totalReceivedThisMonth: number;
    totalPaidThisMonth: number;
    estimatedCropRevenue: number;
    estimatedCropCost: number;
    estimatedCropMargin: number;
    averageCostPerHectare: number;
    lowStockCount: number;
    overduePayablesCount: number;
  };
}

const STORAGE_KEY = 'farmfin_data_v1';

const FarmContext = createContext<FarmContextData>({} as FarmContextData);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farms, setFarms] = useState<Farm[]>(INITIAL_FARMS);
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [seasons, setSeasons] = useState<CropSeason[]>(INITIAL_SEASONS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [payables, setPayables] = useState<Payable[]>(INITIAL_PAYABLES);
  const [receivables, setReceivables] = useState<Receivable[]>(INITIAL_RECEIVABLES);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [machinery, setMachinery] = useState<Machinery[]>(INITIAL_MACHINERY);
  const [bankStatements, setBankStatements] = useState<BankStatementItem[]>(INITIAL_STATEMENTS);

  const [activeFarmId, setActiveFarmId] = useState<string>('farm-1');
  const [activeSeasonId, setActiveSeasonId] = useState<string>('season-25-26');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.farms) setFarms(parsed.farms);
        if (parsed.fields) setFields(parsed.fields);
        if (parsed.seasons) setSeasons(parsed.seasons);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.bankAccounts) setBankAccounts(parsed.bankAccounts);
        if (parsed.payables) setPayables(parsed.payables);
        if (parsed.receivables) setReceivables(parsed.receivables);
        if (parsed.stockItems) setStockItems(parsed.stockItems);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.machinery) setMachinery(parsed.machinery);
        if (parsed.bankStatements) setBankStatements(parsed.bankStatements);
        if (parsed.activeFarmId) setActiveFarmId(parsed.activeFarmId);
        if (parsed.activeSeasonId) setActiveSeasonId(parsed.activeSeasonId);
      }
    } catch (e) {
      console.error('Error loading Farm-Fin state from storage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        farms,
        fields,
        seasons,
        suppliers,
        customers,
        bankAccounts,
        payables,
        receivables,
        stockItems,
        stockMovements,
        machinery,
        bankStatements,
        activeFarmId,
        activeSeasonId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving Farm-Fin state to storage', e);
    }
  }, [
    farms,
    fields,
    seasons,
    suppliers,
    customers,
    bankAccounts,
    payables,
    receivables,
    stockItems,
    stockMovements,
    machinery,
    bankStatements,
    activeFarmId,
    activeSeasonId,
    isLoaded,
  ]);

  // Derived Active Entities
  const activeFarm = useMemo(() => {
    return farms.find((f) => f.id === activeFarmId) || farms[0];
  }, [farms, activeFarmId]);

  const activeSeason = useMemo(() => {
    return seasons.find((s) => s.id === activeSeasonId) || seasons[0];
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

    const pendingPayables = activePayables.filter((p) => p.status === 'pendente' || p.status === 'vencido');
    const totalPendingPayables = pendingPayables.reduce((sum, p) => sum + p.amount, 0);

    const todayStr = '2026-08-14'; // Simulated current context date
    const overduePayables = activePayables.filter(
      (p) => (p.status === 'vencido' || (p.status === 'pendente' && p.dueDate < todayStr))
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
    const estimatedCropMargin = estimatedCropRevenue > 0
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

  // Actions
  const addPayable = useCallback((data: Omit<Payable, 'id'>) => {
    const newId = `pay-${Date.now()}`;
    const newPayable: Payable = { id: newId, ...data };
    setPayables((prev) => [newPayable, ...prev]);
  }, []);

  const payPayable = useCallback(
    (id: string, bankAccountId: string, paidAmount: number, paymentDate: string) => {
      setPayables((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'pago',
                paidAmount,
                paymentDate,
                bankAccountId,
              }
            : p
        )
      );

      // Deduct from bank account balance
      setBankAccounts((prev) =>
        prev.map((b) =>
          b.id === bankAccountId
            ? { ...b, balance: b.balance - paidAmount }
            : b
        )
      );
    },
    []
  );

  const deletePayable = useCallback((id: string) => {
    setPayables((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addReceivable = useCallback((data: Omit<Receivable, 'id'>) => {
    const newId = `rec-${Date.now()}`;
    const newReceivable: Receivable = { id: newId, ...data };
    setReceivables((prev) => [newReceivable, ...prev]);
  }, []);

  const receiveReceivable = useCallback(
    (id: string, bankAccountId: string, receivedDate: string) => {
      let amountReceived = 0;
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            amountReceived = r.totalAmount;
            return {
              ...r,
              status: 'pago',
              receivedDate,
              bankAccountId,
            };
          }
          return r;
        })
      );

      if (amountReceived > 0) {
        setBankAccounts((prev) =>
          prev.map((b) =>
            b.id === bankAccountId
              ? { ...b, balance: b.balance + amountReceived }
              : b
          )
        );
      }
    },
    []
  );

  const deleteReceivable = useCallback((id: string) => {
    setReceivables((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addStockItem = useCallback((item: Omit<StockItem, 'id'>) => {
    const newId = `stk-${Date.now()}`;
    setStockItems((prev) => [{ id: newId, ...item }, ...prev]);
  }, []);

  const addStockMovement = useCallback((movement: Omit<StockMovement, 'id'>) => {
    const newId = `mov-${Date.now()}`;
    const newMovement: StockMovement = { id: newId, ...movement };
    setStockMovements((prev) => [newMovement, ...prev]);

    // Update stock quantity and cost
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

  const matchStatement = useCallback((statementId: string, transactionId: string) => {
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
  }, []);

  const addField = useCallback((field: Omit<Field, 'id'>) => {
    const newId = `field-${Date.now()}`;
    setFields((prev) => [...prev, { id: newId, ...field }]);
  }, []);

  const addFarm = useCallback((farm: Omit<Farm, 'id'>) => {
    const newId = `farm-${Date.now()}`;
    setFarms((prev) => [...prev, { id: newId, ...farm }]);
  }, []);

  const addMachinery = useCallback((item: Omit<Machinery, 'id'>) => {
    const newId = `mac-${Date.now()}`;
    setMachinery((prev) => [...prev, { id: newId, ...item }]);
  }, []);

  const resetToDefaults = useCallback(() => {
    setFarms(INITIAL_FARMS);
    setFields(INITIAL_FIELDS);
    setSeasons(INITIAL_SEASONS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setBankAccounts(INITIAL_BANK_ACCOUNTS);
    setPayables(INITIAL_PAYABLES);
    setReceivables(INITIAL_RECEIVABLES);
    setStockItems(INITIAL_STOCK);
    setStockMovements(INITIAL_MOVEMENTS);
    setMachinery(INITIAL_MACHINERY);
    setBankStatements(INITIAL_STATEMENTS);
    setActiveFarmId('farm-1');
    setActiveSeasonId('season-25-26');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <FarmContext.Provider
      value={{
        activeFarmId,
        setActiveFarmId,
        activeFarm,
        activeSeasonId,
        setActiveSeasonId,
        activeSeason,
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
        payPayable,
        deletePayable,
        addReceivable,
        receiveReceivable,
        deleteReceivable,
        addStockItem,
        addStockMovement,
        matchStatement,
        addField,
        addFarm,
        addMachinery,
        resetToDefaults,
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
