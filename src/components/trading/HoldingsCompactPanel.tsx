import { useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  computeAccountSummary,
  computeHoldingSummaries,
  formatSignedPct,
  formatSignedWon,
} from '../../lib/tradingMetrics';
import type { TradeType } from '../../lib/types';
import { cn } from '../../lib/utils';
import { ArrowUpRight, Briefcase } from 'lucide-react';

interface HoldingsCompactPanelProps {
  selectedStockId: string | null;
  onSelectStock: (stockId: string) => void;
  onRequestOrder: (stockId: string, side: TradeType, presetQty?: number | 'all') => void;
  onOpenPortfolio?: () => void;
}

export default function HoldingsCompactPanel({
  selectedStockId,
  onSelectStock,
  onRequestOrder,
  onOpenPortfolio,
}: HoldingsCompactPanelProps) {
  const {
    holdings,
    stocks,
    cash,
    initialCash,
    realizedProfitTotal,
    tradeHistory,
    dayCount,
    currentNews,
  } = useGameStore();

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

  const holdingList = useMemo(
    () =>
      computeHoldingSummaries(holdings, stocks, cash, currentNews).sort(
        (a, b) => b.currentValue - a.currentValue
      ),
    [holdings, stocks, cash, currentNews]
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden">
      {/* Compact Account Summary Header */}
      <div className="px-4 py-2 border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <span className="font-black text-foreground inline-flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[var(--color-price-down)]" />
            보유 {holdingList.length}종목
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="text-muted-foreground font-semibold tabular-nums">
            평가{' '}
            <strong className="text-foreground">
              {account.totalStockValue.toLocaleString()}원
            </strong>
          </span>
          <span
            className={cn(
              'font-black tabular-nums',
              account.unrealizedProfit > 0
                ? 'text-[var(--color-price-up)]'
                : account.unrealizedProfit < 0
                  ? 'text-[var(--color-price-down)]'
                  : 'text-muted-foreground'
            )}
          >
            {formatSignedWon(account.unrealizedProfit)} (
            {formatSignedPct(account.unrealizedProfitRate, 1)})
          </span>
        </div>

        {onOpenPortfolio && (
          <button
            type="button"
            onClick={onOpenPortfolio}
            className="inline-flex items-center gap-0.5 text-xs font-extrabold text-[var(--color-accent-gold)] hover:underline cursor-pointer shrink-0"
          >
            <span>자산 보고서</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {holdingList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-5 text-center text-muted-foreground">
            <Briefcase className="w-7 h-7 mb-2 opacity-30" />
            <p className="text-xs font-bold text-foreground/80">보유 중인 주식이 없습니다.</p>
            <p className="text-[11px] mt-0.5 opacity-80">
              종목을 선택해 매수하면 여기서 수익률과 빠른 매도 버튼을 바로 쓸 수 있어요.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--color-hts-panel)] border-b border-[var(--color-hts-border)] text-[11px] text-muted-foreground font-bold">
              <tr>
                <th className="py-1.5 pl-4 pr-2 text-left">종목</th>
                <th className="py-1.5 px-2 text-right">수량</th>
                <th className="py-1.5 px-2 text-right hidden sm:table-cell">평단 / 현재가</th>
                <th className="py-1.5 px-2 text-right">평가손익</th>
                <th className="py-1.5 pl-2 pr-4 text-right">빠른 주문</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-hts-border)]/40">
              {holdingList.map((item) => {
                const isSelected = selectedStockId === item.id;
                const isUp = item.profit > 0;
                const isDown = item.profit < 0;

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectStock(item.id)}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-[var(--color-accent-gold)]/[0.06]'
                        : 'hover:bg-[var(--color-hts-hover)]'
                    )}
                  >
                    <td className="py-2 pl-4 pr-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-black text-foreground truncate max-w-[120px]">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold tabular-nums">
                        비중 {item.weightPct.toFixed(1)}% · 평가 {item.currentValue.toLocaleString()}원
                      </div>
                    </td>

                    <td className="py-2 px-2 text-right font-extrabold text-foreground tabular-nums whitespace-nowrap">
                      {item.quantity}주
                    </td>

                    <td className="py-2 px-2 text-right tabular-nums whitespace-nowrap hidden sm:table-cell">
                      <div className="text-muted-foreground font-semibold">
                        {item.avgPrice.toLocaleString()}원
                      </div>
                      <div className="font-extrabold text-foreground">
                        {item.currentPrice.toLocaleString()}원
                      </div>
                    </td>

                    <td
                      className={cn(
                        'py-2 px-2 text-right font-black tabular-nums whitespace-nowrap',
                        isUp
                          ? 'text-[var(--color-price-up)]'
                          : isDown
                            ? 'text-[var(--color-price-down)]'
                            : 'text-muted-foreground'
                      )}
                    >
                      <div>{formatSignedWon(item.profit)}</div>
                      <div className="text-[10px] font-extrabold opacity-90">
                        {formatSignedPct(item.profitRate, 1)}
                      </div>
                    </td>

                    <td className="py-2 pl-2 pr-4 text-right whitespace-nowrap">
                      <div
                        className="inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onRequestOrder(item.id, 'buy', 1)}
                          className="px-2 py-1 rounded-md text-[11px] font-black bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] hover:bg-[var(--color-price-up)] hover:text-white transition-colors cursor-pointer"
                        >
                          매수
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestOrder(item.id, 'sell', 1)}
                          className="px-2 py-1 rounded-md text-[11px] font-black bg-[var(--color-price-down)]/12 text-[var(--color-price-down)] hover:bg-[var(--color-price-down)] hover:text-white transition-colors cursor-pointer"
                        >
                          매도
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestOrder(item.id, 'sell', 'all')}
                          className="px-2 py-1 rounded-md text-[11px] font-black border border-[var(--color-price-down)]/30 text-[var(--color-price-down)] hover:bg-[var(--color-price-down)] hover:text-white transition-colors cursor-pointer"
                          title={`${item.name} ${item.quantity}주 전량 매도 세팅`}
                        >
                          전량
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
