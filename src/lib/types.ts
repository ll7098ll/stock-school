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
  /** 동일 섹터 내에서도 수출/내수 등 특성 차이로 영향이 다른 종목별 개별 영향도 */
  stockImpactOverrides?: Record<string, number>;
  explanations: {
    elementary: string;
    middle: string;
    high: string;
  };
  difficulty: Level[];
}

export interface Holding {
  quantity: number;
  avgPrice: number;
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
}
