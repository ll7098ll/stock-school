import { useGameStore } from '../../stores/gameStore';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, TrendingUp, Target, Building, BookOpen, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  stockId: string;
}

export default function CompanyInfoPanel({ stockId }: Props) {
  const { stocks, level } = useGameStore();
  const stock = stocks[stockId];

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs p-6 text-center">
        <Building className="w-8 h-8 mb-2 opacity-35 text-[var(--color-accent-gold)]" />
        <p className="font-bold">선택된 종목이 없습니다.</p>
      </div>
    );
  }

  const levelNames = {
    elementary: '초등학생 맞춤 설명',
    middle: '중학생 맞춤 설명',
    high: '고등학생 맞춤 설명',
  };

  const levelBadges = {
    elementary: '초급 (기초)',
    middle: '중급 (이해)',
    high: '고급 (분석)',
  };

  const exposureLabels = {
    export: { label: '수출 주도형', hint: '환율 상승(원화 약세) 시 유리한 경향' },
    domestic: { label: '내수 중심형', hint: '국내 경기·금리·수입 원가에 민감' },
    mixed: { label: '수출·내수 혼합', hint: '국내외 업황에 복합 영향' },
  } as const;

  const exposureInfo = exposureLabels[stock.exposure ?? 'mixed'];

  const getVolatilityInfo = (vol: number) => {
    if (vol >= 1.5)
      return {
        label: '매우 높음',
        desc: '주가 등락폭이 매우 커서 높은 수익 또는 큰 손실이 발생할 수 있습니다.',
        color: 'text-[var(--color-price-up)] bg-[var(--color-price-up)]/10 border-[var(--color-price-up)]/20',
      };
    if (vol >= 1.1)
      return {
        label: '높음',
        desc: '시장 평균보다 가격 변동이 크므로 뉴스와 비중 조절에 유의하세요.',
        color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      };
    if (vol >= 0.8)
      return {
        label: '보통',
        desc: '주가 변동이 평균적인 수준이며 비교적 균형 잡힌 움직임을 보입니다.',
        color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      };
    return {
      label: '낮음',
      desc: '주가 움직임이 차분하고 안정적이어서 자산 방어 학습에 적합합니다.',
      color: 'text-[var(--color-price-down)] bg-[var(--color-price-down)]/10 border-[var(--color-price-down)]/20',
    };
  };

  const volInfo = getVolatilityInfo(stock.volatility);

  return (
    <div className="flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-extrabold text-lg text-foreground tracking-tight">{stock.name}</h2>
            <span className="inline-flex items-center text-[10px] px-2 py-0 h-5 font-bold rounded border bg-black/[0.03] dark:bg-white/[0.03] text-muted-foreground border-[var(--color-hts-border)]">
              {stock.sector}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
            Virtual Enterprise Educational Overview
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center text-[10px] px-2 py-0.5 font-bold border rounded shrink-0',
            level === 'elementary'
              ? 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
              : level === 'middle'
                ? 'bg-slate-700/10 text-slate-700 dark:text-slate-300 border-slate-700/20'
                : 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/20'
          )}
        >
          {levelBadges[level]}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3.5">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Target className="w-3 h-3 text-[var(--color-accent-gold)]" />
                <span>기준 주가</span>
              </div>
              <div className="font-extrabold text-foreground text-sm mt-1 tabular-nums">
                {stock.basePrice?.toLocaleString() || stock.currentPrice?.toLocaleString()}
                <span className="text-[10px] text-muted-foreground font-bold ml-0.5">원</span>
              </div>
            </div>

            <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-[var(--color-accent-gold)]" />
                <span>변동성 수준</span>
              </div>
              <div className="font-extrabold text-foreground text-sm mt-1 flex items-center gap-1">
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-black',
                    volInfo.color.split(' ')[0],
                    volInfo.color.split(' ')[1]
                  )}
                >
                  {volInfo.label}
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums font-bold">
                  ({stock.volatility.toFixed(1)}x)
                </span>
              </div>
            </div>

            <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Building className="w-3 h-3 text-[var(--color-accent-gold)]" />
                <span>소속 섹터</span>
              </div>
              <div className="font-extrabold text-foreground text-xs mt-1 truncate">{stock.sector}</div>
            </div>

            <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-[var(--color-accent-gold)]" />
                <span>사업 구조</span>
              </div>
              <div className="font-extrabold text-foreground text-xs mt-1 truncate">
                {exposureInfo.label}
              </div>
              <div className="text-[9px] text-muted-foreground font-medium mt-0.5 leading-snug">
                {exposureInfo.hint}
              </div>
            </div>
          </div>

          {/* Detailed level-appropriate explanation */}
          <Card className="border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/20 shadow-none rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.01] flex flex-row items-center gap-2 space-y-0">
              <BookOpen className="w-4 h-4 text-[var(--color-accent-gold)]" />
              <CardTitle className="text-xs font-black text-foreground">{levelNames[level]}</CardTitle>
            </CardHeader>
            <CardContent className="py-4 px-4">
              <p className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                {stock.descriptions?.[level] || '종목 설명 정보를 불러오고 있습니다.'}
              </p>
            </CardContent>
          </Card>

          {/* Investment Caution Panel */}
          <div className={cn('p-3.5 border rounded-xl flex items-start gap-3', volInfo.color)}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black">변동성 및 분산투자 학습 안내</h4>
              <p className="text-[11px] leading-relaxed opacity-85 mt-0.5 font-medium">
                {volInfo.desc} 한 종목에 모든 가상 자금을 넣기보다 여러 산업에 나누어 분산투자해 보세요.
              </p>
            </div>
          </div>

          {/* Educational Disclaimer */}
          <p className="text-[10px] text-muted-foreground/75 font-semibold text-center leading-relaxed pt-1">
            ※ 본 기업과 주가는 금융 교육을 위해 창작된 가상 데이터이며, 실제 투자 권유가 아닙니다.
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
