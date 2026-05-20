import { useGameStore, type Level } from './stores/gameStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const { uid, setAuth, theme, initializeGame, level, stocks, isLoadingState } = useGameStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuth(user.uid, user.displayName || '게스트');
      } else {
        setAuth(null, null);
      }
    });
    return () => unsubscribe();
  }, [setAuth]);

  useEffect(() => {
    if (uid && !isLoadingState) {
      const pendingLevel = localStorage.getItem('stockschool_pending_level') as Level | null;
      if (pendingLevel) {
        // 유저가 로그인 전에 난이도를 명시적으로 변경한 경우
        localStorage.removeItem('stockschool_pending_level');
        initializeGame(pendingLevel);
      } else if (Object.keys(stocks).length === 0) {
        // 새 유저이거나 저장된 게임이 없는 경우
        initializeGame(level);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isLoadingState]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      {uid ? <Dashboard /> : <Login />}
      <Toaster />
    </>
  );
}

export default App;
