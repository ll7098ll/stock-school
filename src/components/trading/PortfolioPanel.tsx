import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  computeAccountSummary,
  computeHoldingSummaries,
  formatSignedPct,
  formatSignedWon,
} from '../../lib/tradingMetrics';
import type { TradeType } from '../../lib/types';
import { cn } from '../../lib/utils';
import TradeHistoryPanel from './TradeHistoryPanel';
import QuickTradeModal from './QuickTradeModal';
import { Button } from '../ui/button';
import {
  Wallet,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Landmark,
  Target,
  Briefcase,
  History,
  LineChart,
  ArrowUpDown,
  Coins,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface PortfolioPanelProps {
  initialSubTab?: 'holdings' | 'trades';
  subTabNonce?: number;
  onGoToTrading?: (stockId?: string, side?: TradeType) => void;
  onGoToNews?: () => void;
}

type HoldingSort = 'valueDesc' | 'profitRateDesc' | 'profitRateAsc' | 'profitDesc' | 'nameAsc';

export default function PortfolioPanel({
  initialSubTab = 'holdings',
  subTabNonce = 0,
  onGoToTrading,
  onGoToNews,
}: PortfolioPanelProps) {
  const {
    cash,
    holdings,
    stocks,
    initialCash,
    totalAssetHistory,
    theme,
    tutorialStep,
    predictionStats,
    sectorPredictionStats,
    tradeHistory,
    realizedProfitTotal,
    dayCount,
    currentNews,
  } = useGameStore();

  const [subTab, setSubTab] = useState<'holdings' | 'trades'>(initialSubTab);
  const [sortBy, setSortBy] = useState<HoldingSort>('valueDesc');
  const [quickTradeOpen, setQuickTradeOpen] = useState(false);
  const [quickTradeStockId, setQuickTradeStockId] = useState<string | null>(null);
  const [quickTradeSide, setQuickTradeSide] = useState<TradeType>('sell');

  const [prevNonce, setPrevNonce] = useState(subTabNonce);
  if (subTabNonce !== prevNonce) {
    setPrevNonce(subTabNonce);
    setSubTab(initialSubTab);
  }

  const isDark = theme === 'dark';

  const account = useMemo(
    () =>
      computeAccountSummary(
        cash,
        holdings,
        stocks,
        initialCash,
        realizedProfitTotal,
        tradeHistory,
        dayCount
      ),
    [cash, holdings, stocks, initialCash, realizedProfitTotal, tradeHistory, dayCount]
  );

  const holdingList = useMemo(() => {
    const raw = computeHoldingSummaries(holdings, stocks, cash, currentNews);
    return [...raw].sort((a, b) => {
      switch (sortBy) {
        case 'profitRateDesc':
          return b.profitRate - a.profitRate;
        case 'profitRateAsc':
          return a.profitRate - b.profitRate;
        case 'profitDesc':
          return b.profit - a.profit;
        case 'nameAsc':
          return a.name.localeCompare(b.name);
        case 'valueDesc':
        default:
          return b.currentValue - a.currentValue;
      }
    });
  }, [holdings, stocks, cash, currentNews, sortBy]);

  // Chart data for Asset Trend
  const assetTrendData = useMemo(() => {
    return totalAssetHistory.map((val, idx) => ({
      day: `DAY ${idx + 1}`,
      '총 자산': val,
    }));
  }, [totalAssetHistory]);

  // Chart data for Asset Allocation
  const assetAllocationData = useMemo(() => {
    const data = [
      { name: '예수금 (현금)', value: cash, color: isDark ? '#475569' : '#CBD5E1' },
    ];

    const sectorValues: Record<string, number> = {};
    holdingList.forEach((item) => {
      sectorValues[item.sector] = (sectorValues[item.sector] || 0) + item.currentValue;
    });

    const sectorColors = [
      isDark ? '#3182F6' : '#0A84FF',
      isDark ? '#F04452' : '#FF453A',
      isDark ? '#F59E0B' : '#D97706',
      isDark ? '#10B981' : '#059669',
      isDark ? '#6366F1' : '#4F46E5',
      isDark ? '#64748B' : '#94A3B8',
    ];

    Object.entries(sectorValues).forEach(([sector, val], idx) => {
      if (val > 0) {
        data.push({
          name: sector.split('(')[0],
          value: val,
          color: sectorColors[idx % sectorColors.length],
        });
      }
    });

    return data;
  }, [cash, holdingList, isDark]);

  const openQuickTrade = (stockId: string, side: TradeType) => {
    setQuickTradeStockId(stockId);
    setQuickTradeSide(side);
    setQuickTradeOpen(true);
  };

  const isProfit = account.totalProfit > 0;
  const isLoss = account.totalProfit < 0;
  const accuracyPct =
    predictionStats.total > 0
      ? Math.round((predictionStats.correct / predictionStats.total) * 100)
      : null;
  const sectorAccuracyPct =
    sectorPredictionStats.total > 0
      ? Math.round((sectorPredictionStats.correct / sectorPredictionStats.total) * 100)
      : null;

  const formatYAxis = (tick: number) => {
    if (tick >= 10000) return `${(tick / 10000).toFixed(0)}만`;
    return tick.toString();
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden transition-all duration-300',
        tutorialStep === 5 &&
          'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 5 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">💼</span> 5단계: 계좌현황·보유 종목 빠른 매도·체결 거래내역과 누적 뉴스 적중률을 한눈에 관리해 보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2.5 py-0.5 rounded font-black shrink-0">
            자산 보고
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--color-hts-border)] flex items-center justify-between gap-2 flex-wrap bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[var(--color-accent-gold)]" />
          <span className="font-black text-base text-foreground tracking-tight">
            계좌 현황 · 포트폴리오 & 거래 내역
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/25 text-xs font-extrabold text-amber-800 dark:text-amber-300">
            <Target className="w-3.5 h-3.5" />
            <span>
              방향 적중:{' '}
              {accuracyPct !== null
                ? `${accuracyPct}% (${predictionStats.correct}/${predictionStats.total})`
                : '기록 없음'}
              {sectorAccuracyPct !== null &&
                ` · 산업 추론 ${sectorAccuracyPct}% (${sectorPredictionStats.correct}/${sectorPredictionStats.total})`}
            </span>
          </div>
          {onGoToTrading && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onGoToTrading()}
              className="h-8 px-3 rounded-full text-xs font-extrabold gap-1 cursor-pointer"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>모의투자 교실</span>
            </Button>
          )}
        </div>
      </div>

      {/* Account Status KPI Row (5 metrics + Cash/Stock Ratio Bar) */}
      <div className="border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/20 font-sans shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-0">
          <div className="p-3.5 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">총 평가자산</div>
            <div className="font-black text-base md:text-lg text-foreground mt-0.5 tabular-nums">
              {account.totalAsset.toLocaleString()}원
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold tabular-nums mt-0.5">
              초기 {account.initialCash.toLocaleString()}원
            </div>
          </div>

          <div className="p-3.5 md:border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">주문가능 예수금</div>
            <div className="font-extrabold text-base md:text-lg text-foreground mt-0.5 tabular-nums">
              {account.cash.toLocaleString()}원
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold tabular-nums mt-0.5">
              현금 비중 {account.cashRatioPct.toFixed(1)}%
            </div>
          </div>

          <div className="p-3.5 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">
              보유주식 평가금 ({account.holdingCount}종목)
            </div>
            <div className="font-extrabold text-base md:text-lg text-foreground mt-0.5 tabular-nums">
              {account.totalStockValue.toLocaleString()}원
            </div>
            <div
              className={cn(
                'text-[11px] font-black tabular-nums mt-0.5',
                account.unrealizedProfit > 0
                  ? 'text-[var(--color-price-up)]'
                  : account.unrealizedProfit < 0
                    ? 'text-[var(--color-price-down)]'
                    : 'text-muted-foreground'
              )}
            >
              평가손익 {formatSignedWon(account.unrealizedProfit)} (
              {formatSignedPct(account.unrealizedProfitRate, 1)})
            </div>
          </div>

          <div className="p-3.5 md:border-r border-b md:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold inline-flex items-center gap-1">
              <Coins className="w-3 h-3" />
              누적 실현손익
            </div>
            <div
              className={cn(
                'font-black text-base md:text-lg mt-0.5 tabular-nums',
                account.realizedProfitTotal > 0
                  ? 'text-[var(--color-price-up)]'
                  : account.realizedProfitTotal < 0
                    ? 'text-[var(--color-price-down)]'
                    : 'text-muted-foreground'
              )}
            >
              {formatSignedWon(account.realizedProfitTotal)}
            </div>
            <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              매도 확정 손익 합계
            </div>
          </div>

          <div className="col-span-2 md:col-span-2 lg:col-span-1 p-3.5 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.01]">
            <div className="text-[11px] text-muted-foreground font-bold">총 누적 손익 / 수익률</div>
            <div
              className={cn(
                'font-black text-base md:text-lg mt-0.5 tabular-nums flex items-center gap-1 flex-wrap',
                isProfit
                  ? 'text-[var(--color-price-up)]'
                  : isLoss
                    ? 'text-[var(--color-price-down)]'
                    : 'text-muted-foreground'
              )}
            >
              {isProfit && <TrendingUp className="w-4 h-4 inline shrink-0" />}
              {isLoss && <TrendingDown className="w-4 h-4 inline shrink-0" />}
              <span>{formatSignedWon(account.totalProfit)}</span>
            </div>
            <div
              className={cn(
                'text-xs font-black tabular-nums mt-0.5',
                isProfit
                  ? 'text-[var(--color-price-up)]'
                  : isLoss
                    ? 'text-[var(--color-price-down)]'
                    : 'text-muted-foreground'
              )}
            >
              {formatSignedPct(account.totalProfitRate, 2)}
            </div>
          </div>
        </div>

        {/* Cash vs Stock Allocation Progress Bar */}
        <div className="px-4 py-2 border-t border-[var(--color-hts-border)]/70 flex items-center gap-3 text-[11px] font-bold">
          <span className="text-muted-foreground shrink-0">자산 구성</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 flex">
            <div
              className="h-full bg-[var(--color-price-up)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, account.stockRatioPct))}%` }}
              title={`주식 ${account.stockRatioPct.toFixed(1)}%`}
            />
            <div
              className="h-full bg-slate-400 dark:bg-slate-600 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, account.cashRatioPct))}%` }}
              title={`현금 ${account.cashRatioPct.toFixed(1)}%`}
            />
          </div>
          <div className="flex items-center gap-2.5 shrink-0 tabular-nums">
            <span className="inline-flex items-center gap-1 text-foreground">
              <span className="w-2 h-2 rounded-full bg-[var(--color-price-up)]" />
              주식 {account.stockRatioPct.toFixed(0)}%
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600" />
              현금 {account.cashRatioPct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5 space-y-5">
          {/* Sub-Tabs: Holdings Management vs Trade History */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex bg-black/[0.04] dark:bg-black/40 p-1 rounded-xl border border-[var(--color-hts-border)]">
              <button
                type="button"
                onClick={() => setSubTab('holdings')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs sm:text-[13px] font-black transition-all cursor-pointer inline-flex items-center gap-1.5',
                  subTab === 'holdings'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>보유 주식 ({holdingList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('trades')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs sm:text-[13px] font-black transition-all cursor-pointer inline-flex items-center gap-1.5',
                  subTab === 'trades'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span>거래 현황 · 체결 내역 ({tradeHistory.length})</span>
              </button>
            </div>

            {subTab === 'holdings' && holdingList.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as HoldingSort)}
                  aria-label="보유 종목 정렬"
                  className="bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="valueDesc">평가금액 높은순</option>
                  <option value="profitRateDesc">수익률 높은순</option>
                  <option value="profitRateAsc">수익률 낮은순</option>
                  <option value="profitDesc">평가손익 높은순</option>
                  <option value="nameAsc">종목명순</option>
                </select>
              </div>
            )}
          </div>

          {/* SUB-TAB 1: HOLDINGS TABLE WITH QUICK SELL / BUY / CHART ACTIONS */}
          {subTab === 'holdings' && (
            <div className="rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-black/[0.01] dark:bg-black/10">
              {holdingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground text-center space-y-3">
                  <PieIcon className="w-10 h-10 opacity-35 text-[var(--color-accent-gold)]" />
                  <div>
                    <p className="text-sm font-bold text-foreground/85">보유 중인 주식이 없습니다.</p>
                    <p className="text-xs mt-1 opacity-75">
                      오늘의 뉴스를 분석한 뒤 모의투자 교실에서 첫 매수 주문을 넣어보세요.
                    </p>
                  </div>
                  {onGoToTrading && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onGoToTrading()}
                      className="h-9 px-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-black text-xs cursor-pointer"
                    >
                      모의투자 교실로 이동
                    </Button>
                  )}
                </div>
              ) : (
                <div className="w-full">
                  {/* Mobile Card List */}
                  <div className="md:hidden divide-y divide-[var(--color-hts-border)]/40">
                    {holdingList.map((item) => {
                      const itemProfit = item.profit > 0;
                      const itemLoss = item.profit < 0;
                      return (
                        <div
                          key={item.id}
                          className="p-4 space-y-3 hover:bg-[var(--color-hts-hover)] transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-foreground text-[15px] truncate">
                                  {item.name}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground font-semibold mt-0.5 tabular-nums">
                                {item.sector.split('(')[0]} · 비중 {item.weightPct.toFixed(1)}%
                              </div>
                            </div>
                            <div
                              className={cn(
                                'text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums shrink-0',
                                itemProfit
                                  ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                                  : itemLoss
                                    ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                                    : 'bg-slate-500/10 text-slate-500'
                              )}
                            >
                              {formatSignedPct(item.profitRate, 2)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                            <div>
                              <span className="opacity-70 mr-1.5">보유수량</span>
                              <span className="text-foreground tabular-nums">{item.quantity}주</span>
                            </div>
                            <div>
                              <span className="opacity-70 mr-1.5">평가금액</span>
                              <span className="text-foreground tabular-nums">
                                {item.currentValue.toLocaleString()}원
                              </span>
                            </div>
                            <div>
                              <span className="opacity-70 mr-1.5">평균단가</span>
                              <span className="text-foreground/85 tabular-nums">
                                {item.avgPrice.toLocaleString()}원
                              </span>
                            </div>
                            <div>
                              <span className="opacity-70 mr-1.5">현재가격</span>
                              <span className="text-foreground/85 tabular-nums">
                                {item.currentPrice.toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--color-hts-border)]/30 flex items-center justify-between text-xs">
                            <span className="font-bold text-muted-foreground">평가손익</span>
                            <span
                              className={cn(
                                'font-black tabular-nums text-sm',
                                itemProfit
                                  ? 'text-[var(--color-price-up)]'
                                  : itemLoss
                                    ? 'text-[var(--color-price-down)]'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {formatSignedWon(item.profit)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openQuickTrade(item.id, 'sell')}
                              className="h-9 rounded-lg bg-[var(--color-price-down)] hover:brightness-110 text-white font-black text-xs cursor-pointer"
                            >
                              빠른 매도
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openQuickTrade(item.id, 'buy')}
                              className="h-9 rounded-lg border-[var(--color-price-up)]/35 text-[var(--color-price-up)] hover:bg-[var(--color-price-up)]/10 font-black text-xs cursor-pointer"
                            >
                              추가 매수
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onGoToTrading?.(item.id)}
                              className="h-9 rounded-lg font-bold text-xs cursor-pointer"
                            >
                              차트 보기
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-black/[0.02] dark:bg-black/30 border-b border-[var(--color-hts-border)] text-muted-foreground text-xs font-bold">
                        <tr>
                          <th className="p-3.5 text-left pl-5">종목명 / 비중</th>
                          <th className="p-3.5 text-right">보유 수량</th>
                          <th className="p-3.5 text-right">평균 매수가</th>
                          <th className="p-3.5 text-right">현재가 (전일비)</th>
                          <th className="p-3.5 text-right">평가금액</th>
                          <th className="p-3.5 text-right">평가손익 (수익률)</th>
                          <th className="p-3.5 text-right pr-5">주문 · 관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-hts-border)]/40">
                        {holdingList.map((item) => {
                          const itemProfit = item.profit > 0;
                          const itemLoss = item.profit < 0;
                          return (
                            <tr
                              key={item.id}
                              className="hover:bg-[var(--color-hts-hover)] transition-colors duration-150"
                            >
                              <td className="p-3.5 pl-5 font-bold text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => onGoToTrading?.(item.id)}
                                    className="text-sm font-black hover:underline text-left cursor-pointer"
                                  >
                                    {item.name}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-muted-foreground font-semibold">
                                    {item.sector.split('(')[0]}
                                  </span>
                                  <div className="w-16 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                                    <div
                                      className="h-full bg-[var(--color-accent-gold)] rounded-full"
                                      style={{ width: `${Math.min(100, item.weightPct)}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground font-bold tabular-nums">
                                    {item.weightPct.toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                              <td className="p-3.5 text-right font-bold text-foreground tabular-nums whitespace-nowrap">
                                {item.quantity}주
                              </td>
                              <td className="p-3.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                                {item.avgPrice.toLocaleString()}원
                              </td>
                              <td className="p-3.5 text-right tabular-nums whitespace-nowrap">
                                <div className="font-bold text-foreground">
                                  {item.currentPrice.toLocaleString()}원
                                </div>
                                <div
                                  className={cn(
                                    'text-[11px] font-bold',
                                    item.dayChange > 0
                                      ? 'text-[var(--color-price-up)]'
                                      : item.dayChange < 0
                                        ? 'text-[var(--color-price-down)]'
                                        : 'text-muted-foreground'
                                  )}
                                >
                                  {formatSignedPct(item.dayChangePct, 1)}
                                </div>
                              </td>
                              <td className="p-3.5 text-right font-bold text-foreground tabular-nums whitespace-nowrap">
                                {item.currentValue.toLocaleString()}원
                              </td>
                              <td
                                className={cn(
                                  'p-3.5 text-right font-black tabular-nums whitespace-nowrap',
                                  itemProfit
                                    ? 'text-[var(--color-price-up)]'
                                    : itemLoss
                                      ? 'text-[var(--color-price-down)]'
                                      : 'text-muted-foreground'
                                )}
                              >
                                <div>{formatSignedWon(item.profit)}</div>
                                <div className="text-xs font-extrabold opacity-90 mt-0.5">
                                  {formatSignedPct(item.profitRate, 2)}
                                </div>
                              </td>
                              <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openQuickTrade(item.id, 'sell')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-[var(--color-price-down)] text-white hover:brightness-110 transition-all cursor-pointer shadow-xs"
                                  >
                                    매도
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openQuickTrade(item.id, 'buy')}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-black bg-[var(--color-price-up)]/12 text-[var(--color-price-up)] hover:bg-[var(--color-price-up)] hover:text-white transition-all cursor-pointer"
                                  >
                                    추가매수
                                  </button>
                                  {onGoToTrading && (
                                    <button
                                      type="button"
                                      onClick={() => onGoToTrading(item.id)}
                                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[var(--color-hts-border)] text-muted-foreground hover:text-foreground hover:bg-[var(--color-hts-hover)] transition-all cursor-pointer"
                                      title="모의투자 교실 차트 보기"
                                    >
                                      차트
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 2: FULL TRADE HISTORY LEDGER */}
          {subTab === 'trades' && (
            <TradeHistoryPanel
              variant="full"
              onSelectStock={onGoToTrading ? (id) => onGoToTrading(id) : undefined}
            />
          )}

          {/* CHARTS CONTAINER */}
          {totalAssetHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Asset Trend Area Chart */}
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[230px]">
                <h4 className="text-[13px] font-black text-foreground mb-2.5 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[var(--color-accent-gold)]" />
                  자산 성장 추이
                </h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={assetTrendData}
                      margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'}
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#0D1322' : '#FFFFFF',
                          borderColor: 'var(--color-hts-border)',
                          borderRadius: '12px',
                          color: isDark ? '#FFF' : '#000',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        formatter={(value: unknown) => [
                          `${Number(value).toLocaleString()}원`,
                          '총 자산',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="총 자산"
                        stroke={isProfit ? 'var(--price-up)' : 'var(--price-down)'}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorAsset)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Asset Allocation Pie Chart */}
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[230px]">
                <h4 className="text-[13px] font-black text-foreground mb-2.5 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-[var(--color-accent-gold)]" />
                  섹터별 포트폴리오 비중
                </h4>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="40%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {assetAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#0D1322' : '#FFFFFF',
                          borderColor: 'var(--color-hts-border)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        formatter={(value: unknown) => [
                          `${Number(value).toLocaleString()}원`,
                          '평가금액',
                        ]}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Trade Modal */}
      <QuickTradeModal
        open={quickTradeOpen}
        onOpenChange={setQuickTradeOpen}
        stockId={quickTradeStockId}
        initialSide={quickTradeSide}
        onSelectStock={(id) => setQuickTradeStockId(id)}
        onGoToTrading={onGoToTrading ? (id, side) => onGoToTrading(id, side) : undefined}
        onGoToNews={onGoToNews}
      />
    </div>
  );
}
