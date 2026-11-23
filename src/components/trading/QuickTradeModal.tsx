import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
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
  previewBuyOrder,
  previewSellOrder,
} from '../../lib/tradingMetrics';
import type { TradeType } from '../../lib/types';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  LineChart,
  Lock,
  Minus,
  Newspaper,
  Plus,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';

interface QuickTradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockId: string | null;
  initialSide?: TradeType;
  onSelectStock?: (stockId: string) => void;
  onGoToTrading?: (stockId: string, side: TradeType) => void;
  onGoToNews?: () => void;
}

export default function QuickTradeModal({
  open,
  onOpenChange,
  stockId,
  initialSide = 'sell',
  onSelectStock,
  onGoToTrading,
  onGoToNews,
}: QuickTradeModalProps) {
  const {
    stocks,
    holdings,
    cash,
    currentNews,
    todayNewsChecks,
    buyStock,
    sellStock,
  } = useGameStore();

  const [side, setSide] = useState<TradeType>(initialSide);
  const [quantity, setQuantity] = useState<string>('1');
  const [confirmPending, setConfirmPending] = useState(false);

  const [prevSync, setPrevSync] = useState({
    open,
    stockId,
    initialSide,
  });

  if (
    prevSync.open !== open ||
    prevSync.stockId !== stockId ||
    prevSync.initialSide !== initialSide
  ) {
    setPrevSync({ open, stockId, initialSide });
    if (open && stockId) {
      const nextSide = prevSync.open ? side : initialSide;
      if (!prevSync.open) {
        setSide(initialSide);
      }
      const heldQty = holdings[stockId]?.quantity ?? 0;
      setQuantity(nextSide === 'sell' ? (heldQty > 0 ? String(heldQty) : '0') : '1');
      setConfirmPending(false);
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
    () => holdingList.reduce((sum, item) => sum + item.currentValue, 0),
    [holdingList]
  );
  const totalAsset = cash + totalStockValue;

  const stock = stockId ? stocks[stockId] : null;
  const holding = stockId ? holdings[stockId] : undefined;

  if (!stock || !stockId) return null;

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const canTrade = isTodayNewsComplete(currentNews, todayNewsChecks);

  const maxBuy = stock.currentPrice > 0 ? Math.floor(cash / stock.currentPrice) : 0;
  const maxSell = holding?.quantity ?? 0;
  const maxForSide = side === 'buy' ? maxBuy : maxSell;

  const parsedQty = parseInt(quantity, 10);
  const qty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 0;
  const isOverMax = qty > maxForSide;

  const buyPreview = previewBuyOrder(stock, cash, holding, totalAsset, qty);
  const sellPreview = previewSellOrder(stock, cash, holding, qty);

  const needsConfirm =
    side === 'sell'
      ? sellPreview.isFullSell && qty > 0
      : buyPreview.isLargeOrder && qty > 0 && !isOverMax;

  const holdingProfit = holding ? (stock.currentPrice - holding.avgPrice) * holding.quantity : 0;
  const holdingProfitRate =
    holding && holding.avgPrice > 0
      ? ((stock.currentPrice - holding.avgPrice) / holding.avgPrice) * 100
      : 0;

  const handleSetPct = (pct: number) => {
    setQuantity(String(computeSmartQtyByPct(maxForSide, pct)));
    setConfirmPending(false);
  };

  const handleAdjust = (delta: number) => {
    setQuantity(String(Math.min(maxForSide, Math.max(0, qty + delta))));
    setConfirmPending(false);
  };

  const handleExecute = () => {
    if (!canTrade) {
      toast.info('먼저 오늘의 뉴스를 모두 읽고 판단을 체크해 주세요! 📰');
      onOpenChange(false);
      onGoToNews?.();
      return;
    }
    if (qty <= 0 || isOverMax) {
      toast.error('유효한 주문 수량을 입력해 주세요.');
      return;
    }

    if (needsConfirm && !confirmPending) {
      setConfirmPending(true);
      return;
    }

    if (side === 'buy') {
      if (buyStock(stockId, qty)) {
        toast.success(
          `${stock.name} ${qty}주 추가 매수 완료! (${buyPreview.estimatedAmount.toLocaleString()}원)`
        );
        setQuantity('1');
        setConfirmPending(false);
      } else {
        toast.error('주문 가능 예수금이 부족합니다.');
      }
      return;
    }

    const realizedProfit = sellPreview.realizedProfit;
    const realizedRate = sellPreview.realizedProfitRate;
    const remainingAfter = sellPreview.remainingQuantity;

    if (sellStock(stockId, qty)) {
      toast.success(
        `${stock.name} ${qty}주 매도 완료! (실현손익 ${formatSignedWon(realizedProfit)}, ${formatSignedPct(realizedRate, 1)})`
      );
      setConfirmPending(false);

      if (remainingAfter === 0) {
        const nextHeld = holdingList.find((item) => item.id !== stockId);
        if (nextHeld && onSelectStock) {
          onSelectStock(nextHeld.id);
        } else {
          onOpenChange(false);
        }
      } else {
        setQuantity(String(remainingAfter));
      }
    } else {
      toast.error('보유 수량이 부족합니다.');
    }
  };

  const pctOptions =
    side === 'buy'
      ? [
          { label: '10%', pct: 10 },
          { label: '25%', pct: 25 },
          { label: '50%', pct: 50 },
          { label: '최대', pct: 100 },
        ]
      : [
          { label: '25%', pct: 25 },
          { label: '50%', pct: 50 },
          { label: '75%', pct: 75 },
          { label: '전량', pct: 100 },
        ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90dvh] p-0 gap-0 overflow-hidden bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl flex flex-col">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.015] shrink-0 text-left pr-12">
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-lg font-black text-foreground tracking-tight">
              {stock.name}
            </DialogTitle>
            <span className="text-xs font-bold text-muted-foreground">{stock.sector}</span>
          </div>
          <DialogDescription className="text-xs font-semibold text-muted-foreground mt-0.5 tabular-nums">
            현재가 <strong className="text-foreground">{stock.currentPrice.toLocaleString()}원</strong>
            {holding ? (
              <>
                {' · '}보유 <strong className="text-foreground">{holding.quantity}주</strong> (평단{' '}
                {holding.avgPrice.toLocaleString()}원)
              </>
            ) : (
              ' · 미보유 종목'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3.5">
          {/* Quick switch between held stocks inside modal */}
          {holdingList.length > 1 && onSelectStock && (
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-muted-foreground">
                보유 종목 바로 전환 ({holdingList.length})
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
                        'shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1',
                        isCurrent
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                          : 'bg-black/[0.02] dark:bg-black/30 border-[var(--color-hts-border)] text-foreground hover:bg-[var(--color-hts-hover)]'
                      )}
                    >
                      <span>{item.name}</span>
                      <span
                        className={cn(
                          'text-[11px] font-black tabular-nums',
                          isCurrent
                            ? 'opacity-85'
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

          {/* Side Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-xl border border-[var(--color-hts-border)]">
            <button
              type="button"
              onClick={() => {
                setSide('sell');
                setQuantity(maxSell > 0 ? String(maxSell) : '0');
                setConfirmPending(false);
              }}
              className={cn(
                'py-2 rounded-lg text-[13px] font-extrabold transition-all cursor-pointer',
                side === 'sell'
                  ? 'bg-[var(--color-price-down)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              빠른 매도
            </button>
            <button
              type="button"
              onClick={() => {
                setSide('buy');
                setQuantity('1');
                setConfirmPending(false);
              }}
              className={cn(
                'py-2 rounded-lg text-[13px] font-extrabold transition-all cursor-pointer',
                side === 'buy'
                  ? 'bg-[var(--color-price-up)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              추가 매수
            </button>
          </div>

          {/* News Gate Banner */}
          {!canTrade && (
            <div className="p-3.5 rounded-xl border-2 border-amber-500/45 bg-amber-500/10 space-y-2">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-foreground leading-relaxed">
                  오늘의 뉴스 판단을 완료해야 주문할 수 있어요. ({checkedCount}/{currentNews.length})
                </div>
              </div>
              {onGoToNews && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onGoToNews();
                  }}
                  className="w-full h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs gap-1.5 cursor-pointer"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  오늘의 뉴스 읽으러 가기
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}

          {/* Holding KPI Strip */}
          {holding && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-[var(--color-hts-border)]">
                <div className="text-[11px] text-muted-foreground font-semibold">보유 수량</div>
                <div className="font-black text-foreground mt-0.5 tabular-nums">{holding.quantity}주</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-[var(--color-hts-border)]">
                <div className="text-[11px] text-muted-foreground font-semibold">평가금액</div>
                <div className="font-black text-foreground mt-0.5 tabular-nums">
                  {(stock.currentPrice * holding.quantity).toLocaleString()}원
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-black/30 border border-[var(--color-hts-border)]">
                <div className="text-[11px] text-muted-foreground font-semibold">현재 수익률</div>
                <div
                  className={cn(
                    'font-black mt-0.5 tabular-nums',
                    holdingProfit > 0
                      ? 'text-[var(--color-price-up)]'
                      : holdingProfit < 0
                        ? 'text-[var(--color-price-down)]'
                        : 'text-foreground'
                  )}
                >
                  {formatSignedPct(holdingProfitRate, 1)}
                </div>
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-muted-foreground">
                {side === 'sell' ? '매도 수량' : '매수 수량'}
              </span>
              <span className="font-semibold text-muted-foreground tabular-nums">
                {side === 'sell'
                  ? `매도 가능 ${maxSell}주`
                  : `예수금 ${cash.toLocaleString()}원 (최대 ${maxBuy}주)`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAdjust(-1)}
                disabled={!canTrade || qty <= 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-hts-border)] hover:bg-[var(--color-hts-hover)] cursor-pointer disabled:opacity-35"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                disabled={!canTrade}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setConfirmPending(false);
                }}
                min="0"
                max={maxForSide}
                className={cn(
                  'flex-1 min-w-0 bg-black/[0.03] dark:bg-black/40 border rounded-xl py-2 text-center font-black text-lg tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40',
                  isOverMax ? 'border-rose-500 text-rose-500' : 'border-[var(--color-hts-border)]'
                )}
              />
              <button
                type="button"
                onClick={() => handleAdjust(1)}
                disabled={!canTrade || qty >= maxForSide}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-[var(--color-hts-border)] hover:bg-[var(--color-hts-hover)] cursor-pointer disabled:opacity-35"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {pctOptions.map(({ label, pct }) => (
                <button
                  key={label}
                  type="button"
                  disabled={!canTrade || maxForSide <= 0}
                  onClick={() => handleSetPct(pct)}
                  className={cn(
                    'py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all disabled:opacity-40',
                    pct === 100 && side === 'sell'
                      ? 'bg-[var(--color-price-down)]/10 border-[var(--color-price-down)]/30 text-[var(--color-price-down)] hover:bg-[var(--color-price-down)]/20'
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-[var(--color-hts-border)] text-muted-foreground hover:bg-[var(--color-hts-hover)] hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-3 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-bold">
                {side === 'sell' ? '예상 매도 금액' : '예상 매수 금액'}
              </span>
              <span
                className={cn(
                  'font-black text-base tabular-nums',
                  side === 'sell' ? 'text-[var(--color-price-down)]' : 'text-[var(--color-price-up)]'
                )}
              >
                {(side === 'sell' ? sellPreview.estimatedAmount : buyPreview.estimatedAmount).toLocaleString()}원
              </span>
            </div>

            {side === 'sell' && qty > 0 && !isOverMax && (
              <>
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--color-hts-border)]/50">
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
                    {formatSignedWon(sellPreview.realizedProfit)} (
                    {formatSignedPct(sellPreview.realizedProfitRate, 1)})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">매도 후 잔여 보유</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {sellPreview.isFullSell ? '전량 청산 (0주)' : `${sellPreview.remainingQuantity}주`}
                  </span>
                </div>
              </>
            )}

            {side === 'buy' && qty > 0 && !isOverMax && (
              <>
                <div className="flex items-center justify-between pt-1.5 border-t border-[var(--color-hts-border)]/50">
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
              </>
            )}
          </div>

          {/* 2-Step Confirmation or Execute */}
          {confirmPending && canTrade ? (
            <div className="p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 space-y-2.5">
              <div className="flex items-start gap-2 text-xs font-bold text-foreground">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {side === 'sell'
                    ? `${stock.name} ${qty}주 전량 매도를 진행할까요? (실현손익 ${formatSignedWon(sellPreview.realizedProfit)})`
                    : `예수금의 ${Math.round(buyPreview.cashUsagePct)}%로 ${stock.name} ${qty}주를 매수할까요?`}
                </span>
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
                  onClick={handleExecute}
                  className={cn(
                    'h-9 rounded-lg text-xs font-black text-white cursor-pointer gap-1',
                    side === 'sell'
                      ? 'bg-[var(--color-price-down)] hover:brightness-110'
                      : 'bg-[var(--color-price-up)] hover:brightness-110'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {side === 'sell' ? '확인 · 전량매도' : '확인 · 매수'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleExecute}
              disabled={canTrade && (qty <= 0 || isOverMax)}
              className={cn(
                'w-full h-11 rounded-xl font-black text-white text-sm cursor-pointer gap-1.5',
                !canTrade
                  ? 'bg-slate-500 hover:bg-slate-600'
                  : side === 'sell'
                    ? 'bg-[var(--color-price-down)] hover:brightness-110'
                    : 'bg-[var(--color-price-up)] hover:brightness-110'
              )}
            >
              {!canTrade ? (
                <>
                  <Lock className="w-4 h-4" /> 뉴스 확인 후 주문 가능
                </>
              ) : side === 'sell' ? (
                <>
                  <TrendingDown className="w-4 h-4" />
                  {sellPreview.isFullSell ? `${qty}주 전량 매도 실행` : `${qty}주 매도 실행`}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {qty}주 추가 매수 실행
                </>
              )}
            </Button>
          )}
        </div>

        {/* Footer link to Trading Classroom */}
        {onGoToTrading && (
          <div className="px-5 py-3 border-t border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/20 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-muted-foreground">
              차트와 호가를 보고 주문하려면?
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onGoToTrading(stockId, side);
              }}
              className="inline-flex items-center gap-1 text-xs font-black text-[var(--color-accent-gold)] hover:underline cursor-pointer"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>모의투자 교실로 이동</span>
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
