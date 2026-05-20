import { useState, useEffect } from 'react';
import { useGameStore, type Level } from '../stores/gameStore';
import AppShell from '../components/layout/AppShell';
import StockList from '../components/trading/StockList';
import OrderPanel from '../components/trading/OrderPanel';
import NewsPanel from '../components/trading/NewsPanel';
import PortfolioPanel from '../components/trading/PortfolioPanel';
import PriceChart from '../components/trading/PriceChart';
import CompanyInfoPanel from '../components/trading/CompanyInfoPanel';
import OrderBook from '../components/trading/OrderBook';
import GlossaryHub from '../components/trading/GlossaryHub';
import TutorialGuide from '../components/trading/TutorialGuide';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ShoppingCart, 
  Info, 
  Cpu 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

type TradingSubTabMobile = 'stocks' | 'chart' | 'trade';

export default function Dashboard() {
  const { stocks, dayCount, cash, holdings, initialCash, level, setLevel } = useGameStore();
  
  const [activeWorkspace, setActiveWorkspace] = useState<'trading' | 'portfolio' | 'news' | 'glossary'>('trading');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Mobile-specific trading tab
  const [mobileTradingTab, setMobileTradingTab] = useState<TradingSubTabMobile>('stocks');

  const stockIds = Object.keys(stocks);
  
  // Trigger tutorial if not completed
  useEffect(() => {
    const isCompleted = localStorage.getItem('stockschool_tutorial_completed');
    if (!isCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // Auto-select first stock
  useEffect(() => {
    if (!selectedStockId && stockIds.length > 0) {
      setSelectedStockId(stockIds[0]);
    }
  }, [stockIds.length, selectedStockId]);

  // Calculate total asset
  const totalStockValue = Object.entries(holdings).reduce((acc, [id, h]) => {
    const stock = stocks[id];
    return acc + (stock ? stock.currentPrice * h.quantity : 0);
  }, 0);
  const totalAsset = cash + totalStockValue;
  const totalProfitRate = initialCash > 0 ? ((totalAsset - initialCash) / initialCash) * 100 : 0;

  return (
    <>
    <AppShell 
      activeWorkspace={activeWorkspace} 
      setActiveWorkspace={setActiveWorkspace}
      onReplayTutorial={() => setShowTutorial(true)}
    >
      {/* 1. TRADING WORKSPACE */}
      {activeWorkspace === 'trading' && (
        <div className="h-full flex flex-col overflow-hidden bg-[var(--color-hts-bg)]">
          {/* DESKTOP HTS GRID (lg and up) */}
          <div className="hidden lg:grid grid-cols-12 gap-1.5 p-2 flex-1 min-h-0 bg-[var(--color-hts-bg)]">
            {/* Col 1: Stock List (3 columns) */}
            <div className="col-span-3 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
              <StockList selected={selectedStockId} onSelect={(id) => setSelectedStockId(id)} />
            </div>

            {/* Col 2: Chart & Order Book (6 columns) */}
            <div className="col-span-6 flex flex-col gap-1.5 min-h-0">
              {selectedStockId ? (
                <>
                  <div className="flex-1 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
                    <PriceChart stockId={selectedStockId} />
                  </div>
                  <div className="h-[240px] rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)] shrink-0">
                    <OrderBook stockId={selectedStockId} />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-2xl border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] p-6 text-center text-muted-foreground">
                  <Cpu className="w-10 h-10 mb-2 opacity-30 text-[var(--color-accent-gold)] animate-bounce" />
                  <p className="font-extrabold text-foreground">선택된 종목이 없습니다.</p>
                </div>
              )}
            </div>

            {/* Col 3: Trading & Analysis Tabs (3 columns) */}
            <div className="col-span-3 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)] flex flex-col">
              {selectedStockId ? (
                <Tabs defaultValue="order" className="flex-1 flex flex-col min-h-0">
                  <TabsList className="grid grid-cols-2 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/30 p-1 shrink-0">
                    <TabsTrigger 
                      value="order" 
                      className="text-xs font-black cursor-pointer py-2 rounded-lg data-[state=active]:bg-[var(--color-accent-gold)] data-[state=active]:text-[var(--color-hts-panel)] data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1 inline" />
                      주문 실행
                    </TabsTrigger>
                    <TabsTrigger 
                      value="info" 
                      className="text-xs font-black cursor-pointer py-2 rounded-lg data-[state=active]:bg-[var(--color-accent-gold)] data-[state=active]:text-[var(--color-hts-panel)] data-[state=active]:shadow-sm transition-all text-muted-foreground hover:text-foreground"
                    >
                      <Info className="w-3.5 h-3.5 mr-1 inline" />
                      기업 분석
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="order" className="h-full m-0 overflow-hidden">
                      <OrderPanel stockId={selectedStockId} />
                    </TabsContent>
                    <TabsContent value="info" className="h-full m-0 overflow-hidden">
                      <CompanyInfoPanel stockId={selectedStockId} />
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
                  <p className="text-xs font-bold">종목을 선택하면 주문 및 기업 분석 탭이 활성화됩니다.</p>
                </div>
              )}
            </div>
          </div>

          {/* TABLET LAYOUT (md to lg) */}
          <div className="hidden md:grid lg:hidden grid-cols-12 gap-1.5 p-2 flex-1 min-h-0 bg-[var(--color-hts-bg)]">
            <div className="col-span-4 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
              <StockList selected={selectedStockId} onSelect={(id) => setSelectedStockId(id)} />
            </div>

            <div className="col-span-8 flex flex-col gap-1.5 min-h-0">
              {selectedStockId ? (
                <>
                  <div className="flex-1 min-h-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                    <PriceChart stockId={selectedStockId} />
                  </div>
                  <div className="h-[280px] shrink-0 rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-[var(--color-hts-panel)]">
                    <Tabs defaultValue="order" className="h-full flex flex-col">
                      <TabsList className="grid grid-cols-3 bg-black/[0.01] dark:bg-black/35 border-b border-[var(--color-hts-border)] p-1 shrink-0 rounded-none">
                        <TabsTrigger value="order" className="text-[11px] font-bold py-1.5 cursor-pointer">즉시주문</TabsTrigger>
                        <TabsTrigger value="orderbook" className="text-[11px] font-bold py-1.5 cursor-pointer">호가창</TabsTrigger>
                        <TabsTrigger value="info" className="text-[11px] font-bold py-1.5 cursor-pointer">기업분석</TabsTrigger>
                      </TabsList>
                      <div className="flex-1 overflow-hidden">
                        <TabsContent value="order" className="h-full m-0 overflow-hidden">
                          <OrderPanel stockId={selectedStockId} />
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
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs rounded-2xl border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)]">
                  종목을 선택해 주세요.
                </div>
              )}
            </div>
          </div>

          {/* MOBILE MTS SUB-TAB SYSTEM (under md) */}
          <div className="flex md:hidden flex-col flex-1 min-h-0 bg-[var(--color-hts-bg)]">
            {/* Sub-tab header */}
            <div className="h-10 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] grid grid-cols-3 shrink-0">
              <button
                onClick={() => setMobileTradingTab('stocks')}
                className={cn(
                  "text-[11px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all",
                  mobileTradingTab === 'stocks'
                    ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
                    : "border-transparent text-muted-foreground"
                )}
              >
                종목선택
              </button>
              <button
                disabled={!selectedStockId}
                onClick={() => setMobileTradingTab('chart')}
                className={cn(
                  "text-[11px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50",
                  mobileTradingTab === 'chart'
                    ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
                    : "border-transparent text-muted-foreground"
                )}
              >
                차트/호가
              </button>
              <button
                disabled={!selectedStockId}
                onClick={() => setMobileTradingTab('trade')}
                className={cn(
                  "text-[11px] font-black cursor-pointer border-b-2 flex items-center justify-center transition-all disabled:opacity-50",
                  mobileTradingTab === 'trade'
                    ? "border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]"
                    : "border-transparent text-muted-foreground"
                )}
              >
                주문/분석
              </button>
            </div>

            {/* Sub-tab contents */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobileTradingTab === 'stocks' && (
                <StockList 
                  selected={selectedStockId} 
                  onSelect={(id) => {
                    setSelectedStockId(id);
                    setMobileTradingTab('chart');
                  }} 
                />
              )}

              {mobileTradingTab === 'chart' && selectedStockId && (
                <div className="h-full flex flex-col divide-y divide-[var(--color-hts-border)]">
                  <div className="flex-1 min-h-0">
                    <PriceChart stockId={selectedStockId} />
                  </div>
                  <div className="h-[180px] shrink-0">
                    <OrderBook stockId={selectedStockId} />
                  </div>
                </div>
              )}

              {mobileTradingTab === 'trade' && selectedStockId && (
                <Tabs defaultValue="order" className="h-full flex flex-col">
                  <TabsList className="grid grid-cols-2 rounded-none border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/30 p-1 shrink-0">
                    <TabsTrigger value="order" className="text-xs font-bold py-1.5 cursor-pointer">즉시주문</TabsTrigger>
                    <TabsTrigger value="info" className="text-xs font-bold py-1.5 cursor-pointer">기업분석</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="order" className="h-full m-0 overflow-hidden">
                      <OrderPanel stockId={selectedStockId} />
                    </TabsContent>
                    <TabsContent value="info" className="h-full m-0 overflow-hidden">
                      <CompanyInfoPanel stockId={selectedStockId} />
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. PORTFOLIO WORKSPACE */}
      {activeWorkspace === 'portfolio' && (
        <div className="h-full overflow-hidden bg-[var(--color-hts-bg)] p-2">
          <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
            <PortfolioPanel />
          </div>
        </div>
      )}

      {/* 3. NEWS WORKSPACE */}
      {activeWorkspace === 'news' && (
        <div className="h-full overflow-hidden bg-[var(--color-hts-bg)] p-2">
          <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
            <NewsPanel />
          </div>
        </div>
      )}

      {/* 4. GLOSSARY WORKSPACE */}
      {activeWorkspace === 'glossary' && (
        <div className="h-full overflow-hidden bg-[var(--color-hts-bg)] p-2">
          <div className="h-full rounded-2xl border border-[var(--color-hts-border)] overflow-hidden shadow-lg bg-[var(--color-hts-panel)]">
            <GlossaryHub />
          </div>
        </div>
      )}

      {/* FOOTER STATUS BAR (Desktop Only) */}
      <footer className="hidden lg:flex h-7 shrink-0 items-center justify-between px-6 text-[10px] text-muted-foreground border-t border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] z-20 font-bold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-price-up)] animate-pulse" />
            <span>DAY {dayCount}</span>
          </div>
          <span>|</span>
          <div className="flex items-center gap-1">
            <span>난이도:</span>
            <select
              value={level}
              onChange={(e) => {
                const newLevel = e.target.value as Level;
                setLevel(newLevel);
                toast.success(`학습 레벨이 ${newLevel === 'elementary' ? '초급' : newLevel === 'middle' ? '중급' : '고급'}으로 전환되었습니다.`);
              }}
              className="bg-transparent hover:bg-black/5 dark:hover:bg-white/5 px-1 py-0.5 rounded text-[10px] font-bold border-none focus:outline-none cursor-pointer text-muted-foreground hover:text-foreground transition-all font-sans"
            >
              <option value="elementary" className="bg-[var(--color-hts-panel)] text-foreground">초급</option>
              <option value="middle" className="bg-[var(--color-hts-panel)] text-foreground">중급</option>
              <option value="high" className="bg-[var(--color-hts-panel)] text-foreground">고급</option>
            </select>
          </div>
          <span>|</span>
          <span>상장 종목 수: {stockIds.length}개</span>
        </div>
        <div className="flex items-center gap-4">
          <span>평가자산: {totalAsset.toLocaleString()}원</span>
          <span>|</span>
          <span className={cn(
            totalProfitRate > 0 ? 'text-[var(--color-price-up)]' : totalProfitRate < 0 ? 'text-[var(--color-price-down)]' : ''
          )}>
            누적수익률: {totalProfitRate > 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%
          </span>
          <span>|</span>
          <span>예수금: {cash.toLocaleString()}원</span>
          <span>|</span>
          <span className="text-muted-foreground/60">© 스탁스쿨 (StockSchool) Premium Edu</span>
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
    </>
  );
}
