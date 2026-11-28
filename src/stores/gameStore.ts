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
  evaluateSectorGuesses,
  getActualNewsDirection,
  hasOppositeSectorConflict,
  MAX_HISTORY_LENGTH,
  selectDailyNews,
  simulateNextDay,
} from '../lib/priceEngine';
import { getHoldingCostBasis } from '../lib/tradingMetrics';
import {
  decodeIdList,
  decodeJsonArray,
  decodeNumberArray,
  encodeIdList,
  encodeNumberArrayCsv,
  isValidLevel,
  sanitizeDisplayName,
  stripUndefinedDeep,
  VALID_LEVELS,
} from '../lib/persistenceUtils';
import { safeLocalStorage, safeSessionStorage } from '../lib/safeStorage';
import {
  ALL_SECTORS,
  type ActiveScenarioState,
  type AuthMode,
  type CompactStockSave,
  type DayStockBreakdown,
  type Holding,
  type LastDayRecap,
  type Level,
  type LevelGameSnapshot,
  type NewsItem,
  type NewsPrediction,
  type PredictionStats,
  type SectorId,
  type StockState,
  type TradeRecord,
  type TradeStats,
  type TradeType,
} from '../lib/types';
import { deleteDoc, doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import {
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { toast } from 'sonner';

export type {
  AuthMode,
  DayStockBreakdown,
  Holding,
  LastDayRecap,
  Level,
  NewsPrediction,
  PredictionStats,
  StockState,
  TradeRecord,
  TradeStats,
  TradeType,
};

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

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
  if (currentNews.length === 0) return false;
  return countCheckedTodayNews(currentNews, todayNewsChecks) >= currentNews.length;
}

export const GUEST_STORAGE_KEY = 'stockschool_guest_state_v2';
const GUEST_CORRUPT_BACKUP_KEY = 'stockschool_guest_state_v2_corrupt_backup';
const PENDING_LEVEL_KEY = 'stockschool_pending_level';
const PENDING_LEVEL_TTL_MS = 3 * 60 * 1000;
const EXPLICIT_LOGOUT_KEY = 'stockschool_explicit_logout';
const CONSENT_RECORD_KEY = 'stockschool_consent_v1';
export const TUTORIAL_COMPLETED_KEY = 'stockschool_tutorial_completed';
export const MAX_TRADE_HISTORY = 200;
const DEBOUNCE_PERSIST_MS = 350;
const RECENT_LOGIN_THRESHOLD_MS = 4 * 60 * 1000;

export function setPendingGoogleLevel(level: Level): void {
  if (!isValidLevel(level)) return;
  safeLocalStorage.removeItem(PENDING_LEVEL_KEY);
  safeSessionStorage.setItem(
    PENDING_LEVEL_KEY,
    JSON.stringify({ level, createdAt: Date.now() })
  );
}

export function clearPendingGoogleLevel(): void {
  safeSessionStorage.removeItem(PENDING_LEVEL_KEY);
  safeLocalStorage.removeItem(PENDING_LEVEL_KEY);
}

export function consumePendingGoogleLevel(): Level | null {
  const sessionRaw = safeSessionStorage.getItem(PENDING_LEVEL_KEY);
  safeSessionStorage.removeItem(PENDING_LEVEL_KEY);
  safeLocalStorage.removeItem(PENDING_LEVEL_KEY);

  if (!sessionRaw) return null;
  try {
    const parsed = JSON.parse(sessionRaw) as { level?: unknown; createdAt?: unknown };
    if (
      isValidLevel(parsed.level) &&
      typeof parsed.createdAt === 'number' &&
      Date.now() - parsed.createdAt <= PENDING_LEVEL_TTL_MS
    ) {
      return parsed.level;
    }
  } catch {
    // ignore malformed pending level
  }
  return null;
}

export function hasExplicitLogoutFlag(): boolean {
  return safeSessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === '1';
}

function setExplicitLogoutFlag(flag: boolean): void {
  if (flag) {
    safeSessionStorage.setItem(EXPLICIT_LOGOUT_KEY, '1');
  } else {
    safeSessionStorage.removeItem(EXPLICIT_LOGOUT_KEY);
  }
}

export interface SavedGuestSummary {
  displayName: string;
  currentLevel: Level;
  dayCount: number;
  levelDays: Partial<Record<Level, number>>;
  updatedAt: string;
}

export function getSavedGuestSummary(): SavedGuestSummary | null {
  const savedRaw = safeLocalStorage.getItem(GUEST_STORAGE_KEY);
  if (!savedRaw) return null;
  try {
    const parsed = JSON.parse(savedRaw) as Partial<PersistedUserData>;
    if (!parsed || typeof parsed !== 'object' || !parsed.gameStates) return null;

    const currentLevel: Level = isValidLevel(parsed.currentLevel)
      ? parsed.currentLevel
      : 'elementary';
    const levelDays: Partial<Record<Level, number>> = {};
    for (const lvl of VALID_LEVELS) {
      const entry = parsed.gameStates[lvl] as { dayCount?: unknown } | undefined;
      if (entry && typeof entry.dayCount === 'number' && Number.isFinite(entry.dayCount)) {
        levelDays[lvl] = Math.max(1, Math.floor(entry.dayCount));
      }
    }
    if (Object.keys(levelDays).length === 0) return null;

    return {
      displayName: sanitizeDisplayName(parsed.displayName, '모의투자 학생'),
      currentLevel,
      dayCount: levelDays[currentLevel] ?? 1,
      levelDays,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export interface CompactLevelSave {
  schemaVersion: number;
  revision?: number;
  level: Level;
  dayCount: number;
  cash: number;
  initialCash: number;
  stocks: Record<string, CompactStockSave>;
  usedNewsIds?: string[];
  usedNewsIdsCsv?: string;
  currentNewsIds: string[];
  previousNewsIds: string[];
  holdings: Record<string, Holding>;
  totalAssetHistory?: number[];
  totalAssetHistoryCsv?: string;
  tutorialStep: number | null;
  lastDayBreakdown?: Record<string, DayStockBreakdown>;
  carryoverImpacts?: Record<string, number>;
  activeScenario?: ActiveScenarioState | null;
  completedScenarioIds?: string[];
  scenarioCooldown?: number;
  todayNewsChecks?: Record<string, NewsPrediction>;
  previousNewsChecks?: Record<string, NewsPrediction>;
  todayNewsSectorGuesses?: Record<string, SectorId[]>;
  previousNewsSectorGuesses?: Record<string, SectorId[]>;
  predictionStats?: PredictionStats;
  sectorPredictionStats?: PredictionStats;
  watchlistStockIds?: string[];
  lastDayRecap?: LastDayRecap | null;
  tradeHistory?: TradeRecord[];
  tradeHistoryJson?: string;
  tradeStats?: TradeStats;
  realizedProfitTotal?: number;
}

export interface PersistedUserData {
  schemaVersion: number;
  displayName: string | null;
  currentLevel: Level;
  gameStates: Partial<Record<Level, CompactLevelSave>>;
  updatedAt: string;
}

function computeTradeStatsFromHistory(history: TradeRecord[]): TradeStats {
  let buyCount = 0;
  let sellCount = 0;
  let winSells = 0;
  let lossSells = 0;
  for (const t of history) {
    if (t.type === 'buy') {
      buyCount += 1;
    } else {
      sellCount += 1;
      if ((t.realizedProfit ?? 0) > 0) winSells += 1;
      else if ((t.realizedProfit ?? 0) < 0) lossSells += 1;
    }
  }
  return {
    total: history.length,
    buyCount,
    sellCount,
    winSells,
    lossSells,
  };
}

function emptyTradeStats(): TradeStats {
  return { total: 0, buyCount: 0, sellCount: 0, winSells: 0, lossSells: 0 };
}

export const getInitialCash = (level: Level): number => {
  if (level === 'elementary') return 1_000_000;
  if (level === 'middle') return 5_000_000;
  return 10_000_000;
};

export function createFreshLevelSnapshot(level: Level, revision = 0): LevelGameSnapshot {
  const safeLevel: Level = isValidLevel(level) ? level : 'elementary';
  const initialCash = getInitialCash(safeLevel);
  const { selected, nextUsedNewsIds } = selectDailyNews(
    PREDEFINED_NEWS,
    safeLevel,
    [],
    [],
    3
  );
  return {
    level: safeLevel,
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
    todayNewsSectorGuesses: {},
    previousNewsSectorGuesses: {},
    predictionStats: { total: 0, correct: 0 },
    sectorPredictionStats: { total: 0, correct: 0 },
    watchlistStockIds: [],
    lastDayRecap: null,
    tradeHistory: [],
    tradeStats: emptyTradeStats(),
    realizedProfitTotal: 0,
    revision,
  };
}

function sanitizeBreakdownMap(
  input: unknown
): Record<string, DayStockBreakdown> {
  const out: Record<string, DayStockBreakdown> = {};
  if (!input || typeof input !== 'object') return out;
  for (const [id, rawVal] of Object.entries(input as Record<string, unknown>)) {
    if (!STOCK_BY_ID[id] || !rawVal || typeof rawVal !== 'object') continue;
    const rec = rawVal as Record<string, unknown>;
    const prevPrice = Number(rec.prevPrice);
    const newPrice = Number(rec.newPrice);
    const actualChangePct = Number(rec.actualChangePct);
    const newsContribution = Number(rec.newsContribution);
    const carryoverContribution = Number(rec.carryoverContribution);
    const marketAndNoise = Number(rec.marketAndNoise);
    const shockContribution = Number(rec.shockContribution);
    if (
      !Number.isFinite(prevPrice) ||
      !Number.isFinite(newPrice) ||
      !Number.isFinite(actualChangePct) ||
      !Number.isFinite(newsContribution) ||
      !Number.isFinite(carryoverContribution) ||
      !Number.isFinite(marketAndNoise) ||
      !Number.isFinite(shockContribution)
    ) {
      continue;
    }
    const clean: DayStockBreakdown = {
      stockId: id,
      prevPrice,
      newPrice,
      actualChangePct,
      newsContribution,
      carryoverContribution,
      marketAndNoise,
      shockContribution,
      ...(typeof rec.shockReason === 'string' && rec.shockReason.trim().length > 0
        ? { shockReason: rec.shockReason.trim() }
        : {}),
    };
    out[id] = clean;
  }
  return out;
}

/**
 * Firestore/localStorage 저장 시 정적 descriptions 및 기사 전문을 제거하고
 * 대용량 배열(priceHistory/volumeHistory/totalAssetHistory/usedNewsIds/tradeHistory)을
 * CSV·JSON 문자열로 압축해 문서 크기와 Firestore 단일 필드 인덱스 엔트리(40,000 한도)를
 * 95% 이상 절감합니다. 또한 undefined 프로퍼티를 완전히 제거합니다.
 */
export function serializeLevelSnapshot(snap: LevelGameSnapshot): CompactLevelSave {
  const compactStocks: Record<string, CompactStockSave> = {};
  Object.entries(snap.stocks).forEach(([id, s]) => {
    const safePrices = (s.priceHistory ?? [])
      .filter((p) => typeof p === 'number' && Number.isFinite(p) && p >= 100)
      .slice(-MAX_HISTORY_LENGTH);
    const safePrice =
      Number.isFinite(s.currentPrice) && s.currentPrice >= 100
        ? s.currentPrice
        : safePrices[safePrices.length - 1] ?? s.basePrice;
    const finalPrices = safePrices.length > 0 ? safePrices : [safePrice];
    const safeVolumes = (s.volumeHistory ?? [])
      .filter((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0)
      .slice(-MAX_HISTORY_LENGTH);
    const finalVolumes =
      safeVolumes.length === finalPrices.length
        ? safeVolumes
        : finalPrices.map(() => calculateDailyVolume(s.basePrice, 0.01, false));

    compactStocks[id] = {
      currentPrice: safePrice,
      pricesCsv: encodeNumberArrayCsv(finalPrices),
      volumesCsv: encodeNumberArrayCsv(finalVolumes),
    };
  });

  const cleanHoldings: Record<string, Holding> = {};
  Object.entries(snap.holdings ?? {}).forEach(([id, h]) => {
    const qty = Math.floor(h.quantity);
    if (STOCK_BY_ID[id] && Number.isFinite(qty) && qty > 0) {
      const totalCost = Math.max(0, Math.round(getHoldingCostBasis(h)));
      const avgPrice = Math.max(1, Math.round(totalCost / qty));
      cleanHoldings[id] = { quantity: qty, avgPrice, totalCost };
    }
  });

  const safeTrades = (snap.tradeHistory ?? []).slice(-MAX_TRADE_HISTORY);
  const safeTradeStats = snap.tradeStats ?? computeTradeStatsFromHistory(safeTrades);
  const cleanBreakdown = sanitizeBreakdownMap(snap.lastDayBreakdown);

  const cleanCarryover: Record<string, number> = {};
  Object.entries(snap.carryoverImpacts ?? {}).forEach(([id, val]) => {
    if (STOCK_BY_ID[id] && typeof val === 'number' && Number.isFinite(val)) {
      cleanCarryover[id] = val;
    }
  });

  const cleanTodayGuesses: Record<string, SectorId[]> = {};
  Object.entries(snap.todayNewsSectorGuesses ?? {}).forEach(([id, list]) => {
    if (Array.isArray(list) && list.length > 0) {
      cleanTodayGuesses[id] = list;
    }
  });

  const cleanPrevGuesses: Record<string, SectorId[]> = {};
  Object.entries(snap.previousNewsSectorGuesses ?? {}).forEach(([id, list]) => {
    if (Array.isArray(list) && list.length > 0) {
      cleanPrevGuesses[id] = list;
    }
  });

  return stripUndefinedDeep<CompactLevelSave>({
    schemaVersion: 2,
    revision: typeof snap.revision === 'number' && Number.isFinite(snap.revision) ? snap.revision : 0,
    level: snap.level,
    dayCount: Math.max(1, Math.floor(snap.dayCount)),
    cash: Number.isFinite(snap.cash) && snap.cash >= 0 ? Math.round(snap.cash) : snap.initialCash,
    initialCash:
      Number.isFinite(snap.initialCash) && snap.initialCash > 0
        ? Math.round(snap.initialCash)
        : getInitialCash(snap.level),
    stocks: compactStocks,
    usedNewsIdsCsv: encodeIdList(
      (snap.usedNewsIds ?? []).filter((id) => Boolean(NEWS_BY_ID[id]) && !NEWS_BY_ID[id]?.scenarioId)
    ),
    currentNewsIds: snap.currentNews.map((n) => n.id),
    previousNewsIds: snap.previousNews.map((n) => n.id),
    holdings: cleanHoldings,
    totalAssetHistoryCsv: encodeNumberArrayCsv(
      (snap.totalAssetHistory ?? []).slice(-MAX_HISTORY_LENGTH)
    ),
    tutorialStep: null,
    lastDayBreakdown: cleanBreakdown,
    carryoverImpacts: cleanCarryover,
    activeScenario: snap.activeScenario ?? null,
    completedScenarioIds: snap.completedScenarioIds ?? [],
    scenarioCooldown:
      typeof snap.scenarioCooldown === 'number' && Number.isFinite(snap.scenarioCooldown)
        ? Math.max(0, Math.floor(snap.scenarioCooldown))
        : 0,
    todayNewsChecks: snap.todayNewsChecks ?? {},
    previousNewsChecks: snap.previousNewsChecks ?? {},
    todayNewsSectorGuesses: cleanTodayGuesses,
    previousNewsSectorGuesses: cleanPrevGuesses,
    predictionStats: snap.predictionStats ?? { total: 0, correct: 0 },
    sectorPredictionStats: snap.sectorPredictionStats ?? { total: 0, correct: 0 },
    watchlistStockIds: snap.watchlistStockIds ?? [],
    lastDayRecap: snap.lastDayRecap ?? null,
    tradeHistoryJson: JSON.stringify(safeTrades),
    tradeStats: safeTradeStats,
    realizedProfitTotal: Number.isFinite(snap.realizedProfitTotal)
      ? Math.round(snap.realizedProfitTotal)
      : 0,
  });
}

function sanitizeLastDayRecap(input: unknown): LastDayRecap | null {
  if (!input || typeof input !== 'object') return null;
  const r = input as Record<string, unknown>;
  const dayNumber = Number(r.dayNumber);
  const prevTotalAsset = Number(r.prevTotalAsset);
  const newTotalAsset = Number(r.newTotalAsset);
  const assetDelta = Number(r.assetDelta);
  const assetDeltaPct = Number(r.assetDeltaPct);
  const checkedCount = Number(r.checkedCount);
  const correctCount = Number(r.correctCount);
  if (
    !Number.isFinite(dayNumber) ||
    dayNumber < 1 ||
    !Number.isFinite(prevTotalAsset) ||
    !Number.isFinite(newTotalAsset) ||
    !Number.isFinite(assetDelta) ||
    !Number.isFinite(assetDeltaPct) ||
    !Number.isFinite(checkedCount) ||
    !Number.isFinite(correctCount)
  ) {
    return null;
  }
  const recap: LastDayRecap = {
    dayNumber: Math.floor(dayNumber),
    prevTotalAsset,
    newTotalAsset,
    assetDelta,
    assetDeltaPct,
    checkedCount: Math.max(0, Math.floor(checkedCount)),
    correctCount: Math.max(0, Math.min(Math.floor(checkedCount), Math.floor(correctCount))),
  };
  if (typeof r.sectorCheckedCount === 'number' && Number.isFinite(r.sectorCheckedCount)) {
    recap.sectorCheckedCount = Math.max(0, Math.floor(r.sectorCheckedCount));
  }
  if (typeof r.sectorCorrectCount === 'number' && Number.isFinite(r.sectorCorrectCount)) {
    const maxSec = recap.sectorCheckedCount ?? Math.floor(r.sectorCorrectCount);
    recap.sectorCorrectCount = Math.max(0, Math.min(maxSec, Math.floor(r.sectorCorrectCount)));
  }
  return recap;
}

/**
 * 경량 저장 포맷을 런타임 상태로 복원 (구버전 실기업 ID 감지 시 안전 마이그레이션,
 * NaN·음수·범위 이탈·고아 키·누락 종목/뉴스 전면 정제)
 */
export function hydrateLevelSnapshot(
  rawInput: unknown,
  fallbackLevel: Level
): { snapshot: LevelGameSnapshot; migrated: boolean; repaired: boolean } {
  const safeFallback: Level = isValidLevel(fallbackLevel) ? fallbackLevel : 'elementary';
  if (!rawInput || typeof rawInput !== 'object') {
    return {
      snapshot: createFreshLevelSnapshot(safeFallback),
      migrated: false,
      repaired: true,
    };
  }
  const raw = rawInput as Record<string, unknown>;
  const level: Level = isValidLevel(raw.level) ? raw.level : safeFallback;
  let repaired = !isValidLevel(raw.level);

  const rawStocks =
    raw.stocks && typeof raw.stocks === 'object'
      ? (raw.stocks as Record<string, Record<string, unknown>>)
      : {};
  const validKeys = Object.keys(rawStocks).filter((id) => Boolean(STOCK_BY_ID[id]));

  // 구버전 실제 기업명 데이터이거나 종목이 비어 있으면 신규 가상 기업 시장으로 안전 초기화
  if (validKeys.length < Math.floor(INITIAL_STOCKS.length * 0.5)) {
    const hadOldStocks = Object.keys(rawStocks).length > 0;
    return {
      snapshot: createFreshLevelSnapshot(level),
      migrated: hadOldStocks,
      repaired: true,
    };
  }

  const dayCount =
    typeof raw.dayCount === 'number' && Number.isFinite(raw.dayCount) && raw.dayCount >= 1
      ? Math.floor(raw.dayCount)
      : 1;
  if (dayCount !== raw.dayCount) repaired = true;

  // 1차 패스: 저장된 종목 복원 & 유효 히스토리 길이 파악
  const stocks: Record<string, StockState> = {};
  const missingStockDefs: typeof INITIAL_STOCKS = [];
  let maxObservedHistoryLen = 1;

  INITIAL_STOCKS.forEach((def) => {
    const saved = rawStocks[def.id];
    if (
      saved &&
      typeof saved.currentPrice === 'number' &&
      Number.isFinite(saved.currentPrice) &&
      saved.currentPrice >= 100
    ) {
      const decodedPrices = decodeNumberArray(saved.pricesCsv ?? saved.priceHistory)
        .filter((p) => p >= 100)
        .slice(-MAX_HISTORY_LENGTH);
      const priceHistory: number[] =
        decodedPrices.length > 0 ? decodedPrices : [saved.currentPrice];
      // 마지막 이력과 currentPrice 정합성 보정
      if (priceHistory[priceHistory.length - 1] !== saved.currentPrice) {
        priceHistory[priceHistory.length - 1] = saved.currentPrice;
        repaired = true;
      }

      const decodedVolumes = decodeNumberArray(saved.volumesCsv ?? saved.volumeHistory)
        .filter((v) => v >= 0)
        .slice(-MAX_HISTORY_LENGTH);
      const volumeHistory: number[] =
        decodedVolumes.length === priceHistory.length
          ? decodedVolumes
          : priceHistory.map(() => calculateDailyVolume(def.basePrice, 0.01, false));

      if (priceHistory.length > maxObservedHistoryLen) {
        maxObservedHistoryLen = priceHistory.length;
      }

      stocks[def.id] = {
        ...def,
        currentPrice: saved.currentPrice,
        priceHistory,
        volumeHistory,
      };
    } else {
      missingStockDefs.push(def);
      repaired = true;
    }
  });

  // 누락/손상 종목은 기존 시장 길이와 맞춰 보정
  missingStockDefs.forEach((def) => {
    const fresh = createInitialStocks([def])[def.id];
    const targetLen = Math.min(MAX_HISTORY_LENGTH, Math.max(1, maxObservedHistoryLen));
    const paddedPrices = Array.from({ length: targetLen }, () => fresh.currentPrice);
    const paddedVolumes = Array.from({ length: targetLen }, () =>
      calculateDailyVolume(def.basePrice, 0.01, false)
    );
    stocks[def.id] = {
      ...fresh,
      priceHistory: paddedPrices,
      volumeHistory: paddedVolumes,
    };
  });

  // 뉴스 복원 (ID 배열 우선, 구버전 객체 배열 폴백, 중복 ID 제거)
  const resolveNewsList = (ids: unknown, legacyObjs: unknown): NewsItem[] => {
    const seen = new Set<string>();
    const out: NewsItem[] = [];
    const pushById = (id: unknown) => {
      if (typeof id !== 'string' || seen.has(id)) return;
      const item = NEWS_BY_ID[id];
      if (item) {
        seen.add(id);
        out.push(item);
      }
    };
    if (Array.isArray(ids)) {
      ids.forEach(pushById);
      return out;
    }
    if (Array.isArray(legacyObjs)) {
      legacyObjs.forEach((obj) => {
        const rec = obj && typeof obj === 'object' ? (obj as { id?: unknown }) : null;
        pushById(rec?.id);
      });
      return out;
    }
    return [];
  };

  let currentNews = resolveNewsList(raw.currentNewsIds, raw.currentNews);
  const rawUsedList = decodeIdList(raw.usedNewsIdsCsv ?? raw.usedNewsIds);
  let usedNewsIds: string[] = Array.from(
    new Set(
      rawUsedList.filter((id) => Boolean(NEWS_BY_ID[id]) && !NEWS_BY_ID[id]?.scenarioId)
    )
  );

  // 오늘 뉴스가 비었거나 일부(1~2건)가 유실된 경우 3건으로 안전 보충
  if (currentNews.length < 3) {
    const picked = selectDailyNews(
      PREDEFINED_NEWS,
      level,
      usedNewsIds,
      currentNews,
      3,
      currentNews
    );
    currentNews = picked.selected;
    usedNewsIds = picked.nextUsedNewsIds;
    repaired = true;
  }

  const previousNews = resolveNewsList(raw.previousNewsIds, raw.previousNews);
  const currentNewsIdSet = new Set(currentNews.map((n) => n.id));
  const previousNewsIdSet = new Set(previousNews.map((n) => n.id));

  // 보유 종목 중 유효한 stockId · 정수 양수 수량만 유지 (0주 유령 보유 원천 차단)
  const cleanHoldings: Record<string, Holding> = {};
  if (raw.holdings && typeof raw.holdings === 'object') {
    Object.entries(raw.holdings as Record<string, unknown>).forEach(([id, h]) => {
      const rec =
        h && typeof h === 'object'
          ? (h as { quantity?: unknown; avgPrice?: unknown; totalCost?: unknown })
          : null;
      if (
        STOCK_BY_ID[id] &&
        rec &&
        typeof rec.quantity === 'number' &&
        Number.isFinite(rec.quantity)
      ) {
        const qty = Math.floor(rec.quantity);
        if (qty <= 0) {
          repaired = true;
          return;
        }
        const fallbackPrice = stocks[id].currentPrice;
        const rawAvg = Number(rec.avgPrice);
        const safeAvg =
          Number.isFinite(rawAvg) && rawAvg > 0 ? Math.round(rawAvg) : fallbackPrice;
        const rawTotalCost = Number(rec.totalCost);
        const totalCost =
          Number.isFinite(rawTotalCost) && rawTotalCost > 0
            ? Math.round(rawTotalCost)
            : safeAvg * qty;
        cleanHoldings[id] = {
          quantity: qty,
          avgPrice: Math.max(1, Math.round(totalCost / qty)),
          totalCost,
        };
      } else {
        repaired = true;
      }
    });
  }

  const initialCash =
    typeof raw.initialCash === 'number' &&
    Number.isFinite(raw.initialCash) &&
    raw.initialCash > 0
      ? Math.round(raw.initialCash)
      : getInitialCash(level);
  const cash =
    typeof raw.cash === 'number' && Number.isFinite(raw.cash) && raw.cash >= 0
      ? Math.round(raw.cash)
      : initialCash;
  if (cash !== raw.cash || initialCash !== raw.initialCash) repaired = true;

  // 시나리오 상태 엄격 검증 (scenarioId + currentStep 1..totalDays + startedDay >= 1)
  let validActiveScenario: ActiveScenarioState | null = null;
  if (raw.activeScenario && typeof raw.activeScenario === 'object') {
    const rec = raw.activeScenario as Record<string, unknown>;
    const arc = typeof rec.scenarioId === 'string' ? getScenarioById(rec.scenarioId) : undefined;
    const step = Number(rec.currentStep);
    const startedDay = Number(rec.startedDay);
    if (
      arc &&
      Number.isInteger(step) &&
      step >= 1 &&
      step <= arc.totalDays &&
      Number.isFinite(startedDay) &&
      startedDay >= 1
    ) {
      validActiveScenario = {
        scenarioId: arc.id,
        currentStep: step,
        startedDay: Math.floor(startedDay),
      };
    } else {
      repaired = true;
    }
  }

  const sanitizeChecks = (
    input: unknown,
    allowedIds: Set<string>
  ): Record<string, NewsPrediction> => {
    const out: Record<string, NewsPrediction> = {};
    if (input && typeof input === 'object') {
      Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
        if (allowedIds.has(k) && (v === 'bullish' || v === 'bearish' || v === 'mixed')) {
          out[k] = v;
        }
      });
    }
    return out;
  };

  const sanitizeSectorGuesses = (
    input: unknown,
    allowedIds: Set<string>
  ): Record<string, SectorId[]> => {
    const out: Record<string, SectorId[]> = {};
    if (input && typeof input === 'object') {
      Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
        if (!allowedIds.has(k) || !Array.isArray(v)) return;
        const clean = Array.from(
          new Set(
            v.filter(
              (s): s is SectorId =>
                typeof s === 'string' && (ALL_SECTORS as readonly string[]).includes(s)
            )
          )
        );
        if (clean.length > 0) out[k] = clean.slice(0, 3);
      });
    }
    return out;
  };

  const sanitizePredictionStats = (input: unknown): PredictionStats => {
    if (!input || typeof input !== 'object') return { total: 0, correct: 0 };
    const rec = input as { total?: unknown; correct?: unknown };
    const total =
      typeof rec.total === 'number' && Number.isFinite(rec.total) && rec.total >= 0
        ? Math.floor(rec.total)
        : 0;
    const rawCorrect =
      typeof rec.correct === 'number' && Number.isFinite(rec.correct) && rec.correct >= 0
        ? Math.floor(rec.correct)
        : 0;
    return { total, correct: Math.min(total, rawCorrect) };
  };

  const sanitizeTradeHistory = (input: unknown): TradeRecord[] => {
    const rawList = decodeJsonArray(input);
    const cleaned: TradeRecord[] = [];
    rawList.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object') return;
      const rec = entry as Record<string, unknown>;
      const type: TradeType | null =
        rec.type === 'buy' || rec.type === 'sell' ? rec.type : null;
      const stockId = typeof rec.stockId === 'string' ? rec.stockId : null;
      const quantity =
        typeof rec.quantity === 'number' && Number.isFinite(rec.quantity)
          ? Math.floor(rec.quantity)
          : 0;
      const price =
        typeof rec.price === 'number' && Number.isFinite(rec.price) ? rec.price : -1;
      const entryDay =
        typeof rec.dayCount === 'number' && Number.isFinite(rec.dayCount) && rec.dayCount >= 1
          ? Math.floor(rec.dayCount)
          : 1;

      if (!type || !stockId || quantity <= 0 || price < 0) return;

      const stockDef = STOCK_BY_ID[stockId];
      const stockName =
        stockDef?.name ??
        (typeof rec.stockName === 'string' && rec.stockName.trim() ? rec.stockName : stockId);
      const sector = stockDef?.sector ?? (typeof rec.sector === 'string' ? rec.sector : '기술(Tech)');
      const totalAmount =
        typeof rec.totalAmount === 'number' && Number.isFinite(rec.totalAmount)
          ? rec.totalAmount
          : price * quantity;

      const item: TradeRecord = {
        id:
          typeof rec.id === 'string' && rec.id
            ? rec.id
            : `tr-hydrated-${entryDay}-${idx}`,
        dayCount: entryDay,
        timestamp:
          typeof rec.timestamp === 'string' && rec.timestamp
            ? rec.timestamp
            : new Date().toISOString(),
        type,
        stockId,
        stockName,
        sector: sector as TradeRecord['sector'],
        quantity,
        price,
        totalAmount,
      };

      if (typeof rec.avgPriceBefore === 'number' && Number.isFinite(rec.avgPriceBefore)) {
        item.avgPriceBefore = rec.avgPriceBefore;
      }
      if (typeof rec.realizedProfit === 'number' && Number.isFinite(rec.realizedProfit)) {
        item.realizedProfit = rec.realizedProfit;
      }
      if (typeof rec.realizedProfitRate === 'number' && Number.isFinite(rec.realizedProfitRate)) {
        item.realizedProfitRate = rec.realizedProfitRate;
      }

      cleaned.push(item);
    });
    return cleaned.slice(-MAX_TRADE_HISTORY);
  };

  const tradeHistory = sanitizeTradeHistory(raw.tradeHistoryJson ?? raw.tradeHistory);
  const derivedTradeStats = computeTradeStatsFromHistory(tradeHistory);
  const tradeStats: TradeStats = (() => {
    if (raw.tradeStats && typeof raw.tradeStats === 'object') {
      const r = raw.tradeStats as Record<string, unknown>;
      const total = Number(r.total);
      const buyCount = Number(r.buyCount);
      const sellCount = Number(r.sellCount);
      const winSells = Number(r.winSells);
      const lossSells = Number(r.lossSells);
      if (
        Number.isFinite(total) &&
        total >= derivedTradeStats.total &&
        Number.isFinite(buyCount) &&
        buyCount >= 0 &&
        Number.isFinite(sellCount) &&
        sellCount >= 0 &&
        Number.isFinite(winSells) &&
        winSells >= 0 &&
        Number.isFinite(lossSells) &&
        lossSells >= 0
      ) {
        return {
          total: Math.floor(total),
          buyCount: Math.floor(buyCount),
          sellCount: Math.floor(sellCount),
          winSells: Math.floor(winSells),
          lossSells: Math.floor(lossSells),
        };
      }
    }
    return derivedTradeStats;
  })();

  const realizedProfitTotal =
    typeof raw.realizedProfitTotal === 'number' && Number.isFinite(raw.realizedProfitTotal)
      ? Math.round(raw.realizedProfitTotal)
      : tradeHistory.reduce((sum, t) => sum + (t.realizedProfit ?? 0), 0);

  const decodedAssetHistory = decodeNumberArray(
    raw.totalAssetHistoryCsv ?? raw.totalAssetHistory
  )
    .filter((v) => v >= 0)
    .slice(-MAX_HISTORY_LENGTH);
  const totalAssetHistory =
    decodedAssetHistory.length > 0 ? decodedAssetHistory : [initialCash];

  const cleanCarryover: Record<string, number> = {};
  if (raw.carryoverImpacts && typeof raw.carryoverImpacts === 'object') {
    Object.entries(raw.carryoverImpacts as Record<string, unknown>).forEach(([id, v]) => {
      if (STOCK_BY_ID[id] && typeof v === 'number' && Number.isFinite(v)) {
        cleanCarryover[id] = v;
      }
    });
  }

  const revision =
    typeof raw.revision === 'number' && Number.isFinite(raw.revision) && raw.revision >= 0
      ? Math.floor(raw.revision)
      : 0;

  // 구 포맷(비압축 배열)을 감지하면 재저장 시 압축 포맷으로 업그레이드
  if (raw.schemaVersion !== 2 || !raw.totalAssetHistoryCsv) {
    repaired = true;
  }

  return {
    migrated: false,
    repaired,
    snapshot: {
      level,
      dayCount,
      cash,
      initialCash,
      stocks,
      usedNewsIds,
      currentNews,
      previousNews,
      holdings: cleanHoldings,
      totalAssetHistory,
      tutorialStep: null,
      lastDayBreakdown: sanitizeBreakdownMap(raw.lastDayBreakdown),
      carryoverImpacts: cleanCarryover,
      activeScenario: validActiveScenario,
      completedScenarioIds: Array.isArray(raw.completedScenarioIds)
        ? Array.from(
            new Set(
              raw.completedScenarioIds.filter(
                (id): id is string => typeof id === 'string' && Boolean(getScenarioById(id))
              )
            )
          )
        : [],
      scenarioCooldown:
        typeof raw.scenarioCooldown === 'number' &&
        Number.isFinite(raw.scenarioCooldown) &&
        raw.scenarioCooldown >= 0
          ? Math.floor(raw.scenarioCooldown)
          : 0,
      todayNewsChecks: sanitizeChecks(raw.todayNewsChecks, currentNewsIdSet),
      previousNewsChecks: sanitizeChecks(raw.previousNewsChecks, previousNewsIdSet),
      todayNewsSectorGuesses: sanitizeSectorGuesses(
        raw.todayNewsSectorGuesses,
        currentNewsIdSet
      ),
      previousNewsSectorGuesses: sanitizeSectorGuesses(
        raw.previousNewsSectorGuesses,
        previousNewsIdSet
      ),
      predictionStats: sanitizePredictionStats(raw.predictionStats),
      sectorPredictionStats: sanitizePredictionStats(raw.sectorPredictionStats),
      watchlistStockIds: Array.isArray(raw.watchlistStockIds)
        ? Array.from(
            new Set(
              raw.watchlistStockIds.filter(
                (id): id is string => typeof id === 'string' && Boolean(STOCK_BY_ID[id])
              )
            )
          )
        : [],
      lastDayRecap: sanitizeLastDayRecap(raw.lastDayRecap),
      tradeHistory,
      tradeStats,
      realizedProfitTotal,
      revision,
    },
  };
}

interface GameState {
  // User / Auth
  authMode: AuthMode;
  uid: string | null;
  displayName: string | null;
  level: Level;
  isLoadingState: boolean;
  loadStatus: LoadStatus;
  loadError: string | null;
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: string | null;
  wasLegacyMigrated: boolean;

  // Game progress
  dayCount: number;
  cash: number;
  initialCash: number;
  revision: number;

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
  todayNewsSectorGuesses: Record<string, SectorId[]>;
  previousNewsSectorGuesses: Record<string, SectorId[]>;
  predictionStats: PredictionStats;
  sectorPredictionStats: PredictionStats;
  watchlistStockIds: string[];
  lastDayRecap: LastDayRecap | null;
  showRecapModal: boolean;

  // Portfolio & Trade Ledger
  holdings: Record<string, Holding>;
  totalAssetHistory: number[];
  tradeHistory: TradeRecord[];
  tradeStats: TradeStats;
  realizedProfitTotal: number;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeFromExternal: (theme: 'light' | 'dark') => void;

  // Onboarding Tutorial State (순수 UI 상태 — Firestore/localStorage 미저장)
  tutorialStep: number | null;
  setTutorialStep: (step: number | null) => void;

  gameStates: Partial<Record<Level, LevelGameSnapshot>>;

  // Actions
  enterGuestMode: (
    nickname: string,
    level: Level,
    options?: { resetExisting?: boolean }
  ) => void;
  restoreGuestSession: () => boolean;
  syncGuestFromStorage: () => void;
  exitSession: () => Promise<void>;
  setAuth: (uid: string | null, displayName: string | null) => Promise<void>;
  retryLoadCloudState: () => Promise<void>;
  retryPendingSave: () => Promise<void>;
  setLevel: (level: Level) => void;
  initializeGame: (level: Level) => void;
  resetCurrentLevel: () => void;
  startScenario: (scenarioId: string) => boolean;
  markNewsChecked: (newsId: string, prediction: NewsPrediction) => void;
  toggleNewsSectorGuess: (newsId: string, sector: SectorId) => void;
  toggleWatchlistStock: (stockId: string) => void;
  dismissRecap: () => void;
  deleteAccountAndData: () => Promise<{ ok: boolean; message: string }>;
  clearMigrationNotice: () => void;
  buyStock: (stockId: string, quantity: number) => boolean;
  sellStock: (stockId: string, quantity: number) => boolean;
  nextDay: () => void;
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
    tutorialStep: null,
    lastDayBreakdown: state.lastDayBreakdown,
    carryoverImpacts: state.carryoverImpacts,
    activeScenario: state.activeScenario,
    completedScenarioIds: state.completedScenarioIds,
    scenarioCooldown: state.scenarioCooldown,
    todayNewsChecks: state.todayNewsChecks,
    previousNewsChecks: state.previousNewsChecks,
    todayNewsSectorGuesses: state.todayNewsSectorGuesses,
    previousNewsSectorGuesses: state.previousNewsSectorGuesses,
    predictionStats: state.predictionStats,
    sectorPredictionStats: state.sectorPredictionStats,
    watchlistStockIds: state.watchlistStockIds,
    lastDayRecap: state.lastDayRecap,
    tradeHistory: state.tradeHistory,
    tradeStats: state.tradeStats,
    realizedProfitTotal: state.realizedProfitTotal,
    revision: state.revision,
  };
}

function snapshotToStoreFields(snap: LevelGameSnapshot): Partial<GameState> {
  return {
    level: snap.level,
    dayCount: snap.dayCount,
    cash: snap.cash,
    initialCash: snap.initialCash,
    stocks: snap.stocks,
    usedNewsIds: snap.usedNewsIds,
    currentNews: snap.currentNews,
    previousNews: snap.previousNews,
    holdings: snap.holdings,
    totalAssetHistory: snap.totalAssetHistory,
    lastDayBreakdown: snap.lastDayBreakdown,
    carryoverImpacts: snap.carryoverImpacts,
    activeScenario: snap.activeScenario ?? null,
    completedScenarioIds: snap.completedScenarioIds ?? [],
    scenarioCooldown: snap.scenarioCooldown ?? 0,
    todayNewsChecks: snap.todayNewsChecks ?? {},
    previousNewsChecks: snap.previousNewsChecks ?? {},
    todayNewsSectorGuesses: snap.todayNewsSectorGuesses ?? {},
    previousNewsSectorGuesses: snap.previousNewsSectorGuesses ?? {},
    predictionStats: snap.predictionStats ?? { total: 0, correct: 0 },
    sectorPredictionStats: snap.sectorPredictionStats ?? { total: 0, correct: 0 },
    watchlistStockIds: snap.watchlistStockIds ?? [],
    lastDayRecap: snap.lastDayRecap ?? null,
    tradeHistory: snap.tradeHistory ?? [],
    tradeStats: snap.tradeStats ?? computeTradeStatsFromHistory(snap.tradeHistory ?? []),
    realizedProfitTotal: snap.realizedProfitTotal ?? 0,
    revision: snap.revision ?? 0,
  };
}

const EMPTY_GAME_FIELDS: Partial<GameState> = {
  level: 'elementary',
  dayCount: 1,
  cash: 1_000_000,
  initialCash: 1_000_000,
  revision: 0,
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
  todayNewsSectorGuesses: {},
  previousNewsSectorGuesses: {},
  predictionStats: { total: 0, correct: 0 },
  sectorPredictionStats: { total: 0, correct: 0 },
  watchlistStockIds: [],
  lastDayRecap: null,
  showRecapModal: false,
  holdings: {},
  totalAssetHistory: [],
  tradeHistory: [],
  tradeStats: emptyTradeStats(),
  realizedProfitTotal: 0,
  tutorialStep: null,
  gameStates: {},
  wasLegacyMigrated: false,
};

const EMPTY_LOGGED_OUT_STATE: Partial<GameState> = {
  ...EMPTY_GAME_FIELDS,
  authMode: null,
  uid: null,
  displayName: null,
  isLoadingState: false,
  loadStatus: 'idle',
  loadError: null,
  isSaving: false,
  saveError: null,
  lastSavedAt: null,
};

// ============================================================================
// 직렬화 쓰기 큐 · 동시성 리비전 추적 · Race Condition 차단 모듈 상태
// ============================================================================
let authRequestSeq = 0;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let writeChain: Promise<void> = Promise.resolve();
let syncedRevisions: Partial<Record<Level, number>> = {};
const dirtyLevels = new Set<Level>();
let lastSaveErrorToastAt = 0;

function resetPersistenceCoordinator(): void {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
  syncedRevisions = {};
  dirtyLevels.clear();
}

function hydrateDocumentStates(
  rawData: Record<string, unknown>
): {
  currentLevel: Level;
  hydratedStates: Partial<Record<Level, LevelGameSnapshot>>;
  migratedAny: boolean;
  repairedAny: boolean;
} {
  const rawStatesObj =
    rawData.gameStates && typeof rawData.gameStates === 'object'
      ? ({ ...(rawData.gameStates as Record<string, unknown>) })
      : {};

  const legacySingle =
    rawData.gameState && typeof rawData.gameState === 'object'
      ? (rawData.gameState as Record<string, unknown>)
      : null;

  const currentLevel: Level = isValidLevel(rawData.currentLevel)
    ? rawData.currentLevel
    : isValidLevel(legacySingle?.level)
      ? legacySingle.level
      : 'elementary';

  let repairedAny = rawData.schemaVersion !== 2 || !isValidLevel(rawData.currentLevel);

  if (Object.keys(rawStatesObj).length === 0 && legacySingle) {
    const prevLevel: Level = isValidLevel(legacySingle.level) ? legacySingle.level : 'elementary';
    rawStatesObj[prevLevel] = legacySingle;
    repairedAny = true;
  }

  const hydratedStates: Partial<Record<Level, LevelGameSnapshot>> = {};
  let migratedAny = false;

  for (const lvl of VALID_LEVELS) {
    if (lvl in rawStatesObj) {
      const { snapshot, migrated, repaired } = hydrateLevelSnapshot(rawStatesObj[lvl], lvl);
      hydratedStates[lvl] = snapshot;
      if (migrated) migratedAny = true;
      if (repaired) repairedAny = true;
    }
  }

  return { currentLevel, hydratedStates, migratedAny, repairedAny };
}

function notifySaveErrorThrottled(message: string): void {
  const now = Date.now();
  if (now - lastSaveErrorToastAt > 10_000) {
    lastSaveErrorToastAt = now;
    toast.error(message);
  }
}

function executePersistNow(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  expectedSessionSeq: number
): Promise<void> {
  const task = async () => {
    if (expectedSessionSeq !== authRequestSeq) return;
    if (dirtyLevels.size === 0) return;
    const state = get();
    if (!state.authMode || state.isLoadingState || state.loadStatus !== 'ready') return;
    if (Object.keys(state.stocks || {}).length === 0) return;

    const activeSnap = captureActiveSnapshot(state);
    const allSnapshots: Partial<Record<Level, LevelGameSnapshot>> = {
      ...state.gameStates,
      [state.level]: activeSnap,
    };

    const levelsToWrite = new Set<Level>(dirtyLevels);

    const compactGameStates: Partial<Record<Level, CompactLevelSave>> = {};
    for (const lvl of VALID_LEVELS) {
      const snap = allSnapshots[lvl];
      if (snap && Object.keys(snap.stocks || {}).length > 0) {
        compactGameStates[lvl] = serializeLevelSnapshot(snap);
      }
    }

    if (Object.keys(compactGameStates).length === 0) return;

    const cleanDisplayName = sanitizeDisplayName(
      state.displayName,
      state.authMode === 'google' ? '학습자' : '모의투자 학생'
    );
    const nowIso = new Date().toISOString();

    // 1. 게스트 모드 (localStorage) — 타 탭 최신 변경 병합 + 충돌 보호
    if (state.authMode === 'guest') {
      let existingStates: Partial<Record<Level, CompactLevelSave>> = {};
      const existingRaw = safeLocalStorage.getItem(GUEST_STORAGE_KEY);
      if (existingRaw) {
        try {
          const existingParsed = JSON.parse(existingRaw) as Partial<PersistedUserData>;
          if (existingParsed?.gameStates && typeof existingParsed.gameStates === 'object') {
            existingStates = existingParsed.gameStates;
          }
        } catch {
          // ignore malformed existing local data
        }
      }

      const mergedGameStates: Partial<Record<Level, CompactLevelSave>> = {};
      const nextRevs: Partial<Record<Level, number>> = { ...syncedRevisions };
      let conflictedWithRemote = false;

      for (const lvl of VALID_LEVELS) {
        const localCompact = compactGameStates[lvl];
        const storedCompact = existingStates[lvl];
        const storedRev =
          typeof storedCompact?.revision === 'number' && Number.isFinite(storedCompact.revision)
            ? storedCompact.revision
            : 0;
        const baseRev = syncedRevisions[lvl] ?? 0;

        if (levelsToWrite.has(lvl) && localCompact) {
          if (storedCompact && storedRev > baseRev) {
            conflictedWithRemote = true;
            break;
          }
          const writtenRev = baseRev + 1;
          mergedGameStates[lvl] = { ...localCompact, revision: writtenRev };
          nextRevs[lvl] = writtenRev;
        } else if (storedCompact && storedRev >= baseRev) {
          mergedGameStates[lvl] = storedCompact;
          nextRevs[lvl] = storedRev;
        } else if (localCompact) {
          mergedGameStates[lvl] = { ...localCompact, revision: baseRev };
        }
      }

      if (conflictedWithRemote && existingRaw) {
        // 다른 탭이 더 최신 데이터를 저장함 -> 덮어쓰지 않고 최신 상태를 동기화
        dirtyLevels.clear();
        get().syncGuestFromStorage();
        toast.info('다른 탭에서 저장된 최신 학습 기록을 자동으로 불러왔습니다.');
        return;
      }

      const payload: PersistedUserData = stripUndefinedDeep({
        schemaVersion: 2,
        displayName: cleanDisplayName,
        currentLevel: state.level,
        gameStates: mergedGameStates,
        updatedAt: nowIso,
      });

      const res = safeLocalStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(payload));
      if (!res.ok) {
        console.error('Error saving guest state to localStorage:', res.error);
        set({ saveError: '브라우저 저장 공간이 부족하거나 차단되어 저장에 실패했습니다.' });
        notifySaveErrorThrottled('브라우저 저장에 실패했습니다. 저장 공간을 확인해 주세요.');
        return;
      }

      syncedRevisions = nextRevs;
      for (const lvl of levelsToWrite) dirtyLevels.delete(lvl);

      const updatedStoreGameStates: Partial<Record<Level, LevelGameSnapshot>> = {
        ...get().gameStates,
      };
      for (const lvl of VALID_LEVELS) {
        if (updatedStoreGameStates[lvl] && typeof nextRevs[lvl] === 'number') {
          updatedStoreGameStates[lvl] = {
            ...updatedStoreGameStates[lvl]!,
            revision: nextRevs[lvl],
          };
        }
      }

      set({
        revision: nextRevs[state.level] ?? state.revision,
        gameStates: updatedStoreGameStates,
        saveError: null,
        lastSavedAt: nowIso,
      });
      return;
    }

    // 2. Google 클라우드 모드 (Firestore) — 트랜잭션 기반 난이도별 병합 & 충돌 보호
    if (state.authMode === 'google' && state.uid) {
      if (!db) {
        set({ saveError: 'Firebase Firestore 설정이 누락되어 클라우드에 저장할 수 없습니다.' });
        return;
      }
      const firestoreDb = db;
      set({ isSaving: true });
      const userDocRef = doc(firestoreDb, 'users', state.uid);
      try {
        type TxResult =
          | { status: 'saved'; nextRevs: Partial<Record<Level, number>> }
          | { status: 'conflict'; serverData: Record<string, unknown> };

        const txResult: TxResult = await runTransaction(firestoreDb, async (tx) => {
          const snap = await tx.get(userDocRef);
          const serverData = snap.exists()
            ? (snap.data() as Record<string, unknown>)
            : null;
          const serverStates =
            serverData?.gameStates && typeof serverData.gameStates === 'object'
              ? (serverData.gameStates as Partial<Record<Level, CompactLevelSave>>)
              : {};

          const mergedGameStates: Partial<Record<Level, CompactLevelSave>> = {};
          const nextRevs: Partial<Record<Level, number>> = { ...syncedRevisions };

          for (const lvl of VALID_LEVELS) {
            const localCompact = compactGameStates[lvl];
            const remoteCompact = serverStates[lvl];
            const remoteRev =
              typeof remoteCompact?.revision === 'number' &&
              Number.isFinite(remoteCompact.revision)
                ? remoteCompact.revision
                : 0;
            const baseRev = syncedRevisions[lvl] ?? 0;

            if (levelsToWrite.has(lvl) && localCompact) {
              if (remoteCompact && remoteRev > baseRev) {
                return { status: 'conflict', serverData: serverData! };
              }
              const writtenRev = baseRev + 1;
              mergedGameStates[lvl] = { ...localCompact, revision: writtenRev };
              nextRevs[lvl] = writtenRev;
            } else if (remoteCompact && remoteRev >= baseRev) {
              mergedGameStates[lvl] = remoteCompact;
              nextRevs[lvl] = remoteRev;
            } else if (localCompact) {
              mergedGameStates[lvl] = { ...localCompact, revision: baseRev };
            }
          }

          if (Object.keys(mergedGameStates).length === 0) {
            return { status: 'saved', nextRevs };
          }

          const payload: PersistedUserData = stripUndefinedDeep({
            schemaVersion: 2,
            displayName: cleanDisplayName,
            currentLevel: state.level,
            gameStates: mergedGameStates,
            updatedAt: nowIso,
          });

          tx.set(userDocRef, payload);
          return { status: 'saved', nextRevs };
        });

        if (expectedSessionSeq !== authRequestSeq) return;

        if (txResult.status === 'conflict') {
          const { currentLevel, hydratedStates } = hydrateDocumentStates(txResult.serverData);
          const targetLvl = hydratedStates[state.level] ? state.level : currentLevel;
          const activeRemote = hydratedStates[targetLvl] ?? createFreshLevelSnapshot(targetLvl);
          hydratedStates[targetLvl] = activeRemote;

          const refreshedRevs: Partial<Record<Level, number>> = {};
          for (const lvl of VALID_LEVELS) {
            if (hydratedStates[lvl]) {
              refreshedRevs[lvl] = hydratedStates[lvl]!.revision ?? 0;
            }
          }
          syncedRevisions = refreshedRevs;
          dirtyLevels.clear();

          set({
            ...snapshotToStoreFields(activeRemote),
            gameStates: hydratedStates,
            isSaving: false,
            saveError: null,
            lastSavedAt:
              typeof txResult.serverData.updatedAt === 'string'
                ? txResult.serverData.updatedAt
                : nowIso,
          });
          toast.info('다른 기기 또는 탭에서 저장된 최신 학습 기록을 불러왔습니다.');
          return;
        }

        syncedRevisions = txResult.nextRevs;
        for (const lvl of levelsToWrite) dirtyLevels.delete(lvl);

        const currentStoreStates = { ...get().gameStates };
        for (const lvl of VALID_LEVELS) {
          if (currentStoreStates[lvl] && typeof txResult.nextRevs[lvl] === 'number') {
            currentStoreStates[lvl] = {
              ...currentStoreStates[lvl]!,
              revision: txResult.nextRevs[lvl],
            };
          }
        }

        set({
          revision: txResult.nextRevs[state.level] ?? get().revision,
          gameStates: currentStoreStates,
          isSaving: false,
          saveError: null,
          lastSavedAt: nowIso,
        });
      } catch (error) {
        console.error('Error saving game state to Firestore:', error);
        if (expectedSessionSeq !== authRequestSeq) return;
        const errMsg =
          error instanceof Error ? error.message : '네트워크 또는 권한 오류로 저장에 실패했습니다.';
        set({
          isSaving: false,
          saveError: errMsg,
        });
        notifySaveErrorThrottled(
          '클라우드 저장에 실패했습니다. 네트워크 연결 복구 시 자동으로 다시 저장됩니다.'
        );
      }
    }
  };

  writeChain = writeChain.then(task, task);
  return writeChain;
}

function schedulePersist(
  set: (partial: Partial<GameState>) => void,
  get: () => GameState,
  options: { immediate?: boolean; level?: Level } = {}
): void {
  const state = get();
  if (!state.authMode || state.isLoadingState || state.loadStatus !== 'ready') return;

  dirtyLevels.add(options.level ?? state.level);
  const seq = authRequestSeq;

  if (state.authMode === 'guest' || options.immediate) {
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    void executePersistNow(set, get, seq);
    return;
  }

  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    void executePersistNow(set, get, seq);
  }, DEBOUNCE_PERSIST_MS);
}

export async function flushPendingPersist(): Promise<void> {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
    await executePersistNow(useGameStore.setState, useGameStore.getState, authRequestSeq);
    return;
  }
  await writeChain;
  if (dirtyLevels.size > 0) {
    await executePersistNow(useGameStore.setState, useGameStore.getState, authRequestSeq);
  }
}

const syncLocalGameStates = (
  set: (partial: Partial<GameState>) => void,
  get: () => GameState
) => {
  const state = get();
  if (Object.keys(state.stocks || {}).length === 0) return;
  const activeSnap = captureActiveSnapshot(state);
  set({
    gameStates: {
      ...state.gameStates,
      [state.level]: activeSnap,
    },
  });
};

function readInitialTheme(): 'light' | 'dark' {
  const saved = safeLocalStorage.getItem('theme');
  return saved === 'dark' ? 'dark' : 'light';
}

export const useGameStore = create<GameState>((set, get) => ({
  authMode: null,
  uid: null,
  displayName: null,
  level: 'elementary',
  isLoadingState: false,
  loadStatus: 'idle',
  loadError: null,
  isSaving: false,
  saveError: null,
  lastSavedAt: null,
  wasLegacyMigrated: false,

  dayCount: 1,
  cash: 1_000_000,
  initialCash: 1_000_000,
  revision: 0,

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
  todayNewsSectorGuesses: {},
  previousNewsSectorGuesses: {},
  predictionStats: { total: 0, correct: 0 },
  sectorPredictionStats: { total: 0, correct: 0 },
  watchlistStockIds: [],
  lastDayRecap: null,
  showRecapModal: false,

  holdings: {},
  totalAssetHistory: [],
  tradeHistory: [],
  tradeStats: emptyTradeStats(),
  realizedProfitTotal: 0,
  gameStates: {},

  theme: readInitialTheme(),
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    safeLocalStorage.setItem('theme', nextTheme);
    set({ theme: nextTheme });
  },
  setThemeFromExternal: (nextTheme) => {
    if (get().theme !== nextTheme) {
      set({ theme: nextTheme });
    }
  },

  // 순수 UI 하이라이트 상태 — 영속 저장을 절대 트리거하지 않음 (F-2 해결)
  tutorialStep: null,
  setTutorialStep: (step) => {
    set({ tutorialStep: step });
  },

  clearMigrationNotice: () => set({ wasLegacyMigrated: false }),

  enterGuestMode: (nickname, chosenLevel, options) => {
    const safeLevel: Level = isValidLevel(chosenLevel) ? chosenLevel : 'elementary';
    const cleanName = sanitizeDisplayName(nickname, '모의투자 학생');
    const resetExisting = Boolean(options?.resetExisting);

    authRequestSeq += 1;
    resetPersistenceCoordinator();
    setExplicitLogoutFlag(false);

    let loadedStates: Partial<Record<Level, LevelGameSnapshot>> = {};
    let migratedAny = false;

    if (resetExisting) {
      safeLocalStorage.removeItem(GUEST_STORAGE_KEY);
    } else {
      const savedRaw = safeLocalStorage.getItem(GUEST_STORAGE_KEY);
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw) as Record<string, unknown>;
          const hydrated = hydrateDocumentStates(parsed);
          loadedStates = hydrated.hydratedStates;
          migratedAny = hydrated.migratedAny;
        } catch {
          // 손상된 원본을 백업 후 안전 초기화 (L-2)
          safeLocalStorage.setItem(GUEST_CORRUPT_BACKUP_KEY, savedRaw);
          toast.warning(
            '저장된 브라우저 기록에 오류가 있어 백업 후 새 교실로 시작했습니다.'
          );
          loadedStates = {};
        }
      }
    }

    for (const lvl of VALID_LEVELS) {
      if (loadedStates[lvl]) {
        syncedRevisions[lvl] = loadedStates[lvl]!.revision ?? 0;
      }
    }

    const activeSnap = loadedStates[safeLevel] ?? createFreshLevelSnapshot(safeLevel);
    loadedStates[safeLevel] = activeSnap;

    set({
      ...EMPTY_LOGGED_OUT_STATE,
      authMode: 'guest',
      uid: 'guest-local',
      displayName: cleanName,
      ...snapshotToStoreFields(activeSnap),
      gameStates: loadedStates,
      isLoadingState: false,
      loadStatus: 'ready',
      loadError: null,
      wasLegacyMigrated: migratedAny,
    });

    schedulePersist(set, get, { immediate: true, level: safeLevel });
  },

  restoreGuestSession: () => {
    if (hasExplicitLogoutFlag()) return false;

    const savedRaw = safeLocalStorage.getItem(GUEST_STORAGE_KEY);
    if (!savedRaw) return false;
    try {
      const parsed = JSON.parse(savedRaw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object' || !parsed.gameStates) return false;

      authRequestSeq += 1;
      resetPersistenceCoordinator();

      const { currentLevel, hydratedStates, migratedAny, repairedAny } =
        hydrateDocumentStates(parsed);
      const hadTarget = Boolean(hydratedStates[currentLevel]);
      const activeSnap = hydratedStates[currentLevel] ?? createFreshLevelSnapshot(currentLevel);
      hydratedStates[currentLevel] = activeSnap;

      for (const lvl of VALID_LEVELS) {
        if (hydratedStates[lvl]) {
          syncedRevisions[lvl] = hydratedStates[lvl]!.revision ?? 0;
        }
      }

      set({
        ...EMPTY_LOGGED_OUT_STATE,
        authMode: 'guest',
        uid: 'guest-local',
        displayName: sanitizeDisplayName(
          typeof parsed.displayName === 'string' ? parsed.displayName : null,
          '모의투자 학생'
        ),
        ...snapshotToStoreFields(activeSnap),
        gameStates: hydratedStates,
        isLoadingState: false,
        loadStatus: 'ready',
        loadError: null,
        lastSavedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
        wasLegacyMigrated: migratedAny,
      });

      // 마이그레이션·복구·누락 레벨 생성 시 즉시 재저장하여 새로고침 시 재롤링 방지 (L-5)
      if (migratedAny || repairedAny || !hadTarget) {
        schedulePersist(set, get, { immediate: true, level: currentLevel });
      }
      return true;
    } catch {
      return false;
    }
  },

  syncGuestFromStorage: () => {
    const state = get();
    if (state.authMode !== 'guest') return;

    const savedRaw = safeLocalStorage.getItem(GUEST_STORAGE_KEY);
    if (!savedRaw) {
      authRequestSeq += 1;
      resetPersistenceCoordinator();
      set(EMPTY_LOGGED_OUT_STATE);
      toast.info('다른 탭에서 게스트 데이터가 삭제되어 초기 화면으로 이동했습니다.');
      return;
    }

    try {
      const parsed = JSON.parse(savedRaw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object') return;
      const { currentLevel, hydratedStates } = hydrateDocumentStates(parsed);
      const targetLvl = hydratedStates[state.level] ? state.level : currentLevel;
      const activeSnap = hydratedStates[targetLvl];
      if (!activeSnap) return;

      const remoteRev = activeSnap.revision ?? 0;
      const localRev = syncedRevisions[targetLvl] ?? 0;
      const remoteUpdated = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null;

      // 더 최신이거나 타 레벨이 갱신된 경우에만 반영
      let anyNewer = remoteRev > localRev || (remoteUpdated !== null && remoteUpdated !== state.lastSavedAt);
      for (const lvl of VALID_LEVELS) {
        const snap = hydratedStates[lvl];
        if (snap && (snap.revision ?? 0) > (syncedRevisions[lvl] ?? 0)) {
          anyNewer = true;
        }
      }
      if (!anyNewer) return;

      const nextRevs: Partial<Record<Level, number>> = {};
      for (const lvl of VALID_LEVELS) {
        if (hydratedStates[lvl]) {
          nextRevs[lvl] = hydratedStates[lvl]!.revision ?? 0;
        }
      }
      syncedRevisions = nextRevs;
      dirtyLevels.clear();

      set({
        displayName: sanitizeDisplayName(
          typeof parsed.displayName === 'string' ? parsed.displayName : state.displayName,
          '모의투자 학생'
        ),
        ...snapshotToStoreFields(activeSnap),
        gameStates: hydratedStates,
        showRecapModal: false,
        saveError: null,
        lastSavedAt: remoteUpdated,
      });
    } catch {
      // ignore invalid cross-tab storage event
    }
  },

  exitSession: async () => {
    const { authMode } = get();
    setExplicitLogoutFlag(true);

    // 로그아웃 전 미저장 쓰기 완료 대기 (F-5)
    try {
      await flushPendingPersist();
    } catch {
      // ignore flush failure on exit
    }

    authRequestSeq += 1;
    resetPersistenceCoordinator();

    if (authMode === 'google' && auth) {
      await signOut(auth);
    }
    set(EMPTY_LOGGED_OUT_STATE);
  },

  setAuth: async (uid, displayName) => {
    if (!uid) {
      if (get().authMode === 'google') {
        authRequestSeq += 1;
        resetPersistenceCoordinator();
        set(EMPTY_LOGGED_OUT_STATE);
      }
      return;
    }

    const cleanName = sanitizeDisplayName(displayName, '학습자');
    const prevState = get();

    // 이미 동일 Google 계정으로 로드 완료된 경우 중복 refetch 방지 (F-4)
    if (
      prevState.authMode === 'google' &&
      prevState.uid === uid &&
      prevState.loadStatus === 'ready'
    ) {
      if (prevState.displayName !== cleanName) {
        set({ displayName: cleanName });
      }
      return;
    }

    setExplicitLogoutFlag(false);
    const reqSeq = ++authRequestSeq;
    resetPersistenceCoordinator();

    // 이전 세션(게스트/타 계정)의 메모리를 즉시 초기화하고 로딩 상태로 전환 (F-4)
    set({
      ...EMPTY_GAME_FIELDS,
      authMode: 'google',
      uid,
      displayName: cleanName,
      isLoadingState: true,
      loadStatus: 'loading',
      loadError: null,
      isSaving: false,
      saveError: null,
      lastSavedAt: null,
    });

    if (!db) {
      set({
        isLoadingState: false,
        loadStatus: 'error',
        loadError: 'Firebase Firestore 설정이 누락되어 클라우드 데이터를 불러올 수 없습니다.',
      });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      // 도중 로그아웃·계정 전환이 있었으면 늦게 도착한 응답 폐기 (F-4)
      if (reqSeq !== authRequestSeq) return;

      if (userDoc.exists()) {
        const data = userDoc.data() as Record<string, unknown>;
        // 기존 사용자는 로그인 화면 구경용 pending_level에 의해 덮어써지지 않음 (L-4)
        consumePendingGoogleLevel();

        const { currentLevel, hydratedStates, migratedAny, repairedAny } =
          hydrateDocumentStates(data);

        const hadCurrent = Boolean(hydratedStates[currentLevel]);
        const activeSnap =
          hydratedStates[currentLevel] ?? createFreshLevelSnapshot(currentLevel);
        hydratedStates[currentLevel] = activeSnap;

        for (const lvl of VALID_LEVELS) {
          if (hydratedStates[lvl]) {
            syncedRevisions[lvl] = hydratedStates[lvl]!.revision ?? 0;
          }
        }

        set({
          ...snapshotToStoreFields(activeSnap),
          gameStates: hydratedStates,
          isLoadingState: false,
          loadStatus: 'ready',
          loadError: null,
          lastSavedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
          wasLegacyMigrated: migratedAny,
        });

        if (migratedAny || repairedAny || !hadCurrent) {
          schedulePersist(set, get, { immediate: true, level: currentLevel });
        }
      } else {
        // Firestore에 문서가 명확히 존재하지 않는 신규 사용자만 초기화 (F-3, L-4)
        const pendingLevel = consumePendingGoogleLevel();
        const startLevel: Level = pendingLevel ?? 'elementary';
        const fresh = createFreshLevelSnapshot(startLevel, 0);

        set({
          ...snapshotToStoreFields(fresh),
          gameStates: { [startLevel]: fresh },
          isLoadingState: false,
          loadStatus: 'ready',
          loadError: null,
          wasLegacyMigrated: false,
        });

        schedulePersist(set, get, { immediate: true, level: startLevel });
      }
    } catch (error) {
      console.error('Error loading game state from Firestore:', error);
      if (reqSeq !== authRequestSeq) return;
      const errMsg =
        error instanceof Error
          ? error.message
          : '클라우드 학습 기록을 불러오는 중 오류가 발생했습니다.';
      // 읽기 실패 시 절대 initializeGame/setDoc을 실행하지 않고 오류 복구 상태 유지 (F-3)
      set({
        isLoadingState: false,
        loadStatus: 'error',
        loadError: errMsg,
      });
    }
  },

  retryLoadCloudState: async () => {
    const { authMode, uid, displayName } = get();
    if (authMode !== 'google' || !uid) return;
    set({ loadStatus: 'idle' });
    await get().setAuth(uid, displayName);
  },

  retryPendingSave: async () => {
    const state = get();
    if (!state.authMode || state.loadStatus !== 'ready') return;
    dirtyLevels.add(state.level);
    await flushPendingPersist();
  },

  setLevel: (newLevel) => {
    if (!isValidLevel(newLevel)) return;
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;
    if (state.level === newLevel && Object.keys(state.stocks).length > 0) return;

    const updatedGameStates: Partial<Record<Level, LevelGameSnapshot>> = {
      ...state.gameStates,
    };

    if (Object.keys(state.stocks).length > 0) {
      updatedGameStates[state.level] = captureActiveSnapshot(state);
    }

    const existingTarget = updatedGameStates[newLevel];
    const targetState =
      existingTarget && Object.keys(existingTarget.stocks || {}).length > 0
        ? existingTarget
        : createFreshLevelSnapshot(newLevel, syncedRevisions[newLevel] ?? 0);

    updatedGameStates[newLevel] = targetState;

    set({
      ...snapshotToStoreFields(targetState),
      showRecapModal: false,
      gameStates: updatedGameStates,
    });

    schedulePersist(set, get, { immediate: true, level: newLevel });
  },

  initializeGame: (level) => {
    if (!isValidLevel(level)) return;
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;

    const initializedState = createFreshLevelSnapshot(level, syncedRevisions[level] ?? 0);

    set({
      ...snapshotToStoreFields(initializedState),
      showRecapModal: false,
      gameStates: {
        ...state.gameStates,
        [level]: initializedState,
      },
    });

    schedulePersist(set, get, { immediate: true, level });
  },

  resetCurrentLevel: () => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;

    const { level } = state;
    const fresh = createFreshLevelSnapshot(level, syncedRevisions[level] ?? state.revision);
    set({
      ...snapshotToStoreFields(fresh),
      showRecapModal: false,
      gameStates: {
        ...state.gameStates,
        [level]: fresh,
      },
    });
    schedulePersist(set, get, { immediate: true, level });
  },

  startScenario: (scenarioId) => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return false;
    if (Object.keys(state.stocks).length === 0) return false;

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

    const survivingIds = new Set(updatedCurrentNews.map((n) => n.id));
    const filteredChecks: Record<string, NewsPrediction> = {};
    Object.entries(state.todayNewsChecks).forEach(([id, pred]) => {
      if (survivingIds.has(id)) {
        filteredChecks[id] = pred;
      }
    });
    const filteredSectorGuesses: Record<string, SectorId[]> = {};
    Object.entries(state.todayNewsSectorGuesses).forEach(([id, sectors]) => {
      if (survivingIds.has(id) && sectors.length > 0) {
        filteredSectorGuesses[id] = sectors;
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
      todayNewsSectorGuesses: filteredSectorGuesses,
    });

    syncLocalGameStates(set, get);
    schedulePersist(set, get, { immediate: true });
    return true;
  },

  markNewsChecked: (newsId, prediction) => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;
    if (!state.currentNews.some((n) => n.id === newsId)) return;
    set({
      todayNewsChecks: {
        ...state.todayNewsChecks,
        [newsId]: prediction,
      },
    });
    syncLocalGameStates(set, get);
    schedulePersist(set, get);
  },

  toggleNewsSectorGuess: (newsId, sector) => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;
    if (!state.currentNews.some((n) => n.id === newsId)) return;
    const prevList = state.todayNewsSectorGuesses[newsId] ?? [];
    let nextList: SectorId[];
    if (prevList.includes(sector)) {
      nextList = prevList.filter((s) => s !== sector);
    } else if (prevList.length >= 3) {
      nextList = [...prevList.slice(1), sector];
    } else {
      nextList = [...prevList, sector];
    }

    const nextGuesses = { ...state.todayNewsSectorGuesses };
    const nextChecks = { ...state.todayNewsChecks };

    if (nextList.length === 0) {
      // 1단계 산업 선택을 전부 해제하면 빈 배열 대신 키를 제거하고 2단계 체크도 일관되게 해제 (U-5)
      delete nextGuesses[newsId];
      delete nextChecks[newsId];
    } else {
      nextGuesses[newsId] = nextList;
    }

    set({
      todayNewsSectorGuesses: nextGuesses,
      todayNewsChecks: nextChecks,
    });
    syncLocalGameStates(set, get);
    schedulePersist(set, get);
  },

  toggleWatchlistStock: (stockId) => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;
    if (!STOCK_BY_ID[stockId]) return;
    const exists = state.watchlistStockIds.includes(stockId);
    const nextList = exists
      ? state.watchlistStockIds.filter((id) => id !== stockId)
      : [...state.watchlistStockIds, stockId];
    set({ watchlistStockIds: nextList });
    syncLocalGameStates(set, get);
    schedulePersist(set, get);
  },

  dismissRecap: () => set({ showRecapModal: false }),

  deleteAccountAndData: async () => {
    const { authMode, uid } = get();
    try {
      if (authMode === 'guest') {
        authRequestSeq += 1;
        resetPersistenceCoordinator();
        setExplicitLogoutFlag(true);
        safeLocalStorage.removeItem(GUEST_STORAGE_KEY);
        safeLocalStorage.removeItem(GUEST_CORRUPT_BACKUP_KEY);
        clearPendingGoogleLevel();
        safeLocalStorage.removeItem(TUTORIAL_COMPLETED_KEY);
        safeLocalStorage.removeItem(CONSENT_RECORD_KEY);
        set(EMPTY_LOGGED_OUT_STATE);
        return { ok: true, message: '브라우저에 저장된 모든 학습 데이터가 영구 삭제되었습니다.' };
      }

      if (authMode === 'google' && uid) {
        if (!db || !auth) {
          return { ok: false, message: 'Firebase 설정이 누락되어 계정을 삭제할 수 없습니다.' };
        }
        // 진행 중인 자동 저장 중단
        if (pendingTimer) {
          clearTimeout(pendingTimer);
          pendingTimer = null;
        }
        dirtyLevels.clear();

        const currentUser = auth.currentUser;
        if (currentUser) {
          // 최근 로그인 시간이 오래된 경우 데이터 삭제 전에 선재인증 (F-7 반파 상태 방지)
          const lastSignInTime = currentUser.metadata?.lastSignInTime
            ? Date.parse(currentUser.metadata.lastSignInTime)
            : 0;
          if (!lastSignInTime || Date.now() - lastSignInTime > RECENT_LOGIN_THRESHOLD_MS) {
            await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
          }
        }

        // 만일의 deleteUser 실패 시 복구할 수 있도록 삭제 전 백업 스냅샷 보관
        const userDocRef = doc(db, 'users', uid);
        let backupDocData: Record<string, unknown> | null = null;
        try {
          const existingSnap = await getDoc(userDocRef);
          if (existingSnap.exists()) {
            backupDocData = existingSnap.data() as Record<string, unknown>;
          }
        } catch {
          // ignore backup read failure
        }

        // 1. Firestore 사용자 문서 삭제
        await deleteDoc(userDocRef);

        // 2. Firebase Auth 계정 삭제 (재인증 필요 시 재시도, 취소 시 Firestore 백업 복원)
        if (currentUser) {
          try {
            await deleteUser(currentUser);
          } catch (err: unknown) {
            const authErr = err as { code?: string };
            if (authErr?.code === 'auth/requires-recent-login') {
              try {
                await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
                await deleteUser(currentUser);
              } catch (reauthErr) {
                if (backupDocData) {
                  await setDoc(userDocRef, backupDocData).catch(() => undefined);
                }
                throw reauthErr;
              }
            } else {
              if (backupDocData) {
                await setDoc(userDocRef, backupDocData).catch(() => undefined);
              }
              throw err;
            }
          }
        }

        authRequestSeq += 1;
        resetPersistenceCoordinator();
        setExplicitLogoutFlag(true);
        clearPendingGoogleLevel();
        safeLocalStorage.removeItem(CONSENT_RECORD_KEY);
        safeLocalStorage.removeItem(TUTORIAL_COMPLETED_KEY);
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
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return false;
    if (!isTodayNewsComplete(state.currentNews, state.todayNewsChecks)) return false;

    const { cash, stocks, holdings, dayCount, tradeHistory, tradeStats } = state;
    const stock = stocks[stockId];
    if (
      !stock ||
      !Number.isFinite(stock.currentPrice) ||
      stock.currentPrice <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return false;
    }

    const cost = stock.currentPrice * quantity;
    if (!Number.isFinite(cost) || cash < cost) return false;

    const currentHolding = holdings[stockId];
    const prevQty = currentHolding?.quantity ?? 0;
    const prevTotalCost = getHoldingCostBasis(currentHolding);
    const newQuantity = prevQty + quantity;
    const newTotalCost = prevTotalCost + cost;
    const newAvgPrice = Math.max(1, Math.round(newTotalCost / newQuantity));

    const record: TradeRecord = {
      id: `tr-${dayCount}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dayCount,
      timestamp: new Date().toISOString(),
      type: 'buy',
      stockId,
      stockName: stock.name,
      sector: stock.sector,
      quantity,
      price: stock.currentPrice,
      totalAmount: cost,
    };

    set({
      cash: cash - cost,
      holdings: {
        ...holdings,
        [stockId]: {
          quantity: newQuantity,
          avgPrice: newAvgPrice,
          totalCost: newTotalCost,
        },
      },
      tradeHistory: [...tradeHistory, record].slice(-MAX_TRADE_HISTORY),
      tradeStats: {
        ...tradeStats,
        total: tradeStats.total + 1,
        buyCount: tradeStats.buyCount + 1,
      },
    });

    syncLocalGameStates(set, get);
    schedulePersist(set, get, { immediate: true });
    return true;
  },

  sellStock: (stockId, quantity) => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return false;
    if (!isTodayNewsComplete(state.currentNews, state.todayNewsChecks)) return false;

    const { stocks, holdings, cash, dayCount, tradeHistory, tradeStats, realizedProfitTotal } =
      state;
    const stock = stocks[stockId];
    const currentHolding = holdings[stockId];

    if (
      !stock ||
      !Number.isFinite(stock.currentPrice) ||
      stock.currentPrice <= 0 ||
      !currentHolding ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > currentHolding.quantity
    ) {
      return false;
    }

    const revenue = stock.currentPrice * quantity;
    const prevTotalCost = getHoldingCostBasis(currentHolding);
    const isFullSell = quantity === currentHolding.quantity;
    const costBasis = isFullSell
      ? prevTotalCost
      : Math.round((prevTotalCost * quantity) / currentHolding.quantity);
    const realizedProfit = revenue - costBasis;
    const realizedProfitRate = costBasis > 0 ? (realizedProfit / costBasis) * 100 : 0;
    const newQuantity = currentHolding.quantity - quantity;

    const newHoldings = { ...holdings };
    if (newQuantity === 0) {
      delete newHoldings[stockId];
    } else {
      const remainingTotalCost = Math.max(0, prevTotalCost - costBasis);
      newHoldings[stockId] = {
        quantity: newQuantity,
        avgPrice: Math.max(1, Math.round(remainingTotalCost / newQuantity)),
        totalCost: remainingTotalCost,
      };
    }

    const record: TradeRecord = {
      id: `tr-${dayCount}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dayCount,
      timestamp: new Date().toISOString(),
      type: 'sell',
      stockId,
      stockName: stock.name,
      sector: stock.sector,
      quantity,
      price: stock.currentPrice,
      totalAmount: revenue,
      avgPriceBefore: currentHolding.avgPrice,
      realizedProfit,
      realizedProfitRate,
    };

    set({
      cash: cash + revenue,
      holdings: newHoldings,
      tradeHistory: [...tradeHistory, record].slice(-MAX_TRADE_HISTORY),
      tradeStats: {
        ...tradeStats,
        total: tradeStats.total + 1,
        sellCount: tradeStats.sellCount + 1,
        winSells: tradeStats.winSells + (realizedProfit > 0 ? 1 : 0),
        lossSells: tradeStats.lossSells + (realizedProfit < 0 ? 1 : 0),
      },
      realizedProfitTotal: realizedProfitTotal + realizedProfit,
    });

    syncLocalGameStates(set, get);
    schedulePersist(set, get, { immediate: true });
    return true;
  },

  nextDay: () => {
    const state = get();
    if (state.isLoadingState || state.loadStatus !== 'ready') return;
    if (Object.keys(state.stocks).length === 0) return;
    if (!isTodayNewsComplete(state.currentNews, state.todayNewsChecks)) return;

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
      todayNewsSectorGuesses,
      predictionStats,
      sectorPredictionStats,
    } = state;

    // 0. 전일(오늘 마감 시점) 평가총액 계산
    let prevStockValue = 0;
    Object.entries(holdings).forEach(([id, h]) => {
      const existing = stocks[id];
      if (existing && h.quantity > 0) {
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
      if (updated && h.quantity > 0) {
        totalStockValue += updated.currentPrice * h.quantity;
      }
    });
    const newTotalAsset = cash + totalStockValue;
    const assetDelta = newTotalAsset - prevTotalAsset;
    const assetDeltaPct = prevTotalAsset > 0 ? (assetDelta / prevTotalAsset) * 100 : 0;

    // 2-1. 학생의 오늘 뉴스 방향 예측 + 관련 산업 추론 이중 채점
    let checkedCount = 0;
    let correctCount = 0;
    let sectorCheckedCount = 0;
    let sectorCorrectCount = 0;
    currentNews.forEach((item) => {
      const userPred = todayNewsChecks[item.id];
      if (userPred) {
        checkedCount += 1;
        if (getActualNewsDirection(item) === userPred) {
          correctCount += 1;
        }
      }
      const secEval = evaluateSectorGuesses(item, todayNewsSectorGuesses[item.id]);
      if (secEval.checked) {
        sectorCheckedCount += 1;
        if (secEval.hit) {
          sectorCorrectCount += 1;
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

    // 4. 충돌 방지·균형 뉴스 선별
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
      previousNewsSectorGuesses: { ...todayNewsSectorGuesses },
      todayNewsSectorGuesses: {},
      predictionStats: {
        total: predictionStats.total + checkedCount,
        correct: predictionStats.correct + correctCount,
      },
      sectorPredictionStats: {
        total: sectorPredictionStats.total + sectorCheckedCount,
        correct: sectorPredictionStats.correct + sectorCorrectCount,
      },
      lastDayRecap: {
        dayNumber: nextDayNum,
        prevTotalAsset,
        newTotalAsset,
        assetDelta,
        assetDeltaPct,
        checkedCount,
        correctCount,
        sectorCheckedCount,
        sectorCorrectCount,
      },
      showRecapModal: true,
      totalAssetHistory: [...totalAssetHistory, newTotalAsset].slice(-MAX_HISTORY_LENGTH),
    });

    syncLocalGameStates(set, get);
    schedulePersist(set, get, { immediate: true });
  },
}));
