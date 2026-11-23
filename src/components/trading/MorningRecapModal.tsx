import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useGameStore, type NewsPrediction } from '../../stores/gameStore';
import { getActualNewsDirection } from '../../lib/priceEngine';
import { computeHoldingSummaries, formatSignedPct } from '../../lib/tradingMetrics';
import { cn } from '../../lib/utils';
import {
  ArrowRight,
  BookOpenCheck,
  Briefcase,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface MorningRecapModalProps {
  onGoToPreviousNews: () => void;
  onGoToTodayNews: () => void;
}

const PREDICTION_LABEL: Record<NewsPrediction, string> = {
  bullish: '호재 📈',
  mixed: '혼조·중립 ⚖️',
  bearish: '악재 📉',
};

export default function MorningRecapModal({
  onGoToPreviousNews,
  onGoToTodayNews,
}: MorningRecapModalProps) {
  const {
    showRecapModal,
    lastDayRecap,
    previousNews,
    previousNewsChecks,
    predictionStats,
    holdings,
    stocks,
    cash,
    dismissRecap,
  } = useGameStore();

  if (!lastDayRecap) return null;

  const isUp = lastDayRecap.assetDelta > 0;
  const isDown = lastDayRecap.assetDelta < 0;
  const accuracyPct =
    predictionStats.total > 0
      ? Math.round((predictionStats.correct / predictionStats.total) * 100)
      : 0;

  const holdingMovers = computeHoldingSummaries(holdings, stocks, cash)
    .sort((a, b) => Math.abs(b.dayChangePct) - Math.abs(a.dayChangePct))
    .slice(0, 5);

  return (
    <Dialog open={showRecapModal} onOpenChange={(open) => { if (!open) dismissRecap(); }}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90dvh] p-0 gap-0 overflow-hidden bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] shrink-0 text-left pr-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black w-fit mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            DAY {lastDayRecap.dayNumber} 개장 브리핑
          </div>
          <DialogTitle className="text-xl font-black text-foreground tracking-tight">
            어제 뉴스 결과가 시장에 반영되었어요!
          </DialogTitle>
          <DialogDescription className="text-[13px] font-medium text-muted-foreground mt-1">
            어제 세운 뉴스 예측과 실제 시장 반응을 비교해 보고, 오늘의 새 뉴스를 분석해 보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-5">
          {/* KPI Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/25 space-y-1">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                {isUp ? (
                  <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />
                ) : isDown ? (
                  <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />
                ) : (
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                )}
                전일 대비 자산 변동
              </div>
              <div
                className={cn(
                  'text-xl font-black tabular-nums',
                  isUp
                    ? 'text-[var(--color-price-up)]'
                    : isDown
                      ? 'text-[var(--color-price-down)]'
                      : 'text-foreground'
                )}
              >
                {lastDayRecap.assetDelta > 0 ? '+' : ''}
                {lastDayRecap.assetDelta.toLocaleString()}원
                <span className="text-sm font-extrabold ml-1.5">
                  ({lastDayRecap.assetDeltaPct > 0 ? '+' : ''}
                  {lastDayRecap.assetDeltaPct.toFixed(2)}%)
                </span>
              </div>
              <div className="text-xs font-semibold text-muted-foreground tabular-nums">
                현재 총 자산: {lastDayRecap.newTotalAsset.toLocaleString()}원
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/25 space-y-1">
              <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                어제 뉴스 독해 적중률
              </div>
              <div className="text-xl font-black text-foreground tabular-nums">
                {lastDayRecap.checkedCount > 0 ? (
                  <>
                    {lastDayRecap.correctCount} / {lastDayRecap.checkedCount}건 적중
                  </>
                ) : (
                  '예측 기록 없음'
                )}
              </div>
              <div className="text-xs font-semibold text-muted-foreground tabular-nums">
                누적 적중률: {accuracyPct}% ({predictionStats.correct}/{predictionStats.total})
              </div>
            </div>
          </div>

          {/* Held Stocks Overnight Movers */}
          {holdingMovers.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-black text-foreground flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[var(--color-accent-gold)]" />
                <span>내 보유 종목 전일 등락 요약</span>
              </div>
              <div className="rounded-xl border border-[var(--color-hts-border)] divide-y divide-[var(--color-hts-border)]/50 bg-black/[0.015] dark:bg-black/20 overflow-hidden">
                {holdingMovers.map((item) => {
                  const dayUp = item.dayChange > 0;
                  const dayDown = item.dayChange < 0;
                  return (
                    <div
                      key={item.id}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-black text-foreground">{item.name}</span>
                        <span className="text-muted-foreground font-semibold ml-1.5 tabular-nums">
                          {item.quantity}주 · 누적 {formatSignedPct(item.profitRate, 1)}
                        </span>
                      </div>
                      <div className="text-right shrink-0 tabular-nums">
                        <span className="font-bold text-foreground mr-2">
                          {item.currentPrice.toLocaleString()}원
                        </span>
                        <span
                          className={cn(
                            'font-black px-1.5 py-0.5 rounded',
                            dayUp
                              ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                              : dayDown
                                ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                                : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
                          )}
                        >
                          {formatSignedPct(item.dayChangePct, 1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Yesterday News Predictions Breakdown */}
          {previousNews.length > 0 && (
            <div className="space-y-2.5">
              <div className="text-sm font-black text-foreground">어제 뉴스별 내 예측 결과</div>
              <div className="space-y-2">
                {previousNews.map((item) => {
                  const userPred = previousNewsChecks[item.id];
                  const actual = getActualNewsDirection(item);
                  const isCorrect = userPred === actual;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.02] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[13px] font-bold text-foreground leading-snug">
                          {item.title}
                        </div>
                        {userPred && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black shrink-0',
                              isCorrect
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            )}
                          >
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> 적중
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> 복기
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-muted-foreground">
                        <span>
                          내 판단:{' '}
                          <strong className="text-foreground">
                            {userPred ? PREDICTION_LABEL[userPred] : '미체크'}
                          </strong>
                        </span>
                        <span>→</span>
                        <span>
                          실제 영향:{' '}
                          <strong className="text-foreground">{PREDICTION_LABEL[actual]}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/20 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              dismissRecap();
              onGoToPreviousNews();
            }}
            className="h-10 px-4 rounded-xl text-[13px] font-bold gap-1.5 cursor-pointer"
          >
            <BookOpenCheck className="w-4 h-4" />
            어제 뉴스 해설 복기하기
          </Button>
          <Button
            type="button"
            onClick={() => {
              dismissRecap();
              onGoToTodayNews();
            }}
            className="h-10 px-5 rounded-xl text-[13px] font-black gap-1.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 cursor-pointer"
          >
            <span>DAY {lastDayRecap.dayNumber} 오늘의 뉴스 읽기</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
