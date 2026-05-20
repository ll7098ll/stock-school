import { useGameStore, type Level } from '../../stores/gameStore';
import { LogOut, CalendarDays, SkipForward, Sun, Moon } from 'lucide-react';
import SchoolLogo from './SchoolLogo';
import { Button } from '../ui/button';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { useMemo } from 'react';

export default function Header() {
  const { displayName, dayCount, nextDay, level, setLevel, stocks, cash, holdings, initialCash, theme, toggleTheme } = useGameStore();

  // Calculate total assets for header display
  const { totalAsset, totalProfitRate } = useMemo(() => {
    let stockValue = 0;
    Object.entries(holdings).forEach(([id, h]) => {
      const stock = stocks[id];
      if (stock) stockValue += stock.currentPrice * h.quantity;
    });
    const total = cash + stockValue;
    const rate = ((total - initialCash) / initialCash) * 100;
    return { totalAsset: total, totalProfitRate: rate };
  }, [holdings, stocks, cash, initialCash]);

  // Top movers for ticker
  const tickerStocks = useMemo(() => {
    return Object.values(stocks).map(s => {
      const prev = s.priceHistory.length > 1 ? s.priceHistory[s.priceHistory.length - 2] : s.currentPrice;
      const diff = s.currentPrice - prev;
      const pct = prev > 0 ? (diff / prev) * 100 : 0;
      return { name: s.name, price: s.currentPrice, diff, pct };
    });
  }, [stocks]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('로그아웃 되었습니다.');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <header className="shrink-0 border-b border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] shadow-sm z-30 relative">
      {/* Ticker Bar */}
      <div className="h-7 overflow-hidden border-b border-[var(--color-hts-border)] bg-black/[0.04] dark:bg-black/30 flex items-center">
        <div className="flex items-center gap-1 px-3 shrink-0 border-r border-[var(--color-hts-border)] h-full bg-white/50 dark:bg-black/10">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-price-up)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-price-up)]"></span>
          </span>
          <span className="text-[10px] font-bold text-foreground opacity-80 uppercase tracking-widest">LIVE</span>
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-8 animate-ticker whitespace-nowrap py-1">
            {[...tickerStocks, ...tickerStocks].map((s, i) => (
              <span key={i} className="text-[11px] inline-flex items-center gap-1.5 font-sans">
                <span className="text-muted-foreground font-medium">{s.name}</span>
                <span className={`font-bold ${
                  s.diff > 0 ? 'text-[var(--color-price-up)]' :
                  s.diff < 0 ? 'text-[var(--color-price-down)]' : 'text-[var(--color-price-flat)]'
                }`}>
                  {s.price.toLocaleString()}
                </span>
                <span className={`text-[10px] font-semibold ${
                  s.diff > 0 ? 'text-[var(--color-price-up)]' :
                  s.diff < 0 ? 'text-[var(--color-price-down)]' : 'text-[var(--color-price-flat)]'
                }`}>
                  {s.pct > 0 ? '▲' : s.pct < 0 ? '▼' : '━'}{Math.abs(s.pct).toFixed(1)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SchoolLogo className="w-8 h-8 shrink-0 filter drop-shadow-sm" />
            <h1 className="text-xl font-black tracking-tight font-sans text-foreground">
              스탁스쿨
            </h1>
          </div>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground border-l border-[var(--color-hts-border)] pl-4 ml-1">
            <span className="font-semibold text-foreground/80">{displayName}</span>
            <select
              value={level}
              onChange={(e) => {
                const newLevel = e.target.value as Level;
                setLevel(newLevel);
                toast.success(`학습 레벨이 ${newLevel === 'elementary' ? '초급' : newLevel === 'middle' ? '중급' : '고급'}으로 전환되었습니다.`);
              }}
              className="bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[var(--color-accent-gold)]/20 focus:outline-none cursor-pointer hover:bg-[var(--color-accent-gold)]/25 dark:bg-[var(--color-accent-gold)]/20 dark:hover:bg-[var(--color-accent-gold)]/30 transition-all font-sans"
            >
              <option value="elementary" className="bg-[var(--color-hts-panel)] text-foreground">초급</option>
              <option value="middle" className="bg-[var(--color-hts-panel)] text-foreground">중급</option>
              <option value="high" className="bg-[var(--color-hts-panel)] text-foreground">고급</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Asset summary */}
          <div className="hidden md:flex items-center gap-5 text-xs mr-4 py-1.5 px-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--color-hts-border)]">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground">총 자산</span>
              <span className="font-bold text-foreground text-sm tracking-tight">{totalAsset.toLocaleString()}<span className="text-[10px] text-muted-foreground ml-0.5">원</span></span>
            </div>
            <div className="w-[1px] h-6 bg-[var(--color-hts-border)]" />
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground">누적 수익률</span>
              <span className={`font-extrabold text-sm tracking-tight ${
                totalProfitRate > 0 ? 'text-[var(--color-price-up)]' : 
                totalProfitRate < 0 ? 'text-[var(--color-price-down)]' : 'text-muted-foreground'
              }`}>
                {totalProfitRate > 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--color-hts-border)] px-3 py-1.5 rounded-lg">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
            <span className="font-black text-xs font-sans tracking-wider text-foreground">DAY {dayCount}</span>
          </div>
          
          <Button 
            onClick={nextDay} 
            size="sm" 
            className="h-9 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] font-extrabold text-xs px-4 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 gap-1.5 border-transparent cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>다음 날</span>
          </Button>

          <div className="w-[1px] h-6 bg-[var(--color-hts-border)] mx-1" />
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            title="테마 변경" 
            className="h-9 w-9 rounded-lg hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground transition-all"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[var(--color-accent-gold)]" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            title="로그아웃" 
            className="h-9 w-9 rounded-lg hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground transition-all"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
