import { useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  GLOSSARY_BY_ID,
  GLOSSARY_CATEGORY_META,
  GLOSSARY_TERMS,
  getCategoryLabel,
  type GlossaryCategory,
} from '../../lib/glossaryData';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Building2,
  HelpCircle,
  Lightbulb,
  Link2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

export default function GlossaryHub() {
  const { level, tutorialStep } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | GlossaryCategory>('all');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(GLOSSARY_TERMS[0]?.id ?? null);
  const [learningLevel, setLearningLevel] = useState<'elementary' | 'middle' | 'high'>(level);
  const [prevStoreLevel, setPrevStoreLevel] = useState(level);
  if (level !== prevStoreLevel) {
    setPrevStoreLevel(level);
    setLearningLevel(level);
  }
  const detailScrollRef = useRef<HTMLDivElement | null>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: GLOSSARY_TERMS.length };
    for (const item of GLOSSARY_TERMS) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  // Filter glossary items (term, summary, definitions, examples, keywords, relatedSectors)
  const filteredTerms = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return GLOSSARY_TERMS.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;

      return (
        item.term.toLowerCase().includes(q) ||
        item.shortSummary.elementary.toLowerCase().includes(q) ||
        item.shortSummary.middle.toLowerCase().includes(q) ||
        item.shortSummary.high.toLowerCase().includes(q) ||
        item.definitions.elementary.toLowerCase().includes(q) ||
        item.definitions.middle.toLowerCase().includes(q) ||
        item.definitions.high.toLowerCase().includes(q) ||
        item.examples.elementary.toLowerCase().includes(q) ||
        item.examples.middle.toLowerCase().includes(q) ||
        item.examples.high.toLowerCase().includes(q) ||
        (item.keywords?.some((kw) => kw.toLowerCase().includes(q)) ?? false) ||
        (item.relatedSectors?.some((sec) => sec.toLowerCase().includes(q)) ?? false)
      );
    });
  }, [searchTerm, selectedCategory]);

  const categories: { id: 'all' | GlossaryCategory; label: string }[] = [
    { id: 'all', label: '전체' },
    ...GLOSSARY_CATEGORY_META.map((meta) => ({ id: meta.id, label: meta.label })),
  ];

  const selectedItem = selectedTermId ? (GLOSSARY_BY_ID[selectedTermId] ?? null) : null;

  const handleSelectTerm = (id: string, ensureVisibleInList = false) => {
    if (ensureVisibleInList) {
      const target = GLOSSARY_BY_ID[id];
      if (target && selectedCategory !== 'all' && target.category !== selectedCategory) {
        setSelectedCategory('all');
      }
      if (searchTerm.trim()) {
        setSearchTerm('');
      }
    }
    setSelectedTermId(id);
    detailScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-bg)] md:p-6 p-4 overflow-hidden transition-all duration-300 relative',
        tutorialStep === 6 && 'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 6 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 mb-4 rounded-xl gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">👉</span> 6단계: 뉴스에 나온 모르는 금융 용어는 사전방에서 바로 검색해 보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2.5 py-0.5 rounded font-black shrink-0">
            용어 탐색
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-4 shrink-0 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-accent-gold)]" />
            금융 용어 학습 사전
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[var(--color-accent-gold)]/15 text-[var(--color-accent-gold)] tabular-nums">
              {GLOSSARY_TERMS.length}개 수록
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
            초급·중급·고급 눈높이별 해설과 스탁스쿨 실전 예시, 연관 용어까지 한눈에 학습하세요.
          </p>
        </div>

        {/* Global Level Switcher for Learning */}
        <div className="flex items-center gap-1 bg-black/[0.05] dark:bg-white/[0.05] border border-[var(--color-hts-border)] p-1 rounded-full shrink-0">
          {(['elementary', 'middle', 'high'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLearningLevel(lvl)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer transition-all',
                learningLevel === lvl
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              {lvl === 'elementary' ? '초급 해설' : lvl === 'middle' ? '중급 해설' : '고급 해설'}
            </button>
          ))}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col gap-2.5 mb-4 shrink-0">
        {/* Search Input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="용어, 영문 약어(PER·HBM·SCFI·PF), 키워드, 산업명으로 검색..."
            className="pl-10 pr-9 h-11 rounded-xl bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] text-sm text-foreground placeholder:text-muted-foreground/60 w-full focus-visible:ring-1 focus-visible:ring-[var(--color-accent-gold)]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="검색어 지우기"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 6 Categories Filter Pills with Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap',
                  isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm'
                    : 'bg-[var(--color-hts-panel)] text-muted-foreground border-[var(--color-hts-border)] hover:text-foreground'
                )}
              >
                <span>{cat.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-extrabold',
                    isActive
                      ? 'bg-white/20 dark:bg-slate-900/15 text-current'
                      : 'bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground'
                  )}
                >
                  {categoryCounts[cat.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Left Side: Term Cards List */}
        <div
          className={cn(
            'md:col-span-1 flex flex-col min-h-0 bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl overflow-hidden shadow-md',
            selectedTermId !== null ? 'hidden md:flex' : 'flex'
          )}
        >
          <div className="px-4 py-3 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between shrink-0">
            <span className="font-extrabold text-[13px] text-foreground tracking-tight">
              용어 목록 ({filteredTerms.length})
            </span>
            {searchTerm && (
              <span className="text-[11px] font-bold text-[var(--color-accent-gold)]">
                검색 결과
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {filteredTerms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <HelpCircle className="w-9 h-9 mb-2 opacity-30 text-[var(--color-accent-gold)]" />
                <p className="text-sm font-bold">검색 결과가 없습니다.</p>
                <p className="text-xs opacity-75 mt-1">다른 검색어나 카테고리를 선택해 보세요.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredTerms.map((item) => {
                  const isSelected = selectedTermId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectTerm(item.id)}
                      className={cn(
                        'w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col gap-1.5',
                        isSelected
                          ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/35 shadow-sm'
                          : 'bg-black/[0.01] dark:bg-white/[0.01] border-[var(--color-hts-border)]/70 text-foreground hover:bg-[var(--color-hts-hover)] hover:border-[var(--color-hts-border)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 w-full">
                        <span
                          className={cn(
                            'text-sm font-black tracking-tight leading-snug',
                            isSelected ? 'text-[var(--color-accent-gold)]' : 'text-foreground'
                          )}
                        >
                          {item.term}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground shrink-0">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {item.shortSummary[learningLevel]}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Term Deep Explanation Card */}
        <div
          className={cn(
            'md:col-span-2 flex flex-col min-h-0 bg-[var(--color-hts-panel)] border border-[var(--color-hts-border)] rounded-2xl overflow-hidden shadow-md',
            selectedTermId === null ? 'hidden md:flex' : 'flex'
          )}
        >
          {selectedItem ? (
            <div className="h-full flex flex-col min-h-0">
              {/* Detailed Title */}
              <div className="px-6 py-4 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedTermId(null)}
                    className="md:hidden p-2 -ml-2 mr-1 rounded-lg hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
                    title="용어 목록으로 돌아가기"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/20 flex items-center justify-center text-[var(--color-accent-gold)] font-bold shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-black text-foreground leading-tight">
                      {selectedItem.term}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground">
                        {getCategoryLabel(selectedItem.category)}
                      </span>
                      {selectedItem.relatedSectors?.map((sec) => (
                        <span
                          key={sec}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                        >
                          <Building2 className="w-3 h-3" />
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrollable Details Body */}
              <div
                ref={detailScrollRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6"
              >
                <div className="space-y-5">
                  {/* One-line Core Summary */}
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.04] border border-[var(--color-hts-border)]">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                        한 줄 핵심 요약
                      </div>
                      <p className="text-sm font-extrabold text-foreground leading-snug">
                        {selectedItem.shortSummary[learningLevel]}
                      </p>
                    </div>
                  </div>

                  {/* Current Selected explanation card */}
                  <div className="p-5 rounded-2xl border border-[var(--color-accent-gold)]/25 bg-gradient-to-br from-amber-500/[0.04] to-transparent shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--color-accent-gold)]/10 rounded-bl-xl text-xs font-black text-[var(--color-accent-gold)]">
                      {learningLevel === 'elementary'
                        ? '초급 설명'
                        : learningLevel === 'middle'
                          ? '중급 설명'
                          : '고급 설명'}
                    </div>
                    <h4 className="text-sm font-black text-[var(--color-accent-gold)] mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-gold)]" />
                      개념 맞춤 설명
                    </h4>
                    <p className="text-[15px] md:text-base leading-[1.75] text-foreground/95 font-medium whitespace-pre-line">
                      {selectedItem.definitions[learningLevel]}
                    </p>
                  </div>

                  {/* Real-world StockSchool Example Box */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] space-y-2">
                    <h4 className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 shrink-0" />
                      스탁스쿨 실전 예시
                    </h4>
                    <p className="text-sm leading-[1.75] text-foreground/90 font-medium">
                      {selectedItem.examples[learningLevel]}
                    </p>
                  </div>

                  {/* Related Terms Interactive Chips */}
                  {selectedItem.relatedIds.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                        <Link2 className="w-4 h-4 text-[var(--color-accent-gold)]" />
                        함께 보면 좋은 연관 용어 (꼬리물기 학습)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.relatedIds
                          .map((rid) => GLOSSARY_BY_ID[rid])
                          .filter(Boolean)
                          .map((rel) => (
                            <button
                              key={rel.id}
                              type="button"
                              onClick={() => handleSelectTerm(rel.id, true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.03] text-foreground hover:border-[var(--color-accent-gold)]/50 hover:bg-[var(--color-accent-gold)]/10 hover:text-[var(--color-accent-gold)] transition-all cursor-pointer"
                            >
                              <span>{rel.term.split(' (')[0]}</span>
                              <ArrowRight className="w-3 h-3 opacity-60" />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Compare with all other levels */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-sm font-black text-foreground tracking-tight border-b border-[var(--color-hts-border)]/60 pb-2">
                      다른 난이도로 비교해 보기
                    </h4>

                    {(['elementary', 'middle', 'high'] as const).map((lvl) => {
                      if (lvl === learningLevel) return null;
                      return (
                        <div
                          key={lvl}
                          className="p-4 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.02] space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-muted-foreground">
                              {lvl === 'elementary'
                                ? '초급 (초등학생용)'
                                : lvl === 'middle'
                                  ? '중급 (중학생용)'
                                  : '고급 (고등·심화용)'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLearningLevel(lvl)}
                              className="text-[11px] font-bold text-[var(--color-accent-gold)] hover:underline cursor-pointer"
                            >
                              이 눈높이로 보기
                            </button>
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                            {selectedItem.definitions[lvl]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-black/[0.01] dark:bg-transparent">
              <BookOpen className="w-12 h-12 mb-3 opacity-25 text-[var(--color-accent-gold)] animate-pulse" />
              <p className="text-base font-black text-foreground/80">용어를 선택해 보세요</p>
              <p className="text-[13px] mt-1.5 opacity-75 max-w-sm leading-relaxed">
                좌측 리스트에서 상세 해설을 볼 용어를 클릭하면 수준별(초/중/고) 개념, 실전 예시, 연관 용어를 단계적으로 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
