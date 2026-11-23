export type Level = 'elementary' | 'middle' | 'high';

export type AuthMode = 'guest' | 'google' | null;

export const ALL_SECTORS = [
  '기술(Tech)',
  '자동차(Auto)',
  '배터리(Battery)',
  '정유/에너지(Energy)',
  '인터넷(Internet)',
  '금융(Finance)',
  '바이오(Bio)',
  '방산/우주(Defense)',
  '식품(Food)',
  '화학(Chemical)',
  '소재(Material)',
  '통신(Telecom)',
  '조선(Shipbuilding)',
  '건설(Construction)',
  '화장품(Cosmetics)',
  '지주(Holding)',
  '해운(Shipping)',
] as const;

export type SectorId = (typeof ALL_SECTORS)[number];

export type TradeExposure = 'export' | 'domestic' | 'mixed';

export type NewsCategory = 'macro' | 'sector' | 'company' | 'global' | 'social';

export type NewsTwistType =
  | 'direct'
  | 'mixed'
  | 'contrarian'
  | 'rumor'
  | 'earnings'
  | 'competition';

export type NewsArticleFormat =
  | 'breaking'
  | 'earnings'
  | 'interview'
  | 'rival'
  | 'policy'
  | 'trend';

export interface NewsMetric {
  label: string;
  value: string;
  note?: string;
}

export interface NewsQuote {
  text: string;
  speaker: string;
}

export type ScenarioTheme =
  | 'macro'
  | 'geopolitics'
  | 'tech'
  | 'mobility'
  | 'bio'
  | 'corporate'
  | 'trend';

export interface StockDefinition {
  id: string;
  name: string;
  sector: SectorId;
  basePrice: number;
  volatility: number;
  /** 환율 등 거시 변수에 대한 기업 특성 (수출형/내수형/혼합형) */
  exposure: TradeExposure;
  descriptions: {
    elementary: string;
    middle: string;
    high: string;
  };
}

export interface StockState extends StockDefinition {
  currentPrice: number;
  priceHistory: number[];
  volumeHistory: number[];
}

export interface CompactStockSave {
  currentPrice: number;
  priceHistory: number[];
  volumeHistory?: number[];
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  /** -3(매우 악재) ~ +3(매우 호재), 0(중립/섹터 혼조) */
  sentiment: number;
  relatedSectors: SectorId[];
  sectorImpact: Partial<Record<SectorId, number>>;
  /** 동일 섹터 내에서도 수출/내수·개별 수주 등 특성 차이로 영향이 다른 종목별 개별 영향도 */
  stockImpactOverrides?: Record<string, number>;
  relatedStocks?: string[];
  stockImpact?: Record<string, number>;
  explanations: {
    elementary: string;
    middle: string;
    high: string;
  };
  difficulty: Level[];
  scenarioId?: string;
  scenarioTitle?: string;
  scenarioStep?: number;
  scenarioTotalSteps?: number;
  twistType?: NewsTwistType;
  readingHint?: Record<Level, string>;
  marketBias?: number;
  /** 기사 포맷/장르 다양화 */
  articleFormat?: NewsArticleFormat;
  /** 가상 언론 데스크/취재팀 표기 */
  sourceDesk?: string;
  /** 기사 핵심 수치 스냅샷 (정답 방향·섹터 비노출, 순수 팩트 수치) */
  keyMetrics?: NewsMetric[];
  /** 현장 관계자·연구원·소비자 한 줄 인용구 */
  quote?: NewsQuote;
  /** 기사 속 핵심 금융 용어사전 ID 목록 (정답 비노출 순수 개념 학습용) */
  relatedGlossaryIds?: string[];
}

export interface CompanyNewsTemplate {
  id: string;
  category: 'company';
  sentiment: number;
  relatedSectors: SectorId[];
  sectorImpact: Partial<Record<SectorId, number>>;
  relatedStocks: string[];
  stockImpact: Record<string, number>;
  stockImpactOverrides?: Record<string, number>;
  twistType: NewsTwistType;
  headlines: Record<Level, string>;
  contents: Record<Level, string>;
  explanations: Record<Level, string>;
  readingHint: Record<Level, string>;
  articleFormat?: NewsArticleFormat;
  sourceDesk?: string;
  keyMetrics?: NewsMetric[];
  quote?: NewsQuote;
  relatedGlossaryIds?: string[];
}

export interface ScenarioEpisode {
  step: number;
  category: NewsCategory;
  sentiment: number;
  relatedSectors: SectorId[];
  sectorImpact: Partial<Record<SectorId, number>>;
  relatedStocks?: string[];
  stockImpact?: Record<string, number>;
  stockImpactOverrides?: Record<string, number>;
  twistType: NewsTwistType;
  headlines: Record<Level, string>;
  contents: Record<Level, string>;
  explanations: Record<Level, string>;
  readingHint: Record<Level, string>;
  marketBias?: number;
  articleFormat?: NewsArticleFormat;
  sourceDesk?: string;
  keyMetrics?: NewsMetric[];
  quote?: NewsQuote;
  relatedGlossaryIds?: string[];
}

export interface ScenarioArc {
  id: string;
  title: string;
  theme: ScenarioTheme;
  icon: string;
  totalDays: number;
  subtitle: Record<Level, string>;
  summary: Record<Level, string>;
  featuredSectors: SectorId[];
  episodes: ScenarioEpisode[];
}

export interface ActiveScenarioState {
  scenarioId: string;
  currentStep: number;
  startedDay: number;
}

export interface Holding {
  quantity: number;
  avgPrice: number;
}

export type TradeType = 'buy' | 'sell';

export interface TradeRecord {
  id: string;
  dayCount: number;
  timestamp: string;
  type: TradeType;
  stockId: string;
  stockName: string;
  sector: SectorId;
  quantity: number;
  price: number;
  totalAmount: number;
  avgPriceBefore?: number;
  realizedProfit?: number;
  realizedProfitRate?: number;
}

export interface OrderIntent {
  stockId: string;
  side: TradeType;
  presetQty?: number | 'all';
  nonce: number;
}

export interface DayStockBreakdown {
  stockId: string;
  prevPrice: number;
  newPrice: number;
  actualChangePct: number;
  newsContribution: number;
  carryoverContribution: number;
  marketAndNoise: number;
  shockContribution: number;
  shockReason?: string;
}

export type NewsPrediction = 'bullish' | 'bearish' | 'mixed';

export interface PredictionStats {
  total: number;
  correct: number;
}

export interface LastDayRecap {
  dayNumber: number;
  prevTotalAsset: number;
  newTotalAsset: number;
  assetDelta: number;
  assetDeltaPct: number;
  checkedCount: number;
  correctCount: number;
  sectorCheckedCount?: number;
  sectorCorrectCount?: number;
}

export interface LevelGameSnapshot {
  level: Level;
  dayCount: number;
  cash: number;
  initialCash: number;
  stocks: Record<string, StockState>;
  usedNewsIds: string[];
  currentNews: NewsItem[];
  previousNews: NewsItem[];
  holdings: Record<string, Holding>;
  totalAssetHistory: number[];
  tutorialStep: number | null;
  lastDayBreakdown: Record<string, DayStockBreakdown>;
  carryoverImpacts: Record<string, number>;
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
  tradeHistory: TradeRecord[];
  realizedProfitTotal: number;
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  macro: '거시경제',
  sector: '산업/경제',
  company: '기업/종목',
  global: '글로벌 변수',
  social: '사회/트렌드',
};

export const NEWS_TWIST_LABELS: Record<NewsTwistType, string> = {
  direct: '핵심 재료',
  mixed: '복합 교차',
  contrarian: '기대치 반전',
  rumor: '루머·변수',
  earnings: '실적 해석',
  competition: '경쟁사 희비',
};

export const NEWS_FORMAT_LABELS: Record<NewsArticleFormat, string> = {
  breaking: '속보·단독',
  earnings: '실적·공시',
  interview: '현장 인터뷰',
  rival: '라이벌 대조',
  policy: '정책 브리핑',
  trend: '생활경제 르포',
};

export const SCENARIO_THEME_LABELS: Record<ScenarioTheme, string> = {
  macro: '거시경제',
  geopolitics: '지정학·무역',
  tech: '테크·AI',
  mobility: '모빌리티·에너지',
  bio: '바이오·헬스케어',
  corporate: '기업·자본시장',
  trend: '소비·기후',
};
