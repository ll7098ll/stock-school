import { useGameStore, type Level } from './stores/gameStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';

function App() {
  const {
    authMode,
    uid,
    setAuth,
    restoreGuestSession,
    theme,
    initializeGame,
    setLevel,
    level,
    stocks,
    isLoadingState,
    wasLegacyMigrated,
    clearMigrationNotice,
  } = useGameStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        void setAuth(user.uid, user.displayName || '학습자');
      } else {
        // Google 세션이 없는 경우 기존 게스트(로컬) 세션이 있으면 복원
        const currentMode = useGameStore.getState().authMode;
        if (currentMode === 'google') {
          void setAuth(null, null);
        } else if (currentMode === null) {
          restoreGuestSession();
        }
      }
    });
    return () => unsubscribe();
  }, [setAuth, restoreGuestSession]);

  useEffect(() => {
    if (authMode === 'google' && uid && !isLoadingState) {
      const pendingLevel = localStorage.getItem('stockschool_pending_level') as Level | null;
      if (pendingLevel) {
        localStorage.removeItem('stockschool_pending_level');
        setLevel(pendingLevel);
      } else if (Object.keys(stocks).length === 0) {
        initializeGame(level);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authMode, uid, isLoadingState]);

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

  return (
    <>
      {authMode ? <Dashboard /> : <Login />}
      <Toaster />
    </>
  );
}

export default App;
