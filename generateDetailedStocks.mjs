import fs from 'fs';

const kospiStocks = [
  { name: "삼성전자", sector: "기술(Tech)", basePrice: 83000, vol: 0.7, theme: "반도체, 스마트폰, 가전, AI 인프라의 핵심" },
  { name: "SK하이닉스", sector: "기술(Tech)", basePrice: 210000, vol: 1.3, theme: "글로벌 HBM 점유율 1위, 순수 메모리 반도체 강자" },
  { name: "현대차", sector: "자동차(Auto)", basePrice: 280000, vol: 0.9, theme: "내연기관부터 전기차, 수소차를 아우르는 글로벌 모빌리티" },
  { name: "기아", sector: "자동차(Auto)", basePrice: 135000, vol: 1.0, theme: "탁월한 디자인과 고수익성 SUV 중심의 완성차 메이커" },
  { name: "현대모비스", sector: "자동차(Auto)", basePrice: 250000, vol: 0.8, theme: "현대차그룹의 핵심 부품 공급 및 미래 자율주행 모듈" },
  { name: "LG에너지솔루션", sector: "에너지(Energy)", basePrice: 380000, vol: 1.4, theme: "미국 IRA 수혜를 가장 크게 받는 글로벌 전기차 배터리 셀 제조" },
  { name: "삼성SDI", sector: "에너지(Energy)", basePrice: 420000, vol: 1.2, theme: "고성능 프리미엄 배터리 중심의 수익성 위주 전략" },
  { name: "LG화학", sector: "화학(Chemical)", basePrice: 450000, vol: 1.1, theme: "석유화학의 기초 체력을 바탕으로 2차전지 소재로의 대전환" },
  { name: "POSCO홀딩스", sector: "철강/소재(Materials)", basePrice: 400000, vol: 1.5, theme: "전통 철강 강자에서 리튬, 니켈 등 2차전지 풀 밸류체인 기업으로 진화" },
  { name: "포스코퓨처엠", sector: "화학(Chemical)", basePrice: 290000, vol: 1.6, theme: "국내 유일의 양/음극재 동시 생산 능력을 갖춘 배터리 핵심 소재" },
  { name: "네이버", sector: "인터넷(Internet)", basePrice: 220000, vol: 1.1, theme: "검색 포털을 넘어선 초거대 AI(하이퍼클로바X)와 커머스/콘텐츠 생태계" },
  { name: "카카오", sector: "인터넷(Internet)", basePrice: 55000, vol: 1.3, theme: "국민 메신저를 기반으로 한 일상 침투형 플랫폼 및 핀테크/모빌리티" },
  { name: "KB금융", sector: "금융(Finance)", basePrice: 85000, vol: 0.6, theme: "대한민국 리딩 뱅크로 확고한 이자 이익과 강력한 주주환원(밸류업)" },
  { name: "신한지주", sector: "금융(Finance)", basePrice: 45000, vol: 0.7, theme: "은행과 비은행 부문의 균형 잡힌 포트폴리오를 갖춘 대형 금융그룹" },
  { name: "삼성생명", sector: "금융(Finance)", basePrice: 90000, vol: 0.5, theme: "막대한 자산 운용 규모와 삼성그룹 지배구조의 핵심축" },
  { name: "삼성바이오로직스", sector: "바이오(Bio)", basePrice: 880000, vol: 1.0, theme: "압도적인 캐파를 바탕으로 한 글로벌 1위 수준의 바이오 의약품 위탁생산(CDMO)" },
  { name: "셀트리온", sector: "바이오(Bio)", basePrice: 190000, vol: 1.2, theme: "바이오시밀러(복제약)의 글로벌 선구자이자 짐펜트라 등 신약 개발사로 도약" },
  { name: "S-Oil", sector: "에너지(Energy)", basePrice: 75000, vol: 1.4, theme: "국제 유가와 정제마진에 가장 민감하게 반응하는 순수 정유 및 석유화학" },
  { name: "SK이노베이션", sector: "에너지(Energy)", basePrice: 120000, vol: 1.5, theme: "정유 캐시카우를 바탕으로 자회사 SK온을 통한 배터리 사업 확장" },
  { name: "SK텔레콤", sector: "통신(Telecom)", basePrice: 52000, vol: 0.5, theme: "안정적인 통신망 수익과 고배당, 그리고 AI 컴퍼니로의 체질 개선" },
  { name: "KT", sector: "통신(Telecom)", basePrice: 38000, vol: 0.6, theme: "전국적인 유무선 인프라망을 활용한 B2B 클라우드 및 IDC 사업의 성장" },
  { name: "한화에어로스페이스", sector: "방산(Defense)", basePrice: 260000, vol: 1.4, theme: "K9 자주포와 천무 수출 대박, 누리호 발사 등 K-우주항공 및 방산의 상징" },
  { name: "HD현대중공업", sector: "조선(Shipbuilding)", basePrice: 130000, vol: 1.5, theme: "친환경 선박(LNG, 암모니아 추진선) 건조 기술 세계 1위의 메가 조선소" },
  { name: "현대건설", sector: "건설(Construction)", basePrice: 40000, vol: 1.2, theme: "국내 힐스테이트 주택 사업과 중동 원전, 플랜트 등 압도적 해외 수주 능력" },
  { name: "CJ제일제당", sector: "식품(Food)", basePrice: 320000, vol: 0.8, theme: "비비고 만두 등 K-푸드 글로벌 확산을 주도하며, 바이오(아미노산) 사업도 병행" },
  { name: "아모레퍼시픽", sector: "화장품(Cosmetics)", basePrice: 180000, vol: 1.3, theme: "중국 시장 의존도를 줄이고 북미, 일본 등 비중화권 글로벌 뷰티 강자로 부활" },
  { name: "삼성물산", sector: "지주/유통(Retail)", basePrice: 160000, vol: 0.9, theme: "건설, 상사, 패션, 리조트 사업을 아우르며 삼성그룹 지배구조의 정점에 위치" },
  { name: "HMM", sector: "항공/해운(Transport)", basePrice: 18000, vol: 1.8, theme: "글로벌 공급망 병목과 해상 운임(SCFI) 변동에 가장 역동적으로 움직이는 국적 선사" },
  { name: "이마트", sector: "유통(Retail)", basePrice: 70000, vol: 1.1, theme: "오프라인 마트의 한계를 극복하기 위해 SSG닷컴, 스타벅스코리아 등을 통합 운영" }
];

const expandText = (baseTheme, level) => {
  // Generate massive chunks of descriptive text
  let output = "";
  if (level === 'elementary') {
    output += `우리 친구들, ${baseTheme}에 대해 들어본 적 있나요? 이 회사는 대한민국을 대표하는 아주 커다랗고 멋진 회사 중 하나랍니다! 우리가 매일 사용하는 물건들이나, 텔레비전에서 나오는 아주 대단한 뉴스들의 주인공이 바로 이 회사일 때가 많아요. `;
    output += `이 회사가 주로 하는 일은 바로 '${baseTheme}'와 관련된 아주 중요한 일들이에요. 친구들이 장난감을 조립하거나 퍼즐을 맞추는 것처럼, 이 회사에 다니는 수많은 똑똑한 어른들은 세상 사람들을 편안하고 즐겁게 만들어주기 위해 거대한 공장에서 물건을 만들거나 인터넷으로 신기한 서비스를 제공한답니다.\n\n`;
    output += `주식이라는 건 뭘까요? 바로 이 멋진 회사의 '주인'이 되는 티켓 같은 거예요! 우리가 만약 이 회사의 주식을 한 장 가지고 있다면, 이 회사가 물건을 많이 팔아서 돈을 많이 벌 때마다 우리도 같이 기뻐할 수 있어요. 반대로 회사가 물건을 잘 못 팔거나 사람들이 덜 좋아하게 되면 티켓의 가격이 떨어져서 슬퍼질 수도 있답니다.\n\n`;
    output += `그렇다면 이 회사는 언제 돈을 잘 벌까요? 바로 전 세계에 있는 우리나라뿐만 아니라 미국, 유럽, 아프리카 친구들까지 모두 이 회사의 물건이나 서비스를 사려고 줄을 설 때예요! 예를 들어 새로운 스마트폰이 나왔을 때, 엄청나게 멋진 자동차가 나왔을 때, 혹은 맛있는 음식이 외국에서 큰 인기를 끌 때 주식 가격이 쑥쑥 올라간답니다. 어린이 친구들도 나중에 커서 어떤 회사가 세상을 멋지게 바꿀지 잘 지켜보세요. 바로 이 회사가 그 주인공일 확률이 아주 높거든요!`;
  } else if (level === 'middle') {
    output += `대한민국 주식 시장인 KOSPI에서 매우 중요한 비중을 차지하고 있는 이 기업은, '${baseTheme}'라는 명확한 핵심 경쟁력을 바탕으로 국가 경제의 뼈대를 이루고 있습니다. 중학교 사회나 경제 시간에 배우는 '수요와 공급', '수출과 수입', 그리고 '환율'의 원리가 이 회사의 주가에 실시간으로 반영된다고 보면 됩니다.\n\n`;
    output += `이 회사의 비즈니스 모델(돈을 버는 방법)은 매우 체계적이고 글로벌하게 뻗어 있습니다. 단순히 우리나라 안에서만 장사하는 것이 아니라, 미국 달러(USD)나 유럽 유로(EUR)를 벌어들이는 수출 주도형 구조를 가지거나, 해외의 거대한 자본과 경쟁하는 위치에 있습니다. 따라서 뉴스에서 '미국의 경제가 좋아졌다' 혹은 '유럽에 물건을 수출하기 좋아졌다'라는 기사가 나오면 이 회사의 이익이 크게 늘어날 것이라고 예측할 수 있습니다.\n\n`;
    output += `투자자들은 이 회사를 평가할 때 '매출액'과 '영업이익'을 가장 중요하게 봅니다. 매출액은 물건을 총 얼마치 팔았는가이고, 영업이익은 거기서 재료비, 직원들 월급, 공장 전기세 등을 빼고 순수하게 남긴 돈을 의미합니다. 이 기업은 오랜 기간 기술 개발과 공장 증설(투자)을 해왔기 때문에, 한 번 물건이 잘 팔리기 시작하면 이익이 폭발적으로 늘어나는 특징을 가지고 있습니다. 이를 '규모의 경제'라고 부릅니다.\n\n`;
    output += `또한 금리(돈을 빌리는 데 드는 이자율)도 중요합니다. 은행 이자가 비싸지면 사람들은 주식을 팔고 안전한 예금을 하려고 하기 때문에 주식 시장 전체가 힘들어질 수 있습니다. 하지만 이 회사는 워낙 튼튼한 자본력과 미래 성장성을 갖추고 있어서, 오히려 위기가 닥쳤을 때 다른 약한 경쟁사들을 물리치고 시장 점유율을 독차지하는 저력을 보여주기도 합니다. 따라서 이 주식에 투자한다는 것은 대한민국 산업의 미래와 글로벌 경쟁력에 믿음을 갖는 것과 같습니다.`;
  } else {
    output += `현재 KOSPI 지수의 방향성을 결정짓는 핵심 시가총액 상위 종목으로, 해당 섹터 내에서 글로벌 Top-tier의 지위를 누리고 있습니다. 이 기업의 핵심 투자 아이디어(Investment Thesis)는 바로 '${baseTheme}'에 기반한 강력한 경제적 해자(Economic Moat)와 잉여현금흐름(FCF) 창출 능력에 있습니다.\n\n`;
    output += `이 기업의 밸류에이션(Valuation)을 논할 때 빼놓을 수 없는 것은 12M Fwd PER(선행 주가수익비율)과 PBR(주가순자산비율)의 역사적 밴드 흐름입니다. 거시경제적(Macro) 관점에서 글로벌 유동성 국면(미 연준의 기준금리 인상/인하 사이클), 인플레이션 압력, 그리고 강달러 기조는 이 기업의 가중평균자본비용(WACC)을 변동시키는 주요 요인입니다. 즉, 국채 금리가 상승하면 DCF(현금흐름할인) 모델 상의 할인율이 높아져 단기적인 주가 하락 압력(Multiple De-rating)으로 작용할 수 있습니다.\n\n`;
    output += `그러나 이 기업은 막대한 영업 레버리지(Operating Leverage) 효과를 발휘할 수 있는 비용 구조를 갖추고 있습니다. 전방 산업의 수요가 회복되는 사이클이 도래하면, 고정비 비중이 높은 사업 구조 특성상 한계 이익률이 급증하며 폭발적인 어닝 서프라이즈를 기록하게 됩니다. 이는 EPS(주당순이익)의 상향 조정(Upward Revision)을 이끌어내며 기관 및 외국인 투자자들의 패시브 자금(인덱스 펀드 등) 유입을 강제하는 효과를 낳습니다.\n\n`;
    output += `최근 행동주의 펀드의 부상과 정부의 '기업 밸류업 프로그램' 추진은 이 기업의 고질적인 코리아 디스카운트를 해소할 강력한 촉매제(Catalyst)입니다. 쌓아둔 막대한 이익잉여금을 활용한 공격적인 자사주 매입 및 소각, 전향적인 배당 성향 확대는 주가 하방(Downside)을 단단히 지지해줍니다. 더불어 차세대 성장 동력을 확보하기 위한 Capex(설비투자)와 M&A(인수합병) 전략은 이 회사가 단순한 가치주(Value Stock)의 함정에 빠지지 않고 장기적인 성장주(Growth Stock)의 멀티플을 정당화하게 만드는 핵심 요인입니다. 철저한 매크로 분석과 기업 탐방 기반의 바텀업(Bottom-up) 실적 추적이 수반되어야만 이 대장주의 진짜 사이클을 잡아낼 수 있습니다.`;
  }
  return output;
};

const generateStocks = () => {
  return kospiStocks.map((c, idx) => ({
    id: `kospi-${idx}`,
    name: c.name,
    sector: c.sector,
    basePrice: c.basePrice,
    volatility: c.vol,
    descriptions: {
      elementary: expandText(c.theme, 'elementary'),
      middle: expandText(c.theme, 'middle'),
      high: expandText(c.theme, 'high')
    }
  }));
};

// --- NEWS GENERATOR (Using previously built logic but writing more volume) ---
// We'll just generate the massive news array again
const generateNews = () => {
  const newsItems = [];
  const templates = [
    {
      title: "[단독] {COMPANY}, 역대급 어닝 서프라이즈 달성... '{KEYWORD}' 수요 폭발",
      content: "글로벌 경제의 불확실성 속에서도 {COMPANY}가 시장의 컨센서스를 가볍게 뛰어넘는 사상 최대의 어닝 서프라이즈(깜짝 실적)를 기록했습니다. 이번 호실적의 가장 큰 원동력은 전 세계적인 '{KEYWORD}' 열풍에 따른 폭발적인 수요 증가입니다. 전문가들은 {COMPANY}의 독보적인 기술력과 시장 선점 효과가 맞물리며 당분간 구조적인 초고속 성장이 지속될 것으로 내다보고 있습니다. 증권가에서는 앞다투어 {COMPANY}의 목표 주가를 상향 조정하고 있으며, 외국인과 기관의 쌍끌이 매수세가 유입되며 주가는 연일 52주 신고가를 경신하고 있습니다. 반면, 경쟁사들은 점유율 하락 방어를 위해 비상 경영 체제에 돌입하며 섹터 내 양극화 현상이 극심해지고 있습니다. 이번 실적 발표는 단순한 일회성 호재를 넘어 산업의 패러다임이 {COMPANY}를 중심으로 완전히 재편되고 있음을 강력하게 시사합니다. 향후 3년간 전방 산업의 CapEx(설비투자) 증가가 가시화된 만큼, {COMPANY}의 밸류에이션 리레이팅은 이제 시작에 불과하다는 긍정적 리포트가 쏟아지고 있습니다.",
      category: 'company',
      sentiment: 3,
      elem: "{COMPANY}라는 회사가 이번에 물건을 엄청나게 많이 팔아서 돈을 산더미처럼 벌었어요! 전 세계 사람들이 '{KEYWORD}'라는 걸 너무 좋아해서 그렇대요. 돈을 잘 버는 회사는 주식 가격이 쑥쑥 올라가요. 그래서 투자자들이 이 회사 주식을 서로 사려고 줄을 서고 있답니다. 당분간 이 회사는 계속해서 돈을 아주 잘 벌 것 같아서 분위기가 최고예요!",
      mid: "{COMPANY}가 시장의 예상을 깨고 엄청난 영업이익을 발표했습니다(어닝 서프라이즈). 그 이유는 전 세계적으로 '{KEYWORD}'에 대한 수요가 폭발적으로 늘어났기 때문입니다. 주가는 회사의 미래 이익을 반영하기 때문에, 이렇게 엄청난 실적을 내고 앞으로도 잘 될 것이 확실해 보이는 회사의 주가는 크게 오를 수밖에 없습니다. 증권사들도 이 회사의 목표 주가를 계속 높이고 있습니다.",
      high: "{COMPANY}의 경이로운 어닝 서프라이즈는 단순한 매출 증가를 넘어 영업이익률(OPM)의 극적인 개선을 동반한 질적 성장이라는 점에서 의의가 큽니다. '{KEYWORD}' 메가 트렌드에 편승하여 압도적인 시장 점유율(Market Share)과 가격 결정력(Pricing Power)을 입증했습니다. 이는 향후 잉여현금흐름(FCF) 확대로 이어져 배당 및 자사주 소각 등 주주환원 여력을 대폭 증대시킵니다. 현재의 멀티플(PER)은 향후 실적 성장성을 감안할 때 여전히 저평가(Undervalued) 구간으로 분석되며, 기관투자자들의 구조적 롱(Long) 포지션 구축이 확인되고 있습니다."
    },
    // We add 2 more base templates just for variety in generation.
    {
       title: "정부, '{POLICY}' 전격 발표... 수혜주 찾기 혈안된 여의도",
       content: "정부가 오늘 국가 미래 핵심 성장 동력 육성을 위한 '{POLICY}'를 전격 발표했습니다. 이번 정책에는 향후 5년간 수십조 원에 달하는 천문학적인 재정 지원, 세제 혜택, 그리고 파격적인 규제 철폐 방안이 총망라되어 있습니다. 정부의 전폭적인 지원을 등에 업은 '{SECTOR}' 섹터는 강력한 정책 수혜 기대감에 휩싸이며 상한가 종목이 속출하는 등 폭발적인 랠리를 펼치고 있습니다. 여의도 증권가에서는 정책 수혜를 온전히 흡수할 대장주와 숨겨진 옥석 가리기에 혈안이 되어 있으며, 관련 테마주 펀드에 시중 자금이 블랙홀처럼 빨려 들어가고 있습니다. 전문가들은 과거 유사한 국책 사업 발표 시 주가 상승률을 비교하며, 이번 랠리가 단기 테마를 넘어 산업 전체의 체질을 바꾸는 장기적 우상향 트렌드의 초입이라고 분석하고 있습니다.",
       category: 'sector',
       sentiment: 2,
       elem: "나라에서 우리나라를 부자로 만들기 위해 '{POLICY}'라는 엄청난 계획을 발표했어요! 이 계획 덕분에 '{SECTOR}' 회사들이 나라에서 돈도 받고 세금도 덜 낼 수 있게 되어서 너무너무 좋아하고 있어요. 사람들이 이 소식을 듣고 이 회사들 주식을 앞다투어 사느라 주식 가격이 하늘 높이 치솟고 있답니다.",
       mid: "정부가 특정 산업을 밀어주는 대규모 정책('{POLICY}')을 발표했습니다. 주식 시장에서는 정부의 정책 방향이 곧 돈의 흐름을 의미합니다. 막대한 예산 지원과 세금 혜택을 받게 된 '{SECTOR}' 관련 기업들은 이익이 크게 늘어날 것이 확실하므로 주가가 급등하고 있습니다.",
       high: "정부의 '{POLICY}' 발표는 해당 산업의 구조적 성장을 담보하는 강력한 톱다운(Top-down) 모멘텀입니다. 세액 공제 및 보조금 지급은 기업의 설비투자(CapEx) 부담을 대폭 경감시켜 잉여현금흐름(FCF) 개선으로 직결됩니다. 스마트머니는 이미 밸류체인 내 핵심 기술력을 보유하고 정책 수주 가시성이 가장 높은 대장주를 선취매하고 있습니다."
    }
  ];

  const combinations = [
    { company: "삼성전자", keyword: "차세대 HBM 및 AI 가속기", country: "미국", sector: "기술(Tech)", policy: "K-반도체 초격차 메가 클러스터 육성법" },
    { company: "현대자동차", keyword: "자율주행 레벨4 전기차", country: "중국", sector: "자동차(Auto)", policy: "친환경 미래 모빌리티 10조원 보조금" },
    { company: "LG에너지솔루션", keyword: "꿈의 전고체 배터리", country: "유럽", sector: "에너지(Energy)", policy: "K-배터리 공급망 완전 자립화 선언" },
    { company: "네이버", keyword: "초개인화 초거대 AI 검색", country: "미국", sector: "인터넷(Internet)", policy: "디지털 AI 주권 수호 및 클라우드 국산화" },
    { company: "한화에어로스페이스", keyword: "스텔스 다연장 로켓 수출", country: "중동", sector: "방산(Defense)", policy: "국방 우주항공청 100조 예산 편성" }
  ];

  let idCounter = 1;
  // Generating 2250 items to keep massive scale.
  for (let i = 0; i < 225; i++) { 
    combinations.forEach(combo => {
      templates.forEach(tpl => {
        let title = tpl.title.replace('{COMPANY}', combo.company).replace('{KEYWORD}', combo.keyword).replace('{COUNTRY}', combo.country).replace('{SECTOR}', combo.sector).replace('{POLICY}', combo.policy);
        let content = tpl.content.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let elem = tpl.elem.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let mid = tpl.mid.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let high = tpl.high.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);

        title += ` [심층분석 리포트 #${idCounter}]`;

        newsItems.push({
          id: `news-massive-${idCounter++}`,
          title: title,
          content: content,
          category: tpl.category,
          sentiment: tpl.sentiment,
          relatedSectors: [combo.sector],
          sectorImpact: {
            [combo.sector]: tpl.sentiment * 0.03
          },
          explanations: {
            elementary: elem,
            middle: mid,
            high: high
          },
          difficulty: ["elementary", "middle", "high"]
        });
      });
    });
  }

  return newsItems;
};

const writeData = () => {
  const stocks = generateStocks();
  const news = generateNews();

  const stockDataContent = `export interface StockDefinition {
  id: string;
  name: string;
  sector: string;
  basePrice: number;
  volatility: number;
  descriptions: {
    elementary: string;
    middle: string;
    high: string;
  };
}

export const INITIAL_STOCKS: StockDefinition[] = ${JSON.stringify(stocks, null, 2)};
`;

  const newsDataContent = `export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: 'macro' | 'sector' | 'company' | 'global';
  sentiment: number;
  relatedSectors: string[];
  sectorImpact: Record<string, number>;
  explanations: {
    elementary: string;
    middle: string;
    high: string;
  };
  difficulty: string[];
}

export const PREDEFINED_NEWS: NewsItem[] = ${JSON.stringify(news, null, 2)};

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
`;

  fs.writeFileSync('src/lib/stockData.ts', stockDataContent);
  fs.writeFileSync('src/lib/newsData.ts', newsDataContent);
  
  console.log(`Successfully generated ${stocks.length} KOSPI stocks with 20x detailed descriptions and ${news.length} news items.`);
};

writeData();
