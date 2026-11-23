import { useState } from 'react';
import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
} from '../../stores/gameStore';
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
} from 'lucide-react';

interface Props {
  stockId: string;
  onGoToNews?: () => void;
}

export default function OrderPanel({ stockId, onGoToNews }: Props) {
  const {
    stocks,
    cash,
    holdings,
    buyStock,
    sellStock,
    level,
    tutorialStep,
    currentNews,
    todayNewsChecks,
  } = useGameStore();
  const [quantity, setQuantity] = useState<string>('1');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [showDescription, setShowDescription] = useState(false);

  const stock = stocks[stockId];
  const holding = holdings[stockId];

  if (!stock) return null;

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const canTrade = isTodayNewsComplete(currentNews, todayNewsChecks);

  const maxBuy = Math.floor(cash / stock.currentPrice);
  const maxSell = holding?.quantity || 0;
  const qty = parseInt(quantity) || 0;
  const estimatedAmount = qty * stock.currentPrice;

  const percentageButtons = [10, 25, 50, 100];

  const handleBuy = () => {
    if (!canTrade) {
      toast.info('먼저 오늘의 뉴스를 모두 읽고 판단을 체크해 주세요! 📰');
      onGoToNews?.();
      return;
    }
    if (qty <= 0) return toast.error('수량을 입력하세요.');
    if (buyStock(stockId, qty)) {
      toast.success(`${stock.name} ${qty}주 매수 완료! 💰`);
      setQuantity('1');
    } else {
      toast.error('잔액이 부족합니다.');
    }
  };

  const handleSell = () => {
    if (!canTrade) {
      toast.info('먼저 오늘의 뉴스를 모두 읽고 판단을 체크해 주세요! 📰');
      onGoToNews?.();
      return;
    }
    if (qty <= 0) return toast.error('수량을 입력하세요.');
    if (sellStock(stockId, qty)) {
      toast.success(`${stock.name} ${qty}주 매도 완료! 💸`);
      setQuantity('1');
    } else {
      toast.error('보유 수량이 부족합니다.');
    }
  };

  const setPercentage = (pct: number) => {
    const max = tab === 'buy' ? maxBuy : maxSell;
    setQuantity(String(Math.floor((max * pct) / 100)));
  };

  const adjustQty = (amount: number) => {
    const nextQty = Math.max(0, qty + amount);
    const max = tab === 'buy' ? maxBuy : maxSell;
    setQuantity(String(Math.min(max, nextQty)));
  };

  // Calculate P&L for holdings
  const holdingPnL = holding
    ? {
        value: stock.currentPrice * holding.quantity,
        cost: holding.avgPrice * holding.quantity,
        profit: (stock.currentPrice - holding.avgPrice) * holding.quantity,
        profitRate: ((stock.currentPrice - holding.avgPrice) / holding.avgPrice) * 100,
      }
    : null;

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

      {/* Stock Title */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="min-w-0">
          <h3 className="font-black text-foreground text-[15px] tracking-tight truncate">
            {stock.name}
          </h3>
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-4 space-y-3.5">
          {/* Mandatory News Gate Banner */}
          {!canTrade && (
            <div className="p-4 rounded-2xl border-2 border-amber-500/45 bg-amber-500/10 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-black text-foreground leading-snug">
                    오늘의 뉴스를 먼저 읽어주세요!
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                    뉴스 {currentNews.length}건의 호재·악재 판단을 완료하면 매수/매도 주문이 열립니다. (현재{' '}
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
                  className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[13px] gap-1.5 cursor-pointer"
                >
                  <Newspaper className="w-4 h-4" />
                  <span>오늘의 뉴스 읽으러 가기</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Optional Description Toggle */}
          {showDescription && (
            <div className="p-3.5 border border-[var(--color-accent-gold)]/20 bg-black/[0.015] dark:bg-white/[0.02] rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-[var(--color-accent-gold)]">
                <Info className="w-3.5 h-3.5" />
                <span className="text-xs font-black">기업 핵심 정보</span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-medium">
                {stock.descriptions[level]}
              </p>
            </div>
          )}

          {/* Account Info Cards */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3">
                <div className="text-xs text-muted-foreground font-semibold">주문 가능 예수금</div>
                <div className="font-black text-foreground text-[15px] mt-1 tabular-nums">
                  {cash.toLocaleString()}
                  <span className="text-xs text-muted-foreground font-bold ml-0.5">원</span>
                </div>
              </div>
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3">
                <div className="text-xs text-muted-foreground font-semibold">보유 주식 수량</div>
                <div className="font-black text-foreground text-[15px] mt-1 tabular-nums">
                  {holding?.quantity || 0}
                  <span className="text-xs text-muted-foreground font-bold ml-0.5">주</span>
                </div>
              </div>
            </div>

            {holdingPnL && (
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">매수 평균가</div>
                  <div className="font-bold text-sm text-foreground mt-0.5 tabular-nums">
                    {holding!.avgPrice.toLocaleString()}원
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">평가 손익</div>
                  <div
                    className={cn(
                      'font-black text-sm mt-0.5 tabular-nums',
                      holdingPnL.profit > 0
                        ? 'text-[var(--color-price-up)]'
                        : holdingPnL.profit < 0
                          ? 'text-[var(--color-price-down)]'
                          : 'text-foreground'
                    )}
                  >
                    {holdingPnL.profit > 0 ? '+' : ''}
                    {holdingPnL.profit.toLocaleString()} ({holdingPnL.profitRate > 0 ? '+' : ''}
                    {holdingPnL.profitRate.toFixed(1)}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buy/Sell Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-xl border border-[var(--color-hts-border)]">
            <button
              type="button"
              onClick={() => {
                setTab('buy');
                setQuantity('1');
              }}
              className={cn(
                'py-2.5 rounded-lg text-[13px] font-extrabold transition-all duration-200 cursor-pointer',
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
                setQuantity('1');
              }}
              className={cn(
                'py-2.5 rounded-lg text-[13px] font-extrabold transition-all duration-200 cursor-pointer',
                tab === 'sell'
                  ? 'bg-[var(--color-price-down)] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              매도 주문
            </button>
          </div>

          {/* Price display */}
          <div className="text-center py-2.5 border border-dashed border-[var(--color-hts-border)] rounded-xl">
            <div className="text-xs text-muted-foreground font-bold">주문 기준 단가</div>
            <div className="text-2xl font-black text-foreground mt-0.5 tabular-nums">
              {stock.currentPrice.toLocaleString()}원
            </div>
          </div>

          {/* Quantity Input with Plus/Minus */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground">주문 수량</label>
              <span className="text-xs text-muted-foreground font-semibold tabular-nums">
                최대 가능: {tab === 'buy' ? maxBuy : maxSell}주
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustQty(-1)}
                disabled={!canTrade || qty <= 0}
                className="w-11 h-11 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>

              <input
                type="number"
                value={quantity}
                disabled={!canTrade}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                className="flex-1 bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-xl py-2.5 text-center font-black text-lg tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 focus:border-[var(--color-accent-gold)] transition-all disabled:opacity-45"
              />

              <button
                type="button"
                onClick={() => adjustQty(1)}
                disabled={!canTrade || qty >= (tab === 'buy' ? maxBuy : maxSell)}
                className="w-11 h-11 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          {/* Percentage buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {percentageButtons.map((pct) => (
              <button
                key={pct}
                type="button"
                disabled={!canTrade}
                onClick={() => setPercentage(pct)}
                className="py-2 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--color-hts-border)] rounded-lg text-xs font-bold hover:bg-[var(--color-hts-hover)] transition-all cursor-pointer text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Estimated total */}
          <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground font-bold">총 주문 예정 금액</span>
            <span
              className={cn(
                'font-black text-lg tabular-nums',
                tab === 'buy' ? 'text-[var(--color-price-up)]' : 'text-[var(--color-price-down)]'
              )}
            >
              {estimatedAmount.toLocaleString()}원
            </span>
          </div>

          {/* Action button */}
          <Button
            type="button"
            className={cn(
              'w-full font-black text-white text-[15px] h-12 rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:translate-y-0.5 duration-200 disabled:opacity-45',
              !canTrade
                ? 'bg-slate-500 hover:bg-slate-600'
                : tab === 'buy'
                  ? 'bg-[var(--color-price-up)] hover:brightness-110'
                  : 'bg-[var(--color-price-down)] hover:brightness-110'
            )}
            onClick={tab === 'buy' ? handleBuy : handleSell}
            disabled={canTrade && qty <= 0}
          >
            {!canTrade ? (
              <>
                <Lock className="w-4 h-4 mr-1.5" /> 뉴스 확인 후 주문 가능
              </>
            ) : tab === 'buy' ? (
              <>
                <ShoppingCart className="w-4 h-4 mr-1.5" /> 모의 매수 실행
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 mr-1.5" /> 모의 매도 실행
              </>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center font-medium">
            가상 자금 모의 주문 (학습 편의를 위해 거래 수수료·세금 미적용)
          </p>
        </div>
      </div>
    </div>
  );
}
