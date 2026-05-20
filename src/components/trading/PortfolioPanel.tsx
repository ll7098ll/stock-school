import { useGameStore } from '../../stores/gameStore';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';
import { Wallet, PieChart as PieIcon, TrendingUp, TrendingDown, Landmark, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export default function PortfolioPanel() {
  const { cash, holdings, stocks, initialCash, totalAssetHistory, theme, tutorialStep } = useGameStore();

  const isDark = theme === 'dark';

  const { 
    holdingList, 
    totalStockValue, 
    totalAsset, 
    totalProfit, 
    totalProfitRate 
  } = useMemo(() => {
    let stockVal = 0;
    const list = Object.entries(holdings).map(([id, holding]) => {
      const stock = stocks[id];
      if (!stock) return null;
      const currentValue = stock.currentPrice * holding.quantity;
      const buyValue = holding.avgPrice * holding.quantity;
      const profit = currentValue - buyValue;
      const profitRate = buyValue > 0 ? (profit / buyValue) * 100 : 0;
      stockVal += currentValue;
      return { 
        id, 
        name: stock.name, 
        sector: stock.sector, 
        quantity: holding.quantity, 
        avgPrice: holding.avgPrice, 
        currentPrice: stock.currentPrice, 
        currentValue, 
        profit, 
        profitRate 
      };
    }).filter(Boolean) as any[];
    
    const total = cash + stockVal;
    return {
      holdingList: list,
      totalStockValue: stockVal,
      totalAsset: total,
      totalProfit: total - initialCash,
      totalProfitRate: initialCash > 0 ? ((total - initialCash) / initialCash) * 100 : 0
    };
  }, [cash, holdings, stocks, initialCash]);

  // Chart data for Asset Trend
  const assetTrendData = useMemo(() => {
    return totalAssetHistory.map((val, idx) => ({
      day: `DAY ${idx + 1}`,
      '총 자산': val
    }));
  }, [totalAssetHistory]);

  // Chart data for Asset Allocation
  const assetAllocationData = useMemo(() => {
    const data = [
      { name: '예수금 (현금)', value: cash, color: isDark ? '#475569' : '#CBD5E1' } // Muted Slate/Silver
    ];
    
    // Group stocks by sector
    const sectorValues: Record<string, number> = {};
    holdingList.forEach((item: any) => {
      sectorValues[item.sector] = (sectorValues[item.sector] || 0) + item.currentValue;
    });

    // Premium HTS Palette for Sectors (Monochrome & Stock Points, No Green)
    const sectorColors = [
      isDark ? '#3182F6' : '#0A84FF', // Stock Blue
      isDark ? '#F04452' : '#FF453A', // Stock Red
      isDark ? '#64748B' : '#94A3B8', // Slate Gray
      isDark ? '#6366F1' : '#818CF8', // Indigo
      isDark ? '#334155' : '#E2E8F0', // Steel Charcoal
    ];

    Object.entries(sectorValues).forEach(([sector, val], idx) => {
      if (val > 0) {
        data.push({
          name: sector,
          value: val,
          color: sectorColors[idx % sectorColors.length]
        });
      }
    });

    return data;
  }, [cash, holdingList, isDark]);

  const isProfit = totalProfit > 0;
  const isLoss = totalProfit < 0;

  // Custom tooltips
  const formatYAxis = (tick: number) => {
    if (tick >= 10000) return `${(tick / 10000).toFixed(0)}만`;
    return tick.toString();
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden transition-all duration-300",
      tutorialStep === 5 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative animate-pulse"
    )}>
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 5 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">💼</span> 5단계: 현재 나의 전체 평가자산, 예수금, 그리고 실시간 누적 수익률 보고서를 확인해 보세요!
          </span>
          <span className="text-[9px] bg-slate-950 text-white px-2 py-0.5 rounded font-black shrink-0">자산 보고</span>
        </div>
      )}
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-hts-border)] flex items-center justify-between bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[var(--color-accent-gold)]" />
          <span className="font-extrabold text-sm text-foreground tracking-tight">자산 포트폴리오 분석</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[var(--color-accent-gold)]" />
          PORTFOLIO ANALYTICS
        </span>
      </div>

      {/* Asset summary row (Premium Grid Box) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/20 font-sans shrink-0">
        <div className="p-3 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
          <div className="text-[10px] text-muted-foreground font-bold">총 평가자산</div>
          <div className="font-black text-sm md:text-base text-foreground mt-0.5 tabular-nums">{totalAsset.toLocaleString()}원</div>
        </div>
        <div className="p-3 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
          <div className="text-[10px] text-muted-foreground font-bold">주문가능 예수금</div>
          <div className="font-bold text-sm md:text-base text-foreground mt-0.5 tabular-nums">{cash.toLocaleString()}원</div>
        </div>
        <div className="p-3 border-r border-[var(--color-hts-border)]">
          <div className="text-[10px] text-muted-foreground font-bold">보유주식 평가금</div>
          <div className="font-bold text-sm md:text-base text-foreground mt-0.5 tabular-nums">{totalStockValue.toLocaleString()}원</div>
        </div>
        <div className="p-3 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.01]">
          <div className="text-[10px] text-muted-foreground font-bold">누적 손익 / 수익률</div>
          <div className={cn("font-black text-sm md:text-base mt-0.5 tabular-nums flex items-center gap-1",
            isProfit ? 'text-[var(--color-price-up)]' : isLoss ? 'text-[var(--color-price-down)]' : 'text-muted-foreground'
          )}>
            {isProfit && <TrendingUp className="w-3.5 h-3.5 inline" />}
            {isLoss && <TrendingDown className="w-3.5 h-3.5 inline" />}
            <span>{totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()}원</span>
            <span className="text-xs font-extrabold opacity-90">({totalProfitRate > 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%)</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          
          {/* CHARTS CONTAINER */}
          {totalAssetHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Asset Trend Area Chart */}
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[220px]">
                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                  자산 성장 추이
                </h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={assetTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 
                        fontSize={9} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 
                        fontSize={9} 
                        tickLine={false}
                        tickFormatter={formatYAxis} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: isDark ? '#0D1322' : '#FFFFFF', 
                          borderColor: 'var(--color-hts-border)', 
                          borderRadius: '12px',
                          color: isDark ? '#FFF' : '#000',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`${value.toLocaleString()}원`, '총 자산']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="총 자산" 
                        stroke={isProfit ? 'var(--price-up)' : 'var(--price-down)'} 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorAsset)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Asset Allocation Pie Chart */}
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[220px]">
                <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <PieIcon className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                  포트폴리오 비중
                </h4>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="40%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {assetAllocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: isDark ? '#0D1322' : '#FFFFFF', 
                          borderColor: 'var(--color-hts-border)', 
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`${value.toLocaleString()}원`, '평가금액']}
                      />
                      <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* HOLDINGS TABLE */}
          <div className="rounded-2xl border border-[var(--color-hts-border)] overflow-hidden bg-black/[0.01] dark:bg-black/10">
            {holdingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <PieIcon className="w-10 h-10 mb-2 opacity-35 text-[var(--color-accent-gold)]" />
                <p className="text-xs font-bold text-foreground/75">보유 중인 주식이 없습니다.</p>
                <p className="text-[10px] mt-1 opacity-60">트레이딩 룸에서 종목을 골라 첫 매수 주문을 넣어보세요.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-black/[0.02] dark:bg-black/30 border-b border-[var(--color-hts-border)] text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 text-left pl-5">종목명 / 섹터</th>
                      <th className="p-3 text-right">보유 수량</th>
                      <th className="p-3 text-right">평균 매수가</th>
                      <th className="p-3 text-right">현재가</th>
                      <th className="p-3 text-right">평가금액</th>
                      <th className="p-3 text-right pr-5">평가손익 (수익률)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-hts-border)]/40">
                    {holdingList.map(item => {
                      const itemProfit = item.profit > 0;
                      const itemLoss = item.profit < 0;
                      return (
                        <tr key={item.id} className="hover:bg-[var(--color-hts-hover)] transition-colors duration-150">
                          <td className="p-3.5 pl-5 font-bold text-foreground">
                            <div className="text-xs md:text-sm">{item.name}</div>
                            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-wider mt-0.5">{item.sector}</div>
                          </td>
                          <td className="p-3.5 text-right font-bold text-foreground/90 tabular-nums text-xs md:text-sm">{item.quantity}주</td>
                          <td className="p-3.5 text-right text-muted-foreground/90 tabular-nums text-xs md:text-sm">{item.avgPrice.toLocaleString()}원</td>
                          <td className="p-3.5 text-right font-bold text-foreground tabular-nums text-xs md:text-sm">{item.currentPrice.toLocaleString()}원</td>
                          <td className="p-3.5 text-right font-bold text-foreground/90 tabular-nums text-xs md:text-sm">{item.currentValue.toLocaleString()}원</td>
                          <td className={cn("p-3.5 text-right font-extrabold pr-5 tabular-nums text-xs md:text-sm",
                            itemProfit ? 'text-[var(--color-price-up)]' :
                            itemLoss ? 'text-[var(--color-price-down)]' : 'text-muted-foreground'
                          )}>
                            <div>{item.profit > 0 ? '+' : ''}{item.profit.toLocaleString()}원</div>
                            <div className="text-[10px] font-black opacity-85 mt-0.5">
                              {item.profitRate > 0 ? '+' : ''}{item.profitRate.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
