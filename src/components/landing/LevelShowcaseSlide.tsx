import { useMemo, useState } from 'react';
import type { Level } from '../../stores/gameStore';
import { GLOSSARY_TERMS } from '../../lib/glossaryData';
import { ArrowRight, BookOpen, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FEATURED_GLOSSARY_IDS, LEVEL_CONFIGS } from './landingData';

interface LevelShowcaseSlideProps {
  isDark: boolean;
  isVisible: boolean;
  level: Level;
  onSelectLevel: (level: Level) => void;
  onStartWithLevel: () => void;
}

export default function LevelShowcaseSlide({
  isDark,
  isVisible,
  level,
  onSelectLevel,
  onStartWithLevel,
}: LevelShowcaseSlideProps) {
  const featuredTerms = useMemo(
    () => GLOSSARY_TERMS.filter((item) => FEATURED_GLOSSARY_IDS.includes(item.id)),
    []
  );
  const [selectedTermId, setSelectedTermId] = useState(
    featuredTerms[0]?.id ?? GLOSSARY_TERMS[0]?.id ?? 'g-1'
  );

  const activeLevel = LEVEL_CONFIGS.find((l) => l.key === level) ?? LEVEL_CONFIGS[0];
  const activeTerm =
    featuredTerms.find((t) => t.id === selectedTermId) ?? featuredTerms[0] ?? GLOSSARY_TERMS[0];

  return (
    <div className="w-full min-h-dvh flex items-center py-24 lg:py-20 px-5 sm:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-7 lg:space-y-8">
        {/* Header + Level Tab Switcher (Synced with Slide 1!) */}
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-end justify-between gap-5 slide-reveal',
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
              04 · ADAPTIVE CURRICULUM
            </p>
            <h2
              className={cn(
                'text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.15]',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              초등부터 고등까지,
              <br className="hidden sm:block" /> 눈높이에 맞춰 달라지는 교실
            </h2>
          </div>

          {/* 3-Level Selector Switch */}
          <div
            role="tablist"
            aria-label="학습 등급 비교 선택"
            className={cn(
              'inline-flex p-1 rounded-2xl border self-start lg:self-auto',
              isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-slate-100 border-slate-200'
            )}
          >
            {LEVEL_CONFIGS.map((cfg) => {
              const isSelected = cfg.key === level;
              return (
                <button
                  key={cfg.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectLevel(cfg.key)}
                  className={cn(
                    'px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5',
                    isSelected
                      ? isDark
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-white shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <span>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Content: Left Engine Spec + Right Live Glossary Explorer */}
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch slide-reveal slide-delay-1',
            isVisible && 'slide-reveal-visible'
          )}
        >
          {/* Left: Selected Level Simulation Engine Parameters */}
          <div
            className={cn(
              'lg:col-span-5 rounded-[24px] border p-6 flex flex-col justify-between gap-6',
              isDark
                ? 'bg-[#1A1F30]/95 border-[#2B334A]'
                : 'bg-white border-slate-200/90 shadow-[0_14px_40px_rgba(15,23,42,0.05)]'
            )}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-[var(--price-up)]">
                    {activeLevel.audience}
                  </span>
                  <h3
                    className={cn(
                      'text-xl font-black mt-0.5 flex items-center gap-2',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    <span>{activeLevel.emoji}</span>
                    <span>
                      {activeLevel.label} · {activeLevel.title}
                    </span>
                  </h3>
                </div>
                <span
                  className={cn(
                    'font-mono text-xs font-black px-2.5 py-1 rounded-lg tabular-nums shrink-0',
                    isDark ? 'bg-[#12151F] text-white border border-[#2B334A]' : 'bg-slate-100 text-slate-900'
                  )}
                >
                  {activeLevel.cashNumber}
                </span>
              </div>

              <p
                className={cn(
                  'text-xs sm:text-[13px] leading-relaxed font-medium',
                  isDark ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                {activeLevel.detailedDesc}
              </p>

              {/* Engine Parameter Bars */}
              <div
                className={cn(
                  'rounded-2xl border p-4 space-y-3.5',
                  isDark ? 'bg-[#12151F] border-[#2B334A]' : 'bg-slate-50 border-slate-200/80'
                )}
              >
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>시뮬레이션 엔진 파라미터</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">뉴스 반영 강도</span>
                    <span className={cn('font-mono tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
                      {activeLevel.engine.newsScale}
                    </span>
                  </div>
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-[#22283A]' : 'bg-slate-200')}>
                    <div
                      className="h-full bg-[var(--price-up)] rounded-full transition-all duration-500"
                      style={{ width: `${activeLevel.engine.newsScalePct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400">시장 랜덤 변동성</span>
                    <span className={cn('font-mono tabular-nums', isDark ? 'text-white' : 'text-slate-900')}>
                      {activeLevel.engine.noiseRange}
                    </span>
                  </div>
                  <div className={cn('h-2 rounded-full overflow-hidden', isDark ? 'bg-[#22283A]' : 'bg-slate-200')}>
                    <div
                      className="h-full bg-[var(--price-down)] rounded-full transition-all duration-500"
                      style={{ width: `${activeLevel.engine.noisePct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className={cn('rounded-lg p-2.5 border', isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80')}>
                    <span className="block text-[10px] text-slate-400 font-semibold">돌발 수급 충격</span>
                    <span className={cn('font-extrabold mt-0.5 block', isDark ? 'text-slate-100' : 'text-slate-800')}>
                      {activeLevel.engine.shockChance}
                    </span>
                  </div>
                  <div className={cn('rounded-lg p-2.5 border', isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80')}>
                    <span className="block text-[10px] text-slate-400 font-semibold">전일 뉴스 이월</span>
                    <span className={cn('font-extrabold mt-0.5 block', isDark ? 'text-slate-100' : 'text-slate-800')}>
                      {activeLevel.engine.carryover}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartWithLevel}
              className={cn(
                'w-full h-11 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer',
                isDark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              <span>{activeLevel.label}로 바로 시작하기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Interactive Glossary Explorer (Real Data from glossaryData.ts) */}
          <div
            className={cn(
              'lg:col-span-7 rounded-[24px] border p-6 flex flex-col justify-between gap-5',
              isDark
                ? 'bg-[#1A1F30]/95 border-[#2B334A]'
                : 'bg-white border-slate-200/90 shadow-[0_14px_40px_rgba(15,23,42,0.05)]'
            )}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--price-down)]" />
                  <span
                    className={cn(
                      'text-xs font-black tracking-tight',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    같은 금융 용어, 다른 눈높이 해설 미리보기
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  전체 18개 용어 수록
                </span>
              </div>

              {/* Term Selector Chips */}
              <div className="flex flex-wrap gap-2">
                {featuredTerms.map((term) => {
                  const isActive = term.id === activeTerm?.id;
                  const shortTitle = term.term.split(' (')[0];
                  return (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedTermId(term.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                        isActive
                          ? isDark
                            ? 'bg-white text-slate-950 border-white'
                            : 'bg-slate-900 text-white border-slate-900'
                          : isDark
                            ? 'bg-[#12151F] border-[#2B334A] text-slate-300 hover:border-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      {shortTitle}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Term Definition Box */}
              {activeTerm && (
                <div
                  className={cn(
                    'rounded-2xl border p-5 space-y-3 min-h-[195px] flex flex-col justify-between transition-colors',
                    isDark ? 'bg-[#12151F] border-[#2B334A]' : 'bg-slate-50/90 border-slate-200/80'
                  )}
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4
                        className={cn(
                          'text-base sm:text-lg font-black',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {activeTerm.term}
                      </h4>
                      <span
                        className={cn(
                          'text-[11px] font-extrabold px-2.5 py-0.5 rounded-md',
                          isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-900/8 text-slate-800'
                        )}
                      >
                        {activeLevel.emoji} {activeLevel.label} 해설
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-xs sm:text-sm leading-[1.75] font-medium',
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      )}
                    >
                      {activeTerm.definitions[level]}
                    </p>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-400 pt-2 border-t border-dashed border-slate-300/40 dark:border-slate-700/60">
                    위 등급 탭(초급·중급·고급)을 전환해 같은 개념이 어떻게 깊어지는지 비교해 보세요.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>앱 내 ‘금융 용어 사전’ 탭에서 언제든 검색 가능</span>
              <span className="font-mono">GLOSSARY · 18 TERMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
