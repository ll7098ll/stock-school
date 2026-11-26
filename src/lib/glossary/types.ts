import type { Level, SectorId } from '../types.ts';

export type GlossaryCategory =
  | 'basic'
  | 'financial'
  | 'market'
  | 'macro'
  | 'sector'
  | 'advanced';

export interface GlossaryItem {
  id: string;
  term: string;
  category: GlossaryCategory;
  /** 리스트 및 빠른 복습용 한 줄 핵심 요약 */
  shortSummary: Record<Level, string>;
  /** 눈높이별 상세 개념 해설 */
  definitions: Record<Level, string>;
  /** 스탁스쿨 실전 예시 (숫자·상황 비유) */
  examples: Record<Level, string>;
  /** 꼬리물기 학습용 연관 용어 ID */
  relatedIds: string[];
  /** 관련 산업 섹터 (선택) */
  relatedSectors?: SectorId[];
  /** 검색 별칭 (한글 약어, 영문, 유사 표현) */
  keywords?: string[];
}

export const GLOSSARY_CATEGORY_META: {
  id: GlossaryCategory;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'basic',
    label: '주식 기초·거래',
    shortLabel: '주식 기초',
    description: '주식 매매, 호가, 시가총액, 배당, ETF 등 투자의 기본 개념',
  },
  {
    id: 'financial',
    label: '재무·실적 분석',
    shortLabel: '재무·실적',
    description: '매출·영업이익, PER·PBR·ROE, 컨센서스 등 기업 가치 평가 지표',
  },
  {
    id: 'market',
    label: '차트·시장 심리',
    shortLabel: '차트·심리',
    description: '캔들, 이동평균선, 수급, 선반영 등 주가 흐름과 시장 반응 원리',
  },
  {
    id: 'macro',
    label: '거시경제·정책',
    shortLabel: '거시경제',
    description: '기준금리, 물가, 환율, 채권, 관세·공급망 등 경제 전체 변수',
  },
  {
    id: 'sector',
    label: '산업 핵심 지표',
    shortLabel: '산업 지표',
    description: '가동률, HBM, 정제마진, SCFI, NIM 등 17개 섹터 실전 용어',
  },
  {
    id: 'advanced',
    label: '기업 이벤트·심화',
    shortLabel: '심화·이벤트',
    description: '공매도, 유상증자, 물적분할, 지배구조, DCF 등 심화 자본시장 개념',
  },
];
