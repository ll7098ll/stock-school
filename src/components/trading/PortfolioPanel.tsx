import { useGameStore } from '../../stores/gameStore';
import { cn } from '../../lib/utils';
import {
  Wallet,
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Landmark,
  Target,
} from 'lucide-react';
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
  Legend,
} from 'recharts';

export default function PortfolioPanel() {
  const {
    cash,
    holdings,
    stocks,
    initialCash,
    totalAssetHistory,
    theme,
    tutorialStep,
    predictionStats,
  } = useGameStore();

  const isDark = theme === 'dark';

  const { holdingList, totalStockValue, totalAsset, totalProfit, totalProfitRate } = useMemo(() => {
    let stockVal = 0;
    const list = Object.entries(holdings)
      .map(([id, holding]) => {
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
          profitRate,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const total = cash + stockVal;
    return {
      holdingList: list,
      totalStockValue: stockVal,
      totalAsset: total,
      totalProfit: total - initialCash,
      totalProfitRate: initialCash > 0 ? ((total - initialCash) / initialCash) * 100 : 0,
    };
  }, [cash, holdings, stocks, initialCash]);

  // Chart data for Asset Trend
  const assetTrendData = useMemo(() => {
    return totalAssetHistory.map((val, idx) => ({
      day: `DAY ${idx + 1}`,
      '총 자산': val,
    }));
  }, [totalAssetHistory]);

  // Chart data for Asset Allocation
  const assetAllocationData = useMemo(() => {
    const data = [
      { name: '예수금 (현금)', value: cash, color: isDark ? '#475569' : '#CBD5E1' },
    ];

    const sectorValues: Record<string, number> = {};
    holdingList.forEach((item) => {
      sectorValues[item.sector] = (sectorValues[item.sector] || 0) + item.currentValue;
    });

    const sectorColors = [
      isDark ? '#3182F6' : '#0A84FF',
      isDark ? '#F04452' : '#FF453A',
      isDark ? '#64748B' : '#94A3B8',
      isDark ? '#6366F1' : '#818CF8',
      isDark ? '#334155' : '#94A3B8',
    ];

    Object.entries(sectorValues).forEach(([sector, val], idx) => {
      if (val > 0) {
        data.push({
          name: sector.split('(')[0],
          value: val,
          color: sectorColors[idx % sectorColors.length],
        });
      }
    });

    return data;
  }, [cash, holdingList, isDark]);

  const isProfit = totalProfit > 0;
  const isLoss = totalProfit < 0;
  const accuracyPct =
    predictionStats.total > 0
      ? Math.round((predictionStats.correct / predictionStats.total) * 100)
      : null;

  const formatYAxis = (tick: number) => {
    if (tick >= 10000) return `${(tick / 10000).toFixed(0)}만`;
    return tick.toString();
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] overflow-hidden transition-all duration-300',
        tutorialStep === 5 &&
          'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 5 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">💼</span> 5단계: 내 전체 평가자산, 섹터 비중, 그리고 누적 뉴스 독해 적중률을 확인해 보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2.5 py-0.5 rounded font-black shrink-0">
            자산 보고
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[var(--color-hts-border)] flex items-center justify-between gap-2 flex-wrap bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[var(--color-accent-gold)]" />
          <span className="font-black text-base text-foreground tracking-tight">
            자산 포트폴리오 분석
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/12 border border-amber-500/25 text-xs font-extrabold text-amber-800 dark:text-amber-300">
          <Target className="w-3.5 h-3.5" />
          <span>
            뉴스 독해 적중률:{' '}
            {accuracyPct !== null
              ? `${accuracyPct}% (${predictionStats.correct}/${predictionStats.total})`
              : '아직 기록 없음'}
          </span>
        </div>
      </div>

      {/* Asset summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-black/20 font-sans shrink-0">
        <div className="p-3.5 sm:p-4 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
          <div className="text-xs text-muted-foreground font-bold">총 평가자산</div>
          <div className="font-black text-base md:text-lg text-foreground mt-1 tabular-nums">
            {totalAsset.toLocaleString()}원
          </div>
        </div>
        <div className="p-3.5 sm:p-4 border-r border-b lg:border-b-0 border-[var(--color-hts-border)]">
          <div className="text-xs text-muted-foreground font-bold">주문가능 예수금</div>
          <div className="font-extrabold text-base md:text-lg text-foreground mt-1 tabular-nums">
            {cash.toLocaleString()}원
          </div>
        </div>
        <div className="p-3.5 sm:p-4 border-r border-[var(--color-hts-border)]">
          <div className="text-xs text-muted-foreground font-bold">보유주식 평가금</div>
          <div className="font-extrabold text-base md:text-lg text-foreground mt-1 tabular-nums">
            {totalStockValue.toLocaleString()}원
          </div>
        </div>
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.01]">
          <div className="text-xs text-muted-foreground font-bold">누적 손익 / 수익률</div>
          <div
            className={cn(
              'font-black text-base md:text-lg mt-1 tabular-nums flex items-center gap-1 flex-wrap',
              isProfit
                ? 'text-[var(--color-price-up)]'
                : isLoss
                  ? 'text-[var(--color-price-down)]'
                  : 'text-muted-foreground'
            )}
          >
            {isProfit && <TrendingUp className="w-4 h-4 inline shrink-0" />}
            {isLoss && <TrendingDown className="w-4 h-4 inline shrink-0" />}
            <span>
              {totalProfit > 0 ? '+' : ''}
              {totalProfit.toLocaleString()}원
            </span>
            <span className="text-xs font-extrabold opacity-90">
              ({totalProfitRate > 0 ? '+' : ''}
              {totalProfitRate.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="p-4 sm:p-5 space-y-5">
          {/* CHARTS CONTAINER */}
          {totalAssetHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Asset Trend Area Chart */}
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[240px]">
                <h4 className="text-[13px] font-black text-foreground mb-2.5 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-[var(--color-accent-gold)]" />
                  자산 성장 추이
                </h4>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={assetTrendData}
                      margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorAsset" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'}
                            stopOpacity={0.25}
                          />
                          <stop
                            offset="95%"
                            stopColor={isProfit ? 'var(--price-up)' : 'var(--price-down)'}
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? '#0D1322' : '#FFFFFF',
                          borderColor: 'var(--color-hts-border)',
                          borderRadius: '12px',
                          color: isDark ? '#FFF' : '#000',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        formatter={(value: unknown) => [
                          `${Number(value).toLocaleString()}원`,
                          '총 자산',
                        ]}
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
              <div className="p-4 rounded-2xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col h-[240px]">
                <h4 className="text-[13px] font-black text-foreground mb-2.5 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-[var(--color-accent-gold)]" />
                  포트폴리오 비중
                </h4>
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetAllocationData}
                        cx="40%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={74}
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
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        formatter={(value: unknown) => [
                          `${Number(value).toLocaleString()}원`,
                          '평가금액',
                        ]}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
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
              <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground text-center">
                <PieIcon className="w-10 h-10 mb-2.5 opacity-35 text-[var(--color-accent-gold)]" />
                <p className="text-sm font-bold text-foreground/80">보유 중인 주식이 없습니다.</p>
                <p className="text-xs mt-1 opacity-75">
                  오늘의 뉴스를 분석한 뒤 모의투자 교실에서 첫 매수 주문을 넣어보세요.
                </p>
              </div>
            ) : (
              <div className="w-full">
                {/* Mobile Card List */}
                <div className="sm:hidden divide-y divide-[var(--color-hts-border)]/40">
                  {holdingList.map((item) => {
                    const itemProfit = item.profit > 0;
                    const itemLoss = item.profit < 0;
                    return (
                      <div
                        key={item.id}
                        className="p-4 space-y-3 hover:bg-[var(--color-hts-hover)] transition-colors duration-150"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-black text-foreground text-[15px]">
                              {item.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-bold ml-2">
                              {item.sector.split('(')[0]}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'text-xs font-black px-2.5 py-0.5 rounded-full',
                              itemProfit
                                ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)]'
                                : itemLoss
                                  ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)]'
                                  : 'bg-slate-500/10 text-slate-500'
                            )}
                          >
                            {item.profitRate > 0 ? '+' : ''}
                            {item.profitRate.toFixed(2)}%
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                          <div>
                            <span className="opacity-70 mr-1.5">보유수량</span>
                            <span className="text-foreground tabular-nums">{item.quantity}주</span>
                          </div>
                          <div>
                            <span className="opacity-70 mr-1.5">평가금액</span>
                            <span className="text-foreground tabular-nums">
                              {item.currentValue.toLocaleString()}원
                            </span>
                          </div>
                          <div>
                            <span className="opacity-70 mr-1.5">평균단가</span>
                            <span className="text-foreground/85 tabular-nums">
                              {item.avgPrice.toLocaleString()}원
                            </span>
                          </div>
                          <div>
                            <span className="opacity-70 mr-1.5">현재가격</span>
                            <span className="text-foreground/85 tabular-nums">
                              {item.currentPrice.toLocaleString()}원
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[var(--color-hts-border)]/30 flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground">평가손익</span>
                          <span
                            className={cn(
                              'font-black tabular-nums text-sm',
                              itemProfit
                                ? 'text-[var(--color-price-up)]'
                                : itemLoss
                                  ? 'text-[var(--color-price-down)]'
                                  : 'text-muted-foreground'
                            )}
                          >
                            {item.profit > 0 ? '+' : ''}
                            {item.profit.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto w-full">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-black/[0.02] dark:bg-black/30 border-b border-[var(--color-hts-border)] text-muted-foreground text-xs font-bold">
                      <tr>
                        <th className="p-3.5 text-left pl-5">종목명 / 섹터</th>
                        <th className="p-3.5 text-right">보유 수량</th>
                        <th className="p-3.5 text-right">평균 매수가</th>
                        <th className="p-3.5 text-right">현재가</th>
                        <th className="p-3.5 text-right">평가금액</th>
                        <th className="p-3.5 text-right pr-5">평가손익 (수익률)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-hts-border)]/40">
                      {holdingList.map((item) => {
                        const itemProfit = item.profit > 0;
                        const itemLoss = item.profit < 0;
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[var(--color-hts-hover)] transition-colors duration-150"
                          >
                            <td className="p-3.5 pl-5 font-bold text-foreground">
                              <div className="text-sm font-black">{item.name}</div>
                              <div className="text-xs text-muted-foreground font-semibold mt-0.5">
                                {item.sector}
                              </div>
                            </td>
                            <td className="p-3.5 text-right font-bold text-foreground tabular-nums">
                              {item.quantity}주
                            </td>
                            <td className="p-3.5 text-right text-muted-foreground tabular-nums">
                              {item.avgPrice.toLocaleString()}원
                            </td>
                            <td className="p-3.5 text-right font-bold text-foreground tabular-nums">
                              {item.currentPrice.toLocaleString()}원
                            </td>
                            <td className="p-3.5 text-right font-bold text-foreground tabular-nums">
                              {item.currentValue.toLocaleString()}원
                            </td>
                            <td
                              className={cn(
                                'p-3.5 text-right font-black pr-5 tabular-nums',
                                itemProfit
                                  ? 'text-[var(--color-price-up)]'
                                  : itemLoss
                                    ? 'text-[var(--color-price-down)]'
                                    : 'text-muted-foreground'
                              )}
                            >
                              <div>
                                {item.profit > 0 ? '+' : ''}
                                {item.profit.toLocaleString()}원
                              </div>
                              <div className="text-xs font-extrabold opacity-90 mt-0.5">
                                {item.profitRate > 0 ? '+' : ''}
                                {item.profitRate.toFixed(2)}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
