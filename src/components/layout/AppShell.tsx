import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { 
  LineChart, 
  Wallet, 
  Newspaper, 
  BookOpen, 
  LogOut, 
  Sun, 
  Moon, 
  SkipForward, 
  User, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import SchoolLogo from './SchoolLogo';

interface AppShellProps {
  children: React.ReactNode;
  activeWorkspace: 'trading' | 'portfolio' | 'news' | 'glossary';
  setActiveWorkspace: (workspace: 'trading' | 'portfolio' | 'news' | 'glossary') => void;
  onReplayTutorial?: () => void;
}

export default function AppShell({ children, activeWorkspace, setActiveWorkspace, onReplayTutorial }: AppShellProps) {
  const { 
    displayName, 
    level, 
    dayCount, 
    nextDay, 
    theme, 
    toggleTheme,
    tutorialStep
  } = useGameStore();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('성공적으로 로그아웃되었습니다.');
      window.location.href = '/';
    } catch (error) {
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const levelLabel = level === 'elementary' ? '초급' : level === 'middle' ? '중급' : '고급';
  const levelColor = level === 'elementary' ? 'from-slate-400 to-slate-500' : level === 'middle' ? 'from-slate-500 to-slate-600' : 'from-slate-700 to-slate-850';

  const menuItems = [
    { id: 'trading', label: '모의투자 교실', icon: LineChart },
    { id: 'portfolio', label: '자산 보고서', icon: Wallet },
    { id: 'news', label: '경제 뉴스분석', icon: Newspaper },
    { id: 'glossary', label: '용어 사전방', icon: BookOpen },
  ] as const;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-hts-bg)] text-foreground font-sans antialiased">
      {/* LEFT SIDEBAR (Desktop Only: lg and up) */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] transition-all duration-300 relative z-20 shadow-xl",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] hover:bg-[var(--color-hts-hover)] flex items-center justify-center text-muted-foreground hover:text-foreground shadow-md cursor-pointer z-30 transition-transform duration-200"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Sidebar Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--color-hts-border)] shrink-0">
          <SchoolLogo className="w-9 h-9 shrink-0 filter drop-shadow-sm" />
          {!isSidebarCollapsed && (
            <span className="text-lg font-black tracking-tight text-foreground transition-opacity duration-200">
              스탁스쿨
            </span>
          )}
        </div>

        {/* User profile card */}
        <div className={cn(
          "p-4 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col shrink-0 transition-all",
          isSidebarCollapsed ? "items-center" : "items-stretch"
        )}>
          {isSidebarCollapsed ? (
            <div className="w-10 h-10 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center border border-[var(--color-hts-border)] cursor-pointer" title={displayName || '게스트'}>
              <User className="w-4 h-4 text-[var(--color-accent-gold)]" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--color-hts-border)]/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-sm border border-[var(--color-hts-border)]">
                {displayName ? displayName[0].toUpperCase() : 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black truncate text-foreground">{displayName || '게스트'}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn("inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-r shadow-sm shadow-black/10", levelColor)}>
                    {levelLabel}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={cn(
                  "w-full flex items-center rounded-xl p-3 text-xs font-black cursor-pointer transition-all duration-200 group relative",
                  isActive
                    ? "bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/15 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-[var(--color-hts-hover)] border border-transparent"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 bg-[var(--color-accent-gold)] rounded-r-md" />
                )}
                <item.icon className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-[var(--color-accent-gold)]" : "text-muted-foreground group-hover:text-foreground",
                  isSidebarCollapsed ? "mr-0 mx-auto" : "mr-3"
                )} />
                {!isSidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
          {/* Replay Tutorial Button */}
          {onReplayTutorial && (
            <button
              onClick={onReplayTutorial}
              className={cn(
                "w-full flex items-center rounded-xl p-3 text-[11px] font-black cursor-pointer transition-all duration-200 group relative border border-dashed border-[var(--color-accent-gold)]/20 hover:border-[var(--color-accent-gold)]/50 text-muted-foreground hover:text-foreground hover:bg-[var(--color-hts-hover)] mt-4 shadow-sm"
              )}
              title={isSidebarCollapsed ? "튜토리얼 다시 보기" : undefined}
            >
              <span className={cn(
                "flex items-center justify-center shrink-0 w-4 h-4 text-xs font-bold",
                isSidebarCollapsed ? "mr-0 mx-auto" : "mr-3"
              )}>
                🏫
              </span>
              {!isSidebarCollapsed && (
                <span className="truncate">튜토리얼 다시 보기</span>
              )}
            </button>
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[var(--color-hts-border)] shrink-0 flex flex-col gap-2">
          {/* Day progression visual indicator */}
          {!isSidebarCollapsed && (
            <div className={cn(
              "mb-2 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.02] border border-[var(--color-hts-border)]/60 text-center relative overflow-hidden transition-all duration-300",
              tutorialStep === 7 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30"
            )}>
              {tutorialStep === 7 && (
                <div className="absolute inset-x-0 top-0 bg-amber-500 text-slate-950 text-[9px] font-black py-1 px-2 border-b border-amber-600 animate-pulse text-center select-none z-10">
                  🚀 7단계: 다음 날 진행
                </div>
              )}
              <div className={cn(
                "text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1",
                tutorialStep === 7 && "mt-4"
              )}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                DAY PROGRESS
              </div>
              <div className="text-lg font-black text-foreground font-mono tracking-wider">
                DAY {dayCount}
              </div>
              <Button 
                onClick={nextDay} 
                className="w-full mt-2.5 bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] font-extrabold text-xs py-2 rounded-lg shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-transparent"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>다음 날 진행</span>
              </Button>
            </div>
          )}

          {isSidebarCollapsed && (
            <button 
              onClick={nextDay}
              className={cn(
                "w-10 h-10 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] flex items-center justify-center shadow-md cursor-pointer mx-auto mb-2 shrink-0 transition-all active:scale-95 border-transparent duration-300",
                tutorialStep === 7 && "ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30"
              )}
              title={`다음 날로 진행 (DAY ${dayCount})`}
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          <div className={cn(
            "flex items-center gap-1",
            isSidebarCollapsed ? "flex-col items-center" : "justify-between"
          )}>
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground cursor-pointer"
              title="화면 테마 변경"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-[var(--color-accent-gold)]" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-slate-700" />
              )}
            </Button>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"
              title="로그아웃"
            >
              <LogOut className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP NAVIGATION BAR (under lg) */}
      <div className="flex lg:hidden flex-col w-full h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-14 shrink-0 bg-[var(--color-hts-panel)] border-b border-[var(--color-hts-border)] flex items-center justify-between px-4 z-20 shadow-md">
          <div className="flex items-center gap-2">
            <SchoolLogo className="w-8 h-8 shrink-0 filter drop-shadow-sm" />
            <span className="text-base font-black tracking-tight text-foreground">
              스탁스쿨
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] font-black px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.04] border border-[var(--color-hts-border)] rounded-lg font-mono">
              DAY {dayCount}
            </div>

            <Button
              onClick={nextDay}
              size="sm"
              className={cn(
                "h-8 w-8 rounded-lg bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] p-0 flex items-center justify-center cursor-pointer shadow-sm border-transparent transition-all duration-300",
                tutorialStep === 7 && "ring-4 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-30"
              )}
              title="다음 날"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>

            {onReplayTutorial && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onReplayTutorial}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-[var(--color-accent-gold)] cursor-pointer"
                title="튜토리얼 다시 보기"
              >
                <span className="text-xs">🏫</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--color-accent-gold)]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Mobile View Contents */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {children}
        </div>

        {/* Mobile Bottom Nav Tab bar */}
        <nav className="h-16 shrink-0 bg-[var(--color-hts-panel)] border-t border-[var(--color-hts-border)] grid grid-cols-4 pb-safe z-20 shadow-lg">
          {menuItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveWorkspace(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative",
                  isActive
                    ? "text-[var(--color-accent-gold)] font-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-[var(--color-accent-gold)] rounded-b-md" />
                )}
                <item.icon className={cn("w-4.5 h-4.5", isActive && "scale-105")} />
                <span className="text-[9px] tracking-tight">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* RIGHT SIDE MAIN WRAPPER (Desktop Only: lg and up) */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 overflow-hidden relative z-10">
        {children}
      </div>
    </div>
  );
}
