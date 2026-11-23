import React, { useState } from 'react';
import {
  useGameStore,
  countCheckedTodayNews,
  isTodayNewsComplete,
} from '../../stores/gameStore';
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
  ChevronRight,
  Settings,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import SchoolLogo from './SchoolLogo';
import AccountSettingsModal from './AccountSettingsModal';
import LegalModals, { type LegalTab } from '../legal/LegalModals';

interface AppShellProps {
  children: React.ReactNode;
  activeWorkspace: 'trading' | 'portfolio' | 'news' | 'glossary';
  setActiveWorkspace: (workspace: 'trading' | 'portfolio' | 'news' | 'glossary') => void;
  onNextDaySuccess?: () => void;
  onReplayTutorial?: () => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export default function AppShell({
  children,
  activeWorkspace,
  setActiveWorkspace,
  onNextDaySuccess,
  onReplayTutorial,
  onOpenLegal,
}: AppShellProps) {
  const {
    authMode,
    displayName,
    level,
    dayCount,
    nextDay,
    theme,
    toggleTheme,
    tutorialStep,
    exitSession,
    currentNews,
    todayNewsChecks,
  } = useGameStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [internalLegalOpen, setInternalLegalOpen] = useState(false);
  const [internalLegalTab, setInternalLegalTab] = useState<LegalTab>('disclaimer');

  const checkedCount = countCheckedTodayNews(currentNews, todayNewsChecks);
  const allTodayChecked = isTodayNewsComplete(currentNews, todayNewsChecks);
  const remainingCount = Math.max(0, currentNews.length - checkedCount);

  const handleOpenLegal = (tab: LegalTab) => {
    if (onOpenLegal) {
      onOpenLegal(tab);
    } else {
      setInternalLegalTab(tab);
      setInternalLegalOpen(true);
    }
  };

  const handleNextDayClick = () => {
    if (!allTodayChecked) {
      toast.info(
        `오늘의 뉴스 ${remainingCount}건을 먼저 읽고 호재·악재 판단을 체크해 주세요! 📰`
      );
      setActiveWorkspace('news');
      return;
    }
    nextDay();
    onNextDaySuccess?.();
  };

  const handleLogout = async () => {
    try {
      await exitSession();
      toast.success(
        authMode === 'guest'
          ? '초기 화면으로 돌아왔습니다. (브라우저 학습 기록은 유지됩니다)'
          : '성공적으로 로그아웃되었습니다.'
      );
    } catch {
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const levelLabel = level === 'elementary' ? '초급' : level === 'middle' ? '중급' : '고급';
  const levelColor =
    level === 'elementary'
      ? 'from-slate-500 to-slate-600'
      : level === 'middle'
        ? 'from-slate-600 to-slate-700'
        : 'from-slate-800 to-slate-900';

  const menuItems = [
    { id: 'news', label: '오늘의 뉴스', mobileLabel: '뉴스', icon: Newspaper },
    { id: 'trading', label: '모의투자 교실', mobileLabel: '투자', icon: LineChart },
    { id: 'portfolio', label: '자산 보고서', mobileLabel: '내 자산', icon: Wallet },
    { id: 'glossary', label: '용어 사전방', mobileLabel: '용어사전', icon: BookOpen },
  ] as const;

  return (
    <div
      className="flex h-screen w-screen overflow-hidden bg-[var(--color-hts-bg)] text-foreground font-sans antialiased"
      style={{ height: '100dvh' }}
    >
      {/* LEFT SIDEBAR (Desktop Only: lg and up) */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] transition-all duration-300 relative z-20 shadow-xl',
          isSidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] hover:bg-[var(--color-hts-hover)] flex items-center justify-center text-muted-foreground hover:text-foreground shadow-md cursor-pointer z-30 transition-transform duration-200"
          title={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Sidebar Brand Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--color-hts-border)] shrink-0">
          <SchoolLogo className="w-9 h-9 shrink-0 filter drop-shadow-sm" />
          {!isSidebarCollapsed && (
            <div className="min-w-0">
              <span className="text-lg font-black tracking-tight text-foreground block leading-none">
                스탁스쿨
              </span>
              <span className="text-[11px] font-bold text-muted-foreground block mt-1">
                가상 금융교육 시뮬레이터
              </span>
            </div>
          )}
        </div>

        {/* User profile card */}
        <div
          className={cn(
            'p-3.5 border-b border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col shrink-0 transition-all',
            isSidebarCollapsed ? 'items-center' : 'items-stretch'
          )}
        >
          {isSidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center border border-[var(--color-hts-border)] cursor-pointer"
              title={`${displayName || '학습자'} (설정 열기)`}
            >
              <User className="w-4 h-4 text-[var(--color-accent-gold)]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-3 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-[var(--color-hts-hover)] border border-[var(--color-hts-border)]/60 text-left cursor-pointer transition-colors"
              title="난이도 전환 및 개인정보 설정"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 font-extrabold text-sm border border-[var(--color-hts-border)] shrink-0">
                {displayName ? displayName[0].toUpperCase() : 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-black truncate text-foreground">
                  {displayName || '모의투자 학생'}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-[11px] font-black text-white bg-gradient-to-r shadow-sm',
                      levelColor
                    )}
                  >
                    {levelLabel}
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/[0.05] dark:bg-white/[0.08] text-muted-foreground">
                    {authMode === 'google' ? '클라우드' : '로컬'}
                  </span>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Navigation Menu (Ordered by Learning Journey: News → Trading → Portfolio → Glossary) */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            const isNews = item.id === 'news';
            const isTrading = item.id === 'trading';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveWorkspace(item.id)}
                className={cn(
                  'w-full flex items-center justify-between rounded-xl px-3 py-3 text-[13px] font-extrabold cursor-pointer transition-all duration-200 group relative',
                  isActive
                    ? 'bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/20 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[var(--color-hts-hover)] border border-transparent'
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[var(--color-accent-gold)] rounded-r-md" />
                )}
                <div className={cn('flex items-center min-w-0', isSidebarCollapsed && 'mx-auto')}>
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105',
                      isActive
                        ? 'text-[var(--color-accent-gold)]'
                        : 'text-muted-foreground group-hover:text-foreground',
                      isSidebarCollapsed ? 'mr-0' : 'mr-3'
                    )}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {/* Status Badges */}
                {!isSidebarCollapsed && isNews && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black shrink-0',
                      allTodayChecked
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500 text-slate-950 animate-pulse'
                    )}
                  >
                    {allTodayChecked ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> 완료
                      </>
                    ) : (
                      `${checkedCount}/${currentNews.length}`
                    )}
                  </span>
                )}

                {!isSidebarCollapsed && isTrading && !allTodayChecked && (
                  <span
                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/[0.06] dark:bg-white/[0.08] text-muted-foreground shrink-0"
                    title="오늘의 뉴스를 읽으면 주문이 열립니다"
                  >
                    <Lock className="w-3 h-3" />
                  </span>
                )}

                {isSidebarCollapsed && isNews && !allTodayChecked && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}

          {onReplayTutorial && (
            <button
              type="button"
              onClick={onReplayTutorial}
              className="w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-extrabold cursor-pointer transition-all duration-200 group relative border border-dashed border-[var(--color-accent-gold)]/25 hover:border-[var(--color-accent-gold)]/55 text-muted-foreground hover:text-foreground hover:bg-[var(--color-hts-hover)] mt-4"
              title={isSidebarCollapsed ? '튜토리얼 다시 보기' : undefined}
            >
              <span
                className={cn(
                  'flex items-center justify-center shrink-0 w-4 h-4 text-sm',
                  isSidebarCollapsed ? 'mr-0 mx-auto' : 'mr-3'
                )}
              >
                🏫
              </span>
              {!isSidebarCollapsed && <span className="truncate">튜토리얼 다시 보기</span>}
            </button>
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-[var(--color-hts-border)] shrink-0 flex flex-col gap-2">
          {!isSidebarCollapsed && (
            <div
              className={cn(
                'mb-1 p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.02] border border-[var(--color-hts-border)]/70 text-center relative overflow-hidden transition-all duration-300',
                tutorialStep === 7 &&
                  'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30'
              )}
            >
              {tutorialStep === 7 && (
                <div className="absolute inset-x-0 top-0 bg-amber-500 text-slate-950 text-[11px] font-black py-1 px-2 border-b border-amber-600 animate-pulse text-center select-none z-10">
                  🚀 7단계: 다음 날 진행
                </div>
              )}
              <div
                className={cn(
                  'text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5',
                  tutorialStep === 7 && 'mt-5'
                )}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent-gold)] animate-pulse" />
                진행 일차
              </div>
              <div className="text-xl font-black text-foreground font-mono tracking-wider">
                DAY {dayCount}
              </div>
              <Button
                type="button"
                onClick={handleNextDayClick}
                className={cn(
                  'w-full mt-2.5 font-black text-[13px] h-10 rounded-xl shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer border-transparent',
                  allTodayChecked
                    ? 'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)]'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/40'
                )}
              >
                {allTodayChecked ? (
                  <>
                    <SkipForward className="w-4 h-4" />
                    <span>다음 날 진행</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>뉴스 먼저 읽기 ({checkedCount}/{currentNews.length})</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={handleNextDayClick}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shadow-md cursor-pointer mx-auto mb-1 shrink-0 transition-all active:scale-95 border-transparent duration-300',
                allTodayChecked
                  ? 'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)]'
                  : 'bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/40',
                tutorialStep === 7 &&
                  'ring-4 ring-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.55)] z-30'
              )}
              title={
                allTodayChecked
                  ? `다음 날로 진행 (DAY ${dayCount})`
                  : `오늘의 뉴스를 먼저 읽어주세요 (${checkedCount}/${currentNews.length})`
              }
            >
              {allTodayChecked ? (
                <SkipForward className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </button>
          )}

          <div
            className={cn(
              'flex items-center gap-1',
              isSidebarCollapsed ? 'flex-col items-center' : 'justify-between'
            )}
          >
            <Button
              type="button"
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

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleOpenLegal('disclaimer')}
              className="h-9 w-9 rounded-xl hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground cursor-pointer"
              title="법적 고지 · 개인정보처리방침 · 오픈소스"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9 rounded-xl hover:bg-[var(--color-hts-hover)] text-muted-foreground hover:text-foreground cursor-pointer"
              title="학습 설정 · 난이도 전환 · 데이터 삭제"
            >
              <Settings className="w-4.5 h-4.5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"
              title={authMode === 'guest' ? '초기 화면으로' : '로그아웃'}
            >
              <LogOut className="w-4.5 h-4.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* MOBILE / TABLET LAYOUT (under lg) */}
      <div
        className="flex lg:hidden flex-col w-full h-screen overflow-hidden"
        style={{ height: '100dvh' }}
      >
        <header className="h-14 shrink-0 bg-[var(--color-hts-panel)] border-b border-[var(--color-hts-border)] flex items-center justify-between px-3 z-20 shadow-sm gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <SchoolLogo className="w-7 h-7 shrink-0 filter drop-shadow-sm" />
            <div className="min-w-0">
              <span className="text-sm font-black tracking-tight text-foreground block leading-none truncate">
                스탁스쿨
              </span>
              <span className="text-[11px] font-bold text-muted-foreground block leading-tight">
                DAY {dayCount} · {levelLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              onClick={handleNextDayClick}
              size="sm"
              className={cn(
                'h-9 px-3 rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer shadow-sm transition-all duration-300',
                allTodayChecked
                  ? 'bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-foreground)] border-transparent'
                  : 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40',
                tutorialStep === 7 &&
                  'ring-4 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)] z-30'
              )}
              title={allTodayChecked ? '다음 날로 진행' : '오늘의 뉴스를 먼저 읽어주세요'}
            >
              {allTodayChecked ? (
                <>
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>다음 날</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>뉴스 {checkedCount}/{currentNews.length}</span>
                </>
              )}
            </Button>

            {onReplayTutorial && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onReplayTutorial}
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-[var(--color-accent-gold)] cursor-pointer"
                title="튜토리얼 다시 보기"
              >
                <span className="text-sm">🏫</span>
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="설정 · 법적 고지 · 데이터 삭제"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="테마 변경"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--color-accent-gold)]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-rose-500 cursor-pointer"
              title="나가기"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">{children}</div>

        <nav className="h-16 shrink-0 bg-[var(--color-hts-panel)] border-t border-[var(--color-hts-border)] grid grid-cols-4 pb-safe z-20 shadow-lg">
          {menuItems.map((item) => {
            const isActive = activeWorkspace === item.id;
            const isNews = item.id === 'news';
            const isTrading = item.id === 'trading';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveWorkspace(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative',
                  isActive
                    ? 'text-[var(--color-accent-gold)] font-black'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/4 right-1/4 h-[3px] bg-[var(--color-accent-gold)] rounded-b-md" />
                )}
                <div className="relative">
                  <item.icon className={cn('w-5 h-5', isActive && 'scale-105')} />
                  {isNews && !allTodayChecked && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center leading-none">
                      {remainingCount}
                    </span>
                  )}
                  {isTrading && !allTodayChecked && (
                    <Lock className="w-3 h-3 text-muted-foreground absolute -top-1 -right-2" />
                  )}
                </div>
                <span className="text-[11px] font-bold tracking-tight">{item.mobileLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* RIGHT SIDE MAIN WRAPPER (Desktop Only: lg and up) */}
      <div className="hidden lg:flex flex-1 flex-col min-w-0 overflow-hidden relative z-10">
        {children}
      </div>

      {/* Settings & Account Deletion Modal */}
      <AccountSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onOpenLegal={(tab) => {
          setSettingsOpen(false);
          handleOpenLegal(tab);
        }}
      />

      {/* Fallback Legal Modal if parent doesn't supply onOpenLegal */}
      {!onOpenLegal && (
        <LegalModals
          open={internalLegalOpen}
          onOpenChange={setInternalLegalOpen}
          initialTab={internalLegalTab}
        />
      )}
    </div>
  );
}
