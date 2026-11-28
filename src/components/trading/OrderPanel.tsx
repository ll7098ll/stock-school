import { useMemo, useState } from 'react';
import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
} from '../../stores/gameStore';
import {
  computeHoldingSummaries,
  computeSmartQtyByPct,
  formatSignedPct,
  formatSignedWon,
  getHoldingCostBasis,
  previewBuyOrder,
  previewSellOrder,
} from '../../lib/tradingMetrics';
import type { OrderIntent } from '../../lib/types';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import {
  ShoppingCart,
  TrendingDown,
  Info,
  Plus,
  Minus,
  Lock,
  Newspaper,
  ArrowRight,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  stockId: string;
  onGoToNews?: () => void;
  onSelectStock?: (stockId: string) => void;
  orderIntent?: OrderIntent | null;
}

export default function OrderPanel({
  stockId,
  onGoToNews,
  onSelectStock,
  orderIntent,
}: Props) {
  const {
    stocks,
    cash,
    holdings,
    buyStock,
    sellStock,
    level,
    dayCount,
    tutorialStep,
    currentNews,
    todayNewsChecks,
  } = useGameStore();

  const resolveIntentQty = (intent: OrderIntent | null | undefined, targetStockId: string): string => {
    if (!intent || intent.stockId !== targetStockId) return '1';
    if (intent.side === 'sell') {
      const heldQty = holdings[targetStockId]?.quantity ?? 0;
      if (intent.presetQty === 'all') return String(heldQty);
      if (typeof intent.presetQty === 'number') {
        return String(Math.min(heldQty, Math.max(0, intent.presetQty)));
      }
      return heldQty > 0 ? '1' : '0';
    }
    const targetQty = typeof intent.presetQty === 'number' ? intent.presetQty : 1;
    return String(Math.max(1, targetQty));
  };

  const [tab, setTab] = useState<'buy' | 'sell'>(() =>
    orderIntent && orderIntent.stockId === stockId ? orderIntent.side : 'buy'
  );
  const [quantity, setQuantity] = useState<string>(() => resolveIntentQty(orderIntent, stockId));
  const [showDescription, setShowDescription] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);

  const [prevSync, setPrevSync] = useState({
    stockId,
    intentNonce: orderIntent?.nonce ?? 0,
    level,
    dayCount,
  });

  const currentNonce = orderIntent?.nonce ?? 0;
  if (
    prevSync.stockId !== stockId ||
    prevSync.intentNonce !== currentNonce ||
    prevSync.level !== level ||
    prevSync.dayCount !== dayCount
  ) {
    setPrevSync({ stockId, intentNonce: currentNonce, level, dayCount });
    setConfirmPending(false);

    if (
      orderIntent &&
      orderIntent.nonce !== prevSync.intentNonce &&
      orderIntent.stockId === stockId
    ) {
      setTab(orderIntent.side);
      setQuantity(resolveIntentQty(orderIntent, stockId));
    } else if (
      prevSync.stockId !== stockId ||
      prevSync.level !== level ||
      prevSync.dayCount !== dayCount
    ) {
      if (tab === 'sell') {
        const heldQty = holdings[stockId]?.quantity ?? 0;
        setQuantity(heldQty > 0 ? '1' : '0');
      } else {
        setQuantity('1');
      }
    }
  }

  const holdingList = useMemo(
    () =>
      computeHoldingSummaries(holdings, stocks, cash, currentNews).sort(
        (a, b) => b.currentValue - a.currentValue
      ),
    [holdings, stocks, cash, currentNews]
  );

  const totalStockValue = useMemo(
    () => holdingList.reduce((acc, item) => acc + item.currentValue, 0),
    [holdingList]
  );
  const totalAsset = cash + totalStockValue;

  const stock = stocks[stockId];
  const holding = holdings[stockId];

  if (!stock) return null;

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const canTrade = isTodayNewsComplete(currentNews, todayNewsChecks);

  const maxBuy = stock.currentPrice > 0 ? Math.floor(cash / stock.currentPrice) : 0;
  const maxSell = holding?.quantity || 0;
  const maxForTab = tab === 'buy' ? maxBuy : maxSell;

  const parsedQty = parseInt(quantity, 10);
  const qty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;
  const isOverMax = qty > maxForTab;

  const buyPreview = previewBuyOrder(stock, cash, holding, totalAsset, qty);
  const sellPreview = previewSellOrder(stock, cash, holding, qty);

  const buyPctButtons = [
    { label: '10%', pct: 10 },
    { label: '25%', pct: 25 },
    { label: '50%', pct: 50 },
    { label: '최대', pct: 100 },
  ];

  const sellPctButtons = [
    { label: '25%', pct: 25 },
    { label: '50%', pct: 50 },
    { label: '75%', pct: 75 },
    { label: '전량', pct: 100 },
  ];

  const needsConfirmation =
    tab === 'sell'
      ? sellPreview.isFullSell && qty > 0
      : buyPreview.isLargeOrder && qty > 0 && !isOverMax;

  const updateQuantity = (nextVal: string) => {
    setQuantity(nextVal);
    setConfirmPending(false);
  };

  const setPercentage = (pct: number) => {
    const computed = computeSmartQtyByPct(maxForTab, pct);
    updateQuantity(String(computed));
  };

  const adjustQty = (delta: number) => {
    const nextQty = Math.min(maxForTab, Math.max(0, qty + delta));
    updateQuantity(String(nextQty));
  };

  const executeBuy = () => {
    if (!canTrade) {
      toast.info('먼저 오늘의 뉴스를 모두 읽고 판단을 체크해 주세요! 📰');
      onGoToNews?.();
      return;
    }
    if (qty <= 0) return toast.error('주문 수량을 입력하세요.');
    if (isOverMax) return toast.error('주문 가능 예수금이 부족합니다.');

    if (needsConfirmation && !confirmPending) {
      setConfirmPending(true);
      return;
    }

    if (buyStock(stockId, qty)) {
      toast.success(
        `${stock.name} ${qty}주 매수 완료! (${buyPreview.estimatedAmount.toLocaleString()}원)`
      );
      setQuantity('1');
      setConfirmPending(false);
    } else {
      toast.error('잔액이 부족합니다.');
    }
  };

  const executeSell = () => {
    if (!canTrade) {
      toast.info('먼저 오늘의 뉴스를 모두 읽고 판단을 체크해 주세요! 📰');
      onGoToNews?.();
      return;
    }
    if (qty <= 0) return toast.error('매도할 수량을 입력하세요.');
    if (isOverMax) return toast.error('보유 수량보다 많이 매도할 수 없습니다.');

    if (needsConfirmation && !confirmPending) {
      setConfirmPending(true);
      return;
    }

    const realizedProfit = sellPreview.realizedProfit;
    const realizedRate = sellPreview.realizedProfitRate;
    const remainingAfter = sellPreview.remainingQuantity;

    if (sellStock(stockId, qty)) {
      toast.success(
        `${stock.name} ${qty}주 매도 완료! (실현손익 ${formatSignedWon(realizedProfit)}, ${formatSignedPct(realizedRate, 1)})`
      );
      setQuantity(remainingAfter > 0 ? '1' : '0');
      setConfirmPending(false);
    } else {
      toast.error('보유 수량이 부족합니다.');
    }
  };

  const holdingPnL = holding
    ? (() => {
        const value = stock.currentPrice * holding.quantity;
        const cost = getHoldingCostBasis(holding);
        const profit = value - cost;
        return {
          value,
          cost,
          profit,
          profitRate: cost > 0 ? (profit / cost) * 100 : 0,
          weightPct: totalAsset > 0 ? (value / totalAsset) * 100 : 0,
        };
      })()
    : null;

  const isSellUnheld = tab === 'sell' && !holding;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] transition-all duration-300 overflow-hidden',
        tutorialStep === 4 &&
          'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 4 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">💰</span> 4단계: 뉴스를 분석한 뒤 수량을 설정해 모의 주문을 실행해 보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">
            주문 실행
          </span>
        </div>
      )}

      {/* Stock Title Header */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01] shrink-0 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-foreground text-[15px] tracking-tight truncate">
              {stock.name}
            </h3>
            {holding && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 shrink-0 tabular-nums">
                {holding.quantity}주 보유
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-semibold">{stock.sector}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowDescription(!showDescription)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0',
            showDescription
              ? 'bg-[var(--color-hts-hover)] text-foreground'
              : 'text-muted-foreground hover:bg-[var(--color-hts-hover)] hover:text-foreground'
          )}
          title="기업 핵심 요약 토글"
        >
          <Info className="w-3.5 h-3.5" />
          <span>요약</span>
        </button>
      </div>

      {/* Buy / Sell Mode Switcher (Always pinned at top for effortless switching) */}
      <div className="px-4 pt-3 pb-2 shrink-0 bg-[var(--color-hts-panel)]">
        <div className="grid grid-cols-2 gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-xl border border-[var(--color-hts-border)]">
          <button
            type="button"
            onClick={() => {
              setTab('buy');
              setQuantity('1');
              setConfirmPending(false);
            }}
            className={cn(
              'py-2 rounded-lg text-[13px] font-extrabold transition-all duration-200 cursor-pointer',
              tab === 'buy'
                ? 'bg-[var(--color-price-up)] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            매수 주문
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('sell');
              setQuantity(maxSell > 0 ? '1' : '0');
              setConfirmPending(false);
            }}
            className={cn(
              'py-2 rounded-lg text-[13px] font-extrabold transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-1.5',
              tab === 'sell'
                ? 'bg-[var(--color-price-down)] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <span>매도 주문</span>
            {holdingList.length > 0 && (
              <span
                className={cn(
                  'text-[10px] font-black px-1.5 py-0.2 rounded-full tabular-nums',
                  tab === 'sell'
                    ? 'bg-white/25 text-white'
                    : 'bg-[var(--color-price-down)]/15 text-[var(--color-price-down)]'
                )}
              >
                {holdingList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="px-4 pb-4 pt-1.5 space-y-3">
          {/* Mandatory News Gate Banner */}
          {!canTrade && (
            <div className="p-3.5 rounded-2xl border-2 border-amber-500/45 bg-amber-500/10 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-[13px] font-black text-foreground leading-snug">
                    오늘의 뉴스를 먼저 읽어주세요!
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    뉴스 {currentNews.length}건 판단 완료 후 주문이 열립니다. (현재{' '}
                    <strong className="text-amber-700 dark:text-amber-300">
                      {checkedCount}/{currentNews.length}
                    </strong>
                    )
                  </p>
                </div>
              </div>
              {onGoToNews && (
                <Button
                  type="button"
                  onClick={onGoToNews}
                  className="w-full h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 cursor-pointer"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>오늘의 뉴스 읽으러 가기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}

          {/* Optional Description Toggle */}
          {showDescription && (
            <div className="p-3 border border-[var(--color-accent-gold)]/20 bg-black/[0.015] dark:bg-white/[0.02] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-[var(--color-accent-gold)]">
                <Info className="w-3.5 h-3.5" />
                <span className="text-xs font-black">기업 핵심 정보</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-medium">
                {stock.descriptions[level]}
              </p>
            </div>
          )}

          {/* SELL TAB: Quick switcher when user holds other stocks */}
          {tab === 'sell' && holding && holdingList.length > 1 && onSelectStock && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  보유 종목 빠른 전환 ({holdingList.length})
                </span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {holdingList.map((item) => {
                  const isCurrent = item.id === stockId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectStock(item.id)}
                      className={cn(
                        'shrink-0 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5',
                        isCurrent
                          ? 'bg-[var(--color-price-down)] text-white border-[var(--color-price-down)] shadow-sm'
                          : 'bg-black/[0.02] dark:bg-black/30 border-[var(--color-hts-border)] text-foreground hover:bg-[var(--color-hts-hover)]'
                      )}
                    >
                      <span className="truncate max-w-[90px]">{item.name}</span>
                      <span
                        className={cn(
                          'text-[11px] font-black tabular-nums',
                          isCurrent
                            ? 'text-white/90'
                            : item.profitRate > 0
                              ? 'text-[var(--color-price-up)]'
                              : item.profitRate < 0
                                ? 'text-[var(--color-price-down)]'
                                : 'text-muted-foreground'
                        )}
                      >
                        {formatSignedPct(item.profitRate, 1)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SELL TAB: Unheld stock state -> Show held stocks to pick & sell directly! */}
          {isSellUnheld ? (
            <div className="space-y-3 pt-1">
              {holdingList.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/20 text-center space-y-3">
                  <Briefcase className="w-8 h-8 mx-auto text-muted-foreground/45" />
                  <div className="space-y-1">
                    <div className="text-sm font-black text-foreground">
                      보유 중인 주식이 없습니다
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                      먼저 관심 종목을 매수하면 여기에서 보유 수익률을 보며 바로 매도할 수 있어요.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setTab('buy');
                      setQuantity('1');
                    }}
                    className="h-9 px-4 rounded-xl bg-[var(--color-price-up)] hover:brightness-110 text-white font-black text-xs cursor-pointer"
                  >
                    {stock.name} 매수하러 가기
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[var(--color-price-down)]/[0.06] border border-[var(--color-price-down)]/25 text-xs font-semibold text-foreground leading-relaxed">
                    <strong>{stock.name}</strong>은(는) 보유하고 있지 않아요.
                    <br />
                    아래 <strong className="text-[var(--color-price-down)]">내 보유 주식</strong>을 클릭하면 바로 매도할 수 있어요!
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-0.5">
                    <span>내 보유 주식 ({holdingList.length}종목)</span>
                    <span className="tabular-nums">
                      평가합계 {totalStockValue.toLocaleString()}원
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {holdingList.map((item) => {
                      const isUp = item.profit > 0;
                      const isDown = item.profit < 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectStock?.(item.id)}
                          className="w-full p-3 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/30 hover:bg-[var(--color-hts-hover)] hover:border-[var(--color-price-down)]/40 transition-all text-left cursor-pointer group space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-black text-[13px] text-foreground truncate">
                                {item.name}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'text-xs font-black px-2 py-0.5 rounded-md tabular-nums shrink-0',
                                isUp
                                  ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                                  : isDown
                                    ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                                    : 'bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground'
                              )}
                            >
                              {formatSignedPct(item.profitRate, 1)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="text-muted-foreground font-semibold">
                              {item.quantity}주 · 평단 {item.avgPrice.toLocaleString()}원
                            </span>
                            <span
                              className={cn(
                                'font-extrabold',
                                isUp
                                  ? 'text-[var(--color-price-up)]'
                                  : isDown
                                    ? 'text-[var(--color-price-down)]'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {formatSignedWon(item.profit)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-[var(--color-hts-border)]/50">
                            <span className="text-muted-foreground font-semibold tabular-nums truncate">
                              평가 {item.currentValue.toLocaleString()}원
                            </span>
                            <span className="font-black text-[var(--color-price-down)] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5 whitespace-nowrap shrink-0">
                              매도 선택 <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Account & Holding Snapshot Cards */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-2.5">
                    <div className="text-[11px] text-muted-foreground font-semibold">
                      주문 가능 예수금
                    </div>
                    <div className="font-black text-foreground text-sm mt-0.5 tabular-nums">
                      {cash.toLocaleString()}
                      <span className="text-[11px] text-muted-foreground font-bold ml-0.5">원</span>
                    </div>
                  </div>
                  <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-2.5">
                    <div className="text-[11px] text-muted-foreground font-semibold">
                      현재 보유 수량
                    </div>
                    <div className="font-black text-foreground text-sm mt-0.5 tabular-nums">
                      {holding?.quantity || 0}
                      <span className="text-[11px] text-muted-foreground font-bold ml-0.5">주</span>
                    </div>
                  </div>
                </div>

                {holdingPnL && (
                  <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-2.5 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[11px] text-muted-foreground font-semibold">
                          매수 평균가
                        </div>
                        <div className="font-bold text-[13px] text-foreground mt-0.5 tabular-nums">
                          {holding!.avgPrice.toLocaleString()}원
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted-foreground font-semibold">
                          평가 손익
                        </div>
                        <div
                          className={cn(
                            'font-black text-[13px] mt-0.5 tabular-nums',
                            holdingPnL.profit > 0
                              ? 'text-[var(--color-price-up)]'
                              : holdingPnL.profit < 0
                                ? 'text-[var(--color-price-down)]'
                                : 'text-foreground'
                          )}
                        >
                          {formatSignedWon(holdingPnL.profit)} ({formatSignedPct(holdingPnL.profitRate, 1)})
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-[var(--color-hts-border)]/50 font-semibold tabular-nums">
                      <span>평가금액 {holdingPnL.value.toLocaleString()}원</span>
                      <span>자산 비중 {holdingPnL.weightPct.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Price display */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border border-dashed border-[var(--color-hts-border)] rounded-xl">
                <div>
                  <div className="text-[11px] text-muted-foreground font-bold">주문 기준 단가</div>
                  {holding && (
                    <div className="text-[11px] font-bold mt-0.5">
                      {stock.currentPrice > holding.avgPrice ? (
                        <span className="text-[var(--color-price-up)]">
                          평단 대비 +{(stock.currentPrice - holding.avgPrice).toLocaleString()}원 (익절 구간)
                        </span>
                      ) : stock.currentPrice < holding.avgPrice ? (
                        <span className="text-[var(--color-price-down)]">
                          평단 대비 {(stock.currentPrice - holding.avgPrice).toLocaleString()}원 (손절 구간)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">평단가와 동일</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xl font-black text-foreground tabular-nums">
                  {stock.currentPrice.toLocaleString()}
                  <span className="text-xs font-bold text-muted-foreground ml-0.5">원</span>
                </div>
              </div>

              {/* Quantity Input with Plus/Minus */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground">주문 수량</label>
                  <button
                    type="button"
                    disabled={!canTrade || maxForTab <= 0}
                    onClick={() => updateQuantity(String(maxForTab))}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold tabular-nums cursor-pointer disabled:cursor-default disabled:opacity-60"
                    title="클릭하여 최대 수량 입력"
                  >
                    최대 가능: <strong className="text-foreground">{maxForTab.toLocaleString()}주</strong>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustQty(-1)}
                    disabled={!canTrade || qty <= 0}
                    className="w-10 h-10 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all shrink-0"
                    aria-label="수량 1 감소"
                  >
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>

                  <input
                    type="number"
                    value={quantity}
                    disabled={!canTrade}
                    onChange={(e) => updateQuantity(e.target.value)}
                    min="0"
                    max={maxForTab}
                    className={cn(
                      'flex-1 min-w-0 bg-black/[0.03] dark:bg-black/40 border rounded-xl py-2 text-center font-black text-lg tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 transition-all disabled:opacity-45',
                      isOverMax
                        ? 'border-rose-500 text-rose-500'
                        : 'border-[var(--color-hts-border)] focus:border-[var(--color-accent-gold)]'
                    )}
                  />

                  <button
                    type="button"
                    onClick={() => adjustQty(1)}
                    disabled={!canTrade || qty >= maxForTab}
                    className="w-10 h-10 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all shrink-0"
                    aria-label="수량 1 증가"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Percentage buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(tab === 'buy' ? buyPctButtons : sellPctButtons).map(({ label, pct }) => (
                    <button
                      key={label}
                      type="button"
                      disabled={!canTrade || maxForTab <= 0}
                      onClick={() => setPercentage(pct)}
                      className={cn(
                        'py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                        pct === 100 && tab === 'sell'
                          ? 'bg-[var(--color-price-down)]/10 border-[var(--color-price-down)]/30 text-[var(--color-price-down)] hover:bg-[var(--color-price-down)]/20'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] border-[var(--color-hts-border)] text-muted-foreground hover:bg-[var(--color-hts-hover)] hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {isOverMax && (
                  <p className="text-[11px] font-bold text-rose-500">
                    {tab === 'buy'
                      ? `주문 가능 최대 수량(${maxBuy}주)을 초과했습니다.`
                      : `보유 수량(${maxSell}주)을 초과했습니다.`}
                  </p>
                )}
              </div>

              {/* Order Preview Card (Buy or Sell) */}
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-bold">
                    {tab === 'buy' ? '총 매수 예정 금액' : '총 매도 예정 금액'}
                  </span>
                  <span
                    className={cn(
                      'font-black text-base tabular-nums',
                      tab === 'buy'
                        ? 'text-[var(--color-price-up)]'
                        : 'text-[var(--color-price-down)]'
                    )}
                  >
                    {(tab === 'buy' ? buyPreview.estimatedAmount : sellPreview.estimatedAmount).toLocaleString()}원
                  </span>
                </div>

                {tab === 'buy' && qty > 0 && !isOverMax && (
                  <div className="pt-2 border-t border-[var(--color-hts-border)]/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">매수 후 예상 예수금</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {buyPreview.remainingCash.toLocaleString()}원
                      </span>
                    </div>
                    {holding && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-semibold">예상 평균 매수가</span>
                        <span className="font-bold text-foreground tabular-nums">
                          {holding.avgPrice.toLocaleString()} → {buyPreview.nextAvgPrice.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">매수 후 종목 비중</span>
                      <span
                        className={cn(
                          'font-bold tabular-nums',
                          buyPreview.nextWeightPct > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                        )}
                      >
                        총 자산의 {buyPreview.nextWeightPct.toFixed(1)}%
                      </span>
                    </div>
                    {buyPreview.nextWeightPct > 50 && (
                      <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>한 종목 비중이 50%를 넘어요. 분산투자도 함께 고려해 보세요.</span>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'sell' && qty > 0 && !isOverMax && (
                  <div className="pt-2 border-t border-[var(--color-hts-border)]/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">예상 실현 손익</span>
                      <span
                        className={cn(
                          'font-black tabular-nums',
                          sellPreview.realizedProfit > 0
                            ? 'text-[var(--color-price-up)]'
                            : sellPreview.realizedProfit < 0
                              ? 'text-[var(--color-price-down)]'
                              : 'text-foreground'
                        )}
                      >
                        {formatSignedWon(sellPreview.realizedProfit)} ({formatSignedPct(sellPreview.realizedProfitRate, 1)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">매도 후 잔여 보유</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {sellPreview.isFullSell
                          ? '전량 청산 (0주)'
                          : `${maxSell}주 → ${sellPreview.remainingQuantity}주`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold">매도 후 예상 예수금</span>
                      <span className="font-bold text-foreground tabular-nums">
                        {sellPreview.nextCash.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Inline 2-step confirmation for Full Sell or Large Buy (>=50% cash) */}
              {confirmPending && canTrade ? (
                <div className="p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 space-y-2.5 animate-fade-in">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs font-bold text-foreground leading-relaxed">
                      {tab === 'sell' ? (
                        <>
                          <strong>{stock.name} {qty}주 전량 매도</strong>를 실행할까요?
                          <br />
                          <span className="text-muted-foreground">
                            예상 실현손익{' '}
                            <strong
                              className={cn(
                                sellPreview.realizedProfit > 0
                                  ? 'text-[var(--color-price-up)]'
                                  : sellPreview.realizedProfit < 0
                                    ? 'text-[var(--color-price-down)]'
                                    : 'text-foreground'
                              )}
                            >
                              {formatSignedWon(sellPreview.realizedProfit)}
                            </strong>
                          </span>
                        </>
                      ) : (
                        <>
                          예수금의 <strong>{Math.round(buyPreview.cashUsagePct)}%</strong>(
                          {buyPreview.estimatedAmount.toLocaleString()}원)로{' '}
                          <strong>{stock.name} {qty}주</strong>를 매수할까요?
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmPending(false)}
                      className="h-9 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={tab === 'buy' ? executeBuy : executeSell}
                      className={cn(
                        'h-9 rounded-lg text-xs font-black text-white cursor-pointer gap-1',
                        tab === 'buy'
                          ? 'bg-[var(--color-price-up)] hover:brightness-110'
                          : 'bg-[var(--color-price-down)] hover:brightness-110'
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {tab === 'buy' ? '확인 · 매수' : '확인 · 전량매도'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  className={cn(
                    'w-full font-black text-white text-[15px] h-11 rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:translate-y-0.5 duration-200 disabled:opacity-45',
                    !canTrade
                      ? 'bg-slate-500 hover:bg-slate-600'
                      : tab === 'buy'
                        ? 'bg-[var(--color-price-up)] hover:brightness-110'
                        : 'bg-[var(--color-price-down)] hover:brightness-110'
                  )}
                  onClick={tab === 'buy' ? executeBuy : executeSell}
                  disabled={canTrade && (qty <= 0 || isOverMax)}
                >
                  {!canTrade ? (
                    <>
                      <Lock className="w-4 h-4 mr-1.5" /> 뉴스 확인 후 주문 가능
                    </>
                  ) : tab === 'buy' ? (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      {qty > 0 ? `${qty}주 모의 매수 실행` : '모의 매수 실행'}
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 mr-1.5" />
                      {sellPreview.isFullSell
                        ? `${qty}주 전량 매도 실행`
                        : qty > 0
                          ? `${qty}주 모의 매도 실행`
                          : '모의 매도 실행'}
                    </>
                  )}
                </Button>
              )}

              <p className="text-[11px] text-muted-foreground text-center font-medium">
                가상 자금 모의 주문 (학습 편의를 위해 거래 수수료·세금 미적용)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
