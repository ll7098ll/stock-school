import { BookOpenCheck, Building2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConceptSlideProps {
  isDark: boolean;
  isVisible: boolean;
}

const KEY_METRICS = [
  { value: '34', unit: '개사', label: '100% 창작 가상 상장 기업' },
  { value: '17', unit: '섹터', label: '기술·금융·식품 등 전 산업군' },
  { value: '588', unit: '건', label: '난이도별 균형 배치 가상 뉴스' },
  { value: '₩0', unit: '', label: '실제 금전 거래 및 손실 위험' },
];

const CORE_PILLARS = [
  {
    num: '01',
    icon: Building2,
    title: '상표권·편향 없는 가상 경제 세계',
    description:
      '실존 기업을 쓰지 않고 17개 산업마다 특성이 다른 2개 가상 기업(수출형·내수형, 안정형·고변동형)을 배치해 오직 경제 원리에만 집중할 수 있습니다.',
    accent: 'text-[#F04452]',
  },
  {
    num: '02',
    icon: BookOpenCheck,
    title: '찍기가 아닌 인과관계 중심 학습',
    description:
      '매일 배달되는 경제 기사를 읽고 스스로 매매 판단을 내린 뒤, 다음 날 ‘스탁 쌤’의 결과 해설로 주가 변동의 이유를 투명하게 복기합니다.',
    accent: 'text-[#3182F6]',
  },
  {
    num: '03',
    icon: ShieldCheck,
    title: '수업 현장에 맞춘 안심 설계',
    description:
      '실명이나 이메일 없이 별명만으로 바로 입장하는 게스트 모드가 기본입니다. 초·중·고 교실 수업에서 개인정보 걱정 없이 즉시 활용할 수 있습니다.',
    accent: 'text-emerald-500',
  },
];

export default function ConceptSlide({ isDark, isVisible }: ConceptSlideProps) {
  return (
    <div className="w-full min-h-dvh flex items-center py-24 lg:py-20 px-5 sm:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-10 lg:space-y-12">
        {/* Editorial Header */}
        <div
          className={cn(
            'max-w-3xl space-y-4 slide-reveal',
            isVisible && 'slide-reveal-visible'
          )}
        >
          <p
            className={cn(
              'text-[11px] font-extrabold tracking-[0.18em] uppercase',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            02 · WHY STOCKSCHOOL
          </p>
          <h2
            className={cn(
              'text-3xl sm:text-4xl lg:text-[44px] font-black tracking-[-0.03em] leading-[1.15]',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            투자는 투기가 아니라,
            <br />
            세상을 읽는 문해력입니다.
          </h2>
          <p
            className={cn(
              'text-sm sm:text-base leading-relaxed font-medium max-w-2xl',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            스탁스쿨은 학생이 위험 없이 경제 뉴스와 기업 가치, 분산투자의 원리를 몸으로 익히도록
            설계된 비영리 교육용 금융 시뮬레이터입니다.
          </p>
        </div>

        {/* Key Metrics Bar */}
        <div
          className={cn(
            'grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 slide-reveal slide-delay-1',
            isVisible && 'slide-reveal-visible'
          )}
        >
          {KEY_METRICS.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'rounded-2xl border p-5 sm:p-6 transition-colors',
                isDark
                  ? 'bg-[#1A1F30]/80 border-[#2B334A]'
                  : 'bg-white border-slate-200/90 shadow-[0_6px_24px_rgba(15,23,42,0.03)]'
              )}
            >
              <div className="flex items-baseline gap-1 font-mono tabular-nums">
                <span
                  className={cn(
                    'text-3xl sm:text-4xl font-black tracking-tight',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="text-sm font-extrabold text-[var(--price-up)]">
                    {metric.unit}
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs font-semibold mt-2 leading-snug',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                {metric.label}
              </p>
            </div>
          ))}
        </div>

        {/* 3 Core Philosophy Pillars */}
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-3 gap-5 slide-reveal slide-delay-2',
            isVisible && 'slide-reveal-visible'
          )}
        >
          {CORE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article
                key={pillar.num}
                className={cn(
                  'rounded-2xl border p-6 flex flex-col justify-between gap-5 transition-all duration-200',
                  isDark
                    ? 'bg-[#1A1F30]/70 border-[#2B334A] hover:border-slate-500/70'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_8px_28px_rgba(15,23,42,0.04)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center border',
                      isDark
                        ? 'bg-[#12151F] border-[#2B334A]'
                        : 'bg-slate-50 border-slate-200/80'
                    )}
                  >
                    <Icon className={cn('w-5 h-5', pillar.accent)} />
                  </div>
                  <span
                    className={cn(
                      'font-mono text-xs font-black tracking-widest',
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    )}
                  >
                    {pillar.num}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3
                    className={cn(
                      'text-base sm:text-lg font-black tracking-tight',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className={cn(
                      'text-xs sm:text-[13px] leading-relaxed font-medium',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}
                  >
                    {pillar.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
