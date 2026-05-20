import fs from 'fs';

// --- STOCKS GENERATOR ---
const sectors = ['기술(Tech)', '자동차(Auto)', '에너지(Energy)', '금융(Finance)', '인터넷(Internet)', '바이오(Bio)', '방산(Defense)', '건설(Construction)', '식품(Food)', '화학(Chemical)', '엔터테인먼트(Entertainment)', '항공/해운(Transport)', '통신(Telecom)'];

const generateStocks = () => {
  const stocks = [];
  const baseCompanies = [
    { name: "삼성전자", sector: "기술(Tech)", basePrice: 83000, vol: 0.7 },
    { name: "SK하이닉스", sector: "기술(Tech)", basePrice: 210000, vol: 1.3 },
    { name: "한미반도체", sector: "기술(Tech)", basePrice: 140000, vol: 1.6 },
    { name: "LG디스플레이", sector: "기술(Tech)", basePrice: 22000, vol: 1.5 },
    { name: "현대자동차", sector: "자동차(Auto)", basePrice: 280000, vol: 0.9 },
    { name: "기아", sector: "자동차(Auto)", basePrice: 135000, vol: 1.0 },
    { name: "현대모비스", sector: "자동차(Auto)", basePrice: 250000, vol: 0.8 },
    { name: "LG에너지솔루션", sector: "에너지(Energy)", basePrice: 380000, vol: 1.4 },
    { name: "삼성SDI", sector: "에너지(Energy)", basePrice: 420000, vol: 1.2 },
    { name: "에코프로비엠", sector: "화학(Chemical)", basePrice: 230000, vol: 1.8 },
    { name: "포스코퓨처엠", sector: "화학(Chemical)", basePrice: 290000, vol: 1.6 },
    { name: "LG화학", sector: "화학(Chemical)", basePrice: 450000, vol: 1.1 },
    { name: "KB금융", sector: "금융(Finance)", basePrice: 85000, vol: 0.6 },
    { name: "신한지주", sector: "금융(Finance)", basePrice: 45000, vol: 0.7 },
    { name: "하나금융지주", sector: "금융(Finance)", basePrice: 60000, vol: 0.8 },
    { name: "메리츠금융지주", sector: "금융(Finance)", basePrice: 82000, vol: 1.0 },
    { name: "네이버", sector: "인터넷(Internet)", basePrice: 220000, vol: 1.1 },
    { name: "카카오", sector: "인터넷(Internet)", basePrice: 55000, vol: 1.3 },
    { name: "삼성바이오로직스", sector: "바이오(Bio)", basePrice: 880000, vol: 1.0 },
    { name: "셀트리온", sector: "바이오(Bio)", basePrice: 190000, vol: 1.2 },
    { name: "유한양행", sector: "바이오(Bio)", basePrice: 110000, vol: 1.5 },
    { name: "한미약품", sector: "바이오(Bio)", basePrice: 320000, vol: 1.4 },
    { name: "한화에어로스페이스", sector: "방산(Defense)", basePrice: 260000, vol: 1.4 },
    { name: "LIG넥스원", sector: "방산(Defense)", basePrice: 180000, vol: 1.3 },
    { name: "현대로템", sector: "방산(Defense)", basePrice: 42000, vol: 1.5 },
    { name: "현대건설", sector: "건설(Construction)", basePrice: 40000, vol: 1.2 },
    { name: "GS건설", sector: "건설(Construction)", basePrice: 15000, vol: 1.4 },
    { name: "대우건설", sector: "건설(Construction)", basePrice: 4500, vol: 1.6 },
    { name: "삼양식품", sector: "식품(Food)", basePrice: 650000, vol: 1.6 },
    { name: "CJ제일제당", sector: "식품(Food)", basePrice: 320000, vol: 0.8 },
    { name: "농심", sector: "식품(Food)", basePrice: 450000, vol: 0.9 },
    { name: "오리온", sector: "식품(Food)", basePrice: 120000, vol: 1.0 },
    { name: "하이브", sector: "엔터테인먼트(Entertainment)", basePrice: 200000, vol: 1.5 },
    { name: "JYP Ent.", sector: "엔터테인먼트(Entertainment)", basePrice: 70000, vol: 1.4 },
    { name: "에스엠", sector: "엔터테인먼트(Entertainment)", basePrice: 90000, vol: 1.6 },
    { name: "대한항공", sector: "항공/해운(Transport)", basePrice: 24000, vol: 1.1 },
    { name: "HMM", sector: "항공/해운(Transport)", basePrice: 18000, vol: 1.8 },
    { name: "SK텔레콤", sector: "통신(Telecom)", basePrice: 52000, vol: 0.5 },
    { name: "KT", sector: "통신(Telecom)", basePrice: 38000, vol: 0.6 }
  ];

  baseCompanies.forEach((c, idx) => {
    // 10배 상세한 설명 생성
    const elemDesc = `${c.name}은(는) ${c.sector} 분야의 아주 중요한 회사예요. 세상에서 제일 멋지고 신기한 기술과 물건을 만들어서 전 세계 사람들에게 팔고 있답니다! 이 회사가 물건을 많이 팔면 주식 가격이 쭉쭉 올라가고, 사람들이 이 회사의 물건을 좋아하지 않거나 경제가 안 좋아지면 가격이 내려가요. 어린이 여러분도 주변에서 이 회사가 만든 물건을 찾아볼 수 있을 만큼 아주 유명하고 큰 회사랍니다. 투자를 할 때는 이 회사가 앞으로 얼마나 더 멋진 물건을 만들어낼지 상상해보는 것이 가장 중요해요!`;
    const midDesc = `대한민국 ${c.sector} 산업을 이끄는 대표 기업인 ${c.name}입니다. 해당 산업군에서 높은 시장 점유율을 차지하고 있으며, 매출액과 영업이익 규모 면에서 국가 경제에 미치는 파급력이 매우 큽니다. 주가는 글로벌 경제 상황, 금리 변동, 환율, 그리고 경쟁사의 동향 등 수많은 요인에 의해 실시간으로 변동합니다. 특히 이 회사는 최근 새로운 시장 개척과 신제품 개발에 막대한 투자를 단행하고 있어, 미래 성장 잠재력이 높게 평가받고 있습니다. 중학교 수준의 경제 지식을 바탕으로 환율과 금리가 이 기업의 수출입과 부채에 어떤 영향을 미칠지 분석해보는 것이 주가 예측의 핵심입니다.`;
    const highDesc = `글로벌 증시 및 국내 KOSPI 시장의 방향성을 주도하는 ${c.sector} 섹터의 대장주격 기업인 ${c.name}입니다. 현재 주가(Base Price: ${c.basePrice})는 12M Fwd PER 및 PBR 밴드 역사적 평균 수준에서 거래되고 있으며, 변동성(Beta) 지표는 ${c.vol} 수준으로 시장 대비 민감도를 나타냅니다. 기업 펀더멘털 측면에서는 강력한 해자(Economic Moat)를 구축하고 있으며, FCF(잉여현금흐름) 창출 능력과 주주환원(자사주 매입/소각, 배당률) 정책이 주가 하방을 지지하고 있습니다. 거시경제적(Macro) 관점에서 글로벌 유동성 축소/확대 국면, 달러화 강세/약세, 그리고 지정학적 리스크에 따른 원자재 숏티지 등 외부 변수가 DCF(현금흐름할인) 밸류에이션 모델 상 할인율(WACC)에 결정적인 영향을 미칩니다. 철저한 Top-down 및 Bottom-up 분석을 병행하여 목표 주가를 산정해야 합니다.`;

    stocks.push({
      id: `stock-${idx}`,
      name: c.name,
      sector: c.sector,
      basePrice: c.basePrice,
      volatility: c.vol,
      descriptions: {
        elementary: elemDesc,
        middle: midDesc,
        high: highDesc
      }
    });
  });

  return stocks;
};

// --- NEWS GENERATOR ---
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
    {
      title: "글로벌 매크로 쇼크... {COUNTRY}발 경제 위기론에 '{SECTOR}' 초토화",
      content: "오늘 글로벌 금융 시장은 패닉 그 자체였습니다. {COUNTRY}에서 시작된 심각한 경제 지표 둔화와 기업들의 연쇄 도산 우려가 전 세계 증시를 강타했습니다. 특히 수출 의존도가 높고 경기 민감도가 큰 '{SECTOR}' 섹터는 외국인 투자자들의 무차별적인 투매(Panic Selling)가 쏟아지며 하루 만에 시가총액이 수십조 원 증발하는 등 초토화되었습니다. {COUNTRY} 중앙은행의 긴급 유동성 투입 발표에도 불구하고 시장의 공포 심리(VIX 지수 급등)는 진정될 기미를 보이지 않고 있습니다. 경제학자들은 이번 사태가 단순한 단기 조정이 아니라 글로벌 리세션(Recession, 경기 침체)의 신호탄일 수 있다고 경고하며, 최소 6개월 이상의 보수적인 투자 접근을 권고하고 있습니다. 환율은 안전 자산 선호 현상으로 인해 요동치고 있으며, 주식 시장에서 빠져나간 자금은 채권과 금 시장으로 피신하고 있습니다. '{SECTOR}' 관련 기업들은 수출 물량 급감과 재고 손실이라는 이중고를 겪을 것이 확실시되며, 신용 등급 강등 리스크까지 부각되고 있는 암울한 상황입니다.",
      category: 'macro',
      sentiment: -3,
      elem: "{COUNTRY}라는 나라에 경제적으로 큰 문제가 생겼대요! 그래서 전 세계 주식 시장이 덜덜 떨고 있어요. 특히 우리나라의 '{SECTOR}' 관련 회사들이 외국에 물건을 팔기 힘들어져서 주식 가격이 뚝뚝 떨어지고 있어요. 사람들이 무서워서 주식을 다 팔고 도망가고 있어서 당분간은 주식 투자를 조심해야 하는 아주 무서운 상황이에요.",
      mid: "{COUNTRY}의 경제 위기 소식 때문에 글로벌 금융 시장이 엄청난 충격을 받았습니다. 경기가 나빠지면 사람들이 물건을 안 사기 때문에, 수출을 많이 해야 하는 우리나라의 '{SECTOR}' 기업들이 가장 큰 타격을 받습니다. 외국인 투자자들이 이 소식을 듣고 주식을 대량으로 팔아치우면서 주가가 폭락하고 있습니다. 경제 침체(리세션)가 올 수 있으니 위험을 피해야 할 때입니다.",
      high: "{COUNTRY}발 매크로(거시경제) 쇼크로 인해 글로벌 증시에 시스템 리스크 우려가 확산되고 있습니다. 안전자산 선호 심리가 극대화되며 주식과 같은 위험 자산에서 대규모 자금 유출(Capital Flight)이 발생 중입니다. 특히 경기 민감도가 가장 높은 '{SECTOR}' 섹터는 전방 수요 파괴와 재고자산 평가손실 우려가 겹치며 멀티플이 급격히 축소(De-rating)되고 있습니다. 신용 스프레드가 확대되고 기업들의 자금 조달 비용이 치솟는 상황에서 펀더멘털 방어가 취약한 한계 기업들의 연쇄 부도 리스크까지 선반영되고 있는 최악의 국면입니다."
    },
    {
       title: "정부, '{POLICY}' 전격 발표... 수혜주 찾기 혈안된 여의도",
       content: "정부가 오늘 국가 미래 핵심 성장 동력 육성을 위한 '{POLICY}'를 전격 발표했습니다. 이번 정책에는 향후 5년간 수십조 원에 달하는 천문학적인 재정 지원, 세제 혜택, 그리고 파격적인 규제 철폐 방안이 총망라되어 있습니다. 정부의 전폭적인 지원을 등에 업은 '{SECTOR}' 섹터는 강력한 정책 수혜 기대감에 휩싸이며 상한가 종목이 속출하는 등 폭발적인 랠리를 펼치고 있습니다. 여의도 증권가에서는 정책 수혜를 온전히 흡수할 대장주와 숨겨진 옥석 가리기에 혈안이 되어 있으며, 관련 테마주 펀드에 시중 자금이 블랙홀처럼 빨려 들어가고 있습니다. 전문가들은 과거 유사한 국책 사업 발표 시 주가 상승률을 비교하며, 이번 랠리가 단기 테마를 넘어 산업 전체의 체질을 바꾸는 장기적 우상향 트렌드의 초입이라고 분석하고 있습니다. 다만, 실질적인 수혜 여부가 검증되지 않은 껍데기 테마주들의 묻지마 폭등에 대해서는 강력한 주의를 당부하고 있습니다. 확실한 수주 능력과 기술력을 갖춘 기업만이 끝까지 살아남아 과실을 독식할 것입니다.",
       category: 'sector',
       sentiment: 2,
       elem: "나라에서 우리나라를 부자로 만들기 위해 '{POLICY}'라는 엄청난 계획을 발표했어요! 이 계획 덕분에 '{SECTOR}' 회사들이 나라에서 돈도 받고 세금도 덜 낼 수 있게 되어서 너무너무 좋아하고 있어요. 사람들이 이 소식을 듣고 이 회사들 주식을 앞다투어 사느라 주식 가격이 하늘 높이 치솟고 있답니다. 나라가 도와주는 회사는 망하지 않고 쑥쑥 클 거라고 믿기 때문이에요.",
       mid: "정부가 특정 산업을 밀어주는 대규모 정책('{POLICY}')을 발표했습니다. 주식 시장에서는 정부의 정책 방향이 곧 돈의 흐름을 의미합니다. 막대한 예산 지원과 세금 혜택을 받게 된 '{SECTOR}' 관련 기업들은 이익이 크게 늘어날 것이 확실하므로 주가가 급등하고 있습니다. 하지만 진짜 혜택을 볼 회사와 이름만 걸쳐놓은 가짜 회사를 잘 구분해서 투자해야 합니다.",
       high: "정부의 '{POLICY}' 발표는 해당 산업의 구조적 성장을 담보하는 강력한 톱다운(Top-down) 모멘텀입니다. 세액 공제 및 보조금 지급은 기업의 설비투자(CapEx) 부담을 대폭 경감시켜 잉여현금흐름(FCF) 개선으로 직결됩니다. 또한, 규제 완화는 진입 장벽을 낮추고 신시장 창출을 가속화합니다. 자본 시장의 스마트머니는 이미 밸류체인 내 핵심 기술력을 보유하고 정책 수주 가시성이 가장 높은 대장주를 선취매하고 있으며, '{SECTOR}' 섹터 전반의 밸류에이션 리레이팅이 중장기적으로 지속될 전망입니다."
    }
  ];

  const combinations = [
    { company: "삼성전자", keyword: "차세대 HBM 및 AI 가속기", country: "미국", sector: "기술(Tech)", policy: "K-반도체 초격차 메가 클러스터 육성법" },
    { company: "현대자동차", keyword: "자율주행 레벨4 전기차", country: "중국", sector: "자동차(Auto)", policy: "친환경 미래 모빌리티 10조원 보조금" },
    { company: "LG에너지솔루션", keyword: "꿈의 전고체 배터리", country: "유럽", sector: "에너지(Energy)", policy: "K-배터리 공급망 완전 자립화 선언" },
    { company: "네이버", keyword: "초개인화 초거대 AI 검색", country: "미국", sector: "인터넷(Internet)", policy: "디지털 AI 주권 수호 및 클라우드 국산화" },
    { company: "한화에어로스페이스", keyword: "스텔스 다연장 로켓 수출", country: "중동", sector: "방산(Defense)", policy: "국방 우주항공청 100조 예산 편성" },
    { company: "삼성바이오로직스", keyword: "블록버스터 비만/항암 신약 CMO", country: "유럽", sector: "바이오(Bio)", policy: "K-바이오 국가 첨단 전략산업 지정" },
    { company: "삼양식품", keyword: "초매운맛 글로벌 K-푸드 챌린지", country: "동남아", sector: "식품(Food)", policy: "K-푸드 세계화 수출 금융 무제한 지원" },
    { company: "현대건설", keyword: "사우디 네옴시티 후속 메가 프로젝트", country: "중동", sector: "건설(Construction)", policy: "해외 플랜트 수주를 위한 대통령 세일즈 외교" },
    { company: "SK하이닉스", keyword: "초저전력 AI 엣지 디바이스 메모리", country: "미국", sector: "기술(Tech)", policy: "차세대 지능형 반도체 R&D 세액공제 50%" },
    { company: "KB금융", keyword: "글로벌 핀테크 및 AI 자산관리", country: "신흥국", sector: "금융(Finance)", policy: "기업 밸류업 프로그램 및 배당소득세 영구 인하" },
    { company: "대한항공", keyword: "여객/화물 역대급 슈퍼 호황", country: "중국", sector: "항공/해운(Transport)", policy: "글로벌 허브 공항 육성 및 항공 규제 전면 철폐" },
    { company: "에코프로비엠", keyword: "초고용량 하이니켈 양극재", country: "유럽", sector: "화학(Chemical)", policy: "전기차 캐즘 극복을 위한 충전 인프라 대공사" },
    { company: "카카오", keyword: "글로벌 K-웹툰 및 엔터테인먼트", country: "미국", sector: "엔터테인먼트(Entertainment)", policy: "K-콘텐츠 글로벌 지적재산권(IP) 수호 법안" },
    { company: "에스엠", keyword: "초거대 글로벌 아이돌 투어", country: "일본", sector: "엔터테인먼트(Entertainment)", policy: "대중문화 예술인 병역 특례 및 수출 지원" },
    { company: "HMM", keyword: "글로벌 물류 병목 운임지수 폭등", country: "유럽", sector: "항공/해운(Transport)", policy: "국적 선대 100척 확보 해양 강국 부활" }
  ];

  let idCounter = 1;

  // Generate massive combinations by cross-mixing slightly
  for (let i = 0; i < 50; i++) { // 50 * 15 * 3 = 2250 items. Too large. Let's do 10 * 15 * 3 = 450 items
    combinations.forEach(combo => {
      templates.forEach(tpl => {
        let title = tpl.title.replace('{COMPANY}', combo.company).replace('{KEYWORD}', combo.keyword).replace('{COUNTRY}', combo.country).replace('{SECTOR}', combo.sector).replace('{POLICY}', combo.policy);
        let content = tpl.content.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let elem = tpl.elem.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let mid = tpl.mid.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);
        let high = tpl.high.replace(/{COMPANY}/g, combo.company).replace(/{KEYWORD}/g, combo.keyword).replace(/{COUNTRY}/g, combo.country).replace(/{SECTOR}/g, combo.sector).replace(/{POLICY}/g, combo.policy);

        // Add some random noise to make them unique
        const noise = ` [속보 ${i + 1}]`;
        title += noise;

        newsItems.push({
          id: `news-gen-${idCounter++}`,
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
  sentiment: number; // -3 to 3
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
  
  console.log(`Successfully generated ${stocks.length} stocks and ${news.length} news items.`);
};

writeData();
