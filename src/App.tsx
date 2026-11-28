import {
  flushPendingPersist,
  GUEST_STORAGE_KEY,
  useGameStore,
} from './stores/gameStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { useEffect, useRef } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { AlertTriangle, Cloud, Loader2, LogOut, RefreshCw } from 'lucide-react';

function App() {
  const {
    authMode,
    setAuth,
    restoreGuestSession,
    syncGuestFromStorage,
    setThemeFromExternal,
    retryLoadCloudState,
    retryPendingSave,
    exitSession,
    theme,
    isLoadingState,
    loadStatus,
    loadError,
    wasLegacyMigrated,
    clearMigrationNotice,
  } = useGameStore();

  const hasInitialAuthResolvedRef = useRef(false);

  useEffect(() => {
    if (!auth) {
      if (!hasInitialAuthResolvedRef.current && useGameStore.getState().authMode === null) {
        restoreGuestSession();
      }
      hasInitialAuthResolvedRef.current = true;
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        hasInitialAuthResolvedRef.current = true;
        void setAuth(user.uid, user.displayName || '학습자');
      } else {
        const currentMode = useGameStore.getState().authMode;
        if (currentMode === 'google') {
          void setAuth(null, null);
        } else if (!hasInitialAuthResolvedRef.current && currentMode === null) {
          // 최초 앱 부팅 시에만 기존 게스트(로컬) 세션 자동 복원 (로그아웃/탈퇴 후 납치 방지)
          restoreGuestSession();
        }
        hasInitialAuthResolvedRef.current = true;
      }
    });
    return () => unsubscribe();
  }, [setAuth, restoreGuestSession]);

  // 멀티 탭 localStorage 실시간 동기화 (L-3)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === GUEST_STORAGE_KEY || event.key === null) {
        syncGuestFromStorage();
      } else if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
        setThemeFromExternal(event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncGuestFromStorage, setThemeFromExternal]);

  // 네트워크 복구 시 미저장 쓰기 자동 재시도 + 탭 전환/숨김 시 디바운스 쓰기 즉시 반영 (F-5)
  useEffect(() => {
    const handleOnline = () => {
      if (useGameStore.getState().saveError) {
        void retryPendingSave();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushPendingPersist();
      }
    };
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [retryPendingSave]);

  useEffect(() => {
    if (wasLegacyMigrated) {
      toast.info(
        '교육 안전성을 위해 가상 기업(34개 종목)과 개선된 뉴스 엔진으로 시장이 새롭게 개편되었습니다!'
      );
      clearMigrationNotice();
    }
  }, [wasLegacyMigrated, clearMigrationNotice]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isCloudLoading =
    authMode === 'google' &&
    (isLoadingState || loadStatus === 'loading' || loadStatus === 'idle');
  const isCloudLoadError = authMode === 'google' && loadStatus === 'error';

  return (
    <>
      {!authMode ? (
        <Login />
      ) : isCloudLoading ? (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[var(--color-hts-bg)] text-foreground p-6">
          <div className="max-w-sm w-full rounded-2xl border border-[var(--color-hts-border)] bg-[var(--color-hts-panel)] p-8 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/12 text-blue-500 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-black text-foreground">
                클라우드 학습 기록 불러오는 중...
              </h2>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                기존 포트폴리오와 진행 일차를 안전하게 동기화하고 있습니다. 잠시만 기다려 주세요.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground pt-1">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent-gold)]" />
              <span>Firestore 동기화 진행 중</span>
            </div>
          </div>
        </div>
      ) : isCloudLoadError ? (
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[var(--color-hts-bg)] text-foreground p-6">
          <div className="max-w-md w-full rounded-2xl border border-amber-500/35 bg-[var(--color-hts-panel)] p-7 text-center space-y-4 shadow-lg">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-black text-foreground">
                클라우드 데이터를 불러오지 못했습니다
              </h2>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                기존 학습 기록을 보호하기 위해 새 게임으로 초기화하지 않고 대기 중입니다.
                네트워크 연결을 확인한 뒤 다시 시도해 주세요.
              </p>
              {loadError && (
                <p className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 rounded-lg px-3 py-1.5 break-all">
                  {loadError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                type="button"
                onClick={() => void retryLoadCloudState()}
                className="h-10 px-4 rounded-xl text-xs font-black gap-1.5 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>다시 불러오기</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void exitSession()}
                className="h-10 px-4 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
      <Toaster />
    </>
  );
}

export default App;
