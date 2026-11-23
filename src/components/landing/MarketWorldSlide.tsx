import { useMemo, useRef, useState } from 'react';
import { INITIAL_STOCKS } from '../../lib/stockData';
import { ChevronLeft, ChevronRight, Globe2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MARKET_SCENARIO_DEMOS } from './landingData';

interface MarketWorldSlideProps {
  isDark: boolean;
  isVisible: boolean;
}

type ExposureFilter = 'all' | 'export' | 'domestic' | 'mixed';

const EXPOSURE_LABELS: Record<ExposureFilter, string> = {
  all: '전체 34개사',
  export: '수출형',
  domestic: '내수형',
  mixed: '혼합형',
};

export default function MarketWorldSlide({ isDark, isVisible }: MarketWorldSlideProps) {
  const [exposureFilter, setExposureFilter] = useState<ExposureFilter>('all');
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const filteredStocks = useMemo(() => {
    if (exposureFilter === 'all') return INITIAL_STOCKS;
    return INITIAL_STOCKS.filter((s) => s.exposure === exposureFilter);
  }, [exposureFilter]);

  const scrollStrip = (dir: 'left' | 'right') => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const scenario = MARKET_SCENARIO_DEMOS[scenarioIdx];

  return (
    <div className="w-full min-h-dvh flex items-center py-24 lg:py-20 px-5 sm:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-7">
        {/* Header + Exposure Filter */}
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-end justify-between gap-4 slide-reveal',
            isVisible && 'slide-reveal-visible'
          )}
        >
          <div className="space-y-3 max-w-2xl">
            <p
              className={cn(
                'text-[11px] font-extrabold tracking-[0.18em] uppercase',
                isDark ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              05 · VIRTUAL MARKET &amp; ENGINE v2.0
            </p>
            <h2
              className={cn(
                'text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.15]',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              17개 산업, 34개 가상 기업이
              <br className="hidden sm:block" /> 실제 경제 원리로 움직입니다
            </h2>
          </div>

          {/* Exposure Filter + Strip Arrows */}
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(EXPOSURE_LABELS) as ExposureFilter[]).map((key) => {
              const active = exposureFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExposureFilter(key)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer',
                    active
                      ? isDark
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-900 text-white border-slate-900'
                      : isDark
                        ? 'bg-[#1A1F30] border-[#2B334A] text-slate-300 hover:border-slate-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  {EXPOSURE_LABELS[key]}
                </button>
              );
            })}

            <div className="hidden sm:flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => scrollStrip('left')}
                aria-label="이전 가상 기업 보기"
                className={cn(
                  'w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors',
                  isDark
                    ? 'bg-[#1A1F30] border-[#2B334A] text-slate-200 hover:bg-[#22283A]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollStrip('right')}
                aria-label="다음 가상 기업 보기"
                className={cn(
                  'w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors',
                  isDark
                    ? 'bg-[#1A1F30] border-[#2B334A] text-slate-200 hover:bg-[#22283A]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Virtual Stock Card Carousel */}
        <div
          className={cn(
            'slide-reveal slide-delay-1',
            isVisible && 'slide-reveal-visible'
          )}
        >
          <div
            ref={stripRef}
            className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
          >
            {filteredStocks.map((stock) => {
              const expText =
                stock.exposure === 'export'
                  ? '수출형'
                  : stock.exposure === 'domestic'
                    ? '내수형'
                    : '혼합형';
              return (
                <div
                  key={stock.id}
                  className={cn(
                    'min-w-[215px] max-w-[215px] snap-start rounded-2xl border p-4 flex flex-col justify-between gap-3 shrink-0 transition-colors',
                    isDark
                      ? 'bg-[#1A1F30]/90 border-[#2B334A] hover:border-slate-500/70'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_6px_20px_rgba(15,23,42,0.03)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 truncate">
                      {stock.sector}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0',
                        stock.exposure === 'export'
                          ? 'bg-[#3182F6]/12 text-[#3182F6]'
                          : stock.exposure === 'domestic'
                            ? 'bg-emerald-500/12 text-emerald-500'
                            : 'bg-amber-500/12 text-amber-500'
                      )}
                    >
                      {expText}
                    </span>
                  </div>

                  <div>
                    <div className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
                      {stock.name}
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span
                        className={cn(
                          'text-sm font-mono font-black tabular-nums',
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        )}
                      >
                        ₩{stock.basePrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        변동성 {stock.volatility.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive v2.0 Engine Cause & Effect Comparison Card */}
        <div
          className={cn(
            'rounded-[24px] border p-5 sm:p-6 space-y-5 slide-reveal slide-delay-2',
            isDark
              ? 'bg-[#1A1F30]/95 border-[#2B334A]'
              : 'bg-white border-slate-200/90 shadow-[0_14px_40px_rgba(15,23,42,0.05)]'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[var(--price-up)]">
                <Globe2 className="w-3.5 h-3.5" />
                <span>{scenario.tag}</span>
              </div>
              <h3
                className={cn(
                  'text-base sm:text-lg font-black tracking-tight',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                {scenario.headline}
              </h3>
            </div>

            {/* Scenario Switcher */}
            <div
              className={cn(
                'inline-flex p-1 rounded-xl border self-start sm:self-auto shrink-0',
                isDark ? 'bg-[#12151F] border-[#2B334A]' : 'bg-slate-100 border-slate-200'
              )}
            >
              {MARKET_SCENARIO_DEMOS.map((demo, i) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => setScenarioIdx(i)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer',
                    scenarioIdx === i
                      ? isDark
                        ? 'bg-white text-slate-950'
                        : 'bg-slate-900 text-white'
                      : 'text-slate-400 hover:text-slate-200 dark:hover:text-white'
                  )}
                >
                  {i === 0 ? '환율 급등 예시' : 'AI 투자 확대 예시'}
                </button>
              ))}
            </div>
          </div>

          <p className={cn('text-xs sm:text-[13px] font-medium leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>
            {scenario.context}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scenario.outcomes.map((out) => {
              const isUp = out.direction === 'up';
              return (
                <div
                  key={out.stockId}
                  className={cn(
                    'rounded-2xl border p-4 flex flex-col justify-between gap-2.5',
                    isDark ? 'bg-[#12151F] border-[#2B334A]' : 'bg-slate-50/90 border-slate-200/80'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm sm:text-base font-black',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {out.name}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded',
                          isDark ? 'bg-[#1A1F30] text-slate-300' : 'bg-white text-slate-600 border border-slate-200'
                        )}
                      >
                        {out.sector} · {out.exposureLabel}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 font-mono text-sm font-black tabular-nums',
                        isUp ? 'text-[var(--price-up)]' : 'text-[var(--price-down)]'
                      )}
                    >
                      {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {out.deltaText}
                    </span>
                  </div>
                  <p className={cn('text-xs font-medium leading-relaxed', isDark ? 'text-slate-300' : 'text-slate-600')}>
                    {out.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
