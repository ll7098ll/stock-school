import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { ShoppingCart, TrendingDown, Info, Plus, Minus } from 'lucide-react';

interface Props {
  stockId: string;
}

export default function OrderPanel({ stockId }: Props) {
  const { stocks, cash, holdings, buyStock, sellStock, level, tutorialStep } = useGameStore();
  const [quantity, setQuantity] = useState<string>('1');
  const [tab, setTab] = useState<'buy' | 'sell'>('buy');
  const [showDescription, setShowDescription] = useState(true);
  
  const stock = stocks[stockId];
  const holding = holdings[stockId];
  
  if (!stock) return null;

  const maxBuy = Math.floor(cash / stock.currentPrice);
  const maxSell = holding?.quantity || 0;
  const qty = parseInt(quantity) || 0;
  const estimatedAmount = qty * stock.currentPrice;

  const percentageButtons = [10, 25, 50, 100];

  const handleBuy = () => {
    if (qty <= 0) return toast.error('수량을 입력하세요.');
    if (buyStock(stockId, qty)) {
      toast.success(`${stock.name} ${qty}주 매수 완료! 💰`);
      setQuantity('1');
    } else {
      toast.error('잔액이 부족합니다.');
    }
  };

  const handleSell = () => {
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
    setQuantity(String(Math.floor(max * pct / 100)));
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
        profitRate: ((stock.currentPrice - holding.avgPrice) / holding.avgPrice) * 100
      }
    : null;

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--color-hts-panel)] border-l border-[var(--color-hts-border)] transition-all duration-300",
      tutorialStep === 4 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative animate-pulse"
    )}>
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 4 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">💰</span> 4단계: 원하는 만큼 수량을 설정하여 모의 주식을 직접 사보세요!
          </span>
          <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">주문 실행</span>
        </div>
      )}
      {/* Stock Title */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01]">
        <div>
          <h3 className="font-extrabold text-foreground text-sm tracking-tight">{stock.name}</h3>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase">{stock.sector}</span>
        </div>
        <button 
          onClick={() => setShowDescription(!showDescription)}
          className="p-1.5 rounded-lg hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="종목 설명"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description toggle */}
          {showDescription && (
            <div className="p-3.5 border border-[var(--color-accent-gold)]/20 bg-black/[0.01] dark:bg-white/[0.02] rounded-xl shadow-sm">
              <div className="flex items-center gap-1.5 mb-1.5 text-[var(--color-accent-gold)]">
                <Info className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                <span className="text-[10px] font-black uppercase tracking-wider">기업 핵심 정보</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-semibold">
                {stock.descriptions[level]}
              </p>
            </div>
          )}

          {/* Account Info Cards */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground font-semibold">주문 가능 예수금</div>
                <div className="font-extrabold text-foreground text-sm mt-0.5 tabular-nums">
                  {cash.toLocaleString()}
                  <span className="text-[10px] text-muted-foreground font-bold ml-0.5">원</span>
                </div>
              </div>
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3">
                <div className="text-[10px] text-muted-foreground font-semibold">보유 주식 수량</div>
                <div className="font-extrabold text-foreground text-sm mt-0.5 tabular-nums">
                  {holding?.quantity || 0}
                  <span className="text-[10px] text-muted-foreground font-bold ml-0.5">주</span>
                </div>
              </div>
            </div>

            {holdingPnL && (
              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">매수 평균가</div>
                  <div className="font-bold text-foreground mt-0.5 tabular-nums">{holding!.avgPrice.toLocaleString()}원</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-semibold">평가 손익</div>
                  <div className={cn("font-extrabold mt-0.5 tabular-nums", 
                    holdingPnL.profit > 0 ? 'text-[var(--color-price-up)]' : holdingPnL.profit < 0 ? 'text-[var(--color-price-down)]' : 'text-foreground'
                  )}>
                    {holdingPnL.profit > 0 ? '+' : ''}{holdingPnL.profit.toLocaleString()} ({holdingPnL.profitRate > 0 ? '+' : ''}{holdingPnL.profitRate.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Buy/Sell Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-xl border border-[var(--color-hts-border)]">
            <button
              onClick={() => { setTab('buy'); setQuantity('1'); }}
              className={cn(
                "py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                tab === 'buy' 
                  ? "bg-[var(--color-price-up)] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              매수 주문
            </button>
            <button
              onClick={() => { setTab('sell'); setQuantity('1'); }}
              className={cn(
                "py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer",
                tab === 'sell' 
                  ? "bg-[var(--color-price-down)] text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              매도 주문
            </button>
          </div>

          {/* Price display */}
          <div className="text-center py-1.5 border border-dashed border-[var(--color-hts-border)] rounded-xl">
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">주문 기준 단가</div>
            <div className="text-xl font-black text-foreground mt-0.5 tabular-nums">{stock.currentPrice.toLocaleString()}원</div>
          </div>

          {/* Quantity Input with Plus/Minus */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">주문 수량</label>
              <span className="text-[10px] text-muted-foreground font-semibold">
                최대 가능: {tab === 'buy' ? maxBuy : maxSell}주
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustQty(-1)}
                disabled={qty <= 0}
                className="w-10 h-10 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-3.5 h-3.5 text-foreground" />
              </button>
              
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                min="0"
                className="flex-1 bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-xl py-2 text-center font-extrabold text-lg tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 focus:border-[var(--color-accent-gold)] transition-all"
              />

              <button
                onClick={() => adjustQty(1)}
                disabled={qty >= (tab === 'buy' ? maxBuy : maxSell)}
                className="w-10 h-10 flex items-center justify-center border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-foreground" />
              </button>
            </div>
          </div>

          {/* Percentage buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {percentageButtons.map(pct => (
              <button
                key={pct}
                onClick={() => setPercentage(pct)}
                className="py-1.5 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--color-hts-border)] rounded-lg text-[10px] font-bold hover:bg-[var(--color-hts-hover)] transition-all cursor-pointer text-muted-foreground hover:text-foreground"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Estimated total */}
          <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">총 주문 예정 금액</span>
            <span className={cn(
              "font-extrabold text-base tabular-nums",
              tab === 'buy' ? 'text-[var(--color-price-up)]' : 'text-[var(--color-price-down)]'
            )}>
              {estimatedAmount.toLocaleString()}원
            </span>
          </div>

          {/* Action button */}
          <Button
            className={cn(
              "w-full font-bold text-white text-sm h-11 rounded-xl shadow-md transition-all cursor-pointer hover:shadow-lg active:translate-y-0.5 duration-200",
              tab === 'buy' 
                ? "bg-[var(--color-price-up)] hover:brightness-110" 
                : "bg-[var(--color-price-down)] hover:brightness-110"
            )}
            onClick={tab === 'buy' ? handleBuy : handleSell}
            disabled={qty <= 0}
          >
            {tab === 'buy' ? (
              <><ShoppingCart className="w-4 h-4 mr-1.5" /> 즉시 매수</>
            ) : (
              <><TrendingDown className="w-4 h-4 mr-1.5" /> 즉시 매도</>
            )}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
