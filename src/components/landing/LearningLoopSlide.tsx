import { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LEARNING_STEPS } from './landingData';

interface LearningLoopSlideProps {
  isDark: boolean;
  isVisible: boolean;
}

const STEP_ICONS = [Newspaper, BarChart3, PieChart, Sparkles];

export default function LearningLoopSlide({ isDark, isVisible }: LearningLoopSlideProps) {
  const [activeStep, setActiveStep] = useState(0);
  const current = LEARNING_STEPS[activeStep];

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? LEARNING_STEPS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % LEARNING_STEPS.length);
  };

  return (
    <div className="w-full min-h-dvh flex items-center py-24 lg:py-20 px-5 sm:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-8 lg:space-y-10">
        {/* Header Row */}
        <div
          className={cn(
            'flex flex-col md:flex-row md:items-end justify-between gap-4 slide-reveal',
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
              03 · DAILY LEARNING LOOP
            </p>
            <h2
              className={cn(
                'text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.15]',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              하루 4단계로 완성하는
              <br className="hidden sm:block" /> 실전 금융 사고 흐름
            </h2>
          </div>

          {/* Horizontal Slide Step Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-extrabold text-slate-400 mr-1 tabular-nums">
              0{activeStep + 1} / 0{LEARNING_STEPS.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="이전 학습 단계"
              className={cn(
                'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer',
                isDark
                  ? 'bg-[#1A1F30] border-[#2B334A] text-slate-200 hover:bg-[#22283A]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="다음 학습 단계"
              className={cn(
                'w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer',
                isDark
                  ? 'bg-[#1A1F30] border-[#2B334A] text-slate-200 hover:bg-[#22283A]'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Interactive Step Layout */}
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch slide-reveal slide-delay-1',
            isVisible && 'slide-reveal-visible'
          )}
        >
          {/* Left: 4 Clickable Steps */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 justify-center">
            {LEARNING_STEPS.map((item, idx) => {
              const Icon = STEP_ICONS[idx];
              const isSelected = activeStep === idx;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  aria-current={isSelected ? 'step' : undefined}
                  className={cn(
                    'w-full text-left rounded-2xl border p-4 transition-all cursor-pointer flex items-start gap-3.5',
                    isSelected
                      ? isDark
                        ? 'bg-[#1A1F30] border-white/80 shadow-md'
                        : 'bg-white border-slate-900 shadow-[0_10px_28px_rgba(15,23,42,0.06)]'
                      : isDark
                        ? 'bg-[#161B29]/70 border-[#262E43] hover:border-slate-500/70'
                        : 'bg-white/60 border-slate-200/80 hover:border-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      isSelected
                        ? isDark
                          ? 'bg-white text-slate-950'
                          : 'bg-slate-900 text-white'
                        : isDark
                          ? 'bg-[#12151F] text-slate-400'
                          : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono text-[10px] font-black',
                          isSelected ? 'text-[var(--price-up)]' : 'text-slate-400'
                        )}
                      >
                        STEP {item.step}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-black truncate',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {item.title}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-xs font-medium mt-0.5 truncate',
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Preview Stage */}
          <div
            className={cn(
              'lg:col-span-7 rounded-[24px] border p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors',
              isDark
                ? 'bg-[#1A1F30]/95 border-[#2B334A]'
                : 'bg-white border-slate-200/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)]'
            )}
          >
            {/* Active Step Copy */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-black text-[var(--price-up)]">
                  STEP {current.step}
                </span>
                <div className="flex items-center gap-1.5">
                  {LEARNING_STEPS.map((s, i) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveStep(i)}
                      aria-label={`Step ${s.step}`}
                      className={cn(
                        'h-1.5 rounded-full transition-all cursor-pointer',
                        activeStep === i
                          ? 'w-6 bg-[var(--price-up)]'
                          : isDark
                            ? 'w-1.5 bg-slate-700'
                            : 'w-1.5 bg-slate-200'
                      )}
                    />
                  ))}
                </div>
              </div>

              <h3
                className={cn(
                  'text-xl sm:text-2xl font-black tracking-tight',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                {current.title}
              </h3>
              <p
                className={cn(
                  'text-xs sm:text-sm leading-relaxed font-medium',
                  isDark ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                {current.description}
              </p>
            </div>

            {/* Interactive Visual Stage per Step */}
            <div
              className={cn(
                'rounded-2xl border p-4 sm:p-5 min-h-[210px] flex flex-col justify-center',
                isDark ? 'bg-[#12151F] border-[#2B334A]' : 'bg-slate-50/90 border-slate-200/80'
              )}
            >
              {activeStep === 0 && (
                <div className="space-y-2.5">
                  {[
                    {
                      tag: '산업 동향',
                      tone: 'up' as const,
                      text: '글로벌 AI 데이터센터 증설 경쟁… 고대역폭 메모리 주문 급증',
                      sector: '기술(Tech) 주목',
                    },
                    {
                      tag: '거시 경제',
                      tone: 'neutral' as const,
                      text: '원/달러 환율 상승 지속… 수출 기업과 수입 원재료 기업의 명암',
                      sector: '수출/내수 차별화',
                    },
                    {
                      tag: '글로벌 규제',
                      tone: 'down' as const,
                      text: '원자재 가격 변동성 확대… 2차전지 소재 단기 재고 부담 점검',
                      sector: '배터리(Battery) 주의',
                    },
                  ].map((news) => (
                    <div
                      key={news.text}
                      className={cn(
                        'rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3',
                        isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80'
                      )}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold text-slate-400">
                          {news.tag}
                        </span>
                        <p
                          className={cn(
                            'text-xs font-bold truncate mt-0.5',
                            isDark ? 'text-slate-100' : 'text-slate-800'
                          )}
                        >
                          {news.text}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0',
                          news.tone === 'up'
                            ? 'bg-[#F04452]/12 text-[#F04452]'
                            : news.tone === 'down'
                              ? 'bg-[#3182F6]/12 text-[#3182F6]'
                              : isDark
                                ? 'bg-white/8 text-slate-300'
                                : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {news.sector}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
                        노바전자
                      </span>
                      <span className="text-xs font-mono font-extrabold text-[var(--price-up)] tabular-nums">
                        82,000원 (+2.4%)
                      </span>
                    </div>
                    <svg viewBox="0 0 220 82" className="w-full h-24">
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points="6,66 36,58 68,61 102,42 138,47 174,26 212,18"
                      />
                      <polyline
                        fill="none"
                        stroke="#3182F6"
                        strokeWidth="1.6"
                        strokeDasharray="4 4"
                        points="6,68 36,63 68,60 102,52 138,48 174,38 212,30"
                      />
                    </svg>
                    <p className="text-[10px] font-semibold text-slate-400">
                      KRX 가격대 호가 단위(100원) · 수출형 종합 전자
                    </p>
                  </div>

                  {/* Compact Mock OrderBook */}
                  <div
                    className={cn(
                      'rounded-xl border p-3 space-y-1.5 font-mono text-[11px] tabular-nums',
                      isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80'
                    )}
                  >
                    <div className="text-[10px] font-sans font-bold text-slate-400 mb-1">
                      학습용 모의 호가창
                    </div>
                    {[
                      { price: '82,200', qty: '420', side: 'ask', width: '58%' },
                      { price: '82,100', qty: '680', side: 'ask', width: '82%' },
                      { price: '82,000', qty: '910', side: 'bid', width: '92%' },
                      { price: '81,900', qty: '540', side: 'bid', width: '64%' },
                    ].map((row) => (
                      <div key={row.price} className="relative flex items-center justify-between px-2 py-0.5 rounded overflow-hidden">
                        <div
                          className={cn(
                            'absolute inset-y-0 right-0 opacity-15',
                            row.side === 'ask' ? 'bg-[#3182F6]' : 'bg-[#F04452]'
                          )}
                          style={{ width: row.width }}
                        />
                        <span
                          className={cn(
                            'font-extrabold relative z-10',
                            row.side === 'ask' ? 'text-[#3182F6]' : 'text-[#F04452]'
                          )}
                        >
                          {row.price}
                        </span>
                        <span className="text-slate-400 font-semibold relative z-10">{row.qty}주</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-extrabold', isDark ? 'text-slate-200' : 'text-slate-800')}>
                      내 가상 포트폴리오 섹터 분산 현황
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-500 tabular-nums">
                      총 평가 ₩5,240,000 (+4.8%)
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full overflow-hidden flex gap-0.5">
                    <div className="h-full bg-[#F04452]" style={{ width: '34%' }} />
                    <div className="h-full bg-[#3182F6]" style={{ width: '26%' }} />
                    <div className="h-full bg-amber-500" style={{ width: '20%' }} />
                    <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                    {[
                      { label: '기술(Tech)', pct: '34%', dot: 'bg-[#F04452]' },
                      { label: '식품(Food)', pct: '26%', dot: 'bg-[#3182F6]' },
                      { label: '금융(Finance)', pct: '20%', dot: 'bg-amber-500' },
                      { label: '현금 비중', pct: '20%', dot: 'bg-emerald-500' },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className={cn(
                          'rounded-lg border px-2.5 py-2 flex items-center justify-between',
                          isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80'
                        )}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className={cn('w-2 h-2 rounded-full shrink-0', s.dot)} />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{s.label}</span>
                        </span>
                        <span className="font-mono tabular-nums text-slate-400">{s.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[var(--price-up)]">
                      DAY 4 결산 · 어제 뉴스 스탁 쌤 해설
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded',
                        isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-200/70 text-slate-700'
                      )}
                    >
                      실제 변동 요인 공개
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div
                      className={cn(
                        'rounded-xl border p-3 space-y-1',
                        isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-black', isDark ? 'text-white' : 'text-slate-900')}>
                          뉴로세미
                        </span>
                        <span className="text-xs font-mono font-black text-[var(--price-up)] tabular-nums">
                          +5.6%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        AI 메모리 주문 확대 호재 반영(+4.8%) + 시장 매수세 유입(+0.8%)
                      </p>
                    </div>
                    <div
                      className={cn(
                        'rounded-xl border p-3 space-y-1',
                        isDark ? 'bg-[#1A1F30] border-[#2B334A]' : 'bg-white border-slate-200/80'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-black', isDark ? 'text-white' : 'text-slate-900')}>
                          하베스트푸드
                        </span>
                        <span className="text-xs font-mono font-black text-[var(--price-down)] tabular-nums">
                          -2.8%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        환율 상승에 따른 수입 원재료 단가 부담이 단기 수익성 우려로 반영
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Highlights */}
            <div className="flex flex-wrap gap-2">
              {current.highlights.map((h) => (
                <span
                  key={h}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border',
                    isDark
                      ? 'bg-[#141826] border-[#2B334A] text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
