import type {
  ActiveScenarioState,
  CompanyNewsTemplate,
  Level,
  NewsCategory,
  NewsItem,
  NewsTwistType,
  ScenarioArc,
  ScenarioEpisode,
  ScenarioTheme,
} from './types.ts';
import {
  NEWS_CATEGORY_LABELS,
  NEWS_FORMAT_LABELS,
  NEWS_TWIST_LABELS,
  SCENARIO_THEME_LABELS,
} from './types.ts';
import { ELEMENTARY_NEWS } from './news/elementaryNews.ts';
import { MIDDLE_NEWS } from './news/middleNews.ts';
import { HIGH_NEWS } from './news/highNews.ts';
import { ELEMENTARY_EXTRA_NEWS } from './news/elementaryExtra.ts';
import { MIDDLE_EXTRA_NEWS } from './news/middleExtra.ts';
import { HIGH_EXTRA_NEWS } from './news/highExtra.ts';
import {
  ELEMENTARY_DIVERSE_NEWS,
  MIDDLE_DIVERSE_NEWS,
  HIGH_DIVERSE_NEWS,
} from './news/diverseThemesNews.ts';
import { COMPANY_NEWS_TECH_AUTO } from './news/companyNewsTechAuto.ts';
import { COMPANY_NEWS_ENERGY_BIO } from './news/companyNewsEnergyBio.ts';
import { COMPANY_NEWS_IND_FIN } from './news/companyNewsIndFin.ts';
import { COMPANY_NEWS_BALANCED } from './news/companyNewsBalanced.ts';
import { MACRO_GEO_SCENARIOS } from './scenarios/macroGeoScenarios.ts';
import { TECH_MOB_SCENARIOS } from './scenarios/techMobScenarios.ts';
import { CORP_BIO_TREND_SCENARIOS } from './scenarios/corpBioTrendScenarios.ts';
import { DIVERSE_NEW_SCENARIOS } from './scenarios/diverseNewScenarios.ts';
import { shuffleArray } from './priceEngine.ts';
import { enrichRelatedGlossaryIds } from './glossary/matcher.ts';

export type {
  ActiveScenarioState,
  CompanyNewsTemplate,
  Level as NewsDifficulty,
  NewsCategory,
  NewsItem,
  NewsTwistType,
  ScenarioArc,
  ScenarioEpisode,
  ScenarioTheme,
};

export {
  shuffleArray,
  ELEMENTARY_NEWS,
  MIDDLE_NEWS,
  HIGH_NEWS,
  ELEMENTARY_EXTRA_NEWS,
  MIDDLE_EXTRA_NEWS,
  HIGH_EXTRA_NEWS,
  ELEMENTARY_DIVERSE_NEWS,
  MIDDLE_DIVERSE_NEWS,
  HIGH_DIVERSE_NEWS,
  NEWS_CATEGORY_LABELS,
  NEWS_FORMAT_LABELS,
  NEWS_TWIST_LABELS,
  SCENARIO_THEME_LABELS,
};

/**
 * 34개 가상 상장 기업 개별 특화 뉴스 템플릿 136건 (3단계 수준별 기사 분기 = 408편)
 */
export const COMPANY_NEWS_TEMPLATES: CompanyNewsTemplate[] = [
  ...COMPANY_NEWS_TECH_AUTO,
  ...COMPANY_NEWS_ENERGY_BIO,
  ...COMPANY_NEWS_IND_FIN,
  ...COMPANY_NEWS_BALANCED,
];

/**
 * 3~4일 연속 스토리 시나리오 아크 30종 (총 106개 에피소드, 3단계 수준별 기사 분기 = 318편)
 */
export const SCENARIO_ARCS: ScenarioArc[] = [
  ...MACRO_GEO_SCENARIOS,
  ...TECH_MOB_SCENARIOS,
  ...CORP_BIO_TREND_SCENARIOS,
  ...DIVERSE_NEW_SCENARIOS,
];

export function getScenarioById(id: string): ScenarioArc | undefined {
  return SCENARIO_ARCS.find((arc) => arc.id === id);
}

/**
 * 개별 기업 뉴스 템플릿을 특정 난이도에 맞는 NewsItem으로 변환합니다.
 */
export function materializeCompanyNews(
  template: CompanyNewsTemplate,
  level: Level
): NewsItem {
  const title = template.headlines[level];
  const content = template.contents[level];
  return {
    id: `${template.id}-${level}`,
    title,
    content,
    category: template.category,
    sentiment: template.sentiment,
    relatedSectors: template.relatedSectors,
    sectorImpact: template.sectorImpact,
    stockImpactOverrides: template.stockImpactOverrides,
    relatedStocks: template.relatedStocks,
    stockImpact: template.stockImpact,
    explanations: template.explanations,
    difficulty: [level],
    twistType: template.twistType,
    readingHint: template.readingHint,
    articleFormat: template.articleFormat,
    sourceDesk: template.sourceDesk,
    keyMetrics: template.keyMetrics,
    quote: template.quote,
    relatedGlossaryIds: enrichRelatedGlossaryIds(title, content, template.relatedGlossaryIds),
  };
}

/**
 * 멀티데이 시나리오의 특정 회차(1-indexed)를 특정 난이도에 맞는 NewsItem으로 변환합니다.
 */
export function materializeScenarioNews(
  arc: ScenarioArc,
  step: number,
  level: Level
): NewsItem | null {
  const episode = arc.episodes.find((ep) => ep.step === step);
  if (!episode) return null;

  const title = episode.headlines[level];
  const content = episode.contents[level];

  return {
    id: `${arc.id}-day-${episode.step}-${level}`,
    title,
    content,
    category: episode.category,
    sentiment: episode.sentiment,
    relatedSectors: episode.relatedSectors,
    sectorImpact: episode.sectorImpact,
    stockImpactOverrides: episode.stockImpactOverrides,
    relatedStocks: episode.relatedStocks,
    stockImpact: episode.stockImpact,
    explanations: episode.explanations,
    difficulty: [level],
    scenarioId: arc.id,
    scenarioTitle: arc.title,
    scenarioStep: episode.step,
    scenarioTotalSteps: arc.totalDays,
    twistType: episode.twistType,
    readingHint: episode.readingHint,
    marketBias: episode.marketBias,
    articleFormat: episode.articleFormat,
    sourceDesk: episode.sourceDesk,
    keyMetrics: episode.keyMetrics,
    quote: episode.quote,
    relatedGlossaryIds: enrichRelatedGlossaryIds(title, content, episode.relatedGlossaryIds),
  };
}

const LEVELS: Level[] = ['elementary', 'middle', 'high'];

const MATERIALIZED_COMPANY_NEWS: NewsItem[] = LEVELS.flatMap((lvl) =>
  COMPANY_NEWS_TEMPLATES.map((tpl) => materializeCompanyNews(tpl, lvl))
);

const MATERIALIZED_SCENARIO_NEWS: NewsItem[] = LEVELS.flatMap((lvl) =>
  SCENARIO_ARCS.flatMap((arc) =>
    arc.episodes
      .map((ep) => materializeScenarioNews(arc, ep.step, lvl))
      .filter((item): item is NewsItem => item !== null)
  )
);

const withEnrichedGlossary = (items: NewsItem[]): NewsItem[] =>
  items.map((item) => ({
    ...item,
    relatedGlossaryIds: enrichRelatedGlossaryIds(
      item.title,
      item.content,
      item.relatedGlossaryIds
    ),
  }));

/**
 * 전체 교육용 가상 뉴스 풀
 * - 난이도별 기본 34건 + 추가 단독 60건 + 다양화 테마 30건 + 개별 기업 특화 136건 = 레벨당 260건 (총 780건)
 * - 여기에 30종 멀티데이 시나리오(레벨당 106화 = 318건)가 별도 아크로 전개되어 레벨당 총 366건(1,098편) 제공
 */
export const PREDEFINED_NEWS: NewsItem[] = [
  ...withEnrichedGlossary(ELEMENTARY_NEWS),
  ...withEnrichedGlossary(ELEMENTARY_EXTRA_NEWS),
  ...withEnrichedGlossary(ELEMENTARY_DIVERSE_NEWS),
  ...withEnrichedGlossary(MIDDLE_NEWS),
  ...withEnrichedGlossary(MIDDLE_EXTRA_NEWS),
  ...withEnrichedGlossary(MIDDLE_DIVERSE_NEWS),
  ...withEnrichedGlossary(HIGH_NEWS),
  ...withEnrichedGlossary(HIGH_EXTRA_NEWS),
  ...withEnrichedGlossary(HIGH_DIVERSE_NEWS),
  ...MATERIALIZED_COMPANY_NEWS,
];

export const NEWS_BY_ID: Record<string, NewsItem> = Object.fromEntries(
  [...PREDEFINED_NEWS, ...MATERIALIZED_SCENARIO_NEWS].map((item) => [item.id, item])
);
