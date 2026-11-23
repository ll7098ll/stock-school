import { useState } from 'react';
import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
} from '../stores/gameStore';
import AppShell from '../components/layout/AppShell';
import StockList from '../components/trading/StockList';
import OrderPanel from '../components/trading/OrderPanel';
import NewsPanel from '../components/trading/NewsPanel';
import PortfolioPanel from '../components/trading/PortfolioPanel';
import PriceChart from '../components/trading/PriceChart';
import CompanyInfoPanel from '../components/trading/CompanyInfoPanel';
import OrderBook from '../components/trading/OrderBook';
import TodayNewsCompact from '../components/trading/TodayNewsCompact';
import MorningRecapModal from '../components/trading/MorningRecapModal';
import GlossaryHub from '../components/trading/GlossaryHub';
import TutorialGuide from '../components/trading/TutorialGuide';
import LegalModals, { type LegalTab } from '../components/legal/LegalModals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  ShoppingCart,
  Info,
  Cpu,
  Newspaper,
  BookOpen,
  CheckCircle2,
  Circle,
  Wallet,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { SectorId } from '../lib/types';

type TradingSubTabMobile = 'stocks' | 'chart' | 'trade';

export default function Dashboard() {
  const {
    stocks,
    dayCount,
    cash,
    holdings,
    initialCash,
    level,
    currentNews,
    todayNewsChecks,
  } = useGameStore();

  // News-First default workspace!
  const [activeWorkspace, setActiveWorkspace] = useState<
    'trading' | 'portfolio' | 'news' | 'glossary'
  >('news');
  const [newsTab, setNewsTab] = useState<'current' | 'previous'>('current');
  const [manualStockId, setSelectedStockId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem('stockschool_tutorial_completed')
  );
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('disclaimer');

  // Mobile-specific trading tab
  const [mobileTradingTab, setMobileTradingTab] = useState<TradingSubTabMobile>('stocks');

  const stockIds = Object.keys(stocks);
  const selectedStockId =
    manualStockId && stocks[manualStockId] ? manualStockId : (stockIds[0] ?? null);

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleGoToTrading = (targetSector?: SectorId) => {
    if (targetSector) {
      setSectorFilter(targetSector);
      const firstInSector = Object.values(stocks).find((s) => s.sector === targetSector);
      if (firstInSector) {
        setSelectedStockId(firstInSector.id);
      }
      setMobileTradingTab('stocks');
    }
    setActiveWorkspace('trading');
  };

  const handleGoToNews = (tab: 'current' | 'previous' = 'current') => {
    setNewsTab(tab);
    setActiveWorkspace('news');
  };

  // Calculate total asset
  const totalStockValue = Object.entries(holdings).reduce((acc, [id, h]) => {
    const stock = stocks[id];
    return acc + (stock ? stock.currentPrice * h.quantity : 0);
  }, 0);
  const totalAsset = cash + totalStockValue;
  const totalProfitRate = initialCash > 0 ? ((totalAsset - initialCash) / initialCash) * 100 : 0;

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const allTodayChecked = isTodayNewsComplete(currentNews, todayNewsChecks);

  return (
    <>
      <AppShell
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        onNextDaySuccess={() => {
          setNewsTab('current');
          setActiveWorkspace('news');
        }}
        onReplayTutorial={() => setShowTutorial(true)}
        onOpenLegal={openLegal}
      >
        {/* TOP INTEGRATED LEARNING & ACCOUNT STATUS STRIP */}
        <div className="shrink-0 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] px-3 sm:px-5 py-2 flex items-center justify-between gap-3 flex-wrap z-10">
          {/* 3-Step Daily Journey Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => handleGoToNews('current')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 border',
                activeWorkspace === 'news'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                  : allTodayChecked
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                    : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/35'
              )}
            >
              {allTodayChecked ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
              <span>
                1. 뉴스 분석 ({checkedCount}/{currentNews.length})
              </span>
            </button>

            <span className="text-muted-foreground/50 text-xs font-bold shrink-0">→</span>

            <button
              type="button"
              onClick={() => setActiveWorkspace('trading')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer shrink-0 border',
                activeWorkspace === 'trading'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-transparent'
                  : allTodayChecked
                    ? 'bg-black/[0.04] dark:bg-white/[0.06] text-foreground border-[var(--color-hts-border)] hover:bg-[var(--color-hts-hover)]'
                    : 'bg-transparent text-muted-foreground border-[var(--color-hts-border)]/70'
              )}
            >
              <span>2. 투자 결정</span>
            </button>

            <span className="hidden sm:inline text-muted-foreground/50 text-xs font-bold shrink-0">
              →
            </span>
            <span className="hidden sm:inline text-xs font-bold text-muted-foreground shrink-0">
              3. 다음 날 결과 복기
            </span>
          </div>

          {/* Account Summary Strip */}
          <button
            type="button"
            onClick={() => setActiveWorkspace('portfolio')}
            className="flex items-center gap-3 sm:gap-4 text-xs sm:text-[13px] cursor-pointer hover:opacity-85 transition-opacity ml-auto"
            title="자산 보고서 보기"
          >
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
              <span className="text-muted-foreground font-semibold">총 자산</span>
              <span className="font-black text-foreground tabular-nums">
                {totalAsset.toLocaleString()}원
              </span>
            </div>
            <span
              className={cn(
                'font-black tabular-nums px-2 py-0.5 rounded-md text-xs',
                totalProfitRate > 0
                  ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                  : totalProfitRate < 0
                    ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
              )}
            >
              {totalProfitRate > 0 ? '+' : ''}
              {totalProfitRate.toFixed(2)}%
            </span>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-muted-foreground font-semibold">예수금</span>
              <span className="font-extrabold text-foreground/90 tabular-nums">
                {cash.toLocaleString()}원
              </span>
            </div>
          </button>
        </div>

        {/* 1. NEWS WORKSPACE */}
        {activeWorkspace === 'news' && (
          <div className="flex-1 min-h-0 overflow-hidden bg-[var(--color-hts-bg)] p-2">
            <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
              <NewsPanel
                activeTab={newsTab}
                onTabChange={setNewsTab}
                onGoToTrading={handleGoToTrading}
              />
            </div>
          </div>
        )}

        {/* 2. TRADING WORKSPACE */}
        {activeWorkspace === 'trading' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[var(--color-hts-bg)]">
            {/* DESKTOP HTS GRID (lg and up) */}
            <div className="hidden lg:grid grid-cols-12 gap-2 p-2 flex-1 min-h-0 bg-[var(--color-hts-bg)]">
              {/* Col 1: Stock List (3 columns) */}
              <div className="col-span-3 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
                <StockList
                  selected={selectedStockId}
                  onSelect={(id) => setSelectedStockId(id)}
                  sectorFilter={sectorFilter}
                  onSectorFilterChange={setSectorFilter}
                />
              </div>

              {/* Col 2: Chart + Bottom [Today's News | OrderBook] Tabs (6 columns) */}
              <div className="col-span-6 flex flex-col gap-2 min-h-0">
                {selectedStockId ? (
                  <>
                    <div className="flex-1 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
                      <PriceChart stockId={selectedStockId} />
                    </div>
                    <div className="h-[245px] rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)] shrink-0 flex flex-col">
                      <Tabs defaultValue="today-news" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid grid-cols-2 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/30 p-1 shrink-0 h-auto">
                          <TabsTrigger
                            value="today-news"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <Newspaper className="w-3.5 h-3.5 mr-1.5 inline" />
                            오늘의 뉴스 요약 ({checkedCount}/{currentNews.length})
                          </TabsTrigger>
                          <TabsTrigger
                            value="orderbook"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-1.5 inline" />
                            모의 호가창 (참고용)
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <TabsContent value="today-news" className="h-full m-0 overflow-hidden">
                            <TodayNewsCompact
                              onOpenNewsRoom={() => handleGoToNews('current')}
                              onSelectSector={(sec) => handleGoToTrading(sec)}
                            />
                          </TabsContent>
                          <TabsContent value="orderbook" className="h-full m-0 overflow-hidden">
                            <OrderBook stockId={selectedStockId} />
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] p-6 text-center text-muted-foreground">
                    <Cpu className="w-10 h-10 mb-2 opacity-30 text-[var(--color-accent-gold)] animate-bounce" />
                    <p className="font-extrabold text-sm text-foreground">선택된 종목이 없습니다.</p>
                  </div>
                )}
              </div>

              {/* Col 3: Trading & Analysis Tabs (3 columns) */}
              <div className="col-span-3 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)] flex flex-col">
                {selectedStockId ? (
                  <Tabs defaultValue="order" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid grid-cols-2 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/30 p-1 shrink-0 h-auto">
                      <TabsTrigger
                        value="order"
                        className="text-[13px] font-black cursor-pointer py-2 rounded-lg data-[state=active]:bg-[var(--color-accent-gold)] data-[state=active]:text-[var(--color-hts-panel)] data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1 inline" />
                        주문 실행
                      </TabsTrigger>
                      <TabsTrigger
                        value="info"
                        className="text-[13px] font-black cursor-pointer py-2 rounded-lg data-[state=active]:bg-[var(--color-accent-gold)] data-[state=active]:text-[var(--color-hts-panel)] data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                      >
                        <Info className="w-3.5 h-3.5 mr-1 inline" />
                        기업 분석
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 min-h-0 overflow-hidden">
                      <TabsContent value="order" className="h-full m-0 overflow-hidden">
                        <OrderPanel
                          stockId={selectedStockId}
                          onGoToNews={() => handleGoToNews('current')}
                        />
                      </TabsContent>
                      <TabsContent value="info" className="h-full m-0 overflow-hidden">
                        <CompanyInfoPanel stockId={selectedStockId} />
                      </TabsContent>
                    </div>
                  </Tabs>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
                    <p className="text-sm font-bold">
                      종목을 선택하면 주문 및 기업 분석 탭이 활성화됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* TABLET LAYOUT (md to lg) */}
            <div className="hidden md:grid lg:hidden grid-cols-12 gap-2 p-2 flex-1 min-h-0 bg-[var(--color-hts-bg)]">
              <div className="col-span-4 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                <StockList
                  selected={selectedStockId}
                  onSelect={(id) => setSelectedStockId(id)}
                  sectorFilter={sectorFilter}
                  onSectorFilterChange={setSectorFilter}
                />
              </div>

              <div className="col-span-8 flex flex-col gap-2 min-h-0">
                {selectedStockId ? (
                  <>
                    <div className="flex-1 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                      <PriceChart stockId={selectedStockId} />
                    </div>
                    <div className="h-[300px] shrink-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                      <Tabs defaultValue="order" className="h-full flex flex-col min-h-0">
                        <TabsList className="grid grid-cols-4 bg-black/[0.015] dark:bg-black/35 border-b border-[var(--color-hts-border)] p-1 shrink-0 rounded-none h-auto">
                          <TabsTrigger value="order" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            즉시주문
                          </TabsTrigger>
                          <TabsTrigger value="today-news" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            오늘뉴스
                          </TabsTrigger>
                          <TabsTrigger value="orderbook" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            호가창
                          </TabsTrigger>
                          <TabsTrigger value="info" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            기업분석
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <TabsContent value="order" className="h-full m-0 overflow-hidden">
                            <OrderPanel
                              stockId={selectedStockId}
                              onGoToNews={() => handleGoToNews('current')}
                            />
                          </TabsContent>
                          <TabsContent value="today-news" className="h-full m-0 overflow-hidden">
                            <TodayNewsCompact
                              onOpenNewsRoom={() => handleGoToNews('current')}
                              onSelectSector={(sec) => handleGoToTrading(sec)}
                            />
                          </TabsContent>
                          <TabsContent value="orderbook" className="h-full m-0 overflow-hidden">
                            <OrderBook stockId={selectedStockId} />
                          </TabsContent>
                          <TabsContent value="info" className="h-full m-0 overflow-hidden">
                            <CompanyInfoPanel stockId={selectedStockId} />
                          </TabsContent>
                        </div>
                      </Tabs>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm rounded-2xl border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)]">
                    종목을 선택해 주세요.
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE MTS SUB-TAB SYSTEM (under md) */}
            <div className="flex md:hidden flex-col flex-1 min-h-0 bg-[var(--color-hts-bg)]">
              <div className="h-11 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] grid grid-cols-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileTradingTab('stocks')}
                  className={cn(
                    'text-[13px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all',
                    mobileTradingTab === 'stocks'
                      ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'border-transparent text-muted-foreground'
                  )}
                >
                  종목선택
                </button>
                <button
                  type="button"
                  disabled={!selectedStockId}
                  onClick={() => setMobileTradingTab('chart')}
                  className={cn(
                    'text-[13px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50',
                    mobileTradingTab === 'chart'
                      ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'border-transparent text-muted-foreground'
                  )}
                >
                  차트·뉴스
                </button>
                <button
                  type="button"
                  disabled={!selectedStockId}
                  onClick={() => setMobileTradingTab('trade')}
                  className={cn(
                    'text-[13px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50',
                    mobileTradingTab === 'trade'
                      ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'border-transparent text-muted-foreground'
                  )}
                >
                  주문·분석
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {mobileTradingTab === 'stocks' && (
                  <StockList
                    selected={selectedStockId}
                    onSelect={(id) => {
                      setSelectedStockId(id);
                      setMobileTradingTab('chart');
                    }}
                    sectorFilter={sectorFilter}
                    onSectorFilterChange={setSectorFilter}
                  />
                )}

                {mobileTradingTab === 'chart' && selectedStockId && (
                  <div className="h-full flex flex-col divide-y divide-[var(--color-hts-border)]">
                    <div className="flex-1 min-h-0">
                      <PriceChart
                        stockId={selectedStockId}
                        onTradeClick={() => setMobileTradingTab('trade')}
                      />
                    </div>
                    <div className="h-[200px] shrink-0">
                      <TodayNewsCompact
                        onOpenNewsRoom={() => handleGoToNews('current')}
                        onSelectSector={(sec) => handleGoToTrading(sec)}
                      />
                    </div>
                  </div>
                )}

                {mobileTradingTab === 'trade' && selectedStockId && (
                  <Tabs defaultValue="order" className="h-full flex flex-col min-h-0">
                    <TabsList className="grid grid-cols-3 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/30 p-1 shrink-0 h-auto">
                      <TabsTrigger value="order" className="text-xs font-extrabold py-1.5 cursor-pointer">
                        즉시주문
                      </TabsTrigger>
                      <TabsTrigger value="info" className="text-xs font-extrabold py-1.5 cursor-pointer">
                        기업분석
                      </TabsTrigger>
                      <TabsTrigger value="orderbook" className="text-xs font-extrabold py-1.5 cursor-pointer">
                        호가창
                      </TabsTrigger>
                    </TabsList>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <TabsContent value="order" className="h-full m-0 overflow-hidden">
                        <OrderPanel
                          stockId={selectedStockId}
                          onGoToNews={() => handleGoToNews('current')}
                        />
                      </TabsContent>
                      <TabsContent value="info" className="h-full m-0 overflow-hidden">
                        <CompanyInfoPanel stockId={selectedStockId} />
                      </TabsContent>
                      <TabsContent value="orderbook" className="h-full m-0 overflow-hidden">
                        <OrderBook stockId={selectedStockId} />
                      </TabsContent>
                    </div>
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. PORTFOLIO WORKSPACE */}
        {activeWorkspace === 'portfolio' && (
          <div className="flex-1 min-h-0 overflow-hidden bg-[var(--color-hts-bg)] p-2">
            <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
              <PortfolioPanel />
            </div>
          </div>
        )}

        {/* 4. GLOSSARY WORKSPACE */}
        {activeWorkspace === 'glossary' && (
          <div className="flex-1 min-h-0 overflow-hidden bg-[var(--color-hts-bg)] p-2">
            <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
              <GlossaryHub />
            </div>
          </div>
        )}

        {/* FOOTER STATUS BAR (Desktop Only) */}
        <footer className="hidden lg:flex h-8 shrink-0 items-center justify-between px-5 text-xs text-muted-foreground border-t border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] z-20 font-semibold">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="w-2 h-2 rounded-full bg-[var(--color-price-up)] animate-pulse" />
              <span>DAY {dayCount}</span>
            </div>
            <span>|</span>
            <span>난이도: {level === 'elementary' ? '초급' : level === 'middle' ? '중급' : '고급'}</span>
            <span>|</span>
            <span>가상 종목: {stockIds.length}개</span>
            <span>|</span>
            <button
              type="button"
              onClick={() => openLegal('disclaimer')}
              className="text-amber-700 dark:text-amber-400 hover:underline cursor-pointer font-bold"
            >
              가상 교육 시뮬레이터 (실제 투자 아님)
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openLegal('privacy')}
              className="hover:underline cursor-pointer font-bold"
            >
              개인정보처리방침
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => openLegal('terms')}
              className="hover:underline cursor-pointer"
            >
              이용약관
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => openLegal('licenses')}
              className="hover:underline cursor-pointer"
            >
              오픈소스 고지
            </button>
          </div>
        </footer>
      </AppShell>

      {showTutorial && (
        <TutorialGuide
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
          onClose={() => setShowTutorial(false)}
        />
      )}

      <MorningRecapModal
        onGoToPreviousNews={() => handleGoToNews('previous')}
        onGoToTodayNews={() => handleGoToNews('current')}
      />

      <LegalModals open={legalOpen} onOpenChange={setLegalOpen} initialTab={legalTab} />
    </>
  );
}
