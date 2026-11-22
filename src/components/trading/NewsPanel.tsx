import { useGameStore } from '../../stores/gameStore';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { useState, useMemo } from 'react';
import {
  Newspaper,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  Sparkles,
  Layers,
  Zap,
  Scale,
  BookMarked,
  Flame,
  Lightbulb,
} from 'lucide-react';
import { getScaledImpact, isMixedNews } from '../../lib/priceEngine';
import { NEWS_TWIST_LABELS, SCENARIO_ARCS } from '../../lib/newsData';
import type { NewsCategory, NewsItem, SectorId } from '../../lib/types';
import ScenarioModal from './ScenarioModal';

function getCategoryLabel(category: NewsCategory): string {
  switch (category) {
    case 'macro':
      return '거시경제';
    case 'sector':
      return '산업/경제';
    case 'company':
      return '기업/종목';
    case 'social':
      return '사회/트렌드';
    case 'global':
    default:
      return '글로벌 변수';
  }
}

export default function NewsPanel() {
  const {
    currentNews,
    previousNews,
    level,
    tutorialStep,
    stocks,
    lastDayBreakdown,
    activeScenario,
    completedScenarioIds,
  } = useGameStore();
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [collapsedOnMobile, setCollapsedOnMobile] = useState(false);
  const [tab, setTab] = useState<'current' | 'previous'>('current');
  const [showScenarioModal, setShowScenarioModal] = useState(false);

  const completedCount = useMemo(
    () =>
      (completedScenarioIds ?? []).filter((id) =>
        SCENARIO_ARCS.some((arc) => arc.id === id)
      ).length,
    [completedScenarioIds]
  );

  const news = tab === 'current' ? currentNews : previousNews;
  const selectedNews = news.find((item) => item.id === selectedNewsId) || news[0];
  const activeNewsId = collapsedOnMobile ? null : (selectedNews?.id ?? null);

  const getSentimentBadge = (item: NewsItem) => {
    if (isMixedNews(item)) {
      return {
        label: '섹터 혼조 (수혜/피해 공존)',
        icon: <Scale className="w-4 h-4 text-amber-500" />,
        border: 'border-l-amber-500',
        pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      };
    }
    if (item.sentiment >= 2) {
      return {
        label: '강한 호재',
        icon: <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />,
        border: 'border-l-[var(--color-price-up)]',
        pill: 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/20',
      };
    }
    if (item.sentiment === 1) {
      return {
        label: '호재',
        icon: <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />,
        border: 'border-l-[var(--color-price-up)]/60',
        pill: 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/20',
      };
    }
    if (item.sentiment <= -2) {
      return {
        label: '강한 악재',
        icon: <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />,
        border: 'border-l-[var(--color-price-down)]',
        pill: 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/20',
      };
    }
    if (item.sentiment === -1) {
      return {
        label: '악재',
        icon: <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />,
        border: 'border-l-[var(--color-price-down)]/60',
        pill: 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/20',
      };
    }
    return {
      label: '중립',
      icon: <Minus className="w-4 h-4 text-[var(--color-price-flat)]" />,
      border: 'border-l-[var(--color-price-flat)]/60',
      pill: 'bg-[var(--color-price-flat)]/10 text-[var(--color-price-flat)] border-[var(--color-price-flat)]/20',
    };
  };

  /**
   * 어제 뉴스에 관련된 섹터 소속 종목들의 실제 전일 변동률 추출
   */
  const getAffectedStockResults = (item: NewsItem) => {
    const relatedSectorSet = new Set<SectorId>(item.relatedSectors);
    const overrideIds = new Set<string>(Object.keys(item.stockImpactOverrides ?? {}));

    return Object.values(stocks)
      .filter((s) => relatedSectorSet.has(s.sector) || overrideIds.has(s.id))
      .map((s) => {
        const bd = lastDayBreakdown[s.id];
        return {
          id: s.id,
          name: s.name,
          sector: s.sector,
          actualPct: bd ? bd.actualChangePct : 0,
          newsPct: bd ? bd.newsContribution : 0,
          shockReason: bd?.shockReason,
          hasBreakdown: Boolean(bd),
        };
      });
  };

  const renderImpactBlock = (item: NewsItem, compact = false) => {
    const affectedStocks = getAffectedStockResults(item);

    return (
      <div
        className={cn(
          'border border-[var(--color-hts-border)] space-y-3',
          compact
            ? 'bg-black/[0.02] dark:bg-black/35 rounded-lg p-3'
            : 'bg-[var(--color-hts-panel)] rounded-2xl p-5 space-y-4'
        )}
      >
        <div
          className={cn(
            'font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5',
            compact ? 'text-[9px]' : 'text-xs'
          )}
        >
          <Layers className={cn('text-[var(--color-accent-gold)]', compact ? 'w-3 h-3' : 'w-4 h-4')} />
          뉴스 반영 강도 & 실제 주가 변화
        </div>

        {/* 1. Scaled Sector News Impacts (matches engine's newsScale!) */}
        <div className={cn(compact ? 'space-y-1.5' : 'space-y-2.5')}>
          {(Object.entries(item.sectorImpact) as [SectorId, number][]).map(([sector, rawImpact]) => {
            const appliedImpact = getScaledImpact(rawImpact, level);
            return (
              <div
                key={sector}
                className={cn('flex items-center gap-2', compact ? 'text-[10px]' : 'text-xs')}
              >
                <span className={cn('text-muted-foreground truncate font-bold', compact ? 'w-16' : 'w-24')}>
                  {sector.split('(')[0]}
                </span>
                <div className="flex-1 h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded-full absolute right-1/2 left-auto',
                      appliedImpact > 0
                        ? 'bg-[var(--color-price-up)] left-1/2 right-auto'
                        : 'bg-[var(--color-price-down)]'
                    )}
                    style={{ width: `${Math.min(50, Math.abs(appliedImpact) * 500)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'w-14 text-right font-black tabular-nums',
                    appliedImpact > 0
                      ? 'text-[var(--color-price-up)]'
                      : appliedImpact < 0
                        ? 'text-[var(--color-price-down)]'
                        : 'text-muted-foreground'
                  )}
                >
                  {appliedImpact > 0 ? '+' : ''}
                  {(appliedImpact * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* 2. Stock-specific overrides (e.g. export vs domestic FX sensitivity) */}
        {item.stockImpactOverrides && Object.keys(item.stockImpactOverrides).length > 0 && (
          <div className="pt-2 border-t border-[var(--color-hts-border)]/50 space-y-1">
            <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
              기업 특성별 차별화 반영 (수출형 vs 내수형)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(item.stockImpactOverrides).map(([stockId, raw]) => {
                const st = stocks[stockId];
                if (!st) return null;
                const scaled = getScaledImpact(raw, level);
                return (
                  <span
                    key={stockId}
                    className={cn(
                      'text-[10px] font-extrabold px-2 py-0.5 rounded-md border tabular-nums',
                      scaled > 0
                        ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/20'
                        : 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/20'
                    )}
                  >
                    {st.name} {scaled > 0 ? '+' : ''}
                    {(scaled * 100).toFixed(1)}%
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Actual Observed Stock Moves (News + Market Noise + Shock Transparency) */}
        {affectedStocks.some((s) => s.hasBreakdown) && (
          <div className="pt-2.5 border-t border-[var(--color-hts-border)]/50 space-y-1.5">
            <div className="text-[10px] font-extrabold text-muted-foreground">
              관련 종목 실제 전일 등락 결과 (시장 변동 포함)
            </div>
            <div className="space-y-1">
              {affectedStocks.map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-foreground truncate">{st.name}</span>
                    {st.shockReason && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0"
                        title={st.shockReason}
                      >
                        <Zap className="w-2.5 h-2.5" />
                        {st.shockReason}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'font-black tabular-nums shrink-0',
                      st.actualPct > 0
                        ? 'text-[var(--color-price-up)]'
                        : st.actualPct < 0
                          ? 'text-[var(--color-price-down)]'
                          : 'text-muted-foreground'
                    )}
                  >
                    {st.actualPct > 0 ? '+' : ''}
                    {(st.actualPct * 100).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScenarioProgressDots = (step: number, total: number) => (
    <div className="inline-flex items-center gap-1 ml-1">
      {Array.from({ length: total }, (_, idx) => {
        const dotStep = idx + 1;
        return (
          <span
            key={dotStep}
            className={cn(
              'h-1.5 rounded-full transition-all',
              dotStep === step
                ? 'w-3.5 bg-amber-500'
                : dotStep < step
                  ? 'w-1.5 bg-amber-500/55'
                  : 'w-1.5 bg-black/15 dark:bg-white/15'
            )}
          />
        );
      })}
    </div>
  );

  return (
    <>
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden transition-all duration-300',
        tutorialStep === 1 && 'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 1 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">👉</span> 1단계: 오늘의 가상 경제 뉴스를 읽고 내일 주가가 움직일 산업의 힌트를 찾아보세요!
          </span>
          <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">
            분석 시작
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between gap-2 flex-wrap bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2.5">
          <Newspaper className="w-4 h-4 text-[var(--color-accent-gold)] animate-pulse" />
          <span className="font-extrabold text-sm text-foreground tracking-tight">가상 경제 뉴스룸</span>
          <button
            onClick={() => setShowScenarioModal(true)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer',
              activeScenario
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/35 hover:bg-amber-500/25'
                : 'bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground border-[var(--color-hts-border)] hover:text-foreground hover:border-amber-500/40'
            )}
            title="테마 시나리오 도감 열기"
          >
            <BookMarked className="w-3 h-3" />
            <span>
              시나리오 도감 ({completedCount}/{SCENARIO_ARCS.length})
            </span>
          </button>
        </div>
        <div className="flex gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-full border border-[var(--color-hts-border)]">
          <button
            onClick={() => setTab('current')}
            className={cn(
              'px-3.5 py-1 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer',
              tab === 'current'
                ? 'bg-slate-900 dark:bg-slate-950 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            오늘의 뉴스
          </button>
          <button
            onClick={() => setTab('previous')}
            className={cn(
              'px-3.5 py-1 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer',
              tab === 'previous'
                ? 'bg-slate-900 dark:bg-slate-950 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            어제 뉴스 해설
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {news.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
          <AlertCircle className="w-10 h-10 mb-2 opacity-30 text-[var(--color-accent-gold)]" />
          <p className="text-xs font-bold text-foreground/70">
            {tab === 'current' ? '오늘 발행된 가상 뉴스가 아직 없습니다.' : '어제 발행된 뉴스 기록이 아직 없습니다.'}
          </p>
          <p className="text-[10px] opacity-60 mt-1">
            '다음 날 진행' 버튼을 누르면 오늘 뉴스의 해설과 실제 변동 결과를 확인할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: News Headline List */}
          <div className="w-full lg:w-[365px] shrink-0 border-r border-[var(--color-hts-border)] flex flex-col bg-black/[0.01] dark:bg-black/10">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {news.map((item) => {
                  const isSelected = activeNewsId === item.id;
                  const isScenario = Boolean(item.scenarioId);
                  const badge = getSentimentBadge(item);
                  const sentimentBorder =
                    tab === 'previous'
                      ? badge.border
                      : isScenario
                        ? 'border-l-amber-500'
                        : 'border-l-[var(--color-hts-border)]';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setCollapsedOnMobile(true);
                        } else {
                          setCollapsedOnMobile(false);
                          setSelectedNewsId(item.id);
                        }
                      }}
                      className={cn(
                        'w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer border-l-[4px] flex flex-col gap-2 relative',
                        sentimentBorder,
                        isSelected
                          ? 'bg-[var(--color-hts-hover)] border-[var(--color-hts-border)] border-l-[var(--color-accent-gold)] dark:border-l-[var(--color-accent-gold)] shadow-sm'
                          : 'bg-black/[0.02] dark:bg-black/25 border-[var(--color-hts-border)] hover:bg-black/[0.04] dark:hover:bg-black/35'
                      )}
                    >
                      {isScenario && item.scenarioStep && item.scenarioTotalSteps && (
                        <div className="flex items-center justify-between gap-2 w-full">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[9px] font-black">
                            <Flame className="w-2.5 h-2.5" />
                            연속 시나리오 · {item.scenarioStep}/{item.scenarioTotalSteps}일차
                          </span>
                          {renderScenarioProgressDots(item.scenarioStep, item.scenarioTotalSteps)}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2.5 w-full">
                        <span
                          className={cn(
                            'text-xs leading-snug text-foreground/90 line-clamp-2',
                            isSelected ? 'font-extrabold' : 'font-bold'
                          )}
                        >
                          {item.title}
                        </span>
                        {tab === 'previous' && <span className="shrink-0 pt-0.5">{badge.icon}</span>}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold text-muted-foreground">
                        {tab === 'previous' && (
                          <span className={cn('px-1.5 py-0.5 rounded border', badge.pill)}>{badge.label}</span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04]">
                          {getCategoryLabel(item.category)}
                        </span>
                        {tab === 'previous' && item.twistType && item.twistType !== 'direct' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/12 text-amber-700 dark:text-amber-400">
                            {NEWS_TWIST_LABELS[item.twistType]}
                          </span>
                        )}
                        {isScenario && item.scenarioTitle && (
                          <span className="truncate max-w-[155px] opacity-75">
                            {item.scenarioTitle}
                          </span>
                        )}
                      </div>

                      {/* Inline Details (Visible on Mobile/Tablet only) */}
                      {isSelected && (
                        <div className="block lg:hidden mt-3 pt-3 border-t border-[var(--color-hts-border)]/50 space-y-3 w-full">
                          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                            {item.content}
                          </p>

                          {tab === 'previous' ? (
                            <div className="space-y-3">
                              {renderImpactBlock(item, true)}

                              <div className="bg-gradient-to-br from-black/[0.01] to-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 rounded-lg p-3 space-y-2">
                                <div className="text-[9px] font-black text-[var(--color-accent-gold)] flex items-center gap-1 uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3 text-[var(--color-accent-gold)]" />
                                  스탁 쌤 경제 해설 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                                </div>
                                <p className="text-[11px] leading-relaxed text-foreground/80 font-bold whitespace-pre-wrap">
                                  {item.explanations[level]}
                                </p>
                                {item.readingHint?.[level] && (
                                  <div className="pt-2 border-t border-[var(--color-accent-gold)]/15 flex items-start gap-1.5 text-[10px] text-foreground/75 font-semibold">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span>{item.readingHint[level]}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center text-muted-foreground/90 font-bold text-[10px] gap-1">
                                <Lock className="w-3 h-3 text-[var(--color-accent-gold)]" />
                                스탁 쌤 경제 해설 (다음 날 공개)
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT: Article Detail Viewer (PC Only) */}
          <div className="hidden lg:flex flex-1 flex-col bg-black/[0.01] dark:bg-black/5 overflow-hidden">
            {selectedNews ? (
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-3xl mx-auto space-y-6">
                  {selectedNews.scenarioId &&
                    selectedNews.scenarioStep &&
                    selectedNews.scenarioTotalSteps && (
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                        <div className="flex items-center gap-2 min-w-0">
                          <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                          <div className="text-xs font-black text-foreground truncate">
                            연속 시나리오: {selectedNews.scenarioTitle}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-black text-amber-700 dark:text-amber-400 tabular-nums">
                            {selectedNews.scenarioStep} / {selectedNews.scenarioTotalSteps}일차
                          </span>
                          {renderScenarioProgressDots(
                            selectedNews.scenarioStep,
                            selectedNews.scenarioTotalSteps
                          )}
                        </div>
                      </div>
                    )}

                  <div className="space-y-3 border-b border-[var(--color-hts-border)]/50 pb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] text-[10px] font-extrabold border border-[var(--color-accent-gold)]/20 uppercase tracking-wider">
                        {getCategoryLabel(selectedNews.category)}
                      </span>
                      {tab === 'previous' && (() => {
                        const badge = getSentimentBadge(selectedNews);
                        return (
                          <span className={cn('px-2.5 py-0.5 rounded text-[10px] font-extrabold border', badge.pill)}>
                            {badge.label}
                          </span>
                        );
                      })()}
                      {tab === 'previous' &&
                        selectedNews.twistType &&
                        selectedNews.twistType !== 'direct' && (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                            {NEWS_TWIST_LABELS[selectedNews.twistType]}
                          </span>
                        )}
                      <span className="text-[10px] font-semibold text-muted-foreground ml-auto">
                        교육용 가상 뉴스 시나리오
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground leading-snug tracking-tight">
                      {selectedNews.title}
                    </h3>
                  </div>

                  {/* Article Content */}
                  <div className="bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl p-6 shadow-sm space-y-3">
                    <p className="text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                      {selectedNews.content}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 font-semibold pt-2 border-t border-[var(--color-hts-border)]/40">
                      ※ 본 기사는 금융 교육을 위해 창작된 가상의 시나리오이며, 실제 사건이나 투자 권유가 아닙니다.
                    </p>
                  </div>

                  {/* Analysis details */}
                  {tab === 'previous' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {renderImpactBlock(selectedNews, false)}

                      <div className="bg-gradient-to-br from-[var(--color-hts-panel)] to-[var(--color-accent-gold)]/[0.02] border border-[var(--color-accent-gold)]/20 rounded-2xl p-5 space-y-4">
                        <div className="space-y-3">
                          <div className="text-xs font-black text-[var(--color-accent-gold)] flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
                            스탁 쌤 경제 해설 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                          </div>
                          <p className="text-xs md:text-sm leading-relaxed text-foreground/85 font-bold whitespace-pre-wrap">
                            {selectedNews.explanations[level]}
                          </p>
                        </div>

                        {selectedNews.readingHint?.[level] && (
                          <div className="pt-3.5 border-t border-[var(--color-hts-border)]/60 space-y-1.5">
                            <div className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5" />
                              핵심 독해 포인트
                            </div>
                            <p className="text-xs leading-relaxed text-foreground/80 font-semibold">
                              {selectedNews.readingHint[level]}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-2xl p-6 text-center">
                      <div className="flex items-center justify-center mb-1.5 text-muted-foreground/90 font-bold text-sm gap-2">
                        <Lock className="w-4 h-4 text-[var(--color-accent-gold)] animate-pulse" />
                        스탁 쌤 학습 해설 비공개 (당일 열람 제한)
                      </div>
                      <div className="text-xs text-muted-foreground/60 leading-relaxed font-semibold mt-1">
                        기사를 스스로 분석해 투자 판단을 내린 뒤 <span className="text-[var(--color-accent-gold)] font-bold">다음 날</span>로 진행하면, 실제 뉴스 반영 강도와 종목별 변동 결과 및 상세 해설이 공개됩니다.
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                <Newspaper className="w-12 h-12 mb-3 opacity-20 text-[var(--color-accent-gold)]" />
                <p className="text-sm font-bold text-foreground/70">선택된 뉴스가 없습니다.</p>
                <p className="text-xs opacity-60 mt-1">좌측 리스트에서 기사를 선택해 주세요.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    <ScenarioModal
      open={showScenarioModal}
      onOpenChange={setShowScenarioModal}
      onScenarioStarted={() => setTab('current')}
    />
    </>
  );
}
