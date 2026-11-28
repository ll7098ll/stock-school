import { useMemo, useState } from 'react';
import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
  TUTORIAL_COMPLETED_KEY,
} from '../stores/gameStore';
import { safeLocalStorage } from '../lib/safeStorage';
import { computeAccountSummary, formatSignedPct } from '../lib/tradingMetrics';
import AppShell from '../components/layout/AppShell';
import StockList from '../components/trading/StockList';
import OrderPanel from '../components/trading/OrderPanel';
import NewsPanel from '../components/trading/NewsPanel';
import PortfolioPanel from '../components/trading/PortfolioPanel';
import PriceChart from '../components/trading/PriceChart';
import CompanyInfoPanel from '../components/trading/CompanyInfoPanel';
import OrderBook from '../components/trading/OrderBook';
import TodayNewsCompact from '../components/trading/TodayNewsCompact';
import HoldingsCompactPanel from '../components/trading/HoldingsCompactPanel';
import TradeHistoryPanel from '../components/trading/TradeHistoryPanel';
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
  Briefcase,
  History,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { OrderIntent, SectorId, TradeType } from '../lib/types';

type TradingSubTabMobile = 'stocks' | 'chart' | 'trade' | 'account';

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
    tradeHistory,
    realizedProfitTotal,
    saveError,
    isSaving,
    retryPendingSave,
  } = useGameStore();

  // News-First default workspace!
  const [activeWorkspace, setActiveWorkspace] = useState<
    'trading' | 'portfolio' | 'news' | 'glossary'
  >('news');
  const [newsTab, setNewsTab] = useState<'current' | 'previous'>('current');
  const [manualStockId, setSelectedStockId] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const [orderIntent, setOrderIntent] = useState<OrderIntent | null>(null);

  // Controlled sub-tabs so quick actions jump straight to the right pane
  const [desktopRightTab, setDesktopRightTab] = useState<'order' | 'info'>('order');
  const [tabletBottomTab, setTabletBottomTab] = useState<string>('order');
  const [mobileTradingTab, setMobileTradingTab] = useState<TradingSubTabMobile>('stocks');
  const [mobileTradeSubTab, setMobileTradeSubTab] = useState<string>('order');
  const [mobileAccountSubTab, setMobileAccountSubTab] = useState<'holdings' | 'trades'>(
    'holdings'
  );

  // Portfolio sub-tab navigation
  const [portfolioSubTab, setPortfolioSubTab] = useState<'holdings' | 'trades'>('holdings');
  const [portfolioSubTabNonce, setPortfolioSubTabNonce] = useState(0);

  const [showTutorial, setShowTutorial] = useState(
    () => !safeLocalStorage.getItem(TUTORIAL_COMPLETED_KEY)
  );
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('disclaimer');

  const stockIds = Object.keys(stocks);
  const selectedStockId =
    manualStockId && stocks[manualStockId] ? manualStockId : (stockIds[0] ?? null);

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleOpenPortfolio = (tab: 'holdings' | 'trades' = 'holdings') => {
    setPortfolioSubTab(tab);
    setPortfolioSubTabNonce((n) => n + 1);
    setActiveWorkspace('portfolio');
  };

  const handleRequestOrder = (
    stockId: string,
    side: TradeType,
    presetQty?: number | 'all'
  ) => {
    setSelectedStockId(stockId);
    setOrderIntent((prev) => ({
      stockId,
      side,
      presetQty,
      nonce: (prev?.nonce ?? 0) + 1,
    }));
    setDesktopRightTab('order');
    setTabletBottomTab('order');
    setMobileTradingTab('trade');
    setMobileTradeSubTab('order');
    setActiveWorkspace('trading');
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

  const handleGoToTradingFromPortfolio = (stockId?: string, side?: TradeType) => {
    if (stockId && side) {
      handleRequestOrder(stockId, side, 1);
      return;
    }
    if (stockId && stocks[stockId]) {
      setSelectedStockId(stockId);
      setMobileTradingTab('chart');
    }
    setActiveWorkspace('trading');
  };

  const handleGoToNews = (tab: 'current' | 'previous' = 'current') => {
    setNewsTab(tab);
    setActiveWorkspace('news');
  };

  const account = useMemo(
    () =>
      computeAccountSummary(
        cash,
        holdings,
        stocks,
        initialCash,
        realizedProfitTotal,
        tradeHistory,
        dayCount
      ),
    [cash, holdings, stocks, initialCash, realizedProfitTotal, tradeHistory, dayCount]
  );

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
        <div className="shrink-0 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] px-3 sm:px-5 py-2 flex items-center justify-between gap-2.5 flex-wrap z-10">
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

            <span className="hidden xl:inline text-muted-foreground/50 text-xs font-bold shrink-0">
              →
            </span>
            <span className="hidden xl:inline text-xs font-bold text-muted-foreground shrink-0">
              3. 다음 날 복기
            </span>
          </div>

          {/* Account Summary Strip */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-[13px] ml-auto">
            <button
              type="button"
              onClick={() => handleOpenPortfolio('holdings')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-85 transition-opacity"
              title="계좌 현황 및 보유 주식 관리"
            >
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
                <span className="text-muted-foreground font-semibold">총 자산</span>
                <span className="font-black text-foreground tabular-nums">
                  {account.totalAsset.toLocaleString()}원
                </span>
              </div>
              <span
                className={cn(
                  'font-black tabular-nums px-2 py-0.5 rounded-md text-xs',
                  account.totalProfitRate > 0
                    ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                    : account.totalProfitRate < 0
                      ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground'
                )}
              >
                {formatSignedPct(account.totalProfitRate, 2)}
              </span>
              <div className="hidden md:flex items-center gap-1.5">
                <span className="text-muted-foreground font-semibold">예수금</span>
                <span className="font-extrabold text-foreground/90 tabular-nums">
                  {account.cash.toLocaleString()}원
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-foreground text-xs font-extrabold tabular-nums">
                <Briefcase className="w-3 h-3 text-muted-foreground" />
                보유 {account.holdingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenPortfolio('trades')}
              className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[var(--color-hts-border)] hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer transition-colors tabular-nums"
              title="거래 현황 · 체결 내역 보기"
            >
              <History className="w-3 h-3" />
              <span>오늘 거래 {account.todayTradeCount}건</span>
            </button>
          </div>
        </div>

        {/* PERSISTENCE ERROR RECOVERY BANNER (F-1 / F-5) */}
        {saveError && (
          <div className="shrink-0 border-b border-rose-500/35 bg-rose-500/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap text-xs z-10">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">
                학습 기록 저장에 일시적인 문제가 발생했습니다. 새로고침 전에 다시 저장을 시도해 주세요.
              </span>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void retryPendingSave()}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs cursor-pointer shrink-0"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isSaving && 'animate-spin')} />
              <span>{isSaving ? '저장 중...' : '다시 저장'}</span>
            </button>
          </div>
        )}

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
                  onQuickSell={(id) => handleRequestOrder(id, 'sell', 1)}
                  sectorFilter={sectorFilter}
                  onSectorFilterChange={setSectorFilter}
                />
              </div>

              {/* Col 2: Chart + Bottom 4-Tab Integrated Dock (6 columns) */}
              <div className="col-span-6 flex flex-col gap-2 min-h-0">
                {selectedStockId ? (
                  <>
                    <div className="flex-1 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
                      <PriceChart stockId={selectedStockId} />
                    </div>
                    <div className="h-[268px] rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)] shrink-0 flex flex-col">
                      <Tabs defaultValue="today-news" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid grid-cols-4 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.015] dark:bg-black/30 p-1 shrink-0 h-auto gap-1">
                          <TabsTrigger
                            value="today-news"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <Newspaper className="w-3.5 h-3.5 mr-1 inline shrink-0" />
                            <span className="truncate">
                              오늘 뉴스 ({checkedCount}/{currentNews.length})
                            </span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="holdings"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <Briefcase className="w-3.5 h-3.5 mr-1 inline shrink-0" />
                            <span className="truncate">내 보유 ({account.holdingCount})</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="trades"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <History className="w-3.5 h-3.5 mr-1 inline shrink-0" />
                            <span className="truncate">거래현황 ({account.todayTradeCount})</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="orderbook"
                            className="text-xs font-black cursor-pointer py-1.5 rounded-lg data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-white data-[state=active]:text-white dark:data-[state=active]:text-slate-950 transition-all text-muted-foreground hover:text-foreground"
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-1 inline shrink-0" />
                            <span className="truncate">모의 호가창</span>
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 min-h-0 overflow-hidden">
                          <TabsContent value="today-news" className="h-full m-0 overflow-hidden">
                            <TodayNewsCompact
                              onOpenNewsRoom={() => handleGoToNews('current')}
                              onSelectSector={(sec) => handleGoToTrading(sec)}
                            />
                          </TabsContent>
                          <TabsContent value="holdings" className="h-full m-0 overflow-hidden">
                            <HoldingsCompactPanel
                              selectedStockId={selectedStockId}
                              onSelectStock={(id) => setSelectedStockId(id)}
                              onRequestOrder={handleRequestOrder}
                              onOpenPortfolio={() => handleOpenPortfolio('holdings')}
                            />
                          </TabsContent>
                          <TabsContent value="trades" className="h-full m-0 overflow-hidden">
                            <TradeHistoryPanel
                              variant="compact"
                              onSelectStock={(id) => setSelectedStockId(id)}
                              onOpenPortfolio={() => handleOpenPortfolio('trades')}
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
                  <Tabs
                    value={desktopRightTab}
                    onValueChange={(v) => setDesktopRightTab(v as 'order' | 'info')}
                    className="flex-1 flex flex-col min-h-0"
                  >
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
                          onSelectStock={(id) => setSelectedStockId(id)}
                          orderIntent={orderIntent}
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
                  onQuickSell={(id) => handleRequestOrder(id, 'sell', 1)}
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
                    <div className="h-[315px] shrink-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                      <Tabs
                        value={tabletBottomTab}
                        onValueChange={setTabletBottomTab}
                        className="h-full flex flex-col min-h-0"
                      >
                        <TabsList className="grid grid-cols-6 bg-black/[0.015] dark:bg-black/35 border-b border-[var(--color-hts-border)] p-1 shrink-0 rounded-none h-auto">
                          <TabsTrigger value="order" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            즉시주문
                          </TabsTrigger>
                          <TabsTrigger value="holdings" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            보유({account.holdingCount})
                          </TabsTrigger>
                          <TabsTrigger value="trades" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            거래({account.todayTradeCount})
                          </TabsTrigger>
                          <TabsTrigger value="today-news" className="text-xs font-extrabold py-1.5 cursor-pointer">
                            뉴스
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
                              onSelectStock={(id) => setSelectedStockId(id)}
                              orderIntent={orderIntent}
                            />
                          </TabsContent>
                          <TabsContent value="holdings" className="h-full m-0 overflow-hidden">
                            <HoldingsCompactPanel
                              selectedStockId={selectedStockId}
                              onSelectStock={(id) => setSelectedStockId(id)}
                              onRequestOrder={handleRequestOrder}
                              onOpenPortfolio={() => handleOpenPortfolio('holdings')}
                            />
                          </TabsContent>
                          <TabsContent value="trades" className="h-full m-0 overflow-hidden">
                            <TradeHistoryPanel
                              variant="compact"
                              onSelectStock={(id) => setSelectedStockId(id)}
                              onOpenPortfolio={() => handleOpenPortfolio('trades')}
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
              <div className="h-11 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] grid grid-cols-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileTradingTab('stocks')}
                  className={cn(
                    'text-xs font-black cursor-pointer border-b-2 flex items-center justify-center transition-all',
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
                    'text-xs font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50',
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
                    'text-xs font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50',
                    mobileTradingTab === 'trade'
                      ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'border-transparent text-muted-foreground'
                  )}
                >
                  주문·분석
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTradingTab('account')}
                  className={cn(
                    'text-xs font-black cursor-pointer border-b-2 flex items-center justify-center gap-1 transition-all',
                    mobileTradingTab === 'account'
                      ? 'border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]'
                      : 'border-transparent text-muted-foreground'
                  )}
                >
                  <span>보유·거래</span>
                  {account.holdingCount > 0 && (
                    <span className="text-[10px] px-1 rounded bg-black/[0.06] dark:bg-white/[0.1] tabular-nums">
                      {account.holdingCount}
                    </span>
                  )}
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
                    onQuickSell={(id) => handleRequestOrder(id, 'sell', 1)}
                    sectorFilter={sectorFilter}
                    onSectorFilterChange={setSectorFilter}
                  />
                )}

                {mobileTradingTab === 'chart' && selectedStockId && (
                  <div className="h-full flex flex-col divide-y divide-[var(--color-hts-border)]">
                    <div className="flex-1 min-h-0">
                      <PriceChart
                        stockId={selectedStockId}
                        onTradeClick={() => {
                          setMobileTradeSubTab('order');
                          setMobileTradingTab('trade');
                        }}
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
                  <Tabs
                    value={mobileTradeSubTab}
                    onValueChange={setMobileTradeSubTab}
                    className="h-full flex flex-col min-h-0"
                  >
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
                          onSelectStock={(id) => setSelectedStockId(id)}
                          orderIntent={orderIntent}
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

                {mobileTradingTab === 'account' && (
                  <div className="h-full flex flex-col min-h-0 bg-[var(--color-hts-panel)]">
                    <div className="p-2 border-b border-[var(--color-hts-border)] grid grid-cols-2 gap-1 bg-black/[0.02] dark:bg-black/30 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMobileAccountSubTab('holdings')}
                        className={cn(
                          'py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all',
                          mobileAccountSubTab === 'holdings'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                            : 'text-muted-foreground'
                        )}
                      >
                        내 보유주식 ({account.holdingCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileAccountSubTab('trades')}
                        className={cn(
                          'py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all',
                          mobileAccountSubTab === 'trades'
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                            : 'text-muted-foreground'
                        )}
                      >
                        거래 현황 ({tradeHistory.length})
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      {mobileAccountSubTab === 'holdings' ? (
                        <HoldingsCompactPanel
                          selectedStockId={selectedStockId}
                          onSelectStock={(id) => {
                            setSelectedStockId(id);
                            setMobileTradingTab('chart');
                          }}
                          onRequestOrder={handleRequestOrder}
                          onOpenPortfolio={() => handleOpenPortfolio('holdings')}
                        />
                      ) : (
                        <TradeHistoryPanel
                          variant="compact"
                          onSelectStock={(id) => {
                            setSelectedStockId(id);
                            setMobileTradingTab('chart');
                          }}
                          onOpenPortfolio={() => handleOpenPortfolio('trades')}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. PORTFOLIO WORKSPACE */}
        {activeWorkspace === 'portfolio' && (
          <div className="flex-1 min-h-0 overflow-hidden bg-[var(--color-hts-bg)] p-2">
            <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
              <PortfolioPanel
                initialSubTab={portfolioSubTab}
                subTabNonce={portfolioSubTabNonce}
                onGoToTrading={handleGoToTradingFromPortfolio}
                onGoToNews={() => handleGoToNews('current')}
              />
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
