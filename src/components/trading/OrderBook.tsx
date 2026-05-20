import { useGameStore } from '../../stores/gameStore';
import { useMemo } from 'react';

interface OrderBookProps {
  stockId: string;
}

export default function OrderBook({ stockId }: OrderBookProps) {
  const { stocks } = useGameStore();
  const stock = stocks[stockId];

  // Generate 5 ask (매도) and 5 bid (매수) levels around currentPrice
  const orderBookData = useMemo(() => {
    if (!stock) return { asks: [], bids: [] };
    const current = stock.currentPrice;
    
    // Ask levels (above current price, sorted descending)
    const asks = Array.from({ length: 5 }, (_, i) => {
      const step = 5 - i;
      const price = Math.round(current * (1 + step * 0.01));
      // Deterministic volume based on price and dayCount to avoid flickering
      const volume = Math.floor((Math.sin(price) + 1.5) * 500) + 100;
      return { price, volume, type: 'ask' as const };
    });

    // Bid levels (below current price, sorted descending)
    const bids = Array.from({ length: 5 }, (_, i) => {
      const step = i + 1;
      const price = Math.max(1, Math.round(current * (1 - step * 0.01)));
      const volume = Math.floor((Math.cos(price) + 1.5) * 450) + 120;
      return { price, volume, type: 'bid' as const };
    });

    return { asks, bids };
  }, [stock]);

  if (!stock) return null;

  const maxVolume = Math.max(
    ...orderBookData.asks.map((a) => a.volume),
    ...orderBookData.bids.map((b) => b.volume)
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-hts-panel)] border-t border-[var(--color-hts-border)] text-xs">
      <div className="px-4 py-2 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between shrink-0">
        <span className="font-extrabold text-foreground tracking-tight flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)]" />
          실시간 호가창 (Simulated)
        </span>
        <span className="text-[10px] text-muted-foreground font-semibold">5단계 가격 호가</span>
      </div>

      <div className="flex-1 overflow-y-auto font-mono">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.01] dark:bg-white/[0.01] text-muted-foreground border-b border-[var(--color-hts-border)]/50 text-[10px] uppercase font-bold">
              <th className="py-1 px-3 text-left w-1/4">구분</th>
              <th className="py-1 px-3 text-center w-1/3">호가 (원)</th>
              <th className="py-1 px-3 text-right">잔량 (주)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hts-border)]/20">
            {/* ASKS (Sell orders) - Blue-ish tint */}
            {orderBookData.asks.map((item, idx) => {
              const widthPct = (item.volume / maxVolume) * 100;
              return (
                <tr key={`ask-${idx}`} className="hover:bg-[var(--price-down)]/[0.03] transition-colors relative">
                  <td className="py-1 px-3 text-left text-[var(--price-down)] font-bold bg-[var(--price-down)]/[0.02]">매도</td>
                  <td className="py-1 px-3 text-center text-[var(--price-down)] font-bold tabular-nums">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="py-1 px-3 text-right relative pr-6">
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-[var(--price-down)]/[0.08] dark:bg-[var(--price-down)]/[0.12] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-foreground/80 tabular-nums">
                      {item.volume.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* CURRENT PRICE BAR */}
            <tr className="bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border-y border-amber-500/30">
              <td className="py-1.5 px-3 text-left font-black text-[var(--color-accent-gold)] animate-pulse">현재가</td>
              <td className="py-1.5 px-3 text-center font-black text-foreground text-sm tabular-nums tracking-wide">
                {stock.currentPrice.toLocaleString()}
              </td>
              <td className="py-1.5 px-3 text-right text-[10px] font-black text-muted-foreground pr-6">
                Spread 1.0%
              </td>
            </tr>

            {/* BIDS (Buy orders) - Red-ish tint */}
            {orderBookData.bids.map((item, idx) => {
              const widthPct = (item.volume / maxVolume) * 100;
              return (
                <tr key={`bid-${idx}`} className="hover:bg-[var(--price-up)]/[0.03] transition-colors relative">
                  <td className="py-1 px-3 text-left text-[var(--price-up)] font-bold bg-[var(--price-up)]/[0.02]">매수</td>
                  <td className="py-1 px-3 text-center text-[var(--price-up)] font-bold tabular-nums">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="py-1 px-3 text-right relative pr-6">
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-[var(--price-up)]/[0.08] dark:bg-[var(--price-up)]/[0.12] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-foreground/80 tabular-nums">
                      {item.volume.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
