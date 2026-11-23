import { useMemo, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  SCENARIO_ARCS,
  SCENARIO_THEME_LABELS,
  type ScenarioTheme,
} from '../../lib/newsData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../../lib/utils';
import {
  BookMarked,
  CheckCircle2,
  Clock,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface ScenarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScenarioStarted?: () => void;
}

const THEME_FILTERS: { id: 'all' | ScenarioTheme; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'macro', label: SCENARIO_THEME_LABELS.macro },
  { id: 'geopolitics', label: SCENARIO_THEME_LABELS.geopolitics },
  { id: 'tech', label: SCENARIO_THEME_LABELS.tech },
  { id: 'mobility', label: SCENARIO_THEME_LABELS.mobility },
  { id: 'bio', label: SCENARIO_THEME_LABELS.bio },
  { id: 'corporate', label: SCENARIO_THEME_LABELS.corporate },
  { id: 'trend', label: SCENARIO_THEME_LABELS.trend },
];

export default function ScenarioModal({
  open,
  onOpenChange,
  onScenarioStarted,
}: ScenarioModalProps) {
  const { level, activeScenario, completedScenarioIds, startScenario } = useGameStore();
  const [selectedTheme, setSelectedTheme] = useState<'all' | ScenarioTheme>('all');
  const [search, setSearch] = useState('');

  const filteredArcs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SCENARIO_ARCS.filter((arc) => {
      if (selectedTheme !== 'all' && arc.theme !== selectedTheme) return false;
      if (!q) return true;
      return (
        arc.title.toLowerCase().includes(q) ||
        arc.subtitle[level].toLowerCase().includes(q) ||
        arc.summary[level].toLowerCase().includes(q) ||
        (completedScenarioIds.includes(arc.id) &&
          arc.featuredSectors.some((s) => s.toLowerCase().includes(q)))
      );
    });
  }, [selectedTheme, search, level, completedScenarioIds]);

  const completedCount = completedScenarioIds.filter((id) =>
    SCENARIO_ARCS.some((arc) => arc.id === id)
  ).length;
  const totalCount = SCENARIO_ARCS.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStart = (scenarioId: string, title: string) => {
    const ok = startScenario(scenarioId);
    if (ok) {
      toast.success(`"${title}" 시나리오 1일차가 오늘의 뉴스에 도착했습니다!`);
      onScenarioStarted?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85dvh] max-h-[88dvh] p-0 gap-0 flex flex-col overflow-hidden bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] shrink-0 text-left space-y-2.5">
          <div className="flex items-center justify-between pr-8 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-gold)]/15 border border-[var(--color-accent-gold)]/25 flex items-center justify-center text-[var(--color-accent-gold)] shrink-0">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground tracking-tight">
                  테마 시나리오 도감
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-[13px] font-medium text-muted-foreground mt-0.5">
                  3~4일간 이어지는 경제 드라마를 선택해 오늘의 뉴스룸에서 바로 도전해 보세요.
                </DialogDescription>
              </div>
            </div>

            {/* Completion Counter */}
            <div className="flex items-center gap-2.5 bg-black/[0.03] dark:bg-black/30 border border-[var(--color-hts-border)] rounded-xl px-3.5 py-2">
              <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-muted-foreground leading-none">
                  시나리오 완주
                </span>
                <span className="text-sm font-black text-foreground tabular-nums mt-0.5">
                  {completedCount} / {totalCount} ({progressPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-black/[0.05] dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent-gold)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </DialogHeader>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/15 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="시나리오 제목, 키워드, 관련 섹터 검색..."
              className="w-full pl-10 pr-3 py-2.5 text-[13px] font-semibold rounded-xl bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]/40"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {THEME_FILTERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTheme(t.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 border',
                  selectedTheme === t.id
                    ? 'bg-slate-900 dark:bg-[var(--color-accent-gold)] text-white dark:text-slate-950 border-transparent shadow-sm'
                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground border-[var(--color-hts-border)] hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scenario Cards Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArcs.map((arc) => {
              const isActive = activeScenario?.scenarioId === arc.id;
              const isCompleted = completedScenarioIds.includes(arc.id);

              return (
                <div
                  key={arc.id}
                  className={cn(
                    'rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all',
                    isActive
                      ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/[0.06] shadow-sm'
                      : 'border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/25 hover:border-[var(--color-accent-gold)]/40'
                  )}
                >
                  <div className="space-y-2">
                    {/* Top badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xl leading-none">{arc.icon}</span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-black/[0.05] dark:bg-white/[0.06] text-muted-foreground">
                          {SCENARIO_THEME_LABELS[arc.theme]}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/[0.04] dark:bg-white/[0.04] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {arc.totalDays}일 전개
                        </span>
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-slate-950 shrink-0 shadow-sm">
                          진행 중 · {activeScenario.currentStep}/{arc.totalDays}일차
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          완료
                        </span>
                      ) : null}
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h4 className="text-[15px] font-black text-foreground leading-snug">
                        {arc.title}
                      </h4>
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1">
                        {arc.subtitle[level]}
                      </p>
                    </div>

                    {/* Non-spoiler Summary */}
                    <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                      {arc.summary[level]}
                    </p>
                  </div>

                  {/* Footer: review sectors (only after completion to prevent spoilers) + action */}
                  <div className="pt-3 border-t border-[var(--color-hts-border)]/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {isCompleted ? (
                        arc.featuredSectors.slice(0, 3).map((sec) => (
                          <span
                            key={sec}
                            className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            {sec.split('(')[0]}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          🔍 기사를 읽고 영향 산업을 직접 추론해 보세요
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isActive}
                      onClick={() => handleStart(arc.id, arc.title)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all shrink-0',
                        isActive
                          ? 'bg-black/[0.05] dark:bg-white/[0.05] text-muted-foreground cursor-not-allowed'
                          : 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 cursor-pointer shadow-sm active:scale-95'
                      )}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {isActive ? '진행 중' : isCompleted ? '다시 도전' : '지금 도전'}
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredArcs.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p className="text-sm font-bold">검색 조건에 맞는 시나리오가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
