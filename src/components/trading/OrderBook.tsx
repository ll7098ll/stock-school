import { useGameStore } from '../../stores/gameStore';
import { useMemo } from 'react';
import { getTickSize } from '../../lib/priceEngine';

interface OrderBookProps {
  stockId: string;
}

export default function OrderBook({ stockId }: OrderBookProps) {
  const { stocks } = useGameStore();
  const stock = stocks[stockId];

  // Generate 5 ask (매도) and 5 bid (매수) levels using realistic Korean stock market tick sizes
  const orderBookData = useMemo(() => {
    if (!stock) return { asks: [], bids: [], tick: 100 };
    const current = stock.currentPrice;
    const tick = getTickSize(current);

    // Ask levels (above current price, sorted descending)
    const asks = Array.from({ length: 5 }, (_, i) => {
      const step = 5 - i;
      const price = current + step * tick;
      const volume = Math.floor((Math.sin(price * 0.01) + 1.5) * 450) + 120;
      return { price, volume, type: 'ask' as const };
    });

    // Bid levels (below current price, sorted descending)
    const bids = Array.from({ length: 5 }, (_, i) => {
      const step = i + 1;
      const price = Math.max(100, current - step * tick);
      const volume = Math.floor((Math.cos(price * 0.01) + 1.5) * 420) + 140;
      return { price, volume, type: 'bid' as const };
    });

    return { asks, bids, tick };
  }, [stock]);

  if (!stock) return null;

  const maxVolume = Math.max(
    ...orderBookData.asks.map((a) => a.volume),
    ...orderBookData.bids.map((b) => b.volume)
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-hts-panel)] text-[13px] overflow-hidden">
      <div className="px-4 py-2 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between gap-2 shrink-0">
        <span className="font-extrabold text-foreground tracking-tight flex items-center gap-1.5 text-[13px]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
          모의 호가창 (학습 참고용)
        </span>
        <span className="text-xs text-muted-foreground font-semibold">
          호가 단위 {orderBookData.tick.toLocaleString()}원 · 현재가 체결
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain font-mono">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black/[0.015] dark:bg-white/[0.02] text-muted-foreground border-b border-[var(--color-hts-border)]/50 text-xs font-bold">
              <th className="py-1.5 px-3 text-left w-1/4">구분</th>
              <th className="py-1.5 px-3 text-center w-1/3">호가 (원)</th>
              <th className="py-1.5 px-3 text-right">예시 잔량 (주)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-hts-border)]/20">
            {orderBookData.asks.map((item, idx) => {
              const widthPct = (item.volume / maxVolume) * 100;
              return (
                <tr key={`ask-${idx}`} className="hover:bg-[var(--color-price-down)]/[0.04] transition-colors relative">
                  <td className="py-1.5 px-3 text-left text-[var(--color-price-down)] font-bold bg-[var(--color-price-down)]/[0.03]">
                    매도
                  </td>
                  <td className="py-1.5 px-3 text-center text-[var(--color-price-down)] font-bold tabular-nums">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right relative pr-5">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[var(--color-price-down)]/[0.09] dark:bg-[var(--color-price-down)]/[0.14] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-foreground/85 tabular-nums">
                      {item.volume.toLocaleString()}
                    </span>
                  </td>
                </tr>
              );
            })}

            <tr className="bg-gradient-to-r from-amber-500/5 via-amber-500/12 to-amber-500/5 border-y border-amber-500/35">
              <td className="py-2 px-3 text-left font-black text-[var(--color-accent-gold)]">
                현재가
              </td>
              <td className="py-2 px-3 text-center font-black text-foreground text-[15px] tabular-nums tracking-wide">
                {stock.currentPrice.toLocaleString()}
              </td>
              <td className="py-2 px-3 text-right text-xs font-extrabold text-muted-foreground pr-5">
                시뮬레이션 기준가
              </td>
            </tr>

            {orderBookData.bids.map((item, idx) => {
              const widthPct = (item.volume / maxVolume) * 100;
              return (
                <tr key={`bid-${idx}`} className="hover:bg-[var(--color-price-up)]/[0.04] transition-colors relative">
                  <td className="py-1.5 px-3 text-left text-[var(--color-price-up)] font-bold bg-[var(--color-price-up)]/[0.03]">
                    매수
                  </td>
                  <td className="py-1.5 px-3 text-center text-[var(--color-price-up)] font-bold tabular-nums">
                    {item.price.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-3 text-right relative pr-5">
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[var(--color-price-up)]/[0.09] dark:bg-[var(--color-price-up)]/[0.14] transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    />
                    <span className="relative z-10 font-bold text-foreground/85 tabular-nums">
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
