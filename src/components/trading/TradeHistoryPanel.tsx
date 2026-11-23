import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { formatSignedPct, formatSignedWon } from '../../lib/tradingMetrics';
import { cn } from '../../lib/utils';
import { ArrowUpRight, History, Search } from 'lucide-react';

interface TradeHistoryPanelProps {
  variant?: 'compact' | 'full';
  onSelectStock?: (stockId: string) => void;
  onOpenPortfolio?: () => void;
}

type TradeFilter = 'all' | 'today' | 'buy' | 'sell';

function formatTradeTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export default function TradeHistoryPanel({
  variant = 'full',
  onSelectStock,
  onOpenPortfolio,
}: TradeHistoryPanelProps) {
  const { tradeHistory, dayCount, realizedProfitTotal } = useGameStore();
  const [filter, setFilter] = useState<TradeFilter>('all');
  const [search, setSearch] = useState('');

  const reversedHistory = useMemo(() => [...tradeHistory].reverse(), [tradeHistory]);

  const stats = useMemo(() => {
    let buyCount = 0;
    let sellCount = 0;
    let todayCount = 0;
    let winSells = 0;
    let lossSells = 0;

    tradeHistory.forEach((t) => {
      if (t.dayCount === dayCount) todayCount += 1;
      if (t.type === 'buy') {
        buyCount += 1;
      } else {
        sellCount += 1;
        if ((t.realizedProfit ?? 0) > 0) winSells += 1;
        else if ((t.realizedProfit ?? 0) < 0) lossSells += 1;
      }
    });

    const settledSells = winSells + lossSells;
    const winRate = settledSells > 0 ? Math.round((winSells / settledSells) * 100) : null;

    return {
      total: tradeHistory.length,
      buyCount,
      sellCount,
      todayCount,
      winSells,
      lossSells,
      winRate,
    };
  }, [tradeHistory, dayCount]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reversedHistory.filter((item) => {
      if (filter === 'today' && item.dayCount !== dayCount) return false;
      if (filter === 'buy' && item.type !== 'buy') return false;
      if (filter === 'sell' && item.type !== 'sell') return false;
      if (q && !item.stockName.toLowerCase().includes(q) && !item.sector.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [reversedHistory, filter, dayCount, search]);

  const isCompact = variant === 'compact';

  const filterChips: { id: TradeFilter; label: string }[] = [
    { id: 'all', label: `전체 (${stats.total})` },
    { id: 'today', label: `오늘 DAY ${dayCount} (${stats.todayCount})` },
    { id: 'buy', label: `매수 (${stats.buyCount})` },
    { id: 'sell', label: `매도 (${stats.sellCount})` },
  ];

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--color-hts-panel)] overflow-hidden',
        isCompact ? 'h-full' : 'rounded-2xl border border-[var(--color-hts-border)]'
      )}
    >
      {/* Full Mode Stats Bar */}
      {!isCompact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/20">
          <div className="p-3.5 border-r border-b md:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">누적 체결 건수</div>
            <div className="text-sm font-black text-foreground mt-0.5 tabular-nums">
              총 {stats.total}건{' '}
              <span className="text-xs font-bold text-muted-foreground">
                (매수 {stats.buyCount} · 매도 {stats.sellCount})
              </span>
            </div>
          </div>
          <div className="p-3.5 md:border-r border-b md:border-b-0 border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">오늘 거래 (DAY {dayCount})</div>
            <div className="text-sm font-black text-foreground mt-0.5 tabular-nums">
              {stats.todayCount}건
            </div>
          </div>
          <div className="p-3.5 border-r border-[var(--color-hts-border)]">
            <div className="text-[11px] text-muted-foreground font-bold">매도 익절 승률</div>
            <div className="text-sm font-black text-foreground mt-0.5 tabular-nums">
              {stats.winRate !== null
                ? `${stats.winRate}% (익절 ${stats.winSells} / 손절 ${stats.lossSells})`
                : stats.sellCount > 0
                  ? `본전 청산 ${stats.sellCount}건`
                  : '매도 기록 없음'}
            </div>
          </div>
          <div className="p-3.5">
            <div className="text-[11px] text-muted-foreground font-bold">누적 실현손익</div>
            <div
              className={cn(
                'text-sm font-black mt-0.5 tabular-nums',
                realizedProfitTotal > 0
                  ? 'text-[var(--color-price-up)]'
                  : realizedProfitTotal < 0
                    ? 'text-[var(--color-price-down)]'
                    : 'text-foreground'
              )}
            >
              {formatSignedWon(realizedProfitTotal)}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        className={cn(
          'border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between gap-2 flex-wrap shrink-0',
          isCompact ? 'px-3.5 py-2' : 'px-4 py-3'
        )}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer',
                filter === chip.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground hover:text-foreground'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {!isCompact && (
            <div className="relative w-44 sm:w-52">
              <Search className="w-3.5 h-3.5 text-muted-foreground/70 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="종목명 검색..."
                className="w-full bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-lg pl-8 pr-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40"
              />
            </div>
          )}

          {isCompact && onOpenPortfolio && (
            <button
              type="button"
              onClick={onOpenPortfolio}
              className="inline-flex items-center gap-0.5 text-xs font-extrabold text-[var(--color-accent-gold)] hover:underline cursor-pointer shrink-0"
            >
              <span>전체 내역</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Trade List */}
      <div className={cn(isCompact ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : 'w-full')}>
        {filteredList.length === 0 ? (
          <div className={cn('flex flex-col items-center justify-center text-center text-muted-foreground', isCompact ? 'h-full py-6 px-4' : 'py-12 px-4')}>
            <History className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-bold text-foreground/80">
              {stats.total === 0
                ? '아직 체결된 거래 내역이 없습니다.'
                : '선택한 조건에 해당하는 거래 내역이 없습니다.'}
            </p>
            <p className="text-[11px] mt-0.5 opacity-80">
              매수·매도 주문을 실행하면 일차별 체결 단가와 실현손익이 자동으로 기록됩니다.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (full mode only) */}
            {!isCompact && (
              <div className="sm:hidden divide-y divide-[var(--color-hts-border)]/40">
                {filteredList.map((item) => {
                  const isBuy = item.type === 'buy';
                  const profit = item.realizedProfit ?? 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectStock?.(item.stockId)}
                      className={cn(
                        'p-3.5 space-y-2 transition-colors',
                        onSelectStock && 'cursor-pointer hover:bg-[var(--color-hts-hover)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-md text-[11px] font-black shrink-0',
                              isBuy
                                ? 'bg-[var(--color-price-up)]/12 text-[var(--color-price-up)]'
                                : 'bg-[var(--color-price-down)]/12 text-[var(--color-price-down)]'
                            )}
                          >
                            {isBuy ? '매수' : '매도'}
                          </span>
                          <span className="font-black text-sm text-foreground truncate">
                            {item.stockName}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums shrink-0">
                          DAY {item.dayCount} · {formatTradeTime(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs tabular-nums">
                        <span className="text-muted-foreground font-semibold">
                          {item.quantity}주 × {item.price.toLocaleString()}원
                        </span>
                        <span className="font-black text-foreground">
                          {item.totalAmount.toLocaleString()}원
                        </span>
                      </div>

                      {!isBuy && item.realizedProfit !== undefined && (
                        <div className="pt-1.5 border-t border-[var(--color-hts-border)]/40 flex items-center justify-between text-xs tabular-nums">
                          <span className="text-muted-foreground font-semibold">
                            평단 {(item.avgPriceBefore ?? 0).toLocaleString()}원 → 실현손익
                          </span>
                          <span
                            className={cn(
                              'font-black',
                              profit > 0
                                ? 'text-[var(--color-price-up)]'
                                : profit < 0
                                  ? 'text-[var(--color-price-down)]'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {formatSignedWon(profit)} (
                            {formatSignedPct(item.realizedProfitRate ?? 0, 1)})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table View */}
            <div className={cn(!isCompact && 'hidden sm:block', 'overflow-x-auto w-full')}>
              <table className={cn('w-full border-collapse', isCompact ? 'text-xs' : 'text-[13px]')}>
                <thead className="sticky top-0 z-10 bg-[var(--color-hts-panel)] border-b border-[var(--color-hts-border)] text-[11px] text-muted-foreground font-bold">
                  <tr>
                    <th className={cn('text-left', isCompact ? 'py-1.5 pl-4 pr-2' : 'py-3 pl-5 pr-3')}>
                      일차
                    </th>
                    <th className={cn('text-left', isCompact ? 'py-1.5 px-2' : 'py-3 px-3')}>
                      구분
                    </th>
                    <th className={cn('text-left', isCompact ? 'py-1.5 px-2' : 'py-3 px-3')}>
                      종목명
                    </th>
                    <th className={cn('text-right', isCompact ? 'py-1.5 px-2' : 'py-3 px-3')}>
                      수량
                    </th>
                    <th className={cn('text-right', isCompact ? 'py-1.5 px-2 hidden sm:table-cell' : 'py-3 px-3')}>
                      체결단가
                    </th>
                    <th className={cn('text-right', isCompact ? 'py-1.5 px-2' : 'py-3 px-3')}>
                      거래금액
                    </th>
                    <th className={cn('text-right', isCompact ? 'py-1.5 pl-2 pr-4' : 'py-3 pl-3 pr-5')}>
                      실현손익
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-hts-border)]/40">
                  {filteredList.map((item) => {
                    const isBuy = item.type === 'buy';
                    const profit = item.realizedProfit ?? 0;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelectStock?.(item.stockId)}
                        className={cn(
                          'transition-colors',
                          onSelectStock && 'cursor-pointer hover:bg-[var(--color-hts-hover)]'
                        )}
                      >
                        <td
                          className={cn(
                            'font-bold text-muted-foreground tabular-nums whitespace-nowrap',
                            isCompact ? 'py-2 pl-4 pr-2' : 'py-3 pl-5 pr-3'
                          )}
                        >
                          <span className="font-extrabold text-foreground">DAY {item.dayCount}</span>
                          {!isCompact && (
                            <span className="ml-1.5 text-[11px] opacity-75">
                              {formatTradeTime(item.timestamp)}
                            </span>
                          )}
                        </td>
                        <td className={cn(isCompact ? 'py-2 px-2' : 'py-3 px-3', 'whitespace-nowrap')}>
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 rounded-md text-[11px] font-black',
                              isBuy
                                ? 'bg-[var(--color-price-up)]/12 text-[var(--color-price-up)]'
                                : 'bg-[var(--color-price-down)]/12 text-[var(--color-price-down)]'
                            )}
                          >
                            {isBuy ? '매수' : '매도'}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'font-black text-foreground',
                            isCompact ? 'py-2 px-2 max-w-[120px] truncate' : 'py-3 px-3'
                          )}
                        >
                          <div>{item.stockName}</div>
                          {!isCompact && (
                            <div className="text-[11px] text-muted-foreground font-semibold">
                              {item.sector}
                            </div>
                          )}
                        </td>
                        <td
                          className={cn(
                            'text-right font-bold text-foreground tabular-nums whitespace-nowrap',
                            isCompact ? 'py-2 px-2' : 'py-3 px-3'
                          )}
                        >
                          {item.quantity}주
                        </td>
                        <td
                          className={cn(
                            'text-right text-muted-foreground font-semibold tabular-nums whitespace-nowrap',
                            isCompact ? 'py-2 px-2 hidden sm:table-cell' : 'py-3 px-3'
                          )}
                        >
                          {item.price.toLocaleString()}원
                        </td>
                        <td
                          className={cn(
                            'text-right font-extrabold text-foreground tabular-nums whitespace-nowrap',
                            isCompact ? 'py-2 px-2' : 'py-3 px-3'
                          )}
                        >
                          {item.totalAmount.toLocaleString()}원
                        </td>
                        <td
                          className={cn(
                            'text-right font-black tabular-nums whitespace-nowrap',
                            isCompact ? 'py-2 pl-2 pr-4' : 'py-3 pl-3 pr-5'
                          )}
                        >
                          {isBuy || item.realizedProfit === undefined ? (
                            <span className="text-muted-foreground/60 font-semibold">—</span>
                          ) : (
                            <span
                              className={cn(
                                profit > 0
                                  ? 'text-[var(--color-price-up)]'
                                  : profit < 0
                                    ? 'text-[var(--color-price-down)]'
                                    : 'text-muted-foreground'
                              )}
                            >
                              {formatSignedWon(profit)}{' '}
                              <span className="text-[11px] opacity-90">
                                ({formatSignedPct(item.realizedProfitRate ?? 0, 1)})
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
