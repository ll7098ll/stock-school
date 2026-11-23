import { useGameStore } from '../../stores/gameStore';
import {
  formatSignedPct,
  formatSignedWon,
  getTodayNewsSets,
} from '../../lib/tradingMetrics';
import { cn } from '../../lib/utils';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Newspaper,
  Briefcase,
  ArrowUpDown,
} from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  onQuickSell?: (id: string) => void;
  sectorFilter?: string | null;
  onSectorFilterChange?: (sector: string | null) => void;
}

type ListViewMode = 'all' | 'holdings' | 'news';
type SortMode = 'default' | 'changeDesc' | 'profitDesc' | 'profitAsc' | 'valueDesc';

// Mini Sparkline component for stock trend
function Sparkline({ history, isUp }: { history: number[]; isUp: boolean }) {
  const points = useMemo(() => {
    if (history.length < 2) return '';
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 48;
    const height = 14;

    return history
      .slice(-10)
      .map((val, index, arr) => {
        const x = (index / (arr.length - 1)) * width;
        const y = height - 1 - ((val - min) / range) * (height - 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [history]);

  if (history.length < 2) return null;

  return (
    <svg className="w-12 h-3.5 overflow-visible shrink-0 opacity-85" viewBox="0 0 48 14">
      <polyline
        fill="none"
        stroke={isUp ? 'var(--price-up)' : 'var(--price-down)'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function StockList({
  selected,
  onSelect,
  onQuickSell,
  sectorFilter: controlledSectorFilter,
  onSectorFilterChange,
}: Props) {
  const { stocks, tutorialStep, currentNews, holdings } = useGameStore();
  const [search, setSearch] = useState('');
  const [internalSectorFilter, setInternalSectorFilter] = useState<string | null>(null);
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ListViewMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  const sectorFilter =
    controlledSectorFilter !== undefined ? controlledSectorFilter : internalSectorFilter;

  const [prevControlledSector, setPrevControlledSector] = useState(controlledSectorFilter);
  if (controlledSectorFilter !== prevControlledSector) {
    setPrevControlledSector(controlledSectorFilter);
    if (controlledSectorFilter && viewMode === 'holdings') {
      setViewMode('all');
    }
  }

  const setSectorFilter = (next: string | null) => {
    setInternalSectorFilter(next);
    onSectorFilterChange?.(next);
  };

  // Identify sectors and stocks mentioned in today's news (without spoiling direction!)
  const { newsSectorSet, newsStockSet } = useMemo(
    () => getTodayNewsSets(currentNews),
    [currentNews]
  );

  const heldCount = useMemo(
    () => Object.values(holdings).filter((h) => h.quantity > 0).length,
    [holdings]
  );

  const newsRelatedCount = useMemo(
    () =>
      Object.values(stocks).filter(
        (s) => newsStockSet.has(s.id) || newsSectorSet.has(s.sector)
      ).length,
    [stocks, newsSectorSet, newsStockSet]
  );

  const getHoldingStats = (stockId: string, currentPrice: number) => {
    const h = holdings[stockId];
    if (!h || h.quantity <= 0) return null;
    const value = currentPrice * h.quantity;
    const cost = h.avgPrice * h.quantity;
    const profit = value - cost;
    const profitRate = cost > 0 ? (profit / cost) * 100 : 0;
    return { quantity: h.quantity, avgPrice: h.avgPrice, value, profit, profitRate };
  };

  const stockList = useMemo(() => {
    const dailyChangePct = (s: (typeof stocks)[string]) => {
      const prev =
        s.priceHistory.length > 1 ? s.priceHistory[s.priceHistory.length - 2] : s.currentPrice;
      return prev > 0 ? ((s.currentPrice - prev) / prev) * 100 : 0;
    };

    const holdingMetrics = (s: (typeof stocks)[string]) => {
      const h = holdings[s.id];
      if (!h || h.quantity <= 0) return null;
      const value = s.currentPrice * h.quantity;
      const cost = h.avgPrice * h.quantity;
      const profitRate = cost > 0 ? ((value - cost) / cost) * 100 : 0;
      return { value, profitRate };
    };

    let list = Object.values(stocks);

    if (viewMode === 'holdings') {
      list = list.filter((s) => Boolean(holdings[s.id]?.quantity));
    } else if (viewMode === 'news') {
      list = list.filter((s) => newsStockSet.has(s.id) || newsSectorSet.has(s.sector));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
      );
    }
    if (sectorFilter && viewMode !== 'holdings') {
      list = list.filter((s) => s.sector === sectorFilter);
    }

    return list.sort((a, b) => {
      if (sortMode === 'changeDesc') {
        return dailyChangePct(b) - dailyChangePct(a);
      }
      if (sortMode === 'profitDesc' || sortMode === 'profitAsc' || sortMode === 'valueDesc') {
        const aH = holdingMetrics(a);
        const bH = holdingMetrics(b);
        if (sortMode === 'valueDesc') {
          return (bH?.value ?? -Infinity) - (aH?.value ?? -Infinity);
        }
        if (sortMode === 'profitDesc') {
          return (bH?.profitRate ?? -Infinity) - (aH?.profitRate ?? -Infinity);
        }
        return (aH?.profitRate ?? Infinity) - (bH?.profitRate ?? Infinity);
      }
      if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
      return a.name.localeCompare(b.name);
    });
  }, [stocks, holdings, viewMode, search, sectorFilter, sortMode, newsSectorSet, newsStockSet]);

  const sectors = useMemo(() => {
    const s = new Set(Object.values(stocks).map((st) => st.sector));
    return Array.from(s).sort((a, b) => {
      const aNews = newsSectorSet.has(a) ? 0 : 1;
      const bNews = newsSectorSet.has(b) ? 0 : 1;
      if (aNews !== bNews) return aNews - bNews;
      return a.localeCompare(b);
    });
  }, [stocks, newsSectorSet]);

  // Group stocks by sector when in default sort & non-holdings view
  const grouped = useMemo(() => {
    const map: Record<string, typeof stockList> = {};
    stockList.forEach((s) => {
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s);
    });
    return Object.entries(map).sort(([secA], [secB]) => {
      const aNews = newsSectorSet.has(secA) ? 0 : 1;
      const bNews = newsSectorSet.has(secB) ? 0 : 1;
      if (aNews !== bNews) return aNews - bNews;
      return secA.localeCompare(secB);
    });
  }, [stockList, newsSectorSet]);

  const toggleSector = (sector: string) => {
    setCollapsedSectors((prev) => ({
      ...prev,
      [sector]: !prev[sector],
    }));
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 160;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const isFlatListMode = viewMode === 'holdings' || sortMode !== 'default';

  const renderStockRow = (stock: (typeof stockList)[number], showHoldingDetails = false) => {
    const prev =
      stock.priceHistory.length > 1
        ? stock.priceHistory[stock.priceHistory.length - 2]
        : stock.currentPrice;
    const diff = stock.currentPrice - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : 0;
    const isUp = diff > 0;
    const isDown = diff < 0;
    const holdingStats = getHoldingStats(stock.id, stock.currentPrice);
    const isDirectNewsStock = newsStockSet.has(stock.id);

    return (
      <div
        key={stock.id}
        className={cn(
          'rounded-xl transition-all duration-150 border',
          selected === stock.id
            ? 'bg-[var(--color-hts-hover)] border-[var(--color-accent-gold)]/35 shadow-sm'
            : 'border-transparent hover:bg-[var(--color-hts-hover)]'
        )}
      >
        <button
          type="button"
          onClick={() => onSelect(stock.id)}
          className="flex items-center justify-between gap-2 w-full px-3 py-2.5 cursor-pointer text-left"
        >
          {/* Left: Name + Badges + Sparkline */}
          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-foreground text-sm truncate leading-snug">
                {stock.name}
              </span>
              {holdingStats && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded font-black shrink-0 tabular-nums',
                    holdingStats.profit > 0
                      ? 'bg-[var(--color-price-up)]/12 text-[var(--color-price-up)]'
                      : holdingStats.profit < 0
                        ? 'bg-[var(--color-price-down)]/12 text-[var(--color-price-down)]'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                  )}
                >
                  {holdingStats.quantity}주 · {formatSignedPct(holdingStats.profitRate, 1)}
                </span>
              )}
              {isDirectNewsStock && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black shrink-0">
                  관련
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Sparkline
                history={stock.priceHistory}
                isUp={stock.currentPrice >= stock.priceHistory[0]}
              />
              {showHoldingDetails && holdingStats && (
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums truncate">
                  평단 {holdingStats.avgPrice.toLocaleString()}원
                </span>
              )}
            </div>
          </div>

          {/* Right: Price + Percent Change */}
          <div className="text-right shrink-0 space-y-0.5">
            <div
              className={cn(
                'font-black tabular-nums text-sm leading-tight',
                isUp
                  ? 'text-[var(--color-price-up)]'
                  : isDown
                    ? 'text-[var(--color-price-down)]'
                    : 'text-foreground'
              )}
            >
              {stock.currentPrice.toLocaleString()}원
            </div>
            <div
              className={cn(
                'text-xs font-bold tabular-nums leading-tight',
                isUp
                  ? 'text-[var(--color-price-up)]'
                  : isDown
                    ? 'text-[var(--color-price-down)]'
                    : 'text-muted-foreground'
              )}
            >
              {pct > 0 ? '+' : ''}
              {pct.toFixed(2)}%
            </div>
          </div>
        </button>

        {/* Holdings View Extra Bar: Evaluation + Quick Sell CTA */}
        {showHoldingDetails && holdingStats && (
          <div className="px-3 pb-2.5 pt-1 border-t border-[var(--color-hts-border)]/45 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0 tabular-nums">
              <span className="text-muted-foreground font-semibold">평가</span>
              <span className="font-extrabold text-foreground">
                {holdingStats.value.toLocaleString()}원
              </span>
              <span
                className={cn(
                  'font-black',
                  holdingStats.profit > 0
                    ? 'text-[var(--color-price-up)]'
                    : holdingStats.profit < 0
                      ? 'text-[var(--color-price-down)]'
                      : 'text-muted-foreground'
                )}
              >
                ({formatSignedWon(holdingStats.profit)})
              </span>
            </div>
            {onQuickSell && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSell(stock.id);
                }}
                className="px-2 py-0.5 rounded-md bg-[var(--color-price-down)]/12 hover:bg-[var(--color-price-down)] text-[var(--color-price-down)] hover:text-white font-black transition-colors cursor-pointer shrink-0"
              >
                매도
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] transition-all duration-300 overflow-hidden',
        tutorialStep === 2 &&
          'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 2 && (
        <div className="bg-amber-500 text-slate-950 px-3.5 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">👈</span> 2단계: 오늘 뉴스와 관련된 기업을 클릭해 살펴보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">
            클릭
          </span>
        </div>
      )}

      {/* Search + Quick View Mode Tabs */}
      <div className="p-2.5 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] shrink-0 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="종목 또는 산업 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-xl pl-9 pr-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 focus:border-[var(--color-accent-gold)] transition-all placeholder:text-muted-foreground/60 font-medium text-foreground"
          />
        </div>

        {/* View Mode Segmented Filter: 전체 | 내 보유 | 오늘 뉴스 */}
        <div className="grid grid-cols-3 gap-1 bg-black/[0.04] dark:bg-black/40 p-1 rounded-xl border border-[var(--color-hts-border)]/70">
          <button
            type="button"
            onClick={() => {
              setViewMode('all');
              if (sortMode === 'profitDesc' || sortMode === 'profitAsc' || sortMode === 'valueDesc') {
                setSortMode('default');
              }
            }}
            className={cn(
              'py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer',
              viewMode === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            전체 ({Object.keys(stocks).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('holdings');
              setSectorFilter(null);
              if (sortMode === 'default') setSortMode('valueDesc');
            }}
            className={cn(
              'py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer inline-flex items-center justify-center gap-1',
              viewMode === 'holdings'
                ? 'bg-[var(--color-price-down)] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Briefcase className="w-3 h-3" />
            <span>내 보유 ({heldCount})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('news');
              setSectorFilter(null);
              if (sortMode === 'profitDesc' || sortMode === 'profitAsc' || sortMode === 'valueDesc') {
                setSortMode('default');
              }
            }}
            className={cn(
              'py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer inline-flex items-center justify-center gap-1',
              viewMode === 'news'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Newspaper className="w-3 h-3" />
            <span>뉴스 ({newsRelatedCount})</span>
          </button>
        </div>
      </div>

      {/* Sector filter tabs (shown when not in Holdings mode) */}
      {viewMode !== 'holdings' && (
        <div className="relative flex items-center border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] group shrink-0">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-7 bg-gradient-to-r from-[var(--color-hts-panel)] via-[var(--color-hts-panel)] to-transparent flex items-center justify-start pl-1 text-muted-foreground hover:text-foreground cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-1.5 p-2 overflow-x-auto no-scrollbar scroll-smooth"
          >
            <button
              type="button"
              onClick={() => setSectorFilter(null)}
              className={cn(
                'shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
                !sectorFilter
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'bg-black/[0.04] dark:bg-white/[0.05] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.1] hover:text-foreground'
              )}
            >
              전체
            </button>
            {sectors.map((s) => {
              const hasNews = newsSectorSet.has(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                  className={cn(
                    'shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-1',
                    sectorFilter === s
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                      : hasNews
                        ? 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-black/[0.04] dark:bg-white/[0.05] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.1] hover:text-foreground'
                  )}
                >
                  {hasNews && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  {s.split('(')[0]}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-7 bg-gradient-to-l from-[var(--color-hts-panel)] via-[var(--color-hts-panel)] to-transparent flex items-center justify-end pr-1 text-muted-foreground hover:text-foreground cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Sort Control */}
      <div className="flex items-center justify-between px-3.5 py-1.5 text-[11px] text-muted-foreground font-bold border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/15 shrink-0 gap-2">
        <span>{viewMode === 'holdings' ? '보유 종목 · 수익률' : '종목명 / 추세'}</span>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 opacity-70" />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            aria-label="종목 정렬 기준"
            className="bg-transparent text-[11px] font-bold text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
          >
            {viewMode === 'holdings' ? (
              <>
                <option value="valueDesc">평가금액순</option>
                <option value="profitDesc">수익률 높은순</option>
                <option value="profitAsc">수익률 낮은순</option>
                <option value="changeDesc">오늘 등락률순</option>
              </>
            ) : (
              <>
                <option value="default">섹터·뉴스순</option>
                <option value="changeDesc">등락률 높은순</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Stock list */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-2 space-y-2">
          {stockList.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2 text-muted-foreground">
              <Briefcase className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs font-bold text-foreground/80">
                {viewMode === 'holdings'
                  ? '아직 보유 중인 주식이 없습니다.'
                  : '조건에 맞는 종목이 없습니다.'}
              </p>
              {viewMode === 'holdings' && (
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className="text-xs font-black text-[var(--color-accent-gold)] hover:underline cursor-pointer"
                >
                  전체 종목 보러가기 →
                </button>
              )}
            </div>
          ) : isFlatListMode ? (
            <div className="space-y-1.5">
              {stockList.map((stock) => renderStockRow(stock, viewMode === 'holdings'))}
            </div>
          ) : (
            grouped.map(([sector, sectorStocks]) => {
              const isCollapsed = collapsedSectors[sector];
              const isNewsSector = newsSectorSet.has(sector);

              return (
                <div key={sector} className="space-y-1">
                  {/* Collapsible Sector Header */}
                  <button
                    type="button"
                    onClick={() => toggleSector(sector)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-xs font-black rounded-lg cursor-pointer transition-all duration-200',
                      isNewsSector
                        ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'text-white bg-slate-600 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isNewsSector && (
                        <Newspaper className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{sector}</span>
                      {isNewsSector && (
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black shrink-0">
                          오늘 뉴스
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-85">
                      <span className="text-[11px] font-bold">({sectorStocks.length})</span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1">
                      {sectorStocks.map((stock) => renderStockRow(stock, false))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
