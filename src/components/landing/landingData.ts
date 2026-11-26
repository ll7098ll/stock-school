import type { Level } from '../../stores/gameStore';

export interface SlideMeta {
  id: string;
  number: string;
  label: string;
  navLabel?: string;
}

export const LANDING_SLIDES: SlideMeta[] = [
  { id: 'hero', number: '01', label: '메인 · 입장' },
  { id: 'concept', number: '02', label: '컨셉 · 철학', navLabel: '소개' },
  { id: 'loop', number: '03', label: '하루 학습 루프', navLabel: '학습 방법' },
  { id: 'levels', number: '04', label: '3단계 난이도', navLabel: '난이도' },
  { id: 'market', number: '05', label: '가상 시장 · 엔진', navLabel: '가상 시장' },
  { id: 'trust', number: '06', label: '안심 설계 · 시작', navLabel: '안심 설계' },
];

export interface LevelConfig {
  key: Level;
  label: string;
  title: string;
  audience: string;
  emoji: string;
  shortDesc: string;
  detailedDesc: string;
  cash: string;
  cashNumber: string;
  chartLabel: string;
  engine: {
    newsScale: string;
    newsScalePct: number;
    noiseRange: string;
    noisePct: number;
    shockChance: string;
    carryover: string;
    conflictGuard: string;
  };
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    key: 'elementary',
    label: '초급 학교',
    title: '입문자 교실',
    audience: '초등학생 · 금융 첫걸음',
    emoji: '🌱',
    shortDesc: '일상 비유와 뚜렷한 뉴스 인과관계 학습',
    detailedDesc:
      '주식을 처음 만나는 학생도 쉽게 이해할 수 있도록 일상적인 비유와 명확한 뉴스 방향성을 제공합니다. 돌발 변수 없이 뉴스와 가격의 인과관계를 또렷하게 익힙니다.',
    cash: '100만 원 시작',
    cashNumber: '₩1,000,000',
    chartLabel: '초급 · 심플 라인',
    engine: {
      newsScale: '×0.65 (높은 인과성)',
      newsScalePct: 86,
      noiseRange: '±0.9% (안정적)',
      noisePct: 30,
      shockChance: '없음 (0%)',
      carryover: '미적용 (당일 완결)',
      conflictGuard: '동일 섹터 충돌 방지',
    },
  },
  {
    key: 'middle',
    label: '중급 아카데미',
    title: '성장형 실전반',
    audience: '중학생 · 산업 흐름 이해',
    emoji: '📈',
    shortDesc: '산업 뉴스·금리·공급망의 기업 영향 분석',
    detailedDesc:
      '산업별 공급망과 금리·규제 뉴스의 행간을 읽으며 이동평균선(MA)으로 추세를 관찰합니다. 소폭의 돌발 수급 변동이 도입되어 분산투자의 필요성을 자연스럽게 체득합니다.',
    cash: '500만 원 시작',
    cashNumber: '₩5,000,000',
    chartLabel: '중급 · 이동평균선(MA)',
    engine: {
      newsScale: '×0.52 (균형 반영)',
      newsScalePct: 68,
      noiseRange: '±1.5% (보통)',
      noisePct: 58,
      shockChance: '3.0% (사유 배지 공개)',
      carryover: '미적용',
      conflictGuard: '동일 섹터 충돌 방지',
    },
  },
  {
    key: 'high',
    label: '고급 연구소',
    title: '심화 분석반',
    audience: '고등학생 · 거시·재무 심화',
    emoji: '🏦',
    shortDesc: 'ROE·PER·환노출도와 거시 복합 변수 분석',
    detailedDesc:
      '캔들 차트와 재무 핵심 지표, 전일 뉴스 이월 모멘텀(25%), 수출형·내수형 환율 차별화까지 종합 분석하는 심화 시뮬레이션 환경입니다.',
    cash: '1,000만 원 시작',
    cashNumber: '₩10,000,000',
    chartLabel: '고급 · 캔들 심화',
    engine: {
      newsScale: '×0.45 (복합 시장)',
      newsScalePct: 54,
      noiseRange: '±2.0% (실전형)',
      noisePct: 82,
      shockChance: '4.5% (사유 배지 공개)',
      carryover: '전일 뉴스 25% 이월',
      conflictGuard: '복합 혼조 시나리오 허용',
    },
  },
];

// 100% fictional educational sample news by level
export const MOCK_NEWS_BY_LEVEL: Record<Level, string[]> = {
  elementary: [
    '🌱 [새싹뉴스] 새 학기 스마트 태블릿 인기 폭발! 전자·반도체 공장 풀가동',
    '🌱 [쉬운 경제] 이상 기후로 밀가루·설탕 가격 급등… 식품 공장 재료비 비상',
    '🌱 [금융 상식] 달걀을 한 바구니에 담지 마세요! 여러 산업에 분산투자 연습하기',
  ],
  middle: [
    '📈 [산업 동향] 글로벌 AI 데이터센터 증설 경쟁… 고대역폭 메모리 주문 급증',
    '📈 [공급망 분석] 리튬·니켈 광물 시세 급락… 2차전지 소재 재고평가손실 주의',
    '📈 [친환경 규제] 글로벌 해운사 탄소중립 선언… 친환경 선박 교체 발주 확대',
  ],
  high: [
    '🏦 [거시 분석] 미 연준 기준금리 인하 단행… 성장주 할인율 하락 vs 은행 NIM 축소',
    '🏦 [환율 심화] 원/달러 환율 상승! 수출형 식품주 환차익 vs 내수 수입형 원가 부담',
    '🏦 [정책 분석] 저PBR 기업 밸류업 세제 혜택 확정… 금융·지주사 주주환원 확대',
  ],
};

export interface LearningStep {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
}

export const LEARNING_STEPS: LearningStep[] = [
  {
    step: '01',
    title: '가상 경제 뉴스 읽기',
    subtitle: '매일 배달되는 3건의 맞춤 경제 기사',
    description:
      '거시경제·산업·기업·글로벌·사회 5개 카테고리의 1,098편 가상 뉴스와 30종 멀티데이 시나리오 중 난이도에 맞는 3건이 매일 도착합니다. 헤드라인 뒤에 숨은 수혜 산업과 위험 산업을 먼저 추론해 보세요.',
    highlights: ['난이도별 366편 맞춤 기사', '초·중급 동일 섹터 충돌 방지', '80개 금융 용어 칩 연동'],
  },
  {
    step: '02',
    title: '기업 분석 & 차트 확인',
    subtitle: '실제 HTS 감각의 차트와 호가 구조',
    description:
      'TradingView Lightweight Charts 기반 주가·거래량 차트와 KRX 가격대별 호가 단위를 반영한 모의 호가창을 살펴보며, 각 가상 기업의 수출·내수 사업 구조를 확인합니다.',
    highlights: ['주가 연동 결정론적 거래량', 'KRX 호가 단위 자동 반영', '난이도별 기업 분석 리포트'],
  },
  {
    step: '03',
    title: '모의 매수·매도 & 분산투자',
    subtitle: '실제 돈 없이 안전한 포트폴리오 실험',
    description:
      '가상 자금으로 수량을 조절해 매수·매도하면 평균 매수가와 평가 손익이 실시간 계산됩니다. 섹터 비중 파이차트를 보며 한 산업에 쏠리지 않는 분산투자를 연습합니다.',
    highlights: ['평균 매수가 자동 산출', '17개 산업 섹터 비중 점검', '실제 금전 거래·손실 0원'],
  },
  {
    step: '04',
    title: '다음 날 & 스탁 쌤 해설',
    subtitle: '결과를 복기하며 완성하는 금융 문해력',
    description:
      '‘다음 날’을 누르면 시뮬레이션 엔진이 뉴스 반영분·시장 변동·돌발 수급을 합산해 새 주가를 결정합니다. 어제 뉴스 해설 탭에서 왜 오르고 내렸는지 명쾌하게 복기합니다.',
    highlights: ['일일 ±15% 변동폭 제한', '돌발 수급 사유 배지 투명 공개', '난이도 맞춤 스탁 쌤 해설'],
  },
];

export interface ScenarioDemo {
  id: string;
  tag: string;
  headline: string;
  context: string;
  outcomes: {
    stockId: string;
    name: string;
    sector: string;
    exposureLabel: string;
    direction: 'up' | 'down';
    deltaText: string;
    reason: string;
  }[];
}

export const MARKET_SCENARIO_DEMOS: ScenarioDemo[] = [
  {
    id: 'fx-up',
    tag: '환율 차별화 엔진 (v2.0)',
    headline: '원/달러 환율 급등 — 같은 식품 산업, 엇갈리는 두 기업',
    context:
      '단순히 섹터 전체가 똑같이 오르내리지 않습니다. 스탁스쿨 엔진은 개별 기업의 수출·내수 구조(`exposure`)를 구분해 현실적인 경제 원리를 보여줍니다.',
    outcomes: [
      {
        stockId: 'flame-food',
        name: '스파이스랩',
        sector: '식품(Food)',
        exposureLabel: '수출형',
        direction: 'up',
        deltaText: '+4.8%',
        reason: '해외 매출 비중이 높아 달러 매출 원화 환산 시 환차익 발생',
      },
      {
        stockId: 'family-food',
        name: '하베스트푸드',
        sector: '식품(Food)',
        exposureLabel: '내수형',
        direction: 'down',
        deltaText: '-3.4%',
        reason: '수입 곡물·원재료 비중이 높아 원가 부담 증가로 마진 압박',
      },
    ],
  },
  {
    id: 'ai-boom',
    tag: '변동성 & 사업 다각화 비교',
    headline: '글로벌 AI 데이터센터 투자 확대 — 같은 기술 섹터, 다른 변동 폭',
    context:
      '같은 호재라도 사업이 다각화된 종합 기업과 한 분야에 집중한 전문 기업은 주가 반응의 크기가 다릅니다.',
    outcomes: [
      {
        stockId: 'neo-memory',
        name: '뉴로세미',
        sector: '기술(Tech)',
        exposureLabel: '고변동 전문형',
        direction: 'up',
        deltaText: '+6.2%',
        reason: '고대역폭 메모리 집중 구조로 업황 호조 시 높은 이익 레버리지',
      },
      {
        stockId: 'nuri-elec',
        name: '노바전자',
        sector: '기술(Tech)',
        exposureLabel: '안정 종합형',
        direction: 'up',
        deltaText: '+3.1%',
        reason: '반도체·가전·모바일 다각화 구조로 완만하고 안정적인 상승 흐름',
      },
    ],
  },
];

export const FEATURED_GLOSSARY_IDS = ['g-1', 'g-2', 'g-3', 'g-6', 'g-17', 'g-18'];
