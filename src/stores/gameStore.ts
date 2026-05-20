import { create } from 'zustand';
import { INITIAL_STOCKS, type StockDefinition } from '../lib/stockData';
import { PREDEFINED_NEWS, shuffleArray, type NewsItem } from '../lib/newsData';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Level = 'elementary' | 'middle' | 'high';

export interface Holding {
  quantity: number;
  avgPrice: number;
}

export interface StockState extends StockDefinition {
  currentPrice: number;
  priceHistory: number[];
}

interface GameState {
  // User/Auth
  uid: string | null;
  displayName: string | null;
  level: Level;
  isLoadingState: boolean;
  
  // Game progress
  dayCount: number;
  cash: number;
  initialCash: number;
  
  // Market Data
  stocks: Record<string, StockState>;
  usedNewsIds: string[];
  currentNews: NewsItem[];
  previousNews: NewsItem[]; // For explanation tab
  
  // Portfolio
  holdings: Record<string, Holding>; // keyed by stock id
  totalAssetHistory: number[];
  
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Onboarding Tutorial State
  tutorialStep: number | null;
  setTutorialStep: (step: number | null) => void;
  
  gameStates: Record<Level, any>;
  
  // Actions
  setAuth: (uid: string | null, displayName: string | null) => void;
  setLevel: (level: Level) => void;
  initializeGame: (level: Level) => void;
  buyStock: (stockId: string, quantity: number) => boolean;
  sellStock: (stockId: string, quantity: number) => boolean;
  nextDay: () => void;
}

const getInitialCash = (level: Level) => {
  if (level === 'elementary') return 1_000_000;
  if (level === 'middle') return 5_000_000;
  return 10_000_000;
};

const initializeStocks = (): Record<string, StockState> => {
  const stocks: Record<string, StockState> = {};
  INITIAL_STOCKS.forEach(s => {
    // Randomize initial price slightly around basePrice
    const variance = (Math.random() - 0.5) * 0.1; // +/- 5%
    const initialPrice = Math.max(100, Math.round(s.basePrice * (1 + variance)));
    stocks[s.id] = {
      ...s,
      currentPrice: initialPrice,
      priceHistory: [initialPrice]
    };
  });
  return stocks;
};

const saveGameState = async (uid: string | null, state: any) => {
  if (!uid) return;
  try {
    const userDocRef = doc(db, 'users', uid);
    const activeLevelState = {
      level: state.level,
      dayCount: state.dayCount,
      cash: state.cash,
      initialCash: state.initialCash,
      stocks: state.stocks,
      usedNewsIds: state.usedNewsIds,
      currentNews: state.currentNews,
      previousNews: state.previousNews,
      holdings: state.holdings,
      totalAssetHistory: state.totalAssetHistory,
      tutorialStep: state.tutorialStep
    };
    
    const updatedGameStates = {
      ...state.gameStates,
      [state.level]: activeLevelState
    };
    
    await setDoc(userDocRef, {
      displayName: state.displayName,
      currentLevel: state.level,
      gameStates: updatedGameStates,
      gameState: activeLevelState, // backward compatibility
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving game state to Firestore:", error);
  }
};

const updateLocalGameStates = (set: any, get: any) => {
  const state = get();
  const activeLevelState = {
    level: state.level,
    dayCount: state.dayCount,
    cash: state.cash,
    initialCash: state.initialCash,
    stocks: state.stocks,
    usedNewsIds: state.usedNewsIds,
    currentNews: state.currentNews,
    previousNews: state.previousNews,
    holdings: state.holdings,
    totalAssetHistory: state.totalAssetHistory,
    tutorialStep: state.tutorialStep
  };
  set({
    gameStates: {
      ...state.gameStates,
      [state.level]: activeLevelState
    }
  });
};

export const useGameStore = create<GameState>((set, get) => ({
  uid: null,
  displayName: null,
  level: 'elementary',
  isLoadingState: false,
  
  dayCount: 1,
  cash: 1_000_000,
  initialCash: 1_000_000,
  
  stocks: {},
  usedNewsIds: [],
  currentNews: [],
  previousNews: [],
  
  holdings: {},
  totalAssetHistory: [],
  gameStates: {} as Record<Level, any>,
  
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    set({ theme: nextTheme });
  },
  
  tutorialStep: null,
  setTutorialStep: (step) => {
    set({ tutorialStep: step });
    updateLocalGameStates(set, get);
    const state = get();
    saveGameState(state.uid, state);
  },
  
  setAuth: async (uid, displayName) => {
    if (uid) {
      set({ uid, displayName, isLoadingState: true });
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data) {
            let loadedGameStates = data.gameStates ?? {};
            let currentLevel = data.currentLevel ?? data.gameState?.level ?? 'elementary';
            
            // Backward compatibility
            if (Object.keys(loadedGameStates).length === 0 && data.gameState) {
              const prevLevel = data.gameState.level ?? 'elementary';
              loadedGameStates[prevLevel] = data.gameState;
            }
            
            const activeState = loadedGameStates[currentLevel] || {};
            
            set({
              level: currentLevel,
              dayCount: activeState.dayCount ?? 1,
              cash: activeState.cash ?? getInitialCash(currentLevel),
              initialCash: activeState.initialCash ?? getInitialCash(currentLevel),
              stocks: activeState.stocks ?? {},
              usedNewsIds: activeState.usedNewsIds ?? [],
              currentNews: activeState.currentNews ?? [],
              previousNews: activeState.previousNews ?? [],
              holdings: activeState.holdings ?? {},
              totalAssetHistory: activeState.totalAssetHistory ?? [],
              tutorialStep: activeState.tutorialStep !== undefined ? activeState.tutorialStep : null,
              gameStates: loadedGameStates
            });
          }
        }
      } catch (error) {
        console.error("Error loading game state from Firestore:", error);
      } finally {
        set({ isLoadingState: false });
      }
    } else {
      // Clear game state on logout
      set({
        level: 'elementary',
        dayCount: 1,
        cash: 1_000_000,
        initialCash: 1_000_000,
        stocks: {},
        usedNewsIds: [],
        currentNews: [],
        previousNews: [],
        holdings: {},
        totalAssetHistory: [],
        tutorialStep: null,
        gameStates: {} as Record<Level, any>,
        isLoadingState: false
      });
    }
  },
  
  setLevel: (newLevel) => {
    const state = get();
    if (state.level === newLevel) return;

    // 1. Capture current level's active state
    const currentActiveState = {
      level: state.level,
      dayCount: state.dayCount,
      cash: state.cash,
      initialCash: state.initialCash,
      stocks: state.stocks,
      usedNewsIds: state.usedNewsIds,
      currentNews: state.currentNews,
      previousNews: state.previousNews,
      holdings: state.holdings,
      totalAssetHistory: state.totalAssetHistory,
      tutorialStep: state.tutorialStep
    };

    const updatedGameStates = {
      ...state.gameStates,
      [state.level]: currentActiveState
    };

    // 2. Check if new level state exists
    const targetState = updatedGameStates[newLevel];

    if (targetState && Object.keys(targetState.stocks || {}).length > 0) {
      set({
        level: newLevel,
        dayCount: targetState.dayCount ?? 1,
        cash: targetState.cash ?? getInitialCash(newLevel),
        initialCash: targetState.initialCash ?? getInitialCash(newLevel),
        stocks: targetState.stocks ?? {},
        usedNewsIds: targetState.usedNewsIds ?? [],
        currentNews: targetState.currentNews ?? [],
        previousNews: targetState.previousNews ?? [],
        holdings: targetState.holdings ?? {},
        totalAssetHistory: targetState.totalAssetHistory ?? [],
        tutorialStep: targetState.tutorialStep !== undefined ? targetState.tutorialStep : null,
        gameStates: updatedGameStates
      });
    } else {
      const initialCash = getInitialCash(newLevel);
      const availableNews = PREDEFINED_NEWS.filter(n => n.difficulty.includes(newLevel));
      const selected = shuffleArray(availableNews).slice(0, 3);
      
      const newLevelState = {
        level: newLevel,
        dayCount: 1,
        cash: initialCash,
        initialCash: initialCash,
        stocks: initializeStocks(),
        holdings: {},
        usedNewsIds: selected.map((n: NewsItem) => n.id),
        currentNews: selected,
        previousNews: [],
        totalAssetHistory: [initialCash],
        tutorialStep: null
      };

      set({
        ...newLevelState,
        gameStates: {
          ...updatedGameStates,
          [newLevel]: newLevelState
        }
      });
    }

    const nextState = get();
    saveGameState(nextState.uid, nextState);
  },
  
  initializeGame: (level) => {
    const initialCash = getInitialCash(level);
    
    // Pick first news
    const availableNews = PREDEFINED_NEWS.filter(n => n.difficulty.includes(level));
    const selected = shuffleArray(availableNews).slice(0, 3);
    
    const initializedState = {
      level,
      dayCount: 1,
      cash: initialCash,
      initialCash: initialCash,
      stocks: initializeStocks(),
      holdings: {},
      usedNewsIds: selected.map((n: NewsItem) => n.id),
      currentNews: selected,
      previousNews: [],
      totalAssetHistory: [initialCash],
      tutorialStep: null
    };

    set({
      ...initializedState,
      gameStates: {
        ...get().gameStates,
        [level]: initializedState
      }
    });

    const state = get();
    saveGameState(state.uid, state);
  },
  
  buyStock: (stockId, quantity) => {
    const { cash, stocks, holdings } = get();
    const stock = stocks[stockId];
    if (!stock || quantity <= 0) return false;
    
    const cost = stock.currentPrice * quantity;
    if (cash < cost) return false;
    
    const currentHolding = holdings[stockId] || { quantity: 0, avgPrice: 0 };
    const newQuantity = currentHolding.quantity + quantity;
    const newTotalCost = (currentHolding.quantity * currentHolding.avgPrice) + cost;
    const newAvgPrice = Math.round(newTotalCost / newQuantity);
    
    set({
      cash: cash - cost,
      holdings: {
        ...holdings,
        [stockId]: { quantity: newQuantity, avgPrice: newAvgPrice }
      }
    });

    updateLocalGameStates(set, get);
    const state = get();
    saveGameState(state.uid, state);
    return true;
  },
  
  sellStock: (stockId, quantity) => {
    const { stocks, holdings, cash } = get();
    const stock = stocks[stockId];
    const currentHolding = holdings[stockId];
    
    if (!stock || !currentHolding || quantity <= 0 || quantity > currentHolding.quantity) return false;
    
    const revenue = stock.currentPrice * quantity;
    const newQuantity = currentHolding.quantity - quantity;
    
    const newHoldings = { ...holdings };
    if (newQuantity === 0) {
      delete newHoldings[stockId];
    } else {
      newHoldings[stockId] = { ...currentHolding, quantity: newQuantity };
    }
    
    set({
      cash: cash + revenue,
      holdings: newHoldings
    });

    updateLocalGameStates(set, get);
    const state = get();
    saveGameState(state.uid, state);
    return true;
  },
  
  nextDay: () => {
    const { stocks, currentNews, usedNewsIds, level, dayCount, cash, holdings, totalAssetHistory } = get();
    
    // Calculate sector impacts from current news
    const sectorImpacts: Record<string, number> = {};
    currentNews.forEach(news => {
      Object.entries(news.sectorImpact).forEach(([sector, impact]) => {
        sectorImpacts[sector] = (sectorImpacts[sector] || 0) + impact;
      });
    });
    
    // Update stock prices with realistic simulation
    const newStocks = { ...stocks };
    let totalStockValue = 0;
    
    // Market-wide sentiment factor (macro noise affecting all stocks)
    // Slight negative bias to prevent constant upward drift
    const marketFactor = (Math.random() - 0.53) * 0.02;
    
    Object.keys(newStocks).forEach(id => {
      const stock = { ...newStocks[id] };
      const rawImpact = sectorImpacts[stock.sector] || 0;
      
      // Scale down news impact significantly (original +6~9% values are way too strong)
      // Real single-day sector moves from news are typically 1-3%
      const newsImpact = rawImpact * 0.3;
      
      // Base random volatility: daily noise
      const randomChange = (Math.random() - 0.5) * 0.04 * stock.volatility;
      
      // Mean reversion: pull price back toward base price over time
      // Prevents runaway trends in either direction
      const deviation = (stock.currentPrice - stock.basePrice) / stock.basePrice;
      const meanReversion = -deviation * 0.05;
      
      // Occasional shock events (rare large moves, ~5% chance)
      const shockRoll = Math.random();
      let shock = 0;
      if (shockRoll < 0.025) {
        shock = -(Math.random() * 0.05 + 0.02) * stock.volatility; // negative shock
      } else if (shockRoll > 0.975) {
        shock = (Math.random() * 0.05 + 0.02) * stock.volatility;  // positive shock
      }
      
      // Total change, capped at +/- 15%
      let totalChange = marketFactor + newsImpact + randomChange + meanReversion + shock;
      totalChange = Math.max(-0.15, Math.min(0.15, totalChange));
      
      let newPrice = stock.currentPrice * (1 + totalChange);
      newPrice = Math.max(1, Math.round(newPrice)); // min price 1
      
      stock.currentPrice = newPrice;
      stock.priceHistory = [...stock.priceHistory, newPrice];
      newStocks[id] = stock;
      
      // Calculate new total value
      if (holdings[id]) {
        totalStockValue += newPrice * holdings[id].quantity;
      }
    });
    
    // Load new news
    let availableNews = PREDEFINED_NEWS.filter(n => n.difficulty.includes(level) && !usedNewsIds.includes(n.id));
    let nextUsedNewsIds = [...usedNewsIds];
 
    // If available news runs out (less than 3 items remaining), reset the cycle
    if (availableNews.length < 3) {
      const currentIds = currentNews.map(n => n.id);
      availableNews = PREDEFINED_NEWS.filter(n => n.difficulty.includes(level) && !currentIds.includes(n.id));
      nextUsedNewsIds = [...currentIds];
    }
 
    const selected = shuffleArray(availableNews).slice(0, 3);
    
    set({
      dayCount: dayCount + 1,
      stocks: newStocks,
      previousNews: currentNews,
      currentNews: selected,
      usedNewsIds: [...nextUsedNewsIds, ...selected.map((n: NewsItem) => n.id)],
      totalAssetHistory: [...totalAssetHistory, cash + totalStockValue]
    });
 
    updateLocalGameStates(set, get);
    const state = get();
    saveGameState(state.uid, state);
  }
}));
