import {
  StockItem,
  StockAlertCategory,
  ExpiryAlertCategory,
  StockAlertItem,
  StockAlertSummary,
} from './types';
import { calculateDateDifferenceDays, getTodayDateString } from './dateUtils';

/**
 * Categorizes a stock item's balance against its minimum safety threshold:
 * - 'zerado': quantity <= 0 (Stockout / Ruptura de estoque)
 * - 'critico': quantity > 0 && quantity <= minQuantity * 0.5 (Severe danger)
 * - 'minimo': quantity <= minQuantity (Below safety threshold / Ponto de Pedido)
 * - 'atencao': quantity <= minQuantity * 1.2 (Approaching safety threshold)
 * - 'normal': quantity > minQuantity * 1.2 (Healthy buffer)
 */
export function getStockAlertCategory(quantity: number, minQuantity: number): StockAlertCategory {
  const q = Number(quantity) || 0;
  const min = Number(minQuantity) || 0;

  if (q <= 0) return 'zerado';
  if (min > 0 && q <= min * 0.5) return 'critico';
  if (q <= min) return 'minimo';
  if (min > 0 && q <= min * 1.2) return 'atencao';
  return 'normal';
}

/**
 * Categorizes an item's expiration date into an alert tier:
 * - 'vencido': daysDiff < 0 (Expired lot)
 * - 'vencendo_30d': daysDiff >= 0 && daysDiff <= 30 (Expires within 30 days)
 * - 'vencendo_60d': daysDiff > 30 && daysDiff <= 60 (Expires within 60 days)
 * - 'vencendo_90d': daysDiff > 60 && daysDiff <= 90 (Expires within 90 days)
 * - 'valido': daysDiff > 90 or no expiry date
 */
export function getExpiryAlertCategory(
  expiryDate?: string | null,
  baseDate?: string
): ExpiryAlertCategory {
  if (!expiryDate) return 'valido';

  const base = baseDate || getTodayDateString();
  const diffDays = calculateDateDifferenceDays(expiryDate, base);

  if (diffDays < 0) return 'vencido';
  if (diffDays <= 30) return 'vencendo_30d';
  if (diffDays <= 60) return 'vencendo_60d';
  if (diffDays <= 90) return 'vencendo_90d';
  return 'valido';
}

/**
 * Calculates suggested replenishment quantity and estimated purchase cost.
 * Target buffer = 2x the minimum threshold (or minQuantity + 1 if minQuantity is 0).
 */
export function calculateSuggestedReorder(item: StockItem): {
  suggestedQty: number;
  estimatedCost: number;
} {
  const currentQty = Number(item.quantity) || 0;
  const minQty = Number(item.minQuantity) || 0;
  const avgCost = Number(item.averageCost) || 0;

  const targetLevel = minQty > 0 ? minQty * 2 : 10;
  const suggestedQty = Math.max(0, targetLevel - currentQty);
  const estimatedCost = parseFloat((suggestedQty * avgCost).toFixed(2));

  return {
    suggestedQty,
    estimatedCost,
  };
}

/**
 * Compiles an analytical stock alert summary from a list of stock items.
 */
export function calculateStockAlertSummary(
  stockItems: StockItem[],
  baseDate?: string
): StockAlertSummary {
  const base = baseDate || getTodayDateString();
  const alerts: StockAlertItem[] = [];

  let outOfStockCount = 0;
  let criticalStockCount = 0;
  let lowStockCount = 0;
  let reorderAttentionCount = 0;
  let expiredLotsCount = 0;
  let expiring30dLotsCount = 0;
  let totalReplenishmentCost = 0;

  for (const item of stockItems) {
    const stockCat = getStockAlertCategory(item.quantity, item.minQuantity);
    const expiryCat = getExpiryAlertCategory(item.expiryDate, base);
    const daysToExpiry = item.expiryDate
      ? calculateDateDifferenceDays(item.expiryDate, base)
      : null;

    if (stockCat === 'zerado') outOfStockCount++;
    else if (stockCat === 'critico') criticalStockCount++;
    else if (stockCat === 'minimo') lowStockCount++;
    else if (stockCat === 'atencao') reorderAttentionCount++;

    if (expiryCat === 'vencido') expiredLotsCount++;
    else if (expiryCat === 'vencendo_30d') expiring30dLotsCount++;

    const isStockAlert = stockCat !== 'normal';
    const isExpiryAlert = expiryCat !== 'valido';

    if (isStockAlert || isExpiryAlert) {
      const { suggestedQty, estimatedCost } = calculateSuggestedReorder(item);

      if (isStockAlert) {
        totalReplenishmentCost += estimatedCost;
      }

      alerts.push({
        id: `alert-${item.id}`,
        stockItemId: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        stockAlertCategory: stockCat,
        expiryDate: item.expiryDate || null,
        expiryAlertCategory: expiryCat,
        daysToExpiry,
        batchNumber: item.batchNumber || null,
        location: item.location || null,
        averageCost: item.averageCost,
        suggestedReorderQty: suggestedQty,
        suggestedReorderCost: estimatedCost,
      });
    }
  }

  // Priority sorting: Zerado first, then Critico, then Vencido, then Mínimo, then Vencendo
  const priorityOrder: Record<string, number> = {
    zerado: 1,
    critico: 2,
    vencido: 3,
    minimo: 4,
    vencendo_30d: 5,
    atencao: 6,
    vencendo_60d: 7,
    vencendo_90d: 8,
    normal: 9,
    valido: 10,
  };

  alerts.sort((a, b) => {
    const scoreA =
      priorityOrder[a.stockAlertCategory] || priorityOrder[a.expiryAlertCategory || 'valido'] || 99;
    const scoreB =
      priorityOrder[b.stockAlertCategory] || priorityOrder[b.expiryAlertCategory || 'valido'] || 99;
    return scoreA - scoreB;
  });

  return {
    totalItems: stockItems.length,
    outOfStockCount,
    criticalStockCount,
    lowStockCount: lowStockCount + criticalStockCount + outOfStockCount, // Total below safety minimum
    reorderAttentionCount,
    expiredLotsCount,
    expiring30dLotsCount,
    totalAlertsCount: alerts.length,
    totalReplenishmentCost: parseFloat(totalReplenishmentCost.toFixed(2)),
    alerts,
  };
}
