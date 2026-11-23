import type { Holding, NewsItem, SectorId, StockState, TradeRecord } from './types';

export interface HoldingSummary {
  id: string;
  name: string;
  sector: SectorId;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  prevPrice: number;
  dayChange: number;
  dayChangePct: number;
  currentValue: number;
  buyCost: number;
  profit: number;
  profitRate: number;
  weightPct: number;
  hasTodayNews: boolean;
}

export interface AccountSummary {
  cash: number;
  totalStockValue: number;
  totalBuyCost: number;
  totalAsset: number;
  initialCash: number;
  unrealizedProfit: number;
  unrealizedProfitRate: number;
  realizedProfitTotal: number;
  totalProfit: number;
  totalProfitRate: number;
  cashRatioPct: number;
  stockRatioPct: number;
  holdingCount: number;
  todayTradeCount: number;
}

export interface BuyPreview {
  estimatedAmount: number;
  remainingCash: number;
  nextQuantity: number;
  nextAvgPrice: number;
  nextWeightPct: number;
  cashUsagePct: number;
  isLargeOrder: boolean;
}

export interface SellPreview {
  estimatedAmount: number;
  nextCash: number;
  remainingQuantity: number;
  realizedProfit: number;
  realizedProfitRate: number;
  isFullSell: boolean;
}

export function getTodayNewsSets(currentNews: NewsItem[]): {
  newsSectorSet: Set<string>;
  newsStockSet: Set<string>;
} {
  const newsSectorSet = new Set<string>();
  const newsStockSet = new Set<string>();
  currentNews.forEach((n) => {
    n.relatedSectors.forEach((s) => newsSectorSet.add(s));
    Object.keys(n.stockImpactOverrides ?? {}).forEach((id) => newsStockSet.add(id));
    (n.relatedStocks ?? []).forEach((id) => newsStockSet.add(id));
  });
  return { newsSectorSet, newsStockSet };
}

export function computeHoldingSummaries(
  holdings: Record<string, Holding>,
  stocks: Record<string, StockState>,
  cash: number,
  currentNews: NewsItem[] = []
): HoldingSummary[] {
  const { newsSectorSet, newsStockSet } = getTodayNewsSets(currentNews);

  let totalStockValue = 0;
  const rawItems: Omit<HoldingSummary, 'weightPct'>[] = [];

  Object.entries(holdings).forEach(([id, holding]) => {
    const stock = stocks[id];
    if (!stock || holding.quantity <= 0) return;

    const prevPrice =
      stock.priceHistory.length > 1
        ? stock.priceHistory[stock.priceHistory.length - 2]
        : stock.currentPrice;
    const dayChange = stock.currentPrice - prevPrice;
    const dayChangePct = prevPrice > 0 ? (dayChange / prevPrice) * 100 : 0;

    const currentValue = stock.currentPrice * holding.quantity;
    const buyCost = holding.avgPrice * holding.quantity;
    const profit = currentValue - buyCost;
    const profitRate = buyCost > 0 ? (profit / buyCost) * 100 : 0;

    totalStockValue += currentValue;

    rawItems.push({
      id,
      name: stock.name,
      sector: stock.sector,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice: stock.currentPrice,
      prevPrice,
      dayChange,
      dayChangePct,
      currentValue,
      buyCost,
      profit,
      profitRate,
      hasTodayNews: newsStockSet.has(id) || newsSectorSet.has(stock.sector),
    });
  });

  const totalAsset = cash + totalStockValue;

  return rawItems.map((item) => ({
    ...item,
    weightPct: totalAsset > 0 ? (item.currentValue / totalAsset) * 100 : 0,
  }));
}

export function computeAccountSummary(
  cash: number,
  holdings: Record<string, Holding>,
  stocks: Record<string, StockState>,
  initialCash: number,
  realizedProfitTotal: number,
  tradeHistory: TradeRecord[],
  dayCount: number
): AccountSummary {
  let totalStockValue = 0;
  let totalBuyCost = 0;
  let holdingCount = 0;

  Object.entries(holdings).forEach(([id, holding]) => {
    const stock = stocks[id];
    if (!stock || holding.quantity <= 0) return;
    holdingCount += 1;
    totalStockValue += stock.currentPrice * holding.quantity;
    totalBuyCost += holding.avgPrice * holding.quantity;
  });

  const totalAsset = cash + totalStockValue;
  const unrealizedProfit = totalStockValue - totalBuyCost;
  const unrealizedProfitRate = totalBuyCost > 0 ? (unrealizedProfit / totalBuyCost) * 100 : 0;
  const totalProfit = totalAsset - initialCash;
  const totalProfitRate = initialCash > 0 ? (totalProfit / initialCash) * 100 : 0;

  const cashRatioPct = totalAsset > 0 ? (cash / totalAsset) * 100 : 100;
  const stockRatioPct = totalAsset > 0 ? (totalStockValue / totalAsset) * 100 : 0;

  const todayTradeCount = tradeHistory.filter((t) => t.dayCount === dayCount).length;

  return {
    cash,
    totalStockValue,
    totalBuyCost,
    totalAsset,
    initialCash,
    unrealizedProfit,
    unrealizedProfitRate,
    realizedProfitTotal,
    totalProfit,
    totalProfitRate,
    cashRatioPct,
    stockRatioPct,
    holdingCount,
    todayTradeCount,
  };
}

export function computeSmartQtyByPct(maxQty: number, pct: number): number {
  if (maxQty <= 0) return 0;
  if (pct >= 100) return maxQty;
  const raw = Math.floor((maxQty * pct) / 100);
  return Math.min(maxQty, Math.max(1, raw));
}

export function previewBuyOrder(
  stock: StockState,
  cash: number,
  holding: Holding | undefined,
  totalAsset: number,
  quantity: number
): BuyPreview {
  const safeQty = Math.max(0, quantity);
  const estimatedAmount = safeQty * stock.currentPrice;
  const remainingCash = Math.max(0, cash - estimatedAmount);
  const prevQty = holding?.quantity ?? 0;
  const prevAvg = holding?.avgPrice ?? 0;
  const nextQuantity = prevQty + safeQty;
  const nextAvgPrice =
    nextQuantity > 0
      ? Math.round((prevQty * prevAvg + estimatedAmount) / nextQuantity)
      : stock.currentPrice;
  const nextHoldingValue = nextQuantity * stock.currentPrice;
  const nextWeightPct = totalAsset > 0 ? (nextHoldingValue / totalAsset) * 100 : 0;
  const cashUsagePct = cash > 0 ? (estimatedAmount / cash) * 100 : 0;

  return {
    estimatedAmount,
    remainingCash,
    nextQuantity,
    nextAvgPrice,
    nextWeightPct,
    cashUsagePct,
    isLargeOrder: safeQty > 0 && cash > 0 && estimatedAmount >= cash * 0.5,
  };
}

export function previewSellOrder(
  stock: StockState,
  cash: number,
  holding: Holding | undefined,
  quantity: number
): SellPreview {
  const maxSell = holding?.quantity ?? 0;
  const safeQty = Math.min(maxSell, Math.max(0, quantity));
  const estimatedAmount = safeQty * stock.currentPrice;
  const nextCash = cash + estimatedAmount;
  const remainingQuantity = Math.max(0, maxSell - safeQty);
  const avgPrice = holding?.avgPrice ?? stock.currentPrice;
  const costBasis = avgPrice * safeQty;
  const realizedProfit = estimatedAmount - costBasis;
  const realizedProfitRate = costBasis > 0 ? (realizedProfit / costBasis) * 100 : 0;

  return {
    estimatedAmount,
    nextCash,
    remainingQuantity,
    realizedProfit,
    realizedProfitRate,
    isFullSell: maxSell > 0 && safeQty === maxSell,
  };
}

export function formatSignedWon(amount: number): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${Math.round(amount).toLocaleString()}원`;
}

export function formatSignedPct(rate: number, digits = 2): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(digits)}%`;
}
