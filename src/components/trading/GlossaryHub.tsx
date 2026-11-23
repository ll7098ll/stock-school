import { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { GLOSSARY_TERMS, getCategoryLabel } from '../../lib/glossaryData';
import { BookOpen, Search, Bookmark, HelpCircle, ArrowLeft } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

export default function GlossaryHub() {
  const { level, tutorialStep } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [learningLevel, setLearningLevel] = useState<'elementary' | 'middle' | 'high'>(level);

  // Filter glossary items
  const filteredTerms = GLOSSARY_TERMS.filter((item) => {
    const matchesSearch =
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitions.elementary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitions.middle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitions.high.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: '전체' },
    { id: 'basic', label: '주식 기초' },
    { id: 'analysis', label: '주식 분석' },
    { id: 'macro', label: '거시 경제' },
    { id: 'advanced', label: '심화 지식' },
  ];

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
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
            초급·중급·고급 눈높이별로 쉬운 설명을 비교하며 공부할 수 있습니다.
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
      <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="궁금한 경제 용어를 검색해 보세요..."
            className="pl-10 h-11 rounded-xl bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] text-sm text-foreground placeholder:text-muted-foreground/60 w-full focus-visible:ring-1 focus-visible:ring-[var(--color-accent-gold)]"
          />
        </div>

        {/* Categories Carousel / Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3.5 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer whitespace-nowrap',
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm'
                  : 'bg-[var(--color-hts-panel)] text-muted-foreground border-[var(--color-hts-border)] hover:text-foreground'
              )}
            >
              {cat.label}
            </button>
          ))}
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
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {filteredTerms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <HelpCircle className="w-9 h-9 mb-2 opacity-30 text-[var(--color-accent-gold)]" />
                <p className="text-sm font-bold">검색 결과가 없습니다.</p>
                <p className="text-xs opacity-75 mt-1">다른 검색어를 입력해 보세요.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredTerms.map((item) => {
                  const isSelected = selectedTermId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTermId(item.id)}
                      className={cn(
                        'w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group flex flex-col gap-1.5',
                        isSelected
                          ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border-[var(--color-accent-gold)]/35 shadow-sm'
                          : 'bg-black/[0.01] dark:bg-white/[0.01] border-[var(--color-hts-border)]/70 text-foreground hover:bg-[var(--color-hts-hover)] hover:border-[var(--color-hts-border)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span
                          className={cn(
                            'text-sm font-black tracking-tight',
                            isSelected ? 'text-[var(--color-accent-gold)]' : 'text-foreground'
                          )}
                        >
                          {item.term}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground shrink-0">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {item.definitions[learningLevel]}
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
          {selectedTermId ? (
            (() => {
              const selectedItem = GLOSSARY_TERMS.find((i) => i.id === selectedTermId)!;
              return (
                <div className="h-full flex flex-col min-h-0">
                  {/* Detailed Title */}
                  <div className="px-6 py-4 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedTermId(null)}
                        className="md:hidden p-2 -ml-2 mr-1 rounded-lg hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                        title="용어 목록으로 돌아가기"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/20 flex items-center justify-center text-[var(--color-accent-gold)] font-bold shrink-0">
                        <Bookmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-foreground">{selectedItem.term}</h3>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground mt-1 inline-block">
                          {getCategoryLabel(selectedItem.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6">
                    <div className="space-y-6">
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

                      {/* Compare with all other levels */}
                      <div className="space-y-3.5">
                        <h4 className="text-sm font-black text-foreground tracking-tight border-b border-[var(--color-hts-border)]/60 pb-2">
                          다른 난이도로 비교해 보기
                        </h4>

                        {(['elementary', 'middle', 'high'] as const).map((lvl) => {
                          if (lvl === learningLevel) return null;
                          return (
                            <div
                              key={lvl}
                              className="p-4 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-white/[0.02]"
                            >
                              <div className="text-xs font-black text-muted-foreground mb-1.5">
                                {lvl === 'elementary'
                                  ? '초급 (초등학생용)'
                                  : lvl === 'middle'
                                    ? '중급 (중고등학생용)'
                                    : '고급 (심화 분석용)'}
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
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-black/[0.01] dark:bg-transparent">
              <BookOpen className="w-12 h-12 mb-3 opacity-25 text-[var(--color-accent-gold)] animate-pulse" />
              <p className="text-base font-black text-foreground/80">용어를 선택해 보세요</p>
              <p className="text-[13px] mt-1.5 opacity-75 max-w-sm leading-relaxed">
                좌측 리스트에서 상세 해설을 볼 용어를 클릭하면 수준별(초/중/고) 경제 지식을 단계적으로 확인하고 비교할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
