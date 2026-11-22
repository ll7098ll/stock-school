import type { NewsItem } from './types.ts';
import { ELEMENTARY_NEWS } from './news/elementaryNews.ts';
import { MIDDLE_NEWS } from './news/middleNews.ts';
import { HIGH_NEWS } from './news/highNews.ts';
import { shuffleArray } from './priceEngine.ts';

export type { NewsItem };
export { shuffleArray, ELEMENTARY_NEWS, MIDDLE_NEWS, HIGH_NEWS };

/**
 * 전체 교육용 가상 뉴스 풀 (총 102건: 초급 34 / 중급 34 / 고급 34)
 * - 17개 모든 섹터에 난이도별 호재·악재 균형 배치
 * - @ts-nocheck 제거 및 엄격한 SectorId 타입 검증 적용
 */
export const PREDEFINED_NEWS: NewsItem[] = [
  ...ELEMENTARY_NEWS,
  ...MIDDLE_NEWS,
  ...HIGH_NEWS,
];

export const NEWS_BY_ID: Record<string, NewsItem> = Object.fromEntries(
  PREDEFINED_NEWS.map((item) => [item.id, item])
);
