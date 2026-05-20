import { useGameStore } from './stores/gameStore';
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
    if (uid && !isLoadingState && Object.keys(stocks).length === 0) {
      initializeGame(level);
    }
  }, [uid, isLoadingState, stocks, level, initializeGame]);

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
