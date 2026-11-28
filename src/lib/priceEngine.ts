import type {
  DayStockBreakdown,
  Level,
  NewsItem,
  SectorId,
  StockDefinition,
  StockState,
} from './types.ts';
import { INITIAL_STOCKS } from './stockData.ts';

export interface LevelSimConfig {
  /** 뉴스 원본 sectorImpact에 곱해지는 실제 반영 배수 */
  newsScale: number;
  /** 일일 종목 고유 랜덤 변동 반폭 (예: 0.008 -> ±0.8% × volatility) */
  randomHalfRange: number;
  /** 시장 전체 거시 노이즈 반폭 */
  marketHalfRange: number;
  /** 시장 전체 미세 편향 */
  marketBias: number;
  /** 기준가 대비 이탈 시 평균 회귀 강도 */
  meanReversionRate: number;
  /** 돌발 수급/이벤트 발생 확률 (양방향 합계) */
  shockProb: number;
  /** 전일 뉴스 잔여 모멘텀 이월 비율 (고급 난이도 멀티데이 반영) */
  carryoverRate: number;
  /** 일일 최대 변동폭 제한 */
  dailyCap: number;
}

/**
 * 난이도별 주가 시뮬레이션 파라미터
 * - 초급: 뉴스 → 주가 인과관계 체감 최우선 (높은 신호 대 잡음비, 돌발 충격 0%)
 * - 중급: 산업 뉴스 + 시장 변동성·드문 돌발 이벤트(2%, 사유 표시) 체험
 * - 고급: 매크로/복합 노이즈 + 평균회귀 + 뉴스 잔여 모멘텀(25% 이월) + 돌발 이벤트(3.5%)
 */
export const LEVEL_SIM_CONFIG: Record<Level, LevelSimConfig> = {
  elementary: {
    newsScale: 0.65,
    randomHalfRange: 0.009,
    marketHalfRange: 0.0045,
    marketBias: 0,
    meanReversionRate: 0.03,
    shockProb: 0,
    carryoverRate: 0,
    dailyCap: 0.15,
  },
  middle: {
    newsScale: 0.52,
    randomHalfRange: 0.015,
    marketHalfRange: 0.0075,
    marketBias: -0.0002,
    meanReversionRate: 0.04,
    shockProb: 0.03,
    carryoverRate: 0,
    dailyCap: 0.15,
  },
  high: {
    newsScale: 0.45,
    randomHalfRange: 0.02,
    marketHalfRange: 0.01,
    marketBias: -0.0004,
    meanReversionRate: 0.05,
    shockProb: 0.045,
    carryoverRate: 0.25,
    dailyCap: 0.15,
  },
};

const POSITIVE_SHOCK_REASONS = [
  '외국인·기관 동반 순매수 유입',
  '장중 대규모 기관 수급 유입',
  '업종 내 단기 투자심리 급개선',
];

const NEGATIVE_SHOCK_REASONS = [
  '단기 급등에 따른 차익실현 매물 출회',
  '외국인·기관 동반 순매도 압력',
  '장중 수급 불균형으로 인한 일시 조정',
];

/**
 * 한국 거래소(KRX) 호가 단위 규칙에 준하는 가격대별 호가 단위 반환
 */
export function getTickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 20000) return 10;
  if (price < 50000) return 50;
  if (price < 200000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

/**
 * 한국 주식시장 호가 단위에 맞춰 주가를 반올림 (최소 100원 유지)
 */
export function roundToTickSize(price: number): number {
  if (!Number.isFinite(price)) return 100;
  const safePrice = Math.max(100, price);
  const tick = getTickSize(safePrice);
  return Math.max(100, Math.round(safePrice / tick) * tick);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * 한 뉴스 안에 양(+)의 영향과 음(-)의 영향 섹터·종목이 공존하는지 판별
 */
export function isMixedNews(item: NewsItem): boolean {
  const values: number[] = [
    ...Object.values(item.sectorImpact).filter((v): v is number => typeof v === 'number'),
    ...Object.values(item.stockImpactOverrides ?? {}).filter((v): v is number => typeof v === 'number'),
    ...Object.values(item.stockImpact ?? {}).filter((v): v is number => typeof v === 'number'),
  ];
  const hasPos = values.some((v) => v > 0);
  const hasNeg = values.some((v) => v < 0);
  return hasPos && hasNeg;
}

/**
 * 학생의 1클릭 뉴스 판단(호재/악재/혼조)과 비교할 실제 뉴스 방향 판정
 */
export function getActualNewsDirection(item: NewsItem): 'bullish' | 'bearish' | 'mixed' {
  if (isMixedNews(item)) return 'mixed';
  if (item.sentiment > 0) return 'bullish';
  if (item.sentiment < 0) return 'bearish';
  return 'mixed';
}

/**
 * 학생의 관련 산업 추론 채점
 * - 학생이 고른 산업(최대 3개) 중 실제 영향 산업이 1개 이상 포함되고,
 *   절반 이상이 실제 영향 산업에 해당하거나 실제 산업을 모두 맞혔을 때 적중으로 판정
 */
export function evaluateSectorGuesses(
  item: NewsItem,
  guesses: SectorId[] | undefined
): { checked: boolean; hit: boolean; matched: SectorId[]; missed: SectorId[] } {
  const actualSet = new Set<SectorId>(item.relatedSectors);
  const picked = (guesses ?? []).filter((s, idx, arr) => arr.indexOf(s) === idx);
  if (picked.length === 0) {
    return { checked: false, hit: false, matched: [], missed: [...actualSet] };
  }
  const matched = picked.filter((s) => actualSet.has(s));
  const missed = item.relatedSectors.filter((s) => !picked.includes(s));
  const hit = matched.length > 0 && (matched.length === actualSet.size || matched.length >= Math.ceil(picked.length / 2));
  return { checked: true, hit, matched, missed };
}

/**
 * 일일 변동률과 뉴스 영향 유무에 비례하는 현실적 거래량 계산
 */
export function calculateDailyVolume(
  basePrice: number,
  absChangePct: number,
  hasNews: boolean
): number {
  const liquidityBase = Math.max(8000, Math.round(450_000_000 / Math.max(basePrice, 10000)));
  const moveBoost = 1 + absChangePct * 28;
  const newsBoost = hasNews ? 1.55 : 1.0;
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.max(1000, Math.round(liquidityBase * moveBoost * newsBoost * jitter));
}

/**
 * 초기 가상 시장 상태 생성
 */
export function createInitialStocks(
  definitions: StockDefinition[] = INITIAL_STOCKS
): Record<string, StockState> {
  const stocks: Record<string, StockState> = {};
  definitions.forEach((def) => {
    const variance = (Math.random() - 0.5) * 0.08; // ±4%
    const initialPrice = roundToTickSize(def.basePrice * (1 + variance));
    const initialVol = calculateDailyVolume(def.basePrice, Math.abs(variance) * 0.4, false);
    stocks[def.id] = {
      ...def,
      currentPrice: initialPrice,
      priceHistory: [initialPrice],
      volumeHistory: [initialVol],
    };
  });
  return stocks;
}

/**
 * 특정 뉴스가 특정 종목에 미치는 원본 영향도 계산 (종목별 예외 우선 적용)
 */
export function getNewsRawImpactForStock(news: NewsItem, stock: StockDefinition): number {
  if (news.stockImpactOverrides && stock.id in news.stockImpactOverrides) {
    return news.stockImpactOverrides[stock.id];
  }
  if (news.stockImpact && stock.id in news.stockImpact) {
    return news.stockImpact[stock.id];
  }
  return news.sectorImpact[stock.sector] ?? 0;
}

/**
 * 해설 UI에 표시할 난이도별 실제 반영 예상 영향도 (newsScale 적용)
 */
export function getScaledImpact(rawImpact: number, level: Level): number {
  return rawImpact * LEVEL_SIM_CONFIG[level].newsScale;
}

export const MAX_HISTORY_LENGTH = 180;

/**
 * 두 뉴스가 같은 섹터 또는 동일 종목 오버라이드에 정반대(+/-) 영향을 주어 상충하는지 검사
 */
export function hasOppositeSectorConflict(a: NewsItem, b: NewsItem): boolean {
  for (const [sector, impactA] of Object.entries(a.sectorImpact) as [SectorId, number][]) {
    const impactB = b.sectorImpact[sector];
    if (typeof impactA === 'number' && typeof impactB === 'number') {
      if ((impactA > 0 && impactB < 0) || (impactA < 0 && impactB > 0)) {
        return true;
      }
    }
  }

  const stockA: Record<string, number> = {
    ...(a.stockImpact ?? {}),
    ...(a.stockImpactOverrides ?? {}),
  };
  const stockB: Record<string, number> = {
    ...(b.stockImpact ?? {}),
    ...(b.stockImpactOverrides ?? {}),
  };
  for (const [stockId, impactA] of Object.entries(stockA)) {
    const impactB = stockB[stockId];
    if (typeof impactA === 'number' && typeof impactB === 'number') {
      if ((impactA > 0 && impactB < 0) || (impactA < 0 && impactB > 0)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 스마트 일일 뉴스 선별기
 * - 미사용 뉴스 풀에서 난이도에 맞는 뉴스를 추출
 * - 초급/중급에서는 같은 날 동일 섹터에 상반(+/-) 뉴스가 동시 출현하지 않도록 충돌 방지
 * - 하루 뉴스가 전부 호재이거나 전부 악재로 쏠리지 않도록 균형 유도
 */
export function selectDailyNews(
  allNews: NewsItem[],
  level: Level,
  usedNewsIds: string[],
  currentNews: NewsItem[],
  count = 3,
  seedSelected: NewsItem[] = []
): { selected: NewsItem[]; nextUsedNewsIds: string[] } {
  const levelPool = allNews.filter((n) => n.difficulty.includes(level));
  const seedIds = new Set(seedSelected.map((n) => n.id));
  const nonScenarioCurrentIds = new Set(
    currentNews.filter((n) => !n.scenarioId).map((n) => n.id)
  );
  const cleanUsedIds = usedNewsIds.filter((id) => !seedIds.has(id));

  let available = levelPool.filter(
    (n) => !cleanUsedIds.includes(n.id) && !seedIds.has(n.id)
  );
  let baseUsedIds = [...cleanUsedIds];

  // 풀 소진 시 현재 노출 중인 일반 뉴스만 제외하고 리셋
  const needed = Math.max(0, count - seedSelected.length);
  if (available.length < needed) {
    available = levelPool.filter(
      (n) => !nonScenarioCurrentIds.has(n.id) && !seedIds.has(n.id)
    );
    baseUsedIds = [...nonScenarioCurrentIds];
  }

  const shuffled = shuffleArray(available);
  const selected: NewsItem[] = [...seedSelected];
  const selectedIdSet = new Set(selected.map((n) => n.id));
  const avoidConflicts = level === 'elementary' || level === 'middle';

  // 1차 패스: 충돌 없고 호재/악재 균형을 맞추며 선별
  for (const candidate of shuffled) {
    if (selected.length >= count) break;
    if (selectedIdSet.has(candidate.id)) continue;
    if (avoidConflicts && selected.some((s) => hasOppositeSectorConflict(s, candidate))) {
      continue;
    }

    // 마지막 1자리를 채울 때 이미 선택된 뉴스가 모두 단방향이면 반대/혼조 성향 우선 고려
    if (selected.length === count - 1) {
      const allPos = selected.every((s) => s.sentiment > 0 && !isMixedNews(s));
      const allNeg = selected.every((s) => s.sentiment < 0 && !isMixedNews(s));
      const candidateIsPurePos = candidate.sentiment > 0 && !isMixedNews(candidate);
      const candidateIsPureNeg = candidate.sentiment < 0 && !isMixedNews(candidate);

      const hasBetterBalanceRemaining = shuffled.some(
        (other) =>
          !selectedIdSet.has(other.id) &&
          (!avoidConflicts || !selected.some((s) => hasOppositeSectorConflict(s, other))) &&
          ((allPos && !(other.sentiment > 0 && !isMixedNews(other))) ||
            (allNeg && !(other.sentiment < 0 && !isMixedNews(other))))
      );

      if (
        (allPos && candidateIsPurePos && hasBetterBalanceRemaining) ||
        (allNeg && candidateIsPureNeg && hasBetterBalanceRemaining)
      ) {
        continue;
      }
    }

    selected.push(candidate);
    selectedIdSet.add(candidate.id);
  }

  // 폴백: 남은 미사용 풀만으로 충돌 없이 count를 못 채운 경우, 전체 풀(현재 뉴스 제외)에서 충돌 없는 기사로 보충
  if (selected.length < count) {
    const fallbackPool = shuffleArray(
      levelPool.filter((n) => !nonScenarioCurrentIds.has(n.id) && !selectedIdSet.has(n.id))
    );
    for (const candidate of fallbackPool) {
      if (selected.length >= count) break;
      if (avoidConflicts && selected.some((s) => hasOppositeSectorConflict(s, candidate))) {
        continue;
      }
      selected.push(candidate);
      selectedIdSet.add(candidate.id);
    }
    baseUsedIds = [...nonScenarioCurrentIds];
  }

  // 시나리오 에피소드 ID는 PREDEFINED_NEWS 풀이 아니므로 usedNewsIds에 혼입하지 않음
  const regularSelectedIds = selected.filter((n) => !n.scenarioId).map((n) => n.id);
  const regularPoolIdSet = new Set(levelPool.map((n) => n.id));
  const filteredBaseUsed = baseUsedIds.filter((id) => regularPoolIdSet.has(id));

  return {
    selected,
    nextUsedNewsIds: [...new Set([...filteredBaseUsed, ...regularSelectedIds])],
  };
}

export interface SimulateDayResult {
  newStocks: Record<string, StockState>;
  breakdownByStock: Record<string, DayStockBreakdown>;
  nextCarryoverImpacts: Record<string, number>;
}

/**
 * 하루 진행 시 전체 종목 주가 및 거래량 시뮬레이션
 */
export function simulateNextDay(
  stocks: Record<string, StockState>,
  currentNews: NewsItem[],
  level: Level,
  prevCarryoverImpacts: Record<string, number> = {}
): SimulateDayResult {
  const cfg = LEVEL_SIM_CONFIG[level] ?? LEVEL_SIM_CONFIG.elementary;
  const newStocks: Record<string, StockState> = {};
  const breakdownByStock: Record<string, DayStockBreakdown> = {};
  const nextCarryoverImpacts: Record<string, number> = {};

  // 시장 공통 거시 노이즈 + 시나리오/거시 뉴스의 시장 전체 편향(marketBias) 반영
  const newsMarketBias = Math.max(
    -0.02,
    Math.min(
      0.02,
      currentNews.reduce((sum, n) => sum + (typeof n.marketBias === 'number' && Number.isFinite(n.marketBias) ? n.marketBias : 0), 0)
    )
  );
  const marketFactor = (Math.random() * 2 - 1) * cfg.marketHalfRange + cfg.marketBias + newsMarketBias;

  for (const id of Object.keys(stocks)) {
    const stock = stocks[id];
    const safeBasePrice =
      Number.isFinite(stock.basePrice) && stock.basePrice >= 100 ? stock.basePrice : 10000;
    const prevPrice =
      Number.isFinite(stock.currentPrice) && stock.currentPrice >= 100
        ? stock.currentPrice
        : safeBasePrice;

    // 1. 뉴스 영향 합산 (종목별 예외 반영)
    let rawNewsSum = 0;
    for (const news of currentNews) {
      const impact = getNewsRawImpactForStock(news, stock);
      if (Number.isFinite(impact)) {
        rawNewsSum += impact;
      }
    }
    const newsContribution = rawNewsSum * cfg.newsScale;

    // 2. 전일 뉴스 이월 모멘텀 (고급 난이도)
    const rawCarryover = prevCarryoverImpacts[id];
    const carryoverContribution =
      typeof rawCarryover === 'number' && Number.isFinite(rawCarryover) ? rawCarryover : 0;
    if (cfg.carryoverRate > 0 && Math.abs(newsContribution) >= 0.005) {
      nextCarryoverImpacts[id] = newsContribution * cfg.carryoverRate;
    }

    // 3. 종목 고유 랜덤 노이즈
    const randomChange = (Math.random() * 2 - 1) * cfg.randomHalfRange * stock.volatility;

    // 4. 기준가 평균 회귀 (극단적 이탈 완화)
    const deviation = (prevPrice - safeBasePrice) / safeBasePrice;
    const meanReversion = -deviation * cfg.meanReversionRate;

    // 5. 돌발 수급 충격 (중·고급만 발생하며 사유를 기록해 학습자에게 투명하게 공개)
    let shockContribution = 0;
    let shockReason: string | undefined;
    if (cfg.shockProb > 0) {
      const halfProb = cfg.shockProb / 2;
      const roll = Math.random();
      if (roll < halfProb) {
        shockContribution = -(0.02 + Math.random() * 0.035) * stock.volatility;
        shockReason =
          NEGATIVE_SHOCK_REASONS[Math.floor(Math.random() * NEGATIVE_SHOCK_REASONS.length)];
      } else if (roll > 1 - halfProb) {
        shockContribution = (0.02 + Math.random() * 0.035) * stock.volatility;
        shockReason =
          POSITIVE_SHOCK_REASONS[Math.floor(Math.random() * POSITIVE_SHOCK_REASONS.length)];
      }
    }

    const marketAndNoise = marketFactor + randomChange + meanReversion;
    let totalChange =
      newsContribution + carryoverContribution + marketAndNoise + shockContribution;
    totalChange = Math.max(-cfg.dailyCap, Math.min(cfg.dailyCap, totalChange));

    const newPrice = roundToTickSize(prevPrice * (1 + totalChange));
    const actualChangePct = prevPrice > 0 ? (newPrice - prevPrice) / prevPrice : 0;

    const dailyVolume = calculateDailyVolume(
      safeBasePrice,
      Math.abs(actualChangePct),
      Math.abs(rawNewsSum) > 0 || Math.abs(shockContribution) > 0
    );

    const safePriceHistory =
      Array.isArray(stock.priceHistory) && stock.priceHistory.length > 0
        ? stock.priceHistory
        : [prevPrice];
    const existingVolumes =
      stock.volumeHistory && stock.volumeHistory.length === safePriceHistory.length
        ? stock.volumeHistory
        : safePriceHistory.map(() => calculateDailyVolume(safeBasePrice, 0.01, false));

    newStocks[id] = {
      ...stock,
      currentPrice: newPrice,
      priceHistory: [...safePriceHistory, newPrice].slice(-MAX_HISTORY_LENGTH),
      volumeHistory: [...existingVolumes, dailyVolume].slice(-MAX_HISTORY_LENGTH),
    };

    const breakdown: DayStockBreakdown = {
      stockId: id,
      prevPrice,
      newPrice,
      actualChangePct,
      newsContribution,
      carryoverContribution,
      marketAndNoise,
      shockContribution,
      ...(shockReason ? { shockReason } : {}),
    };
    breakdownByStock[id] = breakdown;
  }

  return { newStocks, breakdownByStock, nextCarryoverImpacts };
}
