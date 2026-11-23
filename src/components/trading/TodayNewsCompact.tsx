import { useState } from 'react';
import { useGameStore, type NewsPrediction, countCheckedTodayNews } from '../../stores/gameStore';
import type { SectorId } from '../../lib/types';
import { cn } from '../../lib/utils';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Sparkles,
} from 'lucide-react';

interface TodayNewsCompactProps {
  onOpenNewsRoom: () => void;
  onSelectSector?: (sector: SectorId) => void;
}

const PRED_BADGE: Record<NewsPrediction, { label: string; cls: string }> = {
  bullish: {
    label: '내 판단: 호재 📈',
    cls: 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/25',
  },
  mixed: {
    label: '내 판단: 혼조 ⚖️',
    cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  bearish: {
    label: '내 판단: 악재 📉',
    cls: 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/25',
  },
};

export default function TodayNewsCompact({
  onOpenNewsRoom,
  onSelectSector,
}: TodayNewsCompactProps) {
  const { currentNews, todayNewsChecks, todayNewsSectorGuesses, dayCount } = useGameStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const allChecked = currentNews.length > 0 && checkedCount >= currentNews.length;

  return (
    <div className="flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.015] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Newspaper className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-[13px] font-black text-foreground truncate">
            DAY {dayCount} 오늘의 뉴스 브리핑
          </span>
          <span
            className={cn(
              'text-[11px] font-black px-2 py-0.5 rounded-full shrink-0',
              allChecked
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            )}
          >
            {checkedCount}/{currentNews.length} 확인
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenNewsRoom}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--color-accent-gold)] hover:underline cursor-pointer shrink-0"
        >
          <span>뉴스룸에서 크게 보기</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2">
        {currentNews.map((item) => {
          const pred = todayNewsChecks[item.id];
          const myGuesses = todayNewsSectorGuesses[item.id] ?? [];
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                'rounded-xl border transition-all',
                pred
                  ? 'border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/20'
                  : 'border-amber-500/40 bg-amber-500/[0.04]'
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full px-3.5 py-2.5 text-left flex items-start justify-between gap-2.5 cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pred ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-md border',
                          PRED_BADGE[pred].cls
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {PRED_BADGE[pred].label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-3 h-3" />
                        미확인
                      </span>
                    )}
                    {myGuesses.map((sec) => (
                      <span
                        key={sec}
                        onClick={(e) => {
                          if (!onSelectSector) return;
                          e.stopPropagation();
                          onSelectSector(sec);
                        }}
                        title="내가 추론한 산업 (클릭해 종목 탐색)"
                        className={cn(
                          'text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground',
                          onSelectSector && 'hover:text-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.12]'
                        )}
                      >
                        내 예상 #{sec.split('(')[0]}
                      </span>
                    ))}
                  </div>
                  <div className="text-[13px] font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </div>
                </div>
                <span className="text-muted-foreground shrink-0 pt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-3 pt-1 border-t border-[var(--color-hts-border)]/50 space-y-2">
                  <p className="text-[13px] leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap">
                    {item.content}
                  </p>
                  {!pred && (
                    <button
                      type="button"
                      onClick={onOpenNewsRoom}
                      className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      → 뉴스룸에서 호재/악재 판단 체크하기
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
