import { useGameStore } from '../../stores/gameStore';
import { cn } from '../../lib/utils';
import { Search, ChevronDown, ChevronRight, ChevronLeft, Newspaper } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
  sectorFilter?: string | null;
  onSectorFilterChange?: (sector: string | null) => void;
}

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
  sectorFilter: controlledSectorFilter,
  onSectorFilterChange,
}: Props) {
  const { stocks, tutorialStep, currentNews, holdings } = useGameStore();
  const [search, setSearch] = useState('');
  const [internalSectorFilter, setInternalSectorFilter] = useState<string | null>(null);
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});

  const sectorFilter =
    controlledSectorFilter !== undefined ? controlledSectorFilter : internalSectorFilter;

  const setSectorFilter = (next: string | null) => {
    setInternalSectorFilter(next);
    onSectorFilterChange?.(next);
  };

  // Identify sectors and stocks mentioned in today's news (without spoiling direction!)
  const { newsSectorSet, newsStockSet } = useMemo(() => {
    const secSet = new Set<string>();
    const stSet = new Set<string>();
    currentNews.forEach((n) => {
      n.relatedSectors.forEach((s) => secSet.add(s));
      Object.keys(n.stockImpactOverrides ?? {}).forEach((id) => stSet.add(id));
      (n.relatedStocks ?? []).forEach((id) => stSet.add(id));
    });
    return { newsSectorSet: secSet, newsStockSet: stSet };
  }, [currentNews]);

  const stockList = useMemo(() => {
    let list = Object.values(stocks);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q)
      );
    }
    if (sectorFilter) {
      list = list.filter((s) => s.sector === sectorFilter);
    }
    return list.sort((a, b) => {
      // Float today's news-related sectors slightly higher when not filtering, or keep clean alphabetical
      if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
      return a.name.localeCompare(b.name);
    });
  }, [stocks, search, sectorFilter]);

  const sectors = useMemo(() => {
    const s = new Set(Object.values(stocks).map((st) => st.sector));
    return Array.from(s).sort((a, b) => {
      const aNews = newsSectorSet.has(a) ? 0 : 1;
      const bNews = newsSectorSet.has(b) ? 0 : 1;
      if (aNews !== bNews) return aNews - bNews;
      return a.localeCompare(b);
    });
  }, [stocks, newsSectorSet]);

  // Group stocks by sector (prioritize sectors mentioned in today's news at the top!)
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

      {/* Search */}
      <div className="p-3 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="종목 또는 산업 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-xl pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 focus:border-[var(--color-accent-gold)] transition-all placeholder:text-muted-foreground/60 font-medium text-foreground"
          />
        </div>
      </div>

      {/* Sector filter tabs with arrow navigation */}
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
          className="flex-1 flex gap-1.5 p-2.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          <button
            type="button"
            onClick={() => setSectorFilter(null)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer',
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
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center gap-1',
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

      {/* Clean 2-Column Header */}
      <div className="flex items-center justify-between px-4 py-2 text-[11px] text-muted-foreground font-bold border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/15 shrink-0">
        <span>종목명 / 추세</span>
        <span>현재가 · 등락률</span>
      </div>

      {/* Stock list */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-2 space-y-2">
          {grouped.map(([sector, sectorStocks]) => {
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
                    {isNewsSector && <Newspaper className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
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
                    {sectorStocks.map((stock) => {
                      const prev =
                        stock.priceHistory.length > 1
                          ? stock.priceHistory[stock.priceHistory.length - 2]
                          : stock.currentPrice;
                      const diff = stock.currentPrice - prev;
                      const pct = prev > 0 ? (diff / prev) * 100 : 0;
                      const isUp = diff > 0;
                      const isDown = diff < 0;
                      const isHolding = Boolean(holdings[stock.id]?.quantity);
                      const isDirectNewsStock = newsStockSet.has(stock.id);

                      return (
                        <button
                          key={stock.id}
                          type="button"
                          onClick={() => onSelect(stock.id)}
                          className={cn(
                            'flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer border',
                            selected === stock.id
                              ? 'bg-[var(--color-hts-hover)] border-[var(--color-accent-gold)]/35 shadow-sm'
                              : 'border-transparent hover:bg-[var(--color-hts-hover)]'
                          )}
                        >
                          {/* Left: Name + Badges + Sparkline */}
                          <div className="min-w-0 text-left space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-foreground text-sm truncate leading-snug">
                                {stock.name}
                              </span>
                              {isHolding && (
                                <span className="text-[11px] px-1.5 py-0 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black shrink-0">
                                  보유
                                </span>
                              )}
                              {isDirectNewsStock && (
                                <span className="text-[11px] px-1.5 py-0 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black shrink-0">
                                  관련
                                </span>
                              )}
                            </div>
                            <Sparkline
                              history={stock.priceHistory}
                              isUp={stock.currentPrice >= stock.priceHistory[0]}
                            />
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
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
