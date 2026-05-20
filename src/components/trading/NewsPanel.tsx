import { useGameStore } from '../../stores/gameStore';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { Newspaper, AlertCircle, TrendingUp, TrendingDown, Minus, Lock, Sparkles, Layers } from 'lucide-react';

export default function NewsPanel() {
  const { currentNews, previousNews, level, tutorialStep } = useGameStore();
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [tab, setTab] = useState<'current' | 'previous'>('current');

  const news = tab === 'current' ? currentNews : previousNews;

  // Find currently selected news item
  const selectedNews = news.find(item => item.id === selectedNewsId) || news[0];

  // Auto-select first news item on desktop tab change or list change
  useEffect(() => {
    if (news.length > 0) {
      setSelectedNewsId(news[0].id);
    } else {
      setSelectedNewsId(null);
    }
  }, [news]);

  const getSentimentIcon = (s: number) => {
    if (s > 0) return <TrendingUp className="w-4 h-4 text-[var(--color-price-up)]" />;
    if (s < 0) return <TrendingDown className="w-4 h-4 text-[var(--color-price-down)]" />;
    return <Minus className="w-4 h-4 text-[var(--color-price-flat)]" />;
  };

  const getSentimentBg = (s: number) => {
    if (s >= 2) return 'border-l-[var(--color-price-up)]';
    if (s <= -2) return 'border-l-[var(--color-price-down)]';
    if (s > 0) return 'border-l-[var(--color-price-up)]/60';
    if (s < 0) return 'border-l-[var(--color-price-down)]/60';
    return 'border-l-[var(--color-price-flat)]/60';
  };

  const getSentimentLabel = (s: number) => {
    if (s >= 2) return '매우 호재';
    if (s === 1) return '호재';
    if (s === 0) return '중립';
    if (s === -1) return '악재';
    return '매우 악재';
  };

  const handleTabChange = (newTab: 'current' | 'previous') => {
    setTab(newTab);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden transition-all duration-300",
      tutorialStep === 1 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative"
    )}>
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 1 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">👉</span> 1단계: 오늘의 실시간 경제 뉴스를 읽고 다음 날 주가가 오를 섹터의 힌트를 얻어보세요!
          </span>
          <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">분석 시작</span>
        </div>
      )}
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[var(--color-accent-gold)] animate-pulse" />
          <span className="font-extrabold text-sm text-foreground tracking-tight">실시간 시장 속보</span>
        </div>
        <div className="flex gap-1 bg-black/[0.04] dark:bg-black/50 p-1 rounded-full border border-[var(--color-hts-border)]">
          <button
            onClick={() => handleTabChange('current')}
            className={cn(
              "px-3.5 py-1 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer",
              tab === 'current' 
                ? "bg-slate-900 dark:bg-slate-950 text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            오늘의 뉴스
          </button>
          <button
            onClick={() => handleTabChange('previous')}
            className={cn(
              "px-3.5 py-1 rounded-full text-[10px] font-extrabold transition-all duration-200 cursor-pointer",
              tab === 'previous' 
                ? "bg-slate-900 dark:bg-slate-950 text-white shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
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
            {tab === 'current' ? '오늘 발행된 시장 뉴스가 아직 없습니다.' : '이전 뉴스가 존재하지 않습니다.'}
          </p>
          <p className="text-[10px] opacity-60 mt-1">상단 예수금 우측의 '다음 날' 버튼을 눌러보세요.</p>
        </div>
      ) : (
        /* Split layout on large screens, single column scroll on smaller screens */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: News Headline List (Mobile expands inline) */}
          <div className="w-full lg:w-[360px] shrink-0 border-r border-[var(--color-hts-border)] flex flex-col bg-black/[0.01] dark:bg-black/10">
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {news.map((item) => {
                  const isSelected = selectedNewsId === item.id;
                  const sentimentBorder = tab === 'previous' ? getSentimentBg(item.sentiment) : 'border-l-[var(--color-hts-border)]';
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        // Toggle logic for mobile: if clicked again, it collapses
                        setSelectedNewsId(isSelected ? null : item.id);
                      }}
                      className={cn(
                        "w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer border-l-[4px] flex flex-col gap-2 relative",
                        sentimentBorder,
                        isSelected
                          ? "bg-[var(--color-hts-hover)] border-[var(--color-hts-border)] border-l-[var(--color-accent-gold)] dark:border-l-[var(--color-accent-gold)] shadow-sm"
                          : "bg-black/[0.02] dark:bg-black/25 border-[var(--color-hts-border)] hover:bg-black/[0.04] dark:hover:bg-black/35"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2.5 w-full">
                        <span className={cn(
                          "text-xs leading-snug text-foreground/90 line-clamp-2",
                          isSelected ? "font-extrabold" : "font-bold"
                        )}>
                          {item.title}
                        </span>
                        {tab === 'previous' && (
                          <span className="shrink-0 pt-0.5">
                            {getSentimentIcon(item.sentiment)}
                          </span>
                        )}
                      </div>
                      
                      {/* Sub-info */}
                      <div className="flex items-center gap-1.5 flex-wrap text-[9px] font-bold text-muted-foreground">
                        {tab === 'previous' && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            item.sentiment > 0 ? "bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]" :
                            item.sentiment < 0 ? "bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]" :
                            "bg-[var(--color-price-flat)]/10 text-[var(--color-price-flat)]"
                          )}>
                            {getSentimentLabel(item.sentiment)}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.04]">
                          {item.category === 'macro' ? '거시경제' :
                           item.category === 'sector' ? '산업/경제' :
                           item.category === 'company' ? '기업/종목' : '글로벌 변수'}
                        </span>
                      </div>

                      {/* Inline Details (Visible on Mobile/Tablet only) */}
                      {isSelected && (
                        <div className="block lg:hidden mt-3 pt-3 border-t border-[var(--color-hts-border)]/50 space-y-3 w-full">
                          <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                            {item.content}
                          </p>

                          {tab === 'previous' ? (
                            <div className="space-y-3">
                              {/* Sector Impacts */}
                              <div className="bg-black/[0.02] dark:bg-black/35 border border-[var(--color-hts-border)] rounded-lg p-3 space-y-2">
                                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                  <Layers className="w-3 h-3 text-[var(--color-accent-gold)]" />
                                  영향받은 섹터 시세 변화
                                </div>
                                <div className="space-y-1.5">
                                  {Object.entries(item.sectorImpact).map(([sector, impact]) => (
                                    <div key={sector} className="flex items-center gap-2 text-[10px]">
                                      <span className="w-16 text-muted-foreground truncate font-bold">{sector.split('(')[0]}</span>
                                      <div className="flex-1 h-1.5 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden relative">
                                        <div 
                                          className={cn("h-full rounded-full absolute right-1/2 left-auto", 
                                            impact > 0 ? "bg-[var(--color-price-up)] left-1/2 right-auto" : "bg-[var(--color-price-down)]"
                                          )}
                                          style={{ width: `${Math.min(50, Math.abs(impact) * 200)}%` }}
                                        />
                                      </div>
                                      <span className={cn("w-10 text-right font-black tabular-nums",
                                        impact > 0 ? 'text-[var(--color-price-up)]' : impact < 0 ? 'text-[var(--color-price-down)]' : 'text-muted-foreground'
                                      )}>
                                        {impact > 0 ? '+' : ''}{(impact * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* AI Explanation */}
                              <div className="bg-gradient-to-br from-black/[0.01] to-[var(--color-accent-gold)]/5 border border-[var(--color-accent-gold)]/20 rounded-lg p-3 space-y-1">
                                <div className="text-[9px] font-black text-[var(--color-accent-gold)] flex items-center gap-1 uppercase tracking-wider">
                                  <Sparkles className="w-3 h-3 text-[var(--color-accent-gold)]" />
                                  AI 해설 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                                </div>
                                <p className="text-[11px] leading-relaxed text-foreground/80 font-bold whitespace-pre-wrap">
                                  {item.explanations[level]}
                                </p>
                              </div>
                            </div>
                          ) : (
                            /* Locked message */
                            <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center text-muted-foreground/90 font-bold text-[10px] gap-1">
                                <Lock className="w-3 h-3 text-[var(--color-accent-gold)]" />
                                AI 해설 비공개 (다음 날 공개)
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

          {/* RIGHT: Article Detail Viewer (PC Only, hidden on Mobile/Tablet) */}
          <div className="hidden lg:flex flex-1 flex-col bg-black/[0.01] dark:bg-black/5 overflow-hidden">
            {selectedNews ? (
              <ScrollArea className="flex-1">
                <div className="p-6 max-w-3xl mx-auto space-y-6">
                  {/* Article Title & Meta */}
                  <div className="space-y-3 border-b border-[var(--color-hts-border)]/50 pb-5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] text-[10px] font-extrabold border border-[var(--color-accent-gold)]/20 uppercase tracking-wider">
                        {selectedNews.category === 'macro' ? '거시경제' :
                         selectedNews.category === 'sector' ? '산업/경제' :
                         selectedNews.category === 'company' ? '기업/종목' : '글로벌 변수'}
                      </span>
                      {tab === 'previous' && (
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[10px] font-extrabold border",
                          selectedNews.sentiment > 0 ? "bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/20" :
                          selectedNews.sentiment < 0 ? "bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/20" :
                          "bg-[var(--color-price-flat)]/10 text-[var(--color-price-flat)] border-[var(--color-price-flat)]/20"
                        )}>
                          {getSentimentLabel(selectedNews.sentiment)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-foreground leading-snug tracking-tight">
                      {selectedNews.title}
                    </h3>
                  </div>

                  {/* Article Content */}
                  <div className="bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl p-6 shadow-sm">
                    <p className="text-sm md:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap font-medium">
                      {selectedNews.content}
                    </p>
                  </div>

                  {/* Analysis details */}
                  {tab === 'previous' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Left: Sector Impacts */}
                      <div className="bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl p-5 space-y-4">
                        <div className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[var(--color-accent-gold)]" />
                          영향받은 섹터 시세 변화
                        </div>
                        <div className="space-y-3">
                          {Object.entries(selectedNews.sectorImpact).map(([sector, impact]) => (
                            <div key={sector} className="flex items-center gap-3 text-xs md:text-sm">
                              <span className="w-20 text-muted-foreground truncate font-bold">{sector.split('(')[0]}</span>
                              <div className="flex-1 h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden relative">
                                <div 
                                  className={cn("h-full rounded-full absolute right-1/2 left-auto", 
                                    impact > 0 ? "bg-[var(--color-price-up)] left-1/2 right-auto" : "bg-[var(--color-price-down)]"
                                  )}
                                  style={{ width: `${Math.min(50, Math.abs(impact) * 200)}%` }}
                                />
                              </div>
                              <span className={cn("w-12 text-right font-black tabular-nums",
                                impact > 0 ? 'text-[var(--color-price-up)]' : impact < 0 ? 'text-[var(--color-price-down)]' : 'text-muted-foreground'
                              )}>
                                {impact > 0 ? '+' : ''}{(impact * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: AI Explanation */}
                      <div className="bg-gradient-to-br from-[var(--color-hts-panel)] to-[var(--color-accent-gold)]/[0.02] border border-[var(--color-accent-gold)]/20 rounded-2xl p-5 space-y-3">
                        <div className="text-xs font-black text-[var(--color-accent-gold)] flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
                          AI 해설 브리핑 ({level === 'elementary' ? '초급 맞춤' : level === 'middle' ? '중급 맞춤' : '고급 맞춤'})
                        </div>
                        <p className="text-xs md:text-sm leading-relaxed text-foreground/80 font-bold whitespace-pre-wrap">
                          {selectedNews.explanations[level]}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Locked AI Explanation */
                    <div className="bg-black/[0.02] dark:bg-black/35 border border-dashed border-[var(--color-hts-border)] rounded-2xl p-6 text-center">
                      <div className="flex items-center justify-center mb-1.5 text-muted-foreground/90 font-bold text-sm gap-2">
                        <Lock className="w-4 h-4 text-[var(--color-accent-gold)] animate-pulse" />
                        AI 분석 리포트 비공개 (당일 열람 제한)
                      </div>
                      <div className="text-xs text-muted-foreground/60 leading-relaxed font-semibold mt-1">
                        뉴스를 분석하고 투자를 완료하면, <span className="text-[var(--color-accent-gold)] font-bold">다음 날</span> 이 뉴스에 대한 영향도 및 상세 AI 해설 리포트가 잠금 해제됩니다.
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
  );
}
