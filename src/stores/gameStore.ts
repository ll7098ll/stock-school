import { create } from 'zustand';
import { INITIAL_STOCKS, STOCK_BY_ID } from '../lib/stockData';
import {
  getScenarioById,
  materializeScenarioNews,
  NEWS_BY_ID,
  PREDEFINED_NEWS,
  SCENARIO_ARCS,
  shuffleArray,
} from '../lib/newsData';
import {
  calculateDailyVolume,
  createInitialStocks,
  getActualNewsDirection,
  hasOppositeSectorConflict,
  selectDailyNews,
  simulateNextDay,
} from '../lib/priceEngine';
import type {
  ActiveScenarioState,
  AuthMode,
  CompactStockSave,
  DayStockBreakdown,
  Holding,
  LastDayRecap,
  Level,
  LevelGameSnapshot,
  NewsItem,
  NewsPrediction,
  PredictionStats,
  StockState,
} from '../lib/types';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export type {
  AuthMode,
  DayStockBreakdown,
  Holding,
  LastDayRecap,
  Level,
  NewsPrediction,
  PredictionStats,
  StockState,
};

export function countCheckedTodayNews(
  currentNews: NewsItem[],
  todayNewsChecks: Record<string, NewsPrediction>
): number {
  return currentNews.filter((item) => Boolean(todayNewsChecks[item.id])).length;
}

export function isTodayNewsComplete(
  currentNews: NewsItem[],
  todayNewsChecks: Record<string, NewsPrediction>
): boolean {
  if (currentNews.length === 0) return true;
  return countCheckedTodayNews(currentNews, todayNewsChecks) >= currentNews.length;
}

const GUEST_STORAGE_KEY = 'stockschool_guest_state_v2';
const PENDING_LEVEL_KEY = 'stockschool_pending_level';
const CONSENT_RECORD_KEY = 'stockschool_consent_v1';

interface CompactLevelSave {
  schemaVersion: number;
  level: Level;
  dayCount: number;
  cash: number;
  initialCash: number;
  stocks: Record<string, CompactStockSave>;
  usedNewsIds: string[];
  currentNewsIds: string[];
  previousNewsIds: string[];
  holdings: Record<string, Holding>;
  totalAssetHistory: number[];
  tutorialStep: number | null;
  lastDayBreakdown?: Record<string, DayStockBreakdown>;
  carryoverImpacts?: Record<string, number>;
  activeScenario?: ActiveScenarioState | null;
  completedScenarioIds?: string[];
  scenarioCooldown?: number;
  todayNewsChecks?: Record<string, NewsPrediction>;
  previousNewsChecks?: Record<string, NewsPrediction>;
  predictionStats?: PredictionStats;
  lastDayRecap?: LastDayRecap | null;
}

interface PersistedUserData {
  schemaVersion: number;
  displayName: string | null;
  currentLevel: Level;
  gameStates: Partial<Record<Level, CompactLevelSave>>;
  updatedAt: string;
}

interface GameState {
  // User / Auth
  authMode: AuthMode;
  uid: string | null;
  displayName: string | null;
  level: Level;
  isLoadingState: boolean;
  wasLegacyMigrated: boolean;

  // Game progress
  dayCount: number;
  cash: number;
  initialCash: number;

  // Market Data
  stocks: Record<string, StockState>;
  usedNewsIds: string[];
  currentNews: NewsItem[];
  previousNews: NewsItem[];
  lastDayBreakdown: Record<string, DayStockBreakdown>;
  carryoverImpacts: Record<string, number>;

  // Multi-day Scenario State
  activeScenario: ActiveScenarioState | null;
  completedScenarioIds: string[];
  scenarioCooldown: number;

  // News-First Learning Journey State
  todayNewsChecks: Record<string, NewsPrediction>;
  previousNewsChecks: Record<string, NewsPrediction>;
  predictionStats: PredictionStats;
  lastDayRecap: LastDayRecap | null;
  showRecapModal: boolean;

  // Portfolio
  holdings: Record<string, Holding>;
  totalAssetHistory: number[];

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Onboarding Tutorial State
  tutorialStep: number | null;
  setTutorialStep: (step: number | null) => void;

  gameStates: Partial<Record<Level, LevelGameSnapshot>>;

  // Actions
  enterGuestMode: (nickname: string, level: Level) => void;
  restoreGuestSession: () => boolean;
  exitSession: () => Promise<void>;
  setAuth: (uid: string | null, displayName: string | null) => Promise<void>;
  setLevel: (level: Level) => void;
  initializeGame: (level: Level) => void;
  resetCurrentLevel: () => void;
  startScenario: (scenarioId: string) => boolean;
  markNewsChecked: (newsId: string, prediction: NewsPrediction) => void;
  dismissRecap: () => void;
  deleteAccountAndData: () => Promise<{ ok: boolean; message: string }>;
  clearMigrationNotice: () => void;
  buyStock: (stockId: string, quantity: number) => boolean;
  sellStock: (stockId: string, quantity: number) => boolean;
  nextDay: () => void;
}

export const getInitialCash = (level: Level): number => {
  if (level === 'elementary') return 1_000_000;
  if (level === 'middle') return 5_000_000;
  return 10_000_000;
};

function createFreshLevelSnapshot(level: Level): LevelGameSnapshot {
  const initialCash = getInitialCash(level);
  const { selected, nextUsedNewsIds } = selectDailyNews(
    PREDEFINED_NEWS,
    level,
    [],
    [],
    3
  );
  return {
    level,
    dayCount: 1,
    cash: initialCash,
    initialCash,
    stocks: createInitialStocks(INITIAL_STOCKS),
    holdings: {},
    usedNewsIds: nextUsedNewsIds,
    currentNews: selected,
    previousNews: [],
    totalAssetHistory: [initialCash],
    tutorialStep: null,
    lastDayBreakdown: {},
    carryoverImpacts: {},
    activeScenario: null,
    completedScenarioIds: [],
    scenarioCooldown: 0,
    todayNewsChecks: {},
    previousNewsChecks: {},
    predictionStats: { total: 0, correct: 0 },
    lastDayRecap: null,
  };
}

/**
 * Firestore/localStorage 저장 시 정적 descriptions 및 기사 전문을 제거해
 * 저장 용량을 95% 이상 경량화 (1MB 문서 한도 초과 방지)
 */
function serializeLevelSnapshot(snap: LevelGameSnapshot): CompactLevelSave {
  const compactStocks: Record<string, CompactStockSave> = {};
  Object.entries(snap.stocks).forEach(([id, s]) => {
    compactStocks[id] = {
      currentPrice: s.currentPrice,
      priceHistory: s.priceHistory.slice(-180), // 최대 180거래일 이력 보관
      volumeHistory: (s.volumeHistory ?? []).slice(-180),
    };
  });

  return {
    schemaVersion: 2,
    level: snap.level,
    dayCount: snap.dayCount,
    cash: snap.cash,
    initialCash: snap.initialCash,
    stocks: compactStocks,
    usedNewsIds: snap.usedNewsIds,
    currentNewsIds: snap.currentNews.map((n) => n.id),
    previousNewsIds: snap.previousNews.map((n) => n.id),
    holdings: snap.holdings,
    totalAssetHistory: snap.totalAssetHistory.slice(-180),
    tutorialStep: snap.tutorialStep,
    lastDayBreakdown: snap.lastDayBreakdown,
    carryoverImpacts: snap.carryoverImpacts,
    activeScenario: snap.activeScenario ?? null,
    completedScenarioIds: snap.completedScenarioIds ?? [],
    scenarioCooldown: snap.scenarioCooldown ?? 0,
    todayNewsChecks: snap.todayNewsChecks ?? {},
    previousNewsChecks: snap.previousNewsChecks ?? {},
    predictionStats: snap.predictionStats ?? { total: 0, correct: 0 },
    lastDayRecap: snap.lastDayRecap ?? null,
  };
}

/**
 * 경량 저장 포맷을 런타임 상태로 복원 (구버전 실기업 ID 감지 시 안전 마이그레이션)
 */
function hydrateLevelSnapshot(
  rawInput: unknown,
  fallbackLevel: Level
): { snapshot: LevelGameSnapshot; migrated: boolean } {
  if (!rawInput || typeof rawInput !== 'object') {
    return { snapshot: createFreshLevelSnapshot(fallbackLevel), migrated: false };
  }
  const raw = rawInput as Record<string, unknown>;

  const level: Level =
    raw.level === 'elementary' || raw.level === 'middle' || raw.level === 'high'
      ? raw.level
      : fallbackLevel;

  const rawStocks =
    raw.stocks && typeof raw.stocks === 'object'
      ? (raw.stocks as Record<string, Record<string, unknown>>)
      : {};
  const validKeys = Object.keys(rawStocks).filter((id) => Boolean(STOCK_BY_ID[id]));

  // 구버전 실제 기업명 데이터이거나 종목이 비어 있으면 신규 가상 기업 시장으로 안전 초기화
  if (validKeys.length < Math.floor(INITIAL_STOCKS.length * 0.5)) {
    const hadOldStocks = Object.keys(rawStocks).length > 0;
    return { snapshot: createFreshLevelSnapshot(level), migrated: hadOldStocks };
  }

  const stocks: Record<string, StockState> = {};
  INITIAL_STOCKS.forEach((def) => {
    const saved = rawStocks[def.id];
    if (saved && typeof saved.currentPrice === 'number') {
      const priceHistory: number[] =
        Array.isArray(saved.priceHistory) && saved.priceHistory.length > 0
          ? (saved.priceHistory as number[])
          : [saved.currentPrice];
      const volumeHistory: number[] =
        Array.isArray(saved.volumeHistory) && saved.volumeHistory.length === priceHistory.length
          ? (saved.volumeHistory as number[])
          : priceHistory.map(() => calculateDailyVolume(def.basePrice, 0.01, false));
      stocks[def.id] = {
        ...def,
        currentPrice: saved.currentPrice,
        priceHistory,
        volumeHistory,
      };
    } else {
      const fresh = createInitialStocks([def])[def.id];
      stocks[def.id] = fresh;
    }
  });

  // 뉴스 복원 (ID 배열 우선, 구버전 객체 배열 폴백)
  const resolveNewsList = (ids: unknown, legacyObjs: unknown): NewsItem[] => {
    if (Array.isArray(ids)) {
      return ids
        .map((id) => (typeof id === 'string' ? NEWS_BY_ID[id] : undefined))
        .filter((n): n is NewsItem => Boolean(n));
    }
    if (Array.isArray(legacyObjs)) {
      return legacyObjs
        .map((obj) => {
          const rec = obj && typeof obj === 'object' ? (obj as { id?: unknown }) : null;
          return typeof rec?.id === 'string' ? NEWS_BY_ID[rec.id] : undefined;
        })
        .filter((n): n is NewsItem => Boolean(n));
    }
    return [];
  };

  let currentNews = resolveNewsList(raw.currentNewsIds, raw.currentNews);
  let usedNewsIds: string[] = Array.isArray(raw.usedNewsIds)
    ? raw.usedNewsIds.filter(
        (id: unknown): id is string => typeof id === 'string' && Boolean(NEWS_BY_ID[id])
      )
    : [];

  if (currentNews.length === 0) {
    const picked = selectDailyNews(PREDEFINED_NEWS, level, usedNewsIds, [], 3);
    currentNews = picked.selected;
    usedNewsIds = picked.nextUsedNewsIds;
  }

  const previousNews = resolveNewsList(raw.previousNewsIds, raw.previousNews);

  // 보유 종목 중 유효한 stockId만 유지
  const cleanHoldings: Record<string, Holding> = {};
  if (raw.holdings && typeof raw.holdings === 'object') {
    Object.entries(raw.holdings as Record<string, unknown>).forEach(([id, h]) => {
      const rec = h && typeof h === 'object' ? (h as { quantity?: unknown; avgPrice?: unknown }) : null;
      if (STOCK_BY_ID[id] && rec && typeof rec.quantity === 'number' && rec.quantity > 0) {
        cleanHoldings[id] = {
          quantity: Math.floor(rec.quantity),
          avgPrice: Math.round(Number(rec.avgPrice) || stocks[id].currentPrice),
        };
      }
    });
  }

  const initialCash = typeof raw.initialCash === 'number' ? raw.initialCash : getInitialCash(level);
  const cash = typeof raw.cash === 'number' ? raw.cash : initialCash;

  const rawActiveScenario =
    raw.activeScenario && typeof raw.activeScenario === 'object'
      ? (raw.activeScenario as ActiveScenarioState)
      : null;

  const sanitizeChecks = (input: unknown): Record<string, NewsPrediction> => {
    const out: Record<string, NewsPrediction> = {};
    if (input && typeof input === 'object') {
      Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
        if (v === 'bullish' || v === 'bearish' || v === 'mixed') {
          out[k] = v;
        }
      });
    }
    return out;
  };

  const rawStats =
    raw.predictionStats && typeof raw.predictionStats === 'object'
      ? (raw.predictionStats as { total?: unknown; correct?: unknown })
      : null;

  return {
    migrated: false,
    snapshot: {
      level,
      dayCount: typeof raw.dayCount === 'number' && raw.dayCount >= 1 ? raw.dayCount : 1,
      cash,
      initialCash,
      stocks,
      usedNewsIds,
      currentNews,
      previousNews,
      holdings: cleanHoldings,
      totalAssetHistory:
        Array.isArray(raw.totalAssetHistory) && raw.totalAssetHistory.length > 0
          ? (raw.totalAssetHistory as number[])
          : [initialCash],
      tutorialStep: typeof raw.tutorialStep === 'number' ? raw.tutorialStep : null,
      lastDayBreakdown:
        raw.lastDayBreakdown && typeof raw.lastDayBreakdown === 'object'
          ? (raw.lastDayBreakdown as Record<string, DayStockBreakdown>)
          : {},
      carryoverImpacts:
        raw.carryoverImpacts && typeof raw.carryoverImpacts === 'object'
          ? (raw.carryoverImpacts as Record<string, number>)
          : {},
      activeScenario:
        rawActiveScenario && getScenarioById(rawActiveScenario.scenarioId)
          ? rawActiveScenario
          : null,
      completedScenarioIds: Array.isArray(raw.completedScenarioIds)
        ? raw.completedScenarioIds.filter((id): id is string => typeof id === 'string')
        : [],
      scenarioCooldown:
        typeof raw.scenarioCooldown === 'number' ? raw.scenarioCooldown : 0,
      todayNewsChecks: sanitizeChecks(raw.todayNewsChecks),
      previousNewsChecks: sanitizeChecks(raw.previousNewsChecks),
      predictionStats: {
        total: typeof rawStats?.total === 'number' ? rawStats.total : 0,
        correct: typeof rawStats?.correct === 'number' ? rawStats.correct : 0,
      },
      lastDayRecap:
        raw.lastDayRecap && typeof raw.lastDayRecap === 'object'
          ? (raw.lastDayRecap as LastDayRecap)
          : null,
    },
  };
}

function captureActiveSnapshot(state: GameState): LevelGameSnapshot {
  return {
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
    tutorialStep: state.tutorialStep,
    lastDayBreakdown: state.lastDayBreakdown,
    carryoverImpacts: state.carryoverImpacts,
    activeScenario: state.activeScenario,
    completedScenarioIds: state.completedScenarioIds,
    scenarioCooldown: state.scenarioCooldown,
    todayNewsChecks: state.todayNewsChecks,
    previousNewsChecks: state.previousNewsChecks,
    predictionStats: state.predictionStats,
    lastDayRecap: state.lastDayRecap,
  };
}

async function persistState(state: GameState): Promise<void> {
  if (!state.authMode) return;

  const activeSnap = captureActiveSnapshot(state);
  const allSnapshots: Partial<Record<Level, LevelGameSnapshot>> = {
    ...state.gameStates,
    [state.level]: activeSnap,
  };

  const compactGameStates: Partial<Record<Level, CompactLevelSave>> = {};
  (Object.entries(allSnapshots) as [Level, LevelGameSnapshot | undefined][]).forEach(
    ([lvl, snap]) => {
      if (snap && Object.keys(snap.stocks || {}).length > 0) {
        compactGameStates[lvl] = serializeLevelSnapshot(snap);
      }
    }
  );

  const payload: PersistedUserData = {
    schemaVersion: 2,
    displayName: state.displayName,
    currentLevel: state.level,
    gameStates: compactGameStates,
    updatedAt: new Date().toISOString(),
  };

  if (state.authMode === 'guest') {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Error saving guest state to localStorage:', error);
    }
    return;
  }

  if (state.authMode === 'google' && state.uid) {
    try {
      const userDocRef = doc(db, 'users', state.uid);
      await setDoc(userDocRef, payload, { merge: false });
    } catch (error) {
      console.error('Error saving game state to Firestore:', error);
    }
  }
}

const syncLocalGameStates = (
  set: (partial: Partial<GameState>) => void,
  get: () => GameState
) => {
  const state = get();
  const activeSnap = captureActiveSnapshot(state);
  set({
    gameStates: {
      ...state.gameStates,
      [state.level]: activeSnap,
    },
  });
};

const EMPTY_LOGGED_OUT_STATE: Partial<GameState> = {
  authMode: null,
  uid: null,
  displayName: null,
  level: 'elementary',
  dayCount: 1,
  cash: 1_000_000,
  initialCash: 1_000_000,
  stocks: {},
  usedNewsIds: [],
  currentNews: [],
  previousNews: [],
  lastDayBreakdown: {},
  carryoverImpacts: {},
  activeScenario: null,
  completedScenarioIds: [],
  scenarioCooldown: 0,
  todayNewsChecks: {},
  previousNewsChecks: {},
  predictionStats: { total: 0, correct: 0 },
  lastDayRecap: null,
  showRecapModal: false,
  holdings: {},
  totalAssetHistory: [],
  tutorialStep: null,
  gameStates: {},
  isLoadingState: false,
  wasLegacyMigrated: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  authMode: null,
  uid: null,
  displayName: null,
  level: 'elementary',
  isLoadingState: false,
  wasLegacyMigrated: false,

  dayCount: 1,
  cash: 1_000_000,
  initialCash: 1_000_000,

  stocks: {},
  usedNewsIds: [],
  currentNews: [],
  previousNews: [],
  lastDayBreakdown: {},
  carryoverImpacts: {},

  activeScenario: null,
  completedScenarioIds: [],
  scenarioCooldown: 0,

  todayNewsChecks: {},
  previousNewsChecks: {},
  predictionStats: { total: 0, correct: 0 },
  lastDayRecap: null,
  showRecapModal: false,

  holdings: {},
  totalAssetHistory: [],
  gameStates: {},

  theme:
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('theme') as 'light' | 'dark')) ||
    'light',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', nextTheme);
    set({ theme: nextTheme });
  },

  tutorialStep: null,
  setTutorialStep: (step) => {
    set({ tutorialStep: step });
    syncLocalGameStates(set, get);
    void persistState(get());
  },

  clearMigrationNotice: () => set({ wasLegacyMigrated: false }),

  enterGuestMode: (nickname, chosenLevel) => {
    const cleanName = nickname.trim() || '모의투자 학생';
    let loadedStates: Partial<Record<Level, LevelGameSnapshot>> = {};
    let migratedAny = false;

    try {
      const savedRaw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as PersistedUserData;
        if (parsed?.gameStates) {
          (Object.keys(parsed.gameStates) as Level[]).forEach((lvl) => {
            const { snapshot, migrated } = hydrateLevelSnapshot(parsed.gameStates[lvl], lvl);
            loadedStates[lvl] = snapshot;
            if (migrated) migratedAny = true;
          });
        }
      }
    } catch {
      loadedStates = {};
    }

    const activeSnap = loadedStates[chosenLevel] ?? createFreshLevelSnapshot(chosenLevel);
    loadedStates[chosenLevel] = activeSnap;

    set({
      authMode: 'guest',
      uid: 'guest-local',
      displayName: cleanName,
      ...activeSnap,
      gameStates: loadedStates,
      isLoadingState: false,
      wasLegacyMigrated: migratedAny,
    });

    void persistState(get());
  },

  restoreGuestSession: () => {
    try {
      const savedRaw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!savedRaw) return false;
      const parsed = JSON.parse(savedRaw) as PersistedUserData;
      if (!parsed || !parsed.currentLevel) return false;

      const loadedStates: Partial<Record<Level, LevelGameSnapshot>> = {};
      let migratedAny = false;
      if (parsed.gameStates) {
        (Object.keys(parsed.gameStates) as Level[]).forEach((lvl) => {
          const { snapshot, migrated } = hydrateLevelSnapshot(parsed.gameStates[lvl], lvl);
          loadedStates[lvl] = snapshot;
          if (migrated) migratedAny = true;
        });
      }

      const targetLevel = parsed.currentLevel;
      const activeSnap = loadedStates[targetLevel] ?? createFreshLevelSnapshot(targetLevel);
      loadedStates[targetLevel] = activeSnap;

      set({
        authMode: 'guest',
        uid: 'guest-local',
        displayName: parsed.displayName || '모의투자 학생',
        ...activeSnap,
        gameStates: loadedStates,
        isLoadingState: false,
        wasLegacyMigrated: migratedAny,
      });
      return true;
    } catch {
      return false;
    }
  },

  exitSession: async () => {
    const { authMode } = get();
    if (authMode === 'google') {
      await signOut(auth);
    }
    set(EMPTY_LOGGED_OUT_STATE);
  },

  setAuth: async (uid, displayName) => {
    if (uid) {
      set({ authMode: 'google', uid, displayName, isLoadingState: true });
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data) {
            const rawStates = data.gameStates ?? {};
            const currentLevel: Level =
              data.currentLevel === 'elementary' ||
              data.currentLevel === 'middle' ||
              data.currentLevel === 'high'
                ? data.currentLevel
                : data.gameState?.level ?? 'elementary';

            if (Object.keys(rawStates).length === 0 && data.gameState) {
              const prevLevel: Level = data.gameState.level ?? 'elementary';
              rawStates[prevLevel] = data.gameState;
            }

            const hydratedStates: Partial<Record<Level, LevelGameSnapshot>> = {};
            let migratedAny = false;
            (Object.keys(rawStates) as Level[]).forEach((lvl) => {
              if (lvl === 'elementary' || lvl === 'middle' || lvl === 'high') {
                const { snapshot, migrated } = hydrateLevelSnapshot(rawStates[lvl], lvl);
                hydratedStates[lvl] = snapshot;
                if (migrated) migratedAny = true;
              }
            });

            const activeSnap =
              hydratedStates[currentLevel] ?? createFreshLevelSnapshot(currentLevel);
            hydratedStates[currentLevel] = activeSnap;

            set({
              ...activeSnap,
              gameStates: hydratedStates,
              wasLegacyMigrated: migratedAny,
            });

            if (migratedAny || data.schemaVersion !== 2) {
              void persistState(get());
            }
          }
        }
      } catch (error) {
        console.error('Error loading game state from Firestore:', error);
      } finally {
        set({ isLoadingState: false });
      }
    } else {
      // Google 로그아웃 시 게스트 세션이 아닌 경우에만 상태 초기화
      if (get().authMode === 'google') {
        set(EMPTY_LOGGED_OUT_STATE);
      }
    }
  },

  setLevel: (newLevel) => {
    const state = get();
    if (state.level === newLevel && Object.keys(state.stocks).length > 0) return;

    const updatedGameStates: Partial<Record<Level, LevelGameSnapshot>> = {
      ...state.gameStates,
    };

    if (Object.keys(state.stocks).length > 0) {
      updatedGameStates[state.level] = captureActiveSnapshot(state);
    }

    const targetState =
      updatedGameStates[newLevel] &&
      Object.keys(updatedGameStates[newLevel]!.stocks || {}).length > 0
        ? updatedGameStates[newLevel]!
        : createFreshLevelSnapshot(newLevel);

    updatedGameStates[newLevel] = targetState;

    set({
      ...targetState,
      gameStates: updatedGameStates,
    });

    void persistState(get());
  },

  initializeGame: (level) => {
    const initializedState = createFreshLevelSnapshot(level);

    set({
      ...initializedState,
      gameStates: {
        ...get().gameStates,
        [level]: initializedState,
      },
    });

    void persistState(get());
  },

  resetCurrentLevel: () => {
    const { level } = get();
    const fresh = createFreshLevelSnapshot(level);
    set({
      ...fresh,
      showRecapModal: false,
      gameStates: {
        ...get().gameStates,
        [level]: fresh,
      },
    });
    void persistState(get());
  },

  startScenario: (scenarioId) => {
    const state = get();
    const arc = getScenarioById(scenarioId);
    if (!arc) return false;

    const firstEpisode = materializeScenarioNews(arc, 1, state.level);
    if (!firstEpisode) return false;

    const avoidConflicts = state.level === 'elementary' || state.level === 'middle';
    const nonScenarioNews = state.currentNews.filter(
      (item) =>
        !item.scenarioId &&
        (!avoidConflicts || !hasOppositeSectorConflict(firstEpisode, item))
    );

    let updatedCurrentNews: NewsItem[];
    let nextUsedIds = state.usedNewsIds;
    if (nonScenarioNews.length >= 2) {
      updatedCurrentNews = [firstEpisode, ...nonScenarioNews.slice(0, 2)];
    } else {
      const picked = selectDailyNews(
        PREDEFINED_NEWS,
        state.level,
        state.usedNewsIds,
        state.currentNews,
        3,
        [firstEpisode]
      );
      updatedCurrentNews = picked.selected;
      nextUsedIds = picked.nextUsedNewsIds;
    }

    // Keep checks only for surviving news items so the new scenario episode must be read
    const survivingIds = new Set(updatedCurrentNews.map((n) => n.id));
    const filteredChecks: Record<string, NewsPrediction> = {};
    Object.entries(state.todayNewsChecks).forEach(([id, pred]) => {
      if (survivingIds.has(id)) {
        filteredChecks[id] = pred;
      }
    });

    set({
      activeScenario: {
        scenarioId: arc.id,
        currentStep: 1,
        startedDay: state.dayCount,
      },
      scenarioCooldown: 0,
      currentNews: updatedCurrentNews,
      usedNewsIds: nextUsedIds,
      todayNewsChecks: filteredChecks,
    });

    syncLocalGameStates(set, get);
    void persistState(get());
    return true;
  },

  markNewsChecked: (newsId, prediction) => {
    const state = get();
    if (!state.currentNews.some((n) => n.id === newsId)) return;
    set({
      todayNewsChecks: {
        ...state.todayNewsChecks,
        [newsId]: prediction,
      },
    });
    syncLocalGameStates(set, get);
    void persistState(get());
  },

  dismissRecap: () => set({ showRecapModal: false }),

  deleteAccountAndData: async () => {
    const { authMode, uid } = get();
    try {
      if (authMode === 'guest') {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        localStorage.removeItem(PENDING_LEVEL_KEY);
        localStorage.removeItem('stockschool_tutorial_completed');
        set(EMPTY_LOGGED_OUT_STATE);
        return { ok: true, message: '브라우저에 저장된 모든 학습 데이터가 영구 삭제되었습니다.' };
      }

      if (authMode === 'google' && uid) {
        // 1. Firestore 사용자 문서 삭제
        await deleteDoc(doc(db, 'users', uid));

        // 2. Firebase Auth 계정 삭제 (재인증 필요 시 팝업 재인증 후 재시도)
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            await deleteUser(currentUser);
          } catch (err: unknown) {
            const authErr = err as { code?: string };
            if (authErr?.code === 'auth/requires-recent-login') {
              await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
              await deleteUser(currentUser);
            } else {
              throw err;
            }
          }
        }

        localStorage.removeItem(PENDING_LEVEL_KEY);
        localStorage.removeItem(CONSENT_RECORD_KEY);
        set(EMPTY_LOGGED_OUT_STATE);
        return {
          ok: true,
          message: '회원 탈퇴 및 클라우드 개인정보·학습 기록이 모두 영구 파기되었습니다.',
        };
      }

      return { ok: false, message: '활성화된 계정이 없습니다.' };
    } catch (error: unknown) {
      console.error('Account deletion error:', error);
      const msg = error instanceof Error ? error.message : '다시 시도해 주세요.';
      return {
        ok: false,
        message: `데이터 삭제 중 오류가 발생했습니다: ${msg}`,
      };
    }
  },

  buyStock: (stockId, quantity) => {
    const { cash, stocks, holdings } = get();
    const stock = stocks[stockId];
    if (!stock || !Number.isInteger(quantity) || quantity <= 0) return false;

    const cost = stock.currentPrice * quantity;
    if (cash < cost) return false;

    const currentHolding = holdings[stockId] || { quantity: 0, avgPrice: 0 };
    const newQuantity = currentHolding.quantity + quantity;
    const newTotalCost = currentHolding.quantity * currentHolding.avgPrice + cost;
    const newAvgPrice = Math.round(newTotalCost / newQuantity);

    set({
      cash: cash - cost,
      holdings: {
        ...holdings,
        [stockId]: { quantity: newQuantity, avgPrice: newAvgPrice },
      },
    });

    syncLocalGameStates(set, get);
    void persistState(get());
    return true;
  },

  sellStock: (stockId, quantity) => {
    const { stocks, holdings, cash } = get();
    const stock = stocks[stockId];
    const currentHolding = holdings[stockId];

    if (
      !stock ||
      !currentHolding ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > currentHolding.quantity
    ) {
      return false;
    }

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
      holdings: newHoldings,
    });

    syncLocalGameStates(set, get);
    void persistState(get());
    return true;
  },

  nextDay: () => {
    const {
      stocks,
      currentNews,
      usedNewsIds,
      level,
      dayCount,
      cash,
      holdings,
      totalAssetHistory,
      carryoverImpacts,
      activeScenario,
      completedScenarioIds,
      scenarioCooldown,
      todayNewsChecks,
      predictionStats,
    } = get();

    // 0. 전일(오늘 마감 시점) 평가총액 계산
    let prevStockValue = 0;
    Object.entries(holdings).forEach(([id, h]) => {
      const existing = stocks[id];
      if (existing) {
        prevStockValue += existing.currentPrice * h.quantity;
      }
    });
    const prevTotalAsset = cash + prevStockValue;

    // 1. 난이도별 주가·거래량 시뮬레이션 실행
    const { newStocks, breakdownByStock, nextCarryoverImpacts } = simulateNextDay(
      stocks,
      currentNews,
      level,
      carryoverImpacts
    );

    // 2. 보유 주식 평가총액 계산
    let totalStockValue = 0;
    Object.entries(holdings).forEach(([id, h]) => {
      const updated = newStocks[id];
      if (updated) {
        totalStockValue += updated.currentPrice * h.quantity;
      }
    });
    const newTotalAsset = cash + totalStockValue;
    const assetDelta = newTotalAsset - prevTotalAsset;
    const assetDeltaPct = prevTotalAsset > 0 ? (assetDelta / prevTotalAsset) * 100 : 0;

    // 2-1. 학생의 오늘 뉴스 예측 채점
    let checkedCount = 0;
    let correctCount = 0;
    currentNews.forEach((item) => {
      const userPred = todayNewsChecks[item.id];
      if (userPred) {
        checkedCount += 1;
        if (getActualNewsDirection(item) === userPred) {
          correctCount += 1;
        }
      }
    });

    // 3. 멀티데이 시나리오 상태 전이
    const nextDayNum = dayCount + 1;
    let nextActiveScenario: ActiveScenarioState | null = activeScenario;
    const nextCompletedScenarioIds = [...completedScenarioIds];
    let nextCooldown = scenarioCooldown;

    if (activeScenario) {
      const currentArc = getScenarioById(activeScenario.scenarioId);
      if (currentArc && activeScenario.currentStep < currentArc.totalDays) {
        nextActiveScenario = {
          ...activeScenario,
          currentStep: activeScenario.currentStep + 1,
        };
      } else {
        if (!nextCompletedScenarioIds.includes(activeScenario.scenarioId)) {
          nextCompletedScenarioIds.push(activeScenario.scenarioId);
        }
        nextActiveScenario = null;
        nextCooldown = 1;
      }
    } else if (nextDayNum >= 2) {
      if (nextCooldown > 0) {
        nextCooldown = nextCooldown - 1;
      } else if (nextDayNum === 2 || Math.random() < 0.78) {
        const uncompleted = SCENARIO_ARCS.filter(
          (arc) => !nextCompletedScenarioIds.includes(arc.id)
        );
        const candidates = uncompleted.length > 0 ? uncompleted : SCENARIO_ARCS;
        if (candidates.length > 0) {
          const chosen = shuffleArray(candidates)[0];
          nextActiveScenario = {
            scenarioId: chosen.id,
            currentStep: 1,
            startedDay: nextDayNum,
          };
        }
      }
    }

    const seedSelected: NewsItem[] = [];
    if (nextActiveScenario) {
      const arc = getScenarioById(nextActiveScenario.scenarioId);
      const epNews = arc
        ? materializeScenarioNews(arc, nextActiveScenario.currentStep, level)
        : null;
      if (epNews) {
        seedSelected.push(epNews);
      }
    }

    // 4. 충돌 방지·균형 뉴스 선별 (시나리오 에피소드가 있으면 1번 슬롯에 배치하고 나머지 2건을 충돌 없이 선별)
    const { selected, nextUsedNewsIds } = selectDailyNews(
      PREDEFINED_NEWS,
      level,
      usedNewsIds,
      currentNews,
      3,
      seedSelected
    );

    set({
      dayCount: nextDayNum,
      stocks: newStocks,
      previousNews: currentNews,
      currentNews: selected,
      usedNewsIds: nextUsedNewsIds,
      lastDayBreakdown: breakdownByStock,
      carryoverImpacts: nextCarryoverImpacts,
      activeScenario: nextActiveScenario,
      completedScenarioIds: nextCompletedScenarioIds,
      scenarioCooldown: nextCooldown,
      previousNewsChecks: { ...todayNewsChecks },
      todayNewsChecks: {},
      predictionStats: {
        total: predictionStats.total + checkedCount,
        correct: predictionStats.correct + correctCount,
      },
      lastDayRecap: {
        dayNumber: nextDayNum,
        prevTotalAsset,
        newTotalAsset,
        assetDelta,
        assetDeltaPct,
        checkedCount,
        correctCount,
      },
      showRecapModal: true,
      totalAssetHistory: [...totalAssetHistory, newTotalAsset],
    });

    syncLocalGameStates(set, get);
    void persistState(get());
  },
}));
