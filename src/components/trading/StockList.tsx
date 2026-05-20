import { useGameStore } from '../../stores/gameStore';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { Search, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useMemo, useRef } from 'react';

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

// Mini Sparkline component for stock trend
function Sparkline({ history, isUp }: { history: number[]; isUp: boolean }) {
  const points = useMemo(() => {
    if (history.length < 2) return '';
    const max = Math.max(...history);
    const min = Math.min(...history);
    const range = max - min === 0 ? 1 : max - min;
    const width = 45;
    const height = 14;
    
    return history.slice(-10).map((val, index, arr) => {
      const x = (index / (arr.length - 1)) * width;
      const y = height - 1 - ((val - min) / range) * (height - 2);
      return `${x},${y}`;
    }).join(' ');
  }, [history]);

  if (history.length < 2) return null;

  return (
    <svg className="w-12 h-4 overflow-visible shrink-0 opacity-80" viewBox="0 0 45 14">
      <polyline
        fill="none"
        stroke={isUp ? 'var(--price-up)' : 'var(--price-down)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function StockList({ selected, onSelect }: Props) {
  const { stocks, tutorialStep } = useGameStore();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});

  const stockList = useMemo(() => {
    let list = Object.values(stocks);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
    }
    if (sectorFilter) {
      list = list.filter(s => s.sector === sectorFilter);
    }
    return list.sort((a, b) => {
      if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
      return a.name.localeCompare(b.name);
    });
  }, [stocks, search, sectorFilter]);

  const sectors = useMemo(() => {
    const s = new Set(Object.values(stocks).map(s => s.sector));
    return Array.from(s).sort();
  }, [stocks]);

  // Group stocks by sector
  const grouped = useMemo(() => {
    const map: Record<string, typeof stockList> = {};
    stockList.forEach(s => {
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s);
    });
    return map;
  }, [stockList]);

  const toggleSector = (sector: string) => {
    setCollapsedSectors(prev => ({
      ...prev,
      [sector]: !prev[sector]
    }));
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 140;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--color-hts-panel)] transition-all duration-300",
      tutorialStep === 2 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative"
    )}>
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 2 && (
        <div className="bg-amber-500 text-slate-950 px-3 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">👈</span> 2단계: 관심 있는 기업 종목을 클릭해 보세요!
          </span>
          <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">클릭</span>
        </div>
      )}
      {/* Search */}
      <div className="p-3 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="종목 또는 섹터 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-black/40 border border-[var(--color-hts-border)] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40 focus:border-[var(--color-accent-gold)] transition-all placeholder:text-muted-foreground/55 font-medium text-foreground"
          />
        </div>
      </div>

      {/* Sector filter tabs with arrow navigation */}
      <div className="relative flex items-center border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] group shrink-0">
        {/* Left scroll chevron */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-7 bg-gradient-to-r from-[var(--color-hts-panel)] via-[var(--color-hts-panel)] to-transparent flex items-center justify-start pl-1 text-muted-foreground hover:text-foreground cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex-1 flex gap-1.5 p-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          <button
            onClick={() => setSectorFilter(null)}
            className={cn(
              "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer",
              !sectorFilter 
                ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent-gold)] text-[var(--color-primary-foreground)] shadow-sm" 
                : "bg-black/[0.04] dark:bg-white/[0.03] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:text-foreground"
            )}
          >
            전체
          </button>
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap",
                sectorFilter === s 
                  ? "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent-gold)] text-[var(--color-primary-foreground)] shadow-sm" 
                  : "bg-black/[0.04] dark:bg-white/[0.03] text-muted-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:text-foreground"
              )}
            >
              {s.split('(')[0]}
            </button>
          ))}
        </div>

        {/* Right scroll chevron */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-7 bg-gradient-to-l from-[var(--color-hts-panel)] via-[var(--color-hts-panel)] to-transparent flex items-center justify-end pr-1 text-muted-foreground hover:text-foreground cursor-pointer transition-opacity opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-12 px-4 py-2 text-[10px] text-muted-foreground font-bold tracking-wider uppercase border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/10">
        <span className="col-span-5">종목명 / 차트</span>
        <span className="col-span-3 text-right">현재가</span>
        <span className="col-span-2 text-right">대비</span>
        <span className="col-span-2 text-right">등락률</span>
      </div>

      {/* Stock list */}
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-1.5">
          {Object.entries(grouped).map(([sector, sectorStocks]) => {
            const isCollapsed = collapsedSectors[sector];
            return (
              <div key={sector} className="space-y-1">
                {/* Collapsible Header */}
                <button
                  onClick={() => toggleSector(sector)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black tracking-wider text-white bg-slate-600 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-all duration-200"
                >
                  <span className="uppercase text-white/95 font-black">{sector}</span>
                  <div className="flex items-center gap-1 text-white/80">
                    <span className="text-[9px] font-bold">({sectorStocks.length})</span>
                    {isCollapsed ? <ChevronRight className="w-3 h-3 text-white/90" /> : <ChevronDown className="w-3 h-3 text-white/90" />}
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 pl-1">
                    {sectorStocks.map(stock => {
                      const prev = stock.priceHistory.length > 1
                        ? stock.priceHistory[stock.priceHistory.length - 2]
                        : stock.currentPrice;
                      const diff = stock.currentPrice - prev;
                      const pct = prev > 0 ? (diff / prev) * 100 : 0;
                      const isUp = diff > 0;
                      const isDown = diff < 0;

                      return (
                        <button
                          key={stock.id}
                          onClick={() => onSelect(stock.id)}
                          className={cn(
                            "grid grid-cols-12 items-center w-full px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer border border-transparent",
                            "hover:bg-[var(--color-hts-hover)]",
                            selected === stock.id 
                              ? "bg-[var(--color-hts-hover)] border-[var(--color-accent-gold)]/25 font-bold shadow-sm" 
                              : ""
                          )}
                        >
                          {/* Name and Sparkline */}
                          <div className="col-span-5 flex items-center gap-2 pr-1">
                            <div className="min-w-0">
                              <div className="font-extrabold text-foreground text-xs truncate leading-snug">{stock.name}</div>
                              <div className="mt-0.5">
                                <Sparkline history={stock.priceHistory} isUp={stock.currentPrice >= stock.priceHistory[0]} />
                              </div>
                            </div>
                          </div>
                          
                          {/* Price */}
                          <div className={cn(
                            "col-span-3 text-right font-black tabular-nums text-xs",
                            isUp ? "text-[var(--color-price-up)]" : isDown ? "text-[var(--color-price-down)]" : "text-foreground/80"
                          )}>
                            {stock.currentPrice.toLocaleString()}
                          </div>

                          {/* Net Change */}
                          <div className={cn(
                            "col-span-2 text-right text-[10px] font-bold tabular-nums",
                            isUp ? "text-[var(--color-price-up)]" : isDown ? "text-[var(--color-price-down)]" : "text-muted-foreground"
                          )}>
                            {isUp ? '▲' : isDown ? '▼' : ''}{Math.abs(diff).toLocaleString()}
                          </div>

                          {/* Percent Change */}
                          <div className={cn(
                            "col-span-2 text-right text-[10px] font-black tabular-nums",
                            isUp ? "text-[var(--color-price-up)]" : isDown ? "text-[var(--color-price-down)]" : "text-muted-foreground"
                          )}>
                            {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
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
      </ScrollArea>
    </div>
  );
}
