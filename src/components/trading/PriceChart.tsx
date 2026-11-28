import { useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import {
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  ColorType,
  LineStyle,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { formatSignedPct } from '../../lib/tradingMetrics';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  stockId: string;
  onTradeClick?: () => void;
  onAnalyzeClick?: () => void;
}

export default function PriceChart({ stockId, onTradeClick, onAnalyzeClick }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const avgPriceLineRef = useRef<IPriceLine | null>(null);

  const { stocks, holdings, theme, tutorialStep, level, dayCount } = useGameStore();
  const stock = stocks[stockId];
  const holding = holdings[stockId];

  useEffect(() => {
    if (!chartContainerRef.current || !stock) return;

    const historyStartOffset = Math.max(0, dayCount - stock.priceHistory.length);
    const getDateString = (index: number) => {
      const date = new Date(2026, 0, 1);
      date.setDate(date.getDate() + historyStartOffset + index);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
      avgPriceLineRef.current = null;
    }

    const container = chartContainerRef.current;

    // Resolve theme colors
    const isDark = theme === 'dark';
    const textColor = isDark ? '#9CA3AF' : '#4B5563';
    const gridColor = isDark ? 'rgba(31, 41, 55, 0.4)' : 'rgba(226, 232, 240, 0.8)';
    const borderColor = isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(226, 232, 240, 0.8)';

    const priceUpColor = isDark ? '#FF375F' : '#E11D48';
    const priceDownColor = isDark ? '#0A84FF' : '#2563EB';
    const goldColor = isDark ? '#FBBF24' : '#D97706';

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: textColor,
        fontSize: 12,
        fontFamily: 'Pretendard Variable, Inter, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: goldColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: goldColor,
        },
        horzLine: {
          color: goldColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: goldColor,
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: false,
      },
    });

    chartRef.current = chart;

    const isOverallUp =
      stock.priceHistory[stock.priceHistory.length - 1] >= stock.priceHistory[0];

    // Area series for gradient fill
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: isOverallUp
        ? isDark
          ? 'rgba(255, 55, 95, 0.22)'
          : 'rgba(225, 29, 72, 0.12)'
        : isDark
          ? 'rgba(10, 132, 255, 0.22)'
          : 'rgba(37, 99, 235, 0.12)',
      bottomColor: 'transparent',
      lineColor: isOverallUp ? priceUpColor : priceDownColor,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      priceLineColor: goldColor,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    areaSeriesRef.current = areaSeries;

    // Create data
    const data = stock.priceHistory.map((price: number, i: number) => ({
      time: getDateString(i),
      value: price,
    }));

    areaSeries.setData(data);

    // Moving average (5-day)
    if (stock.priceHistory.length >= 5) {
      const ma5Series = chart.addSeries(LineSeries, {
        color: goldColor,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const ma5Data: { time: string; value: number }[] = [];
      for (let i = 4; i < stock.priceHistory.length; i++) {
        const sum = stock.priceHistory
          .slice(i - 4, i + 1)
          .reduce((a: number, b: number) => a + b, 0);
        ma5Data.push({
          time: getDateString(i),
          value: Math.round(sum / 5),
        });
      }
      ma5Series.setData(ma5Data);
    }

    // Volume bars (simulated)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    const volumeData = stock.priceHistory.map((price: number, i: number) => {
      const prev = i > 0 ? stock.priceHistory[i - 1] : price;
      const recordedVolume = stock.volumeHistory?.[i];
      return {
        time: getDateString(i),
        value: typeof recordedVolume === 'number' ? recordedVolume : 20000,
        color:
          price >= prev
            ? isDark
              ? 'rgba(255, 55, 95, 0.35)'
              : 'rgba(225, 29, 72, 0.25)'
            : isDark
              ? 'rgba(10, 132, 255, 0.35)'
              : 'rgba(37, 99, 235, 0.25)',
      };
    });
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
      avgPriceLineRef.current = null;
    };
  }, [stockId, stock, level, dayCount, theme]);

  // Sync user's average purchase price line onto the chart without recreating chart
  const avgPrice = holding && holding.quantity > 0 ? holding.avgPrice : null;
  useEffect(() => {
    const series = areaSeriesRef.current;
    if (!series) return;

    if (avgPriceLineRef.current) {
      series.removePriceLine(avgPriceLineRef.current);
      avgPriceLineRef.current = null;
    }

    if (avgPrice !== null) {
      const isDark = theme === 'dark';
      avgPriceLineRef.current = series.createPriceLine({
        price: avgPrice,
        color: isDark ? '#FBBF24' : '#D97706',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: '내 평단',
      });
    }
  }, [avgPrice, stockId, stock, level, dayCount, theme]);

  if (!stock) return null;

  const prev =
    stock.priceHistory.length > 1
      ? stock.priceHistory[stock.priceHistory.length - 2]
      : stock.currentPrice;
  const diff = stock.currentPrice - prev;
  const pct = prev > 0 ? (diff / prev) * 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;

  const holdingProfitRate =
    holding && holding.quantity > 0 && holding.avgPrice > 0
      ? ((stock.currentPrice - holding.avgPrice) / holding.avgPrice) * 100
      : null;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-[var(--color-hts-panel)] transition-all duration-300',
        tutorialStep === 3 &&
          'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30 relative animate-pulse'
      )}
    >
      {/* Tutorial Instruction Banner */}
      {tutorialStep === 3 && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black flex items-center justify-between border-b border-amber-600 shadow-md animate-fade-in shrink-0 relative z-30 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block animate-bounce">📊</span> 3단계: 시세 차트와 아래의 오늘의 뉴스 요약·보유잔고·거래현황을 함께 확인해 보세요!
          </span>
          <span className="text-[11px] bg-slate-950 text-white px-2.5 py-0.5 rounded font-black shrink-0">
            분석 단계
          </span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-lg text-foreground tracking-tight leading-tight">
                {stock.name}
              </h2>
              {holding && holding.quantity > 0 && holdingProfitRate !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black tabular-nums border',
                    holdingProfitRate > 0
                      ? 'bg-[var(--color-price-up)]/10 text-[var(--color-price-up)] border-[var(--color-price-up)]/25'
                      : holdingProfitRate < 0
                        ? 'bg-[var(--color-price-down)]/10 text-[var(--color-price-down)] border-[var(--color-price-down)]/25'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                  )}
                >
                  보유 {holding.quantity}주 · 평단 {holding.avgPrice.toLocaleString()}원 (
                  {formatSignedPct(holdingProfitRate, 1)})
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-bold">{stock.sector}</span>
          </div>
          <div className="border-l border-[var(--color-hts-border)] pl-4 sm:pl-5">
            <div
              className={`text-2xl font-black tabular-nums tracking-tight leading-tight ${
                isUp
                  ? 'text-[var(--color-price-up)]'
                  : isDown
                    ? 'text-[var(--color-price-down)]'
                    : 'text-foreground'
              }`}
            >
              {stock.currentPrice.toLocaleString()}
              <span className="text-sm font-bold ml-0.5 text-foreground/80">원</span>
            </div>
            <div
              className={`text-[13px] font-extrabold mt-0.5 tabular-nums ${
                isUp
                  ? 'text-[var(--color-price-up)]'
                  : isDown
                    ? 'text-[var(--color-price-down)]'
                    : 'text-[var(--color-price-flat)]'
              }`}
            >
              {isUp ? '▲' : isDown ? '▼' : ''} {Math.abs(diff).toLocaleString()} (
              {pct > 0 ? '+' : ''}
              {pct.toFixed(2)}%)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAnalyzeClick && (
            <button
              type="button"
              onClick={onAnalyzeClick}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] text-foreground border border-[var(--color-hts-border)] rounded-lg cursor-pointer transition-all active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
              <span>기업 분석</span>
            </button>
          )}
          {onTradeClick && (
            <button
              type="button"
              onClick={onTradeClick}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] rounded-lg cursor-pointer shadow-sm transition-all active:scale-95 border-transparent"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>주문하기</span>
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1 min-h-0 w-full" />
    </div>
  );
}
