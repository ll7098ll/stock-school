import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
  type NewsPrediction,
} from '../../stores/gameStore';
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
  CheckCircle2,
  ArrowRight,
  Compass,
  XCircle,
  BookOpen,
  Quote,
  BarChart3,
  Brain,
} from 'lucide-react';
import {
  evaluateSectorGuesses,
  getActualNewsDirection,
  getScaledImpact,
  isMixedNews,
} from '../../lib/priceEngine';
import {
  NEWS_FORMAT_LABELS,
  NEWS_TWIST_LABELS,
  SCENARIO_ARCS,
} from '../../lib/newsData';
import { GLOSSARY_BY_ID, type GlossaryItem } from '../../lib/glossaryData';
import {
  ALL_SECTORS,
  type Level,
  type NewsArticleFormat,
  type NewsCategory,
  type NewsItem,
  type SectorId,
} from '../../lib/types';
import ScenarioModal from './ScenarioModal';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';

interface NewsPanelProps {
  activeTab?: 'current' | 'previous';
  onTabChange?: (tab: 'current' | 'previous') => void;
  onGoToTrading?: (sector?: SectorId) => void;
}

const PREDICTION_OPTIONS: {
  id: NewsPrediction;
  label: string;
  sub: string;
  activeCls: string;
}[] = [
  {
    id: 'bullish',
    label: '호재 📈',
    sub: '주가 상승 예상',
    activeCls:
      'bg-[var(--color-price-up)] text-white border-[var(--color-price-up)] shadow-sm',
  },
  {
    id: 'mixed',
    label: '혼조 · 중립 ⚖️',
    sub: '수혜/피해 공존',
    activeCls:
      'bg-amber-500 text-slate-950 border-amber-500 shadow-sm',
  },
  {
    id: 'bearish',
    label: '악재 📉',
    sub: '주가 하락 예상',
    activeCls:
      'bg-[var(--color-price-down)] text-white border-[var(--color-price-down)] shadow-sm',
  },
];

const PREDICTION_SHORT_LABEL: Record<NewsPrediction, string> = {
  bullish: '호재 📈',
  mixed: '혼조 ⚖️',
  bearish: '악재 📉',
};

const FORMAT_STYLE: Record<NewsArticleFormat, { icon: string; cls: string }> = {
  breaking: {
    icon: '⚡',
    cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
  earnings: {
    icon: '📊',
    cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25',
  },
  interview: {
    icon: '🎙️',
    cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25',
  },
  rival: {
    icon: '⚖️',
    cls: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/30',
  },
  policy: {
    icon: '🏛️',
    cls: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
  },
  trend: {
    icon: '💬',
    cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 초급은 6개 보기(실제 산업 + 결정적 오답 보기, 가나다순 정렬로 위치 스포일러 차단),
 * 중·고급은 17개 전체 산업군에서 학생이 직접 추론
 */
function getSectorChoicesForArticle(item: NewsItem, level: Level): SectorId[] {
  if (level !== 'elementary') {
    return [...ALL_SECTORS];
  }
  const picked = new Set<SectorId>(item.relatedSectors);
  const seed = hashString(item.id);
  const pool = ALL_SECTORS.filter((s) => !picked.has(s));
  let idx = seed % pool.length;
  const targetCount = Math.max(6, picked.size + 3);
  while (picked.size < Math.min(targetCount, ALL_SECTORS.length) && pool.length > 0) {
    picked.add(pool[idx % pool.length]);
    idx += 5;
  }
  return ALL_SECTORS.filter((s) => picked.has(s));
}

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

export default function NewsPanel({
  activeTab,
  onTabChange,
  onGoToTrading,
}: NewsPanelProps) {
  const {
    dayCount,
    currentNews,
    previousNews,
    level,
    tutorialStep,
    stocks,
    lastDayBreakdown,
    activeScenario,
    completedScenarioIds,
    todayNewsChecks,
    previousNewsChecks,
    todayNewsSectorGuesses,
    previousNewsSectorGuesses,
    markNewsChecked,
    toggleNewsSectorGuess,
  } = useGameStore();

  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [collapsedOnMobile, setCollapsedOnMobile] = useState(false);
  const [internalTab, setInternalTab] = useState<'current' | 'previous'>('current');
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<GlossaryItem | null>(null);

  const tab = activeTab ?? internalTab;
  const setTab = (next: 'current' | 'previous') => {
    setInternalTab(next);
    onTabChange?.(next);
  };

  const completedCount = useMemo(
    () =>
      (completedScenarioIds ?? []).filter((id) =>
        SCENARIO_ARCS.some((arc) => arc.id === id)
      ).length,
    [completedScenarioIds]
  );

  const checkedTodayCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const allTodayChecked = isTodayNewsComplete(currentNews, todayNewsChecks);

  const news = tab === 'current' ? currentNews : previousNews;
  const selectedNews = news.find((item) => item.id === selectedNewsId) || news[0];
  const activeNewsId = collapsedOnMobile ? null : (selectedNews?.id ?? null);

  const nextUncheckedNews = useMemo(
    () => currentNews.find((item) => !todayNewsChecks[item.id] && item.id !== selectedNews?.id),
    [currentNews, todayNewsChecks, selectedNews?.id]
  );

  const handlePredict = (item: NewsItem, pred: NewsPrediction) => {
    const guesses = todayNewsSectorGuesses[item.id] ?? [];
    if (guesses.length === 0) {
      toast.info('먼저 1단계에서 이 뉴스가 영향을 줄 산업을 1개 이상 직접 골라보세요! 🧠');
      return;
    }

    const wasAllComplete = isTodayNewsComplete(currentNews, todayNewsChecks);
    markNewsChecked(item.id, pred);

    const nextChecks = { ...todayNewsChecks, [item.id]: pred };
    const nowAllComplete = isTodayNewsComplete(currentNews, nextChecks);

    if (!wasAllComplete && nowAllComplete) {
      toast.success('오늘의 뉴스 추론 완료! 이제 모의투자 교실에서 직접 기업을 찾아 투자해 보세요. 🎉');
    }
  };

  const getSentimentBadge = (item: NewsItem) => {
    if (isMixedNews(item)) {
      return {
        label: '섹터 혼조 (수혜/피해 공존)',
        icon: <Scale className="w-4 h-4 text-amber-500" />,
        border: 'border-l-amber-500',
        pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
      };
    }
    if (item.sentiment >= 2) {
      return {
        label: '강한 호재',
        icon: <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />,
        border: 'border-l-[var(--color-price-up)]',
        pill: 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/25',
      };
    }
    if (item.sentiment === 1) {
      return {
        label: '호재',
        icon: <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />,
        border: 'border-l-[var(--color-price-up)]/60',
        pill: 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/25',
      };
    }
    if (item.sentiment <= -2) {
      return {
        label: '강한 악재',
        icon: <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />,
        border: 'border-l-[var(--color-price-down)]',
        pill: 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/25',
      };
    }
    if (item.sentiment === -1) {
      return {
        label: '악재',
        icon: <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />,
        border: 'border-l-[var(--color-price-down)]/60',
        pill: 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/25',
      };
    }
    return {
      label: '중립',
      icon: <Minus className="w-4 h-4 text-[var(--color-price-flat)]" />,
      border: 'border-l-[var(--color-price-flat)]/60',
      pill: 'bg-[var(--color-price-flat)]/10 text-[var(--color-price-flat)] border-[var(--color-price-flat)]/25',
    };
  };

  /**
   * 어제 뉴스에 관련된 섹터 소속 종목들의 실제 전일 변동률 추출 (어제 복기 탭 전용)
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

  const renderArticleExtras = (item: NewsItem, compact = false) => {
    const glossaryItems = (item.relatedGlossaryIds ?? [])
      .map((id) => GLOSSARY_BY_ID[id])
      .filter((g): g is GlossaryItem => Boolean(g));

    if (!item.keyMetrics?.length && !item.quote && glossaryItems.length === 0) {
      return null;
    }

    return (
      <div className={cn('space-y-3', compact ? 'pt-1' : 'pt-2')}>
        {/* Key Metrics Snapshot (Pure facts, zero direction/sector spoiler) */}
        {item.keyMetrics && item.keyMetrics.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-black text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
              기사 핵심 수치 체크
            </div>
            <div
              className={cn(
                'grid gap-2',
                item.keyMetrics.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              )}
            >
              {item.keyMetrics.map((m, i) => (
                <div
                  key={`${m.label}-${i}`}
                  className="rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/30 px-3 py-2"
                >
                  <div className="text-[11px] font-bold text-muted-foreground truncate">
                    {m.label}
                  </div>
                  <div className="text-sm font-black text-foreground tabular-nums mt-0.5">
                    {m.value}
                  </div>
                  {m.note && (
                    <div className="text-[10px] font-semibold text-muted-foreground/85 mt-0.5 truncate">
                      {m.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Field / Expert Quote */}
        {item.quote && (
          <blockquote className="rounded-xl border-l-[3px] border-[var(--color-accent-gold)] bg-black/[0.02] dark:bg-white/[0.03] px-3.5 py-2.5 space-y-1">
            <div className="flex items-start gap-2">
              <Quote className="w-3.5 h-3.5 text-[var(--color-accent-gold)] shrink-0 mt-1" />
              <p className="text-[13px] font-semibold text-foreground/90 leading-relaxed">
                “{item.quote.text}”
              </p>
            </div>
            <footer className="text-[11px] font-bold text-muted-foreground pl-5">
              — {item.quote.speaker}
            </footer>
          </blockquote>
        )}

        {/* Related Glossary Concept Chips (Pure concept explanations, non-spoiler) */}
        {glossaryItems.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] font-extrabold text-muted-foreground inline-flex items-center gap-1 mr-0.5">
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
              경제 용어:
            </span>
            {glossaryItems.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGlossaryTerm(g);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[var(--color-accent-gold)]/10 text-amber-800 dark:text-amber-300 border border-[var(--color-accent-gold)]/25 hover:bg-[var(--color-accent-gold)]/20 transition-colors cursor-pointer"
              >
                {g.term.split(' (')[0]}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPredictionCard = (item: NewsItem, compact = false) => {
    const chosen = todayNewsChecks[item.id];
    const mySectors = todayNewsSectorGuesses[item.id] ?? [];
    const sectorChoices = getSectorChoicesForArticle(item, level);

    return (
      <div
        className={cn(
          'rounded-2xl border-2 transition-all space-y-4',
          chosen
            ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
            : 'border-amber-500/45 bg-amber-500/[0.05]',
          compact ? 'p-3.5' : 'p-5'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Brain className={cn('w-4 h-4 shrink-0', chosen ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')} />
            <span className={cn('font-black text-foreground', compact ? 'text-[13px]' : 'text-[15px]')}>
              {chosen ? '내 경제 문해력 추론 기록 완료!' : '스스로 추론하기: 기사를 읽고 영향 산업과 방향을 예상해 보세요'}
            </span>
          </div>
          {chosen && (
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              내일 실제 영향 산업·주가와 비교해 드려요
            </span>
          )}
        </div>

        {/* STEP 1: Infer affected sectors (1~3) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground/90">
              1단계. 어떤 산업(업종)이 가장 큰 영향을 받을까요?{' '}
              <span className="text-muted-foreground font-bold">
                (1~3개 직접 선택 · {mySectors.length}/3)
              </span>
            </span>
            {level === 'elementary' && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                초급 보기 6개 중 선택
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sectorChoices.map((sec) => {
              const isPicked = mySectors.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNewsSectorGuess(item.id, sec);
                  }}
                  className={cn(
                    'px-2.5 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer',
                    isPicked
                      ? 'bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 border-transparent shadow-sm'
                      : 'bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] text-foreground/85 hover:border-foreground/40 hover:bg-[var(--color-hts-hover)]'
                  )}
                >
                  {isPicked ? '✓ ' : ''}
                  {sec.split('(')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: Predict direction */}
        <div className="space-y-2 pt-1 border-t border-[var(--color-hts-border)]/40">
          <div className="text-xs font-black text-foreground/90">
            2단계. 추론한 산업과 기업에 어떤 방향의 영향일까요?
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PREDICTION_OPTIONS.map((opt) => {
              const isActive = chosen === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePredict(item, opt.id);
                  }}
                  className={cn(
                    'rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5',
                    compact ? 'py-2.5 px-2' : 'py-3 px-3',
                    isActive
                      ? opt.activeCls
                      : 'bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] text-foreground hover:border-foreground/40 hover:bg-[var(--color-hts-hover)]'
                  )}
                >
                  <span className={cn('font-black', compact ? 'text-xs' : 'text-sm')}>
                    {opt.label}
                  </span>
                  <span
                    className={cn(
                      'text-[11px] font-semibold',
                      isActive ? 'opacity-90' : 'text-muted-foreground'
                    )}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Step Bridge (Zero spoiler — guides student to explore companies on their own!) */}
        {chosen && (
          <div className="pt-2.5 border-t border-[var(--color-hts-border)]/50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold text-muted-foreground">
              <span>내가 예상한 산업:</span>
              {mySectors.map((sec) => (
                <span
                  key={sec}
                  className="px-2 py-0.5 rounded-md bg-black/[0.05] dark:bg-white/[0.08] text-foreground font-extrabold"
                >
                  #{sec.split('(')[0]}
                </span>
              ))}
              <span className="hidden sm:inline opacity-80">
                — 모의투자 교실에서 기업 정보를 직접 확인해 보세요!
              </span>
            </div>

            {!allTodayChecked && nextUncheckedNews && !compact && (
              <Button
                type="button"
                size="sm"
                onClick={() => setSelectedNewsId(nextUncheckedNews.id)}
                className="h-9 px-3.5 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-950 gap-1.5 cursor-pointer"
              >
                <span>다음 미확인 뉴스 보기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            {allTodayChecked && onGoToTrading && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onGoToTrading();
                }}
                className="h-9 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer"
              >
                <span>모의투자 교실에서 직접 기업 찾기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPreviousPredictionResult = (item: NewsItem) => {
    const userPred = previousNewsChecks[item.id];
    const userSectors = previousNewsSectorGuesses[item.id] ?? [];
    const secEval = evaluateSectorGuesses(item, userSectors);
    if (!userPred && !secEval.checked) return null;

    const actual = getActualNewsDirection(item);
    const dirCorrect = userPred === actual;

    return (
      <div className="space-y-2.5">
        {userPred && (
          <div
            className={cn(
              'rounded-xl border p-3.5 flex items-center justify-between gap-3 flex-wrap',
              dirCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
            )}
          >
            <div className="flex items-center gap-2 text-[13px] font-black">
              {dirCorrect ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span>
                {dirCorrect
                  ? '방향 예측 적중! 기사 흐름을 정확히 읽어냈어요.'
                  : '예상과 다른 방향이었어요 — 아래 스탁 쌤 해설로 이유를 복기해 보세요!'}
              </span>
            </div>
            <div className="text-xs font-extrabold flex items-center gap-1.5">
              <span>내 판단: {PREDICTION_SHORT_LABEL[userPred]}</span>
              <span>→</span>
              <span>실제: {PREDICTION_SHORT_LABEL[actual]}</span>
            </div>
          </div>
        )}

        {secEval.checked && (
          <div
            className={cn(
              'rounded-xl border p-3.5 flex items-center justify-between gap-3 flex-wrap',
              secEval.hit
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-900 dark:text-sky-200'
            )}
          >
            <div className="flex items-center gap-2 text-[13px] font-black">
              {secEval.hit ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Compass className="w-4 h-4 shrink-0" />
              )}
              <span>
                {secEval.hit
                  ? '산업 추론 적중! 뉴스와 연결된 산업을 정확히 찾아냈어요.'
                  : '산업 연결 복기! 실제 영향이 간 산업을 아래에서 확인해 보세요.'}
              </span>
            </div>
            <div className="text-xs font-extrabold flex items-center gap-1.5 flex-wrap">
              <span>
                내 추론: {userSectors.map((s) => `#${s.split('(')[0]}`).join(' ')}
              </span>
              <span>→</span>
              <span>
                실제: {item.relatedSectors.map((s) => `#${s.split('(')[0]}`).join(' ')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderImpactBlock = (item: NewsItem, compact = false) => {
    const affectedStocks = getAffectedStockResults(item);

    return (
      <div
        className={cn(
          'border border-[var(--color-hts-border)] space-y-3',
          compact
            ? 'bg-black/[0.02] dark:bg-black/35 rounded-xl p-3.5'
            : 'bg-[var(--color-hts-panel)] rounded-2xl p-5 space-y-4'
        )}
      >
        <div
          className={cn(
            'font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5',
            compact ? 'text-xs' : 'text-[13px]'
          )}
        >
          <Layers className="w-4 h-4 text-[var(--color-accent-gold)]" />
          뉴스 반영 강도 & 실제 주가 변화
        </div>

        {/* 1. Scaled Sector News Impacts */}
        <div className={cn(compact ? 'space-y-2' : 'space-y-2.5')}>
          {(Object.entries(item.sectorImpact) as [SectorId, number][]).map(([sector, rawImpact]) => {
            const appliedImpact = getScaledImpact(rawImpact, level);
            return (
              <div
                key={sector}
                className={cn('flex items-center gap-2.5', compact ? 'text-xs' : 'text-[13px]')}
              >
                <span className={cn('text-muted-foreground truncate font-bold', compact ? 'w-20' : 'w-24')}>
                  {sector.split('(')[0]}
                </span>
                <div className="flex-1 h-2.5 bg-black/[0.05] dark:bg-white/[0.06] rounded-full overflow-hidden relative">
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
                    'w-16 text-right font-black tabular-nums',
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

        {/* 2. Stock-specific overrides */}
        {item.stockImpactOverrides && Object.keys(item.stockImpactOverrides).length > 0 && (
          <div className="pt-2.5 border-t border-[var(--color-hts-border)]/50 space-y-1.5">
            <div className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
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
                      'text-xs font-extrabold px-2.5 py-0.5 rounded-md border tabular-nums',
                      scaled > 0
                        ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/25'
                        : 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/25'
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

        {/* 3. Actual Observed Stock Moves */}
        {affectedStocks.some((s) => s.hasBreakdown) && (
          <div className="pt-3 border-t border-[var(--color-hts-border)]/50 space-y-2">
            <div className="text-xs font-extrabold text-muted-foreground">
              관련 종목 실제 전일 등락 결과 (시장 변동 포함)
            </div>
            <div className="space-y-1.5">
              {affectedStocks.map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-foreground truncate">{st.name}</span>
                    {st.shockReason && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[11px] font-extrabold px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0"
                        title={st.shockReason}
                      >
                        <Zap className="w-3 h-3" />
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
              'h-2 rounded-full transition-all',
              dotStep === step
                ? 'w-4 bg-amber-500'
                : dotStep < step
                  ? 'w-2 bg-amber-500/55'
                  : 'w-2 bg-black/15 dark:bg-white/15'
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
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-[13px] font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
            <span className="flex items-center gap-1.5">
              <span className="inline-block animate-bounce">👉</span> 1단계: 오늘의 가상 경제 뉴스 3건을 읽고 호재/악재 판단을 체크해 보세요!
            </span>
            <span className="text-[11px] bg-slate-950 text-white px-2.5 py-0.5 rounded font-black shrink-0">
              필수 분석
            </span>
          </div>
        )}

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between gap-2.5 flex-wrap bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Newspaper className="w-5 h-5 text-[var(--color-accent-gold)]" />
            <span className="font-black text-base text-foreground tracking-tight">
              DAY {dayCount} 경제 뉴스룸
            </span>
            <button
              onClick={() => setShowScenarioModal(true)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer',
                activeScenario
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                  : 'bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground border-[var(--color-hts-border)] hover:text-foreground hover:border-amber-500/40'
              )}
              title="테마 시나리오 도감 열기"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>
                시나리오 도감 ({completedCount}/{SCENARIO_ARCS.length})
              </span>
            </button>
          </div>
          <div className="flex gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-full border border-[var(--color-hts-border)]">
            <button
              onClick={() => setTab('current')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer',
                tab === 'current'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              오늘의 뉴스 ({checkedTodayCount}/{currentNews.length})
            </button>
            <button
              onClick={() => setTab('previous')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer',
                tab === 'previous'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              어제 뉴스 해설
            </button>
          </div>
        </div>

        {/* Daily News Mission Progress Strip (Current tab only) */}
        {tab === 'current' && currentNews.length > 0 && (
          <div
            className={cn(
              'px-4 sm:px-5 py-2.5 border-b border-[var(--color-hts-border)] flex items-center justify-between gap-3 flex-wrap shrink-0',
              allTodayChecked
                ? 'bg-emerald-500/10'
                : 'bg-amber-500/[0.08]'
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              <div className="flex items-center gap-1.5 shrink-0">
                {allTodayChecked ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-[13px] font-black text-foreground">
                  {allTodayChecked
                    ? '오늘의 뉴스 분석 완료! 모의투자 교실이 열렸어요.'
                    : `필수 미션: 오늘의 뉴스 ${currentNews.length}건을 읽고 판단 체크 (${checkedTodayCount}/${currentNews.length})`}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 w-28 shrink-0">
                {currentNews.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-all',
                      todayNewsChecks[item.id]
                        ? 'bg-emerald-500'
                        : 'bg-black/15 dark:bg-white/15'
                    )}
                  />
                ))}
              </div>
            </div>

            {allTodayChecked && onGoToTrading && (
              <Button
                type="button"
                size="sm"
                onClick={() => onGoToTrading()}
                className="h-9 px-4 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shrink-0"
              >
                <span>모의투자 교실로 이동</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Main Content Area */}
        {news.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
            <AlertCircle className="w-11 h-11 mb-3 opacity-35 text-[var(--color-accent-gold)]" />
            <p className="text-sm font-bold text-foreground/80">
              {tab === 'current'
                ? '오늘 발행된 가상 뉴스가 아직 없습니다.'
                : '어제 발행된 뉴스 기록이 아직 없습니다.'}
            </p>
            <p className="text-xs opacity-75 mt-1.5">
              오늘 뉴스를 분석하고 ‘다음 날 진행’ 버튼을 누르면 실제 변동 결과와 스탁 쌤 해설이 공개됩니다.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* LEFT: News Headline List */}
            <div className="w-full lg:w-[390px] shrink-0 border-r border-[var(--color-hts-border)] flex flex-col min-h-0 bg-black/[0.01] dark:bg-black/10">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                <div className="p-3.5 space-y-2.5">
                  {news.map((item, idx) => {
                    const isSelected = activeNewsId === item.id;
                    const isScenario = Boolean(item.scenarioId);
                    const badge = getSentimentBadge(item);
                    const todayPred = tab === 'current' ? todayNewsChecks[item.id] : undefined;
                    const prevPred = tab === 'previous' ? previousNewsChecks[item.id] : undefined;
                    const prevActual = tab === 'previous' ? getActualNewsDirection(item) : undefined;
                    const prevCorrect = prevPred && prevActual ? prevPred === prevActual : false;

                    const sentimentBorder =
                      tab === 'previous'
                        ? badge.border
                        : todayPred
                          ? 'border-l-emerald-500'
                          : isScenario
                            ? 'border-l-amber-500'
                            : 'border-l-amber-400/70';

                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isSelected) {
                            setCollapsedOnMobile(true);
                          } else {
                            setCollapsedOnMobile(false);
                            setSelectedNewsId(item.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCollapsedOnMobile(false);
                            setSelectedNewsId(item.id);
                          }
                        }}
                        className={cn(
                          'w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer border-l-[4px] flex flex-col gap-2.5 relative',
                          sentimentBorder,
                          isSelected
                            ? 'bg-[var(--color-hts-hover)] border-[var(--color-hts-border)] shadow-sm ring-1 ring-[var(--color-accent-gold)]/20'
                            : 'bg-black/[0.015] dark:bg-black/25 border-[var(--color-hts-border)] hover:bg-black/[0.035] dark:hover:bg-black/35'
                        )}
                      >
                        {isScenario && item.scenarioStep && item.scenarioTotalSteps && (
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-black">
                              <Flame className="w-3 h-3" />
                              연속 시나리오 · {item.scenarioStep}/{item.scenarioTotalSteps}일차
                            </span>
                            {renderScenarioProgressDots(item.scenarioStep, item.scenarioTotalSteps)}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-2.5 w-full">
                          <span
                            className={cn(
                              'text-sm leading-snug text-foreground line-clamp-2',
                              isSelected ? 'font-black' : 'font-bold'
                            )}
                          >
                            <span className="text-muted-foreground mr-1.5 font-mono">0{idx + 1}</span>
                            {item.title}
                          </span>
                          {tab === 'previous' && <span className="shrink-0 pt-0.5">{badge.icon}</span>}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-muted-foreground">
                          {tab === 'current' &&
                            (todayPred ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black">
                                <CheckCircle2 className="w-3 h-3" />
                                분석 완료 ({PREDICTION_SHORT_LABEL[todayPred]})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black">
                                미확인 · 터치해 읽기
                              </span>
                            ))}

                          {tab === 'previous' && (
                            <span className={cn('px-2 py-0.5 rounded-md border', badge.pill)}>
                              {badge.label}
                            </span>
                          )}
                          {tab === 'previous' && prevPred && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md font-black',
                                prevCorrect
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              )}
                            >
                              {prevCorrect ? '🎯 적중' : '복기'}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06]">
                            {getCategoryLabel(item.category)}
                          </span>
                          {item.articleFormat && (
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md border text-[10px] font-extrabold',
                                FORMAT_STYLE[item.articleFormat].cls
                              )}
                            >
                              {FORMAT_STYLE[item.articleFormat].icon}{' '}
                              {NEWS_FORMAT_LABELS[item.articleFormat]}
                            </span>
                          )}
                          {tab === 'previous' && item.twistType && item.twistType !== 'direct' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/12 text-amber-700 dark:text-amber-400">
                              {NEWS_TWIST_LABELS[item.twistType]}
                            </span>
                          )}
                        </div>

                        {/* Inline Details (Visible on Mobile/Tablet only) */}
                        {isSelected && (
                          <div
                            className="block lg:hidden mt-2 pt-3 border-t border-[var(--color-hts-border)]/60 space-y-3.5 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-sm text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
                              {item.content}
                            </p>

                            {renderArticleExtras(item, true)}

                            {tab === 'current' ? (
                              <>
                                {renderPredictionCard(item, true)}
                                <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-xl p-3 text-center">
                                  <div className="flex items-center justify-center text-muted-foreground font-bold text-xs gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                                    스탁 쌤 경제 해설 & 실제 관련 산업 (다음 날 공개)
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-3">
                                {renderPreviousPredictionResult(item)}
                                {renderImpactBlock(item, true)}

                                <div className="bg-gradient-to-br from-black/[0.01] to-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 rounded-xl p-3.5 space-y-2">
                                  <div className="text-xs font-black text-[var(--color-accent-gold)] flex items-center gap-1.5 uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                                    스탁 쌤 경제 해설 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                                  </div>
                                  <p className="text-[13px] leading-relaxed text-foreground/85 font-semibold whitespace-pre-wrap">
                                    {item.explanations[level]}
                                  </p>
                                  {item.readingHint?.[level] && (
                                    <div className="pt-2 border-t border-[var(--color-accent-gold)]/15 flex items-start gap-2 text-xs text-foreground/80 font-semibold">
                                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                      <span>{item.readingHint[level]}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Article Detail Viewer (PC Only) */}
            <div className="hidden lg:flex flex-1 flex-col min-h-0 bg-black/[0.01] dark:bg-black/5 overflow-hidden">
              {selectedNews ? (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  <div className="p-6 xl:p-8 max-w-3xl mx-auto space-y-6">
                    {selectedNews.scenarioId &&
                      selectedNews.scenarioStep &&
                      selectedNews.scenarioTotalSteps && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
                          <div className="flex items-center gap-2 min-w-0">
                            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                            <div className="text-[13px] font-black text-foreground truncate">
                              연속 시나리오: {selectedNews.scenarioTitle}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-amber-700 dark:text-amber-300 tabular-nums">
                              {selectedNews.scenarioStep} / {selectedNews.scenarioTotalSteps}일차
                            </span>
                            {renderScenarioProgressDots(
                              selectedNews.scenarioStep,
                              selectedNews.scenarioTotalSteps
                            )}
                          </div>
                        </div>
                      )}

                    <div className="space-y-3 border-b border-[var(--color-hts-border)]/60 pb-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-md bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] text-xs font-extrabold border border-[var(--color-accent-gold)]/20">
                          {getCategoryLabel(selectedNews.category)}
                        </span>
                        {selectedNews.articleFormat && (
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-md text-xs font-extrabold border',
                              FORMAT_STYLE[selectedNews.articleFormat].cls
                            )}
                          >
                            {FORMAT_STYLE[selectedNews.articleFormat].icon}{' '}
                            {NEWS_FORMAT_LABELS[selectedNews.articleFormat]}
                          </span>
                        )}
                        {tab === 'previous' &&
                          (() => {
                            const badge = getSentimentBadge(selectedNews);
                            return (
                              <span
                                className={cn(
                                  'px-2.5 py-1 rounded-md text-xs font-extrabold border',
                                  badge.pill
                                )}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                        {tab === 'previous' &&
                          selectedNews.twistType &&
                          selectedNews.twistType !== 'direct' && (
                            <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                              {NEWS_TWIST_LABELS[selectedNews.twistType]}
                            </span>
                          )}
                        <span className="text-xs font-semibold text-muted-foreground ml-auto">
                          {selectedNews.sourceDesk ?? '스탁스쿨 경제데스크'} · 가상 교육 기사
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-foreground leading-snug tracking-tight">
                        {selectedNews.title}
                      </h3>
                    </div>

                    {/* Article Content */}
                    <div className="bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl p-6 shadow-sm space-y-4">
                      <p className="text-[15px] md:text-base leading-[1.75] text-foreground/95 whitespace-pre-wrap font-medium">
                        {selectedNews.content}
                      </p>
                      {renderArticleExtras(selectedNews, false)}
                      <p className="text-xs text-muted-foreground font-medium pt-3 border-t border-[var(--color-hts-border)]/50">
                        ※ 본 기사는 금융 문해력 교육을 위해 창작된 가상의 시나리오이며, 실제 사건이나 투자 권유가 아닙니다.
                      </p>
                    </div>

                    {/* Active Prediction Gate (Today) or Explanations (Previous) */}
                    {tab === 'current' ? (
                      <div className="space-y-4">
                        {renderPredictionCard(selectedNews, false)}

                        <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-2xl p-5 text-center">
                          <div className="flex items-center justify-center mb-1.5 text-foreground/80 font-bold text-sm gap-2">
                            <Lock className="w-4 h-4 text-[var(--color-accent-gold)]" />
                            실제 관련 산업 · 스탁 쌤 학습 해설 비공개 (당일 열람 제한)
                          </div>
                          <div className="text-[13px] text-muted-foreground leading-relaxed font-medium mt-1">
                            기사를 스스로 읽고 영향 산업과 기업을 추론해 투자 판단을 내린 뒤{' '}
                            <span className="text-foreground font-bold">다음 날</span>로 진행하면, 실제 영향 산업·종목별 변동 결과 및 상세 해설이 공개됩니다.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {renderPreviousPredictionResult(selectedNews)}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {renderImpactBlock(selectedNews, false)}

                          <div className="bg-gradient-to-br from-[var(--color-hts-panel)] to-[var(--color-accent-gold)]/[0.02] border border-[var(--color-accent-gold)]/20 rounded-2xl p-5 space-y-4">
                            <div className="space-y-3">
                              <div className="text-[13px] font-black text-[var(--color-accent-gold)] flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
                                스탁 쌤 경제 해설 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                              </div>
                              <p className="text-sm leading-relaxed text-foreground/90 font-semibold whitespace-pre-wrap">
                                {selectedNews.explanations[level]}
                              </p>
                            </div>

                            {selectedNews.readingHint?.[level] && (
                              <div className="pt-3.5 border-t border-[var(--color-hts-border)]/60 space-y-1.5">
                                <div className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                  <Lightbulb className="w-4 h-4" />
                                  핵심 독해 포인트
                                </div>
                                <p className="text-[13px] leading-relaxed text-foreground/85 font-medium">
                                  {selectedNews.readingHint[level]}
                                </p>
                              </div>
                            )}

                            {onGoToTrading && (
                              <div className="pt-3 border-t border-[var(--color-hts-border)]/60 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-muted-foreground">
                                  복기 차트 보기:
                                </span>
                                {selectedNews.relatedSectors.map((sec) => (
                                  <button
                                    key={sec}
                                    type="button"
                                    onClick={() => onGoToTrading(sec)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] hover:border-[var(--color-accent-gold)] text-xs font-extrabold text-foreground cursor-pointer transition-colors"
                                  >
                                    <Compass className="w-3 h-3 text-amber-500" />
                                    {sec.split('(')[0]}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                  <Newspaper className="w-12 h-12 mb-3 opacity-25 text-[var(--color-accent-gold)]" />
                  <p className="text-base font-bold text-foreground/75">선택된 뉴스가 없습니다.</p>
                  <p className="text-sm opacity-70 mt-1">좌측 리스트에서 기사를 선택해 주세요.</p>
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

      {/* Non-spoiler Glossary Concept Modal */}
      <Dialog
        open={Boolean(activeGlossaryTerm)}
        onOpenChange={(open) => {
          if (!open) setActiveGlossaryTerm(null);
        }}
      >
        <DialogContent className="max-w-lg w-[92vw] max-h-[85vh] overflow-y-auto bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl">
          {activeGlossaryTerm && (
            <div className="space-y-4">
              <DialogHeader className="text-left space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] text-[11px] font-black w-fit">
                  <BookOpen className="w-3.5 h-3.5" />
                  경제 용어 사전 ({level === 'elementary' ? '초급' : level === 'middle' ? '중급' : '고급'} 눈높이)
                </div>
                <DialogTitle className="text-lg font-black text-foreground">
                  {activeGlossaryTerm.term}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-foreground/80">
                  {activeGlossaryTerm.shortSummary[level]}
                </DialogDescription>
              </DialogHeader>

              <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                {activeGlossaryTerm.definitions[level]}
              </p>

              {/* Real-world Example */}
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5 space-y-1">
                <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                  💡 실전 예시
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-foreground/90 font-medium">
                  {activeGlossaryTerm.examples[level]}
                </p>
              </div>

              {/* Clickable Related Terms */}
              {activeGlossaryTerm.relatedIds.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-[var(--color-hts-border)]/70">
                  <div className="text-[11px] font-extrabold text-muted-foreground">
                    연관 용어 바로 보기
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeGlossaryTerm.relatedIds
                      .map((rid) => GLOSSARY_BY_ID[rid])
                      .filter((g): g is GlossaryItem => Boolean(g))
                      .map((rel) => (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => setActiveGlossaryTerm(rel)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-black/[0.04] dark:bg-white/[0.06] text-foreground hover:bg-[var(--color-accent-gold)]/15 hover:text-[var(--color-accent-gold)] border border-[var(--color-hts-border)] transition-colors cursor-pointer"
                        >
                          {rel.term.split(' (')[0]}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
