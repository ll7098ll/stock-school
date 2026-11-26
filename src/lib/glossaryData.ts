import type { GlossaryCategory, GlossaryItem } from './glossary/types.ts';
import { GLOSSARY_CATEGORY_META } from './glossary/types.ts';
import { BASIC_GLOSSARY_TERMS } from './glossary/basicTerms.ts';
import { FINANCIAL_GLOSSARY_TERMS } from './glossary/financialTerms.ts';
import { MARKET_GLOSSARY_TERMS } from './glossary/marketTerms.ts';
import { MACRO_GLOSSARY_TERMS } from './glossary/macroTerms.ts';
import { SECTOR_GLOSSARY_TERMS } from './glossary/sectorTerms.ts';
import { ADVANCED_GLOSSARY_TERMS } from './glossary/advancedTerms.ts';

export type { GlossaryCategory, GlossaryItem };
export { GLOSSARY_CATEGORY_META };

/**
 * 스탁스쿨 금융용어사전 통합 데이터 (6개 카테고리 · 총 80개 핵심 용어)
 *
 * - 모든 용어는 초등(elementary) · 중등(middle) · 고등(high) 3단계 맞춤
 *   한 줄 요약(shortSummary), 상세 해설(definitions), 실전 예시(examples)를 제공합니다.
 * - 기존 g-1 ~ g-32 ID를 100% 유지하면서 48개 실전 용어(g-33 ~ g-80)를 확충했습니다.
 */
export const GLOSSARY_TERMS: GlossaryItem[] = [
  ...BASIC_GLOSSARY_TERMS,
  ...FINANCIAL_GLOSSARY_TERMS,
  ...MARKET_GLOSSARY_TERMS,
  ...MACRO_GLOSSARY_TERMS,
  ...SECTOR_GLOSSARY_TERMS,
  ...ADVANCED_GLOSSARY_TERMS,
];

export const GLOSSARY_BY_ID: Record<string, GlossaryItem> = Object.fromEntries(
  GLOSSARY_TERMS.map((item) => [item.id, item])
);

const CATEGORY_LABEL_MAP: Record<GlossaryCategory, string> = Object.fromEntries(
  GLOSSARY_CATEGORY_META.map((meta) => [meta.id, meta.label])
) as Record<GlossaryCategory, string>;

export const getCategoryLabel = (category: GlossaryCategory): string => {
  return CATEGORY_LABEL_MAP[category];
};
