/**
 * 스탁스쿨(StockSchool) 데이터 정합성 · 상표/실기업명 누출 · 조사/오버라이드 · 주가 시뮬레이션 엔진 자동 검증 스크립트
 * 실행: node scripts/verifySimulation.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_SECTORS } from '../src/lib/types.ts';
import { INITIAL_STOCKS, STOCK_BY_ID } from '../src/lib/stockData.ts';
import {
  COMPANY_NEWS_TEMPLATES,
  PREDEFINED_NEWS,
  SCENARIO_ARCS,
} from '../src/lib/newsData.ts';
import { GLOSSARY_BY_ID, GLOSSARY_TERMS } from '../src/lib/glossaryData.ts';
import {
  createInitialStocks,
  evaluateSectorGuesses,
  getActualNewsDirection,
  getScaledImpact,
  getTickSize,
  roundToTickSize,
  selectDailyNews,
  simulateNextDay,
} from '../src/lib/priceEngine.ts';

console.log('🔍 1. 종목 데이터 정합성 검증...');
assert.equal(INITIAL_STOCKS.length, 34, '총 종목 수는 34개여야 합니다.');
const sectorCounts = Object.fromEntries(ALL_SECTORS.map((s) => [s, 0]));
for (const stock of INITIAL_STOCKS) {
  assert.ok(ALL_SECTORS.includes(stock.sector), `유효하지 않은 섹터: ${stock.sector}`);
  assert.ok(stock.basePrice >= 1000, `기준가 오류: ${stock.id}`);
  assert.ok(stock.volatility > 0 && stock.volatility <= 2.5, `변동성 범위 오류: ${stock.id}`);
  assert.ok(['export', 'domestic', 'mixed'].includes(stock.exposure), `exposure 오류: ${stock.id}`);
  assert.ok(stock.descriptions.elementary.length > 20, `초급 설명 부족: ${stock.id}`);
  assert.ok(stock.descriptions.middle.length > 20, `중급 설명 부족: ${stock.id}`);
  assert.ok(stock.descriptions.high.length > 20, `고급 설명 부족: ${stock.id}`);
  sectorCounts[stock.sector]++;
}
for (const [sec, cnt] of Object.entries(sectorCounts)) {
  assert.ok(cnt >= 2, `단일 종목 섹터 금지! ${sec} 섹터 종목 수: ${cnt}`);
}
console.log('   ✅ 17개 섹터 × 2종목 = 34개 가상 종목 통과');

console.log('🔍 2. 뉴스·시나리오 정합성, 메타데이터 완비 및 전 34종목 균형 검증...');
assert.equal(COMPANY_NEWS_TEMPLATES.length, 136, '개별기업 뉴스 템플릿은 136건이어야 합니다.');
assert.equal(SCENARIO_ARCS.length, 30, '멀티데이 시나리오는 30종이어야 합니다.');
assert.equal(PREDEFINED_NEWS.length, 780, '총 일반 뉴스 수는 780건(레벨당 260건)이어야 합니다.');

const totalScenarioEpisodes = SCENARIO_ARCS.reduce((sum, arc) => sum + arc.episodes.length, 0);
assert.equal(totalScenarioEpisodes, 106, '총 시나리오 에피소드는 106화(×3레벨=318편)여야 합니다.');

const newsIdSet = new Set();
const validCategories = new Set(['macro', 'sector', 'company', 'global', 'social']);
const validTwists = new Set(['direct', 'mixed', 'contrarian', 'rumor', 'earnings', 'competition']);
const validFormats = new Set(['breaking', 'earnings', 'interview', 'rival', 'policy', 'trend']);

for (const news of PREDEFINED_NEWS) {
  assert.ok(!newsIdSet.has(news.id), `중복 뉴스 ID: ${news.id}`);
  newsIdSet.add(news.id);
  assert.ok(validCategories.has(news.category), `유효하지 않은 카테고리: ${news.id} -> ${news.category}`);
  assert.ok(news.twistType && validTwists.has(news.twistType), `twistType 누락/오류: ${news.id}`);
  assert.ok(news.articleFormat && validFormats.has(news.articleFormat), `articleFormat 누락/오류: ${news.id}`);
  assert.ok(
    news.readingHint?.elementary && news.readingHint?.middle && news.readingHint?.high,
    `readingHint 누락: ${news.id}`
  );
  assert.ok(news.relatedSectors.length > 0, `relatedSectors 비어있음: ${news.id}`);

  const impactKeys = Object.keys(news.sectorImpact);
  assert.ok(impactKeys.length > 0, `sectorImpact 비어있음: ${news.id}`);
  for (const key of impactKeys) {
    assert.ok(ALL_SECTORS.includes(key), `유효하지 않은 sectorImpact 키: ${news.id} -> ${key}`);
    assert.ok(news.relatedSectors.includes(key), `relatedSectors 누락: ${news.id} -> ${key}`);
  }
  for (const key of news.relatedSectors) {
    assert.ok(key in news.sectorImpact, `sectorImpact 누락: ${news.id} -> ${key}`);
  }
  if (news.stockImpactOverrides) {
    for (const stockId of Object.keys(news.stockImpactOverrides)) {
      assert.ok(stockId in STOCK_BY_ID, `존재하지 않는 override stockId: ${news.id} -> ${stockId}`);
    }
  }
  if (news.relatedGlossaryIds) {
    for (const gid of news.relatedGlossaryIds) {
      assert.ok(gid in GLOSSARY_BY_ID, `유효하지 않은 glossary ID: ${news.id} -> ${gid}`);
    }
  }

  // Sentiment vs actual direction alignment
  const actualDir = getActualNewsDirection(news);
  const sentDir = news.sentiment > 0 ? 'bullish' : news.sentiment < 0 ? 'bearish' : 'mixed';
  assert.equal(actualDir, sentDir, `sentiment(${news.sentiment}) vs actualDirection(${actualDir}) 불일치: ${news.id}`);
}

for (const level of ['elementary', 'middle', 'high']) {
  const pool = PREDEFINED_NEWS.filter((n) => n.difficulty.includes(level));
  assert.equal(pool.length, 260, `${level} 뉴스 수는 260건(기본 34 + 추가 60 + 다양화 30 + 개별기업 136)이어야 합니다.`);
  const cov = Object.fromEntries(ALL_SECTORS.map((s) => [s, { pos: 0, neg: 0 }]));
  for (const n of pool) {
    for (const [sec, val] of Object.entries(n.sectorImpact)) {
      if (val > 0) cov[sec].pos++;
      if (val < 0) cov[sec].neg++;
    }
  }
  for (const [sec, c] of Object.entries(cov)) {
    assert.ok(c.pos >= 4, `${level} 난이도 ${sec} 호재 뉴스 부족! (${c.pos})`);
    assert.ok(c.neg >= 4, `${level} 난이도 ${sec} 악재 뉴스 부족! (${c.neg})`);
  }
}

// 전 34종목 개별기업 뉴스(>=3, 호재/악재 모두 존재) + 시나리오 등장(>=1) + 유령/역전 오버라이드 0건 검증
const stockCompanyStats = Object.fromEntries(
  INITIAL_STOCKS.map((s) => [s.id, { total: 0, pos: 0, neg: 0, scen: 0 }])
);
for (const tpl of COMPANY_NEWS_TEMPLATES) {
  const mainId = tpl.relatedStocks[0];
  assert.ok(mainId in STOCK_BY_ID, `존재하지 않는 주 종목: ${tpl.id} -> ${mainId}`);
  stockCompanyStats[mainId].total++;
  const d = getActualNewsDirection({
    sectorImpact: tpl.sectorImpact,
    stockImpactOverrides: tpl.stockImpactOverrides,
    sentiment: tpl.sentiment,
  });
  if (d === 'bullish') stockCompanyStats[mainId].pos++;
  else if (d === 'bearish') stockCompanyStats[mainId].neg++;

  // Ghost override check
  for (const [sid, val] of Object.entries(tpl.stockImpactOverrides ?? {})) {
    if (val === 0) continue;
    const st = STOCK_BY_ID[sid];
    assert.ok(
      tpl.contents.middle.includes(st.name) || tpl.headlines.middle.includes(st.name),
      `유령 오버라이드 발견 (개별기업 ${tpl.id}): ${st.name}이 본문/제목에 없음`
    );
  }
}

for (const arc of SCENARIO_ARCS) {
  assert.equal(arc.episodes.length, arc.totalDays, `시나리오 일수 불일치: ${arc.id}`);
  for (const ep of arc.episodes) {
    assert.ok(ep.articleFormat && validFormats.has(ep.articleFormat), `시나리오 articleFormat 누락: ${arc.id}#${ep.step}`);
    for (const sid of ep.relatedStocks ?? []) {
      if (stockCompanyStats[sid]) stockCompanyStats[sid].scen++;
    }
    // Ghost override check
    for (const [sid, val] of Object.entries(ep.stockImpactOverrides ?? {})) {
      if (val === 0) continue;
      const st = STOCK_BY_ID[sid];
      assert.ok(
        ep.contents.middle.includes(st.name) || ep.headlines.middle.includes(st.name),
        `유령 오버라이드 발견 (시나리오 ${arc.id}#${ep.step}): ${st.name}이 본문/제목에 없음`
      );
    }
    // Override inversion check
    const bySec = {};
    for (const [sid, ov] of Object.entries(ep.stockImpactOverrides ?? {})) {
      const st = STOCK_BY_ID[sid];
      if (!bySec[st.sector]) bySec[st.sector] = [];
      bySec[st.sector].push(ov);
    }
    for (const [sec, vals] of Object.entries(bySec)) {
      const si = ep.sectorImpact[sec];
      if (typeof si === 'number' && si !== 0) {
        const allWeakerSameSign = vals.every(
          (v) => v !== 0 && Math.sign(v) === Math.sign(si) && Math.abs(v) < Math.abs(si)
        );
        assert.ok(
          !allWeakerSameSign,
          `시나리오 오버라이드 역전 버그 (${arc.id}#${ep.step}, ${sec}): sector=${si}, overrides=${JSON.stringify(vals)}`
        );
      }
    }
    // Sentiment alignment check
    const actualDir = getActualNewsDirection({
      sectorImpact: ep.sectorImpact,
      stockImpactOverrides: ep.stockImpactOverrides,
      sentiment: ep.sentiment,
    });
    const sentDir = ep.sentiment > 0 ? 'bullish' : ep.sentiment < 0 ? 'bearish' : 'mixed';
    assert.equal(actualDir, sentDir, `시나리오 sentiment 불일치 (${arc.id}#${ep.step}): ${sentDir} vs ${actualDir}`);
  }
}

for (const s of INITIAL_STOCKS) {
  const st = stockCompanyStats[s.id];
  assert.ok(st.total >= 3, `${s.name}(${s.id}) 개별기업 뉴스 부족: ${st.total}건`);
  assert.ok(st.pos >= 1, `${s.name}(${s.id}) 개별기업 호재 부족: ${st.pos}건`);
  assert.ok(st.neg >= 1, `${s.name}(${s.id}) 개별기업 악재 부족: ${st.neg}건`);
  assert.ok(st.scen >= 1, `${s.name}(${s.id}) 시나리오 등장 0회 금지!`);
}
console.log('   ✅ 780건 일반 뉴스 + 30종 시나리오 318편 = 총 1,098편 · 전 34종목 균형 · 유령/역전 오버라이드 0건 통과');

console.log('🔍 3. 실제 기업명·등록 상표·파손어·중복명·조사 오류 전수 검사...');
const forbiddenPattern =
  /삼성전자|삼성바이오|삼성그룹|SK하이닉스|현대차|기아|현대모비스|모비스|현대건설|HD현대중공업|LG에너지솔루션|LG에너지|LG화학|삼성바이오로직스|셀트리온|한화에어로스페이스|한화에어로|삼양식품|CJ제일제당|아모레퍼시픽|아모레|이니스프리|삼성물산|삼성생명|삼성SDI|POSCO홀딩스|포스코퓨처엠|강철산업퓨처엠|KB금융|KB증권|KB손해보험|KB라이프|\bKB\b|신한지주|신한베트남은행|신한(?!다는)|SK이노베이션|SK텔레콤|S-Oil|\bHMM\b|네이버|카카오톡|카카오뱅크|엔비디아|NVIDIA|TSMC|테슬라|아람코|우시바이오|불닭볶음면|햇반|비비고|설화수|라네즈|에버랜드|구도일|힐스테이트|갤럭시|아이오닉|쏘나타|아반떼|그랜저|제네시스|쏘렌토|카니발|스포티지|싼타페|투싼|EV9|\bBMW\b|아우디|\bGM\b|세포라|유튜브|틱톡|아마존|코스트코|월마트|올리브영|카지노|톱픽|사법리스크|라인야후/i;

const dataFilesToScan = [
  'src/lib/stockData.ts',
  'src/lib/news/elementaryNews.ts',
  'src/lib/news/middleNews.ts',
  'src/lib/news/highNews.ts',
  'src/lib/news/elementaryExtra.ts',
  'src/lib/news/middleExtra.ts',
  'src/lib/news/highExtra.ts',
  'src/lib/news/diverseThemesNews.ts',
  'src/lib/news/companyNewsTechAuto.ts',
  'src/lib/news/companyNewsEnergyBio.ts',
  'src/lib/news/companyNewsIndFin.ts',
  'src/lib/news/companyNewsBalanced.ts',
  'src/lib/scenarios/macroGeoScenarios.ts',
  'src/lib/scenarios/techMobScenarios.ts',
  'src/lib/scenarios/corpBioTrendScenarios.ts',
  'src/lib/scenarios/diverseNewScenarios.ts',
  'src/lib/glossaryData.ts',
  'src/components/trading/NewsPanel.tsx',
  'src/components/trading/ScenarioModal.tsx',
  'src/components/trading/CompanyInfoPanel.tsx',
  'src/components/trading/TutorialGuide.tsx',
];

function hasBatchim(word) {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return false;
  return (ch - 0xac00) % 28 !== 0;
}

const stockNames = INITIAL_STOCKS.map((s) => ({ name: s.name, batchim: hasBatchim(s.name) }));

for (const file of dataFilesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(forbiddenPattern);
  assert.equal(match, null, `금지된 실기업명/상표/문구 발견 (${file}): ${match?.[0]}`);

  if (file.startsWith('src/lib/news/') || file.startsWith('src/lib/scenarios/')) {
    for (const s of stockNames) {
      const dupRe = new RegExp(`${s.name}(?:과|와|이나|나|,\\s*|·|\\s+및\\s+|\\s+또는\\s+)${s.name}`);
      const dm = content.match(dupRe);
      assert.equal(dm, null, `중복 종목명 발견 (${file}): ${dm?.[0]}`);

      const wrongRe = s.batchim
        ? new RegExp(`${s.name}(는|가|를|와)(?=[\\s.,!?"'”’)\\]]|$)`)
        : new RegExp(`${s.name}(은|을|과|이나|이)(?=[\\s.,!?"'”’)\\]]|$)`);
      const pm = content.match(wrongRe);
      assert.equal(pm, null, `한국어 조사 오류 발견 (${file}): ${pm?.[0]}`);
    }
  }
}

const loginContent = fs.readFileSync('src/pages/Login.tsx', 'utf8').replace(/카카오톡/g, '');
const loginMatch = loginContent.match(forbiddenPattern);
assert.equal(loginMatch, null, `Login.tsx에 금지된 실기업명/상표/문구 발견: ${loginMatch?.[0]}`);
assert.ok(GLOSSARY_TERMS.length >= 32, `용어사전 항목 수 확인 (기대>=32, 실제=${GLOSSARY_TERMS.length})`);
console.log('   ✅ 실기업명·상표·파손어 0건 · 중복명 0건 · 조사 오류 0건 · 용어사전 32개 통과');

console.log('🔍 4. 호가 단위 · 환율 차별화 · marketBias · 산업 추론 채점 단위 테스트...');
assert.equal(getTickSize(3500), 5);
assert.equal(getTickSize(18000), 10);
assert.equal(getTickSize(42000), 50);
assert.equal(getTickSize(82000), 100);
assert.equal(getTickSize(310000), 500);
assert.equal(getTickSize(640000), 1000);
assert.equal(roundToTickSize(82147), 82100);
assert.equal(roundToTickSize(310320), 310500);

// 고환율 뉴스 시 불꽃푸드(+) vs 온가족식품(-) 분리 확인
const fxNews = PREDEFINED_NEWS.find((n) => n.id === 'news-hi-fx-mixed');
assert.ok(fxNews, 'news-hi-fx-mixed 존재 확인');
const testStocks = createInitialStocks(INITIAL_STOCKS);
const fxResult = simulateNextDay(testStocks, [fxNews], 'high', {});
assert.ok(
  fxResult.breakdownByStock['flame-food'].newsContribution > 0,
  '고환율 시 수출형 불꽃푸드는 양(+)의 뉴스 기여도를 받아야 함'
);
assert.ok(
  fxResult.breakdownByStock['family-food'].newsContribution < 0,
  '고환율 시 내수 수입형 온가족식품은 음(-)의 뉴스 기여도를 받아야 함'
);

// evaluateSectorGuesses 단위 테스트
assert.equal(evaluateSectorGuesses(fxNews, ['자동차(Auto)']).hit, true);
assert.equal(evaluateSectorGuesses(fxNews, ['자동차(Auto)', '바이오(Bio)']).hit, true);
assert.equal(evaluateSectorGuesses(fxNews, ['바이오(Bio)', '통신(Telecom)']).hit, false);
assert.equal(evaluateSectorGuesses(fxNews, []).checked, false);

// marketBias 반영 단위 테스트 (비관련 종목 평균이 marketBias 방향으로 이동하는지 확인)
const biasArcNews = {
  ...fxNews,
  relatedSectors: ['기술(Tech)'],
  sectorImpact: { '기술(Tech)': 0 },
  stockImpactOverrides: undefined,
  marketBias: -0.015,
};
let biasSum = 0;
for (let i = 0; i < 40; i++) {
  const r = simulateNextDay(testStocks, [biasArcNews], 'elementary', {});
  biasSum += r.breakdownByStock['dundeun-life'].marketAndNoise;
}
assert.ok(biasSum / 40 < -0.008, `news.marketBias(-0.015) 반영 확인: avg=${(biasSum / 40).toFixed(4)}`);
console.log('   ✅ KRX 호가 단위 · 수출/내수 환율 차별화 · marketBias · 산업 추론 채점 통과');

console.log('🔍 5. 몬테카를로 시뮬레이션 검증 (난이도별 300회 × 30일)...');
for (const level of ['elementary', 'middle', 'high']) {
  let posTotal = 0,
    posUp = 0,
    negTotal = 0,
    negDown = 0;
  let sumErr = 0,
    errCount = 0;
  let conflictDays = 0;

  for (let t = 0; t < 300; t++) {
    let stocks = createInitialStocks(INITIAL_STOCKS);
    let carryover = {};
    let picked = selectDailyNews(PREDEFINED_NEWS, level, [], [], 3);
    let currentNews = picked.selected;
    let usedIds = picked.nextUsedNewsIds;

    for (let day = 1; day <= 30; day++) {
      const sectorSigns = {};
      for (const n of currentNews) {
        for (const [sec, val] of Object.entries(n.sectorImpact)) {
          if (!sectorSigns[sec]) sectorSigns[sec] = new Set();
          sectorSigns[sec].add(val > 0 ? '+' : '-');
        }
      }
      if (Object.values(sectorSigns).some((s) => s.size > 1)) {
        conflictDays++;
      }

      const { newStocks, breakdownByStock, nextCarryoverImpacts } = simulateNextDay(
        stocks,
        currentNews,
        level,
        carryover
      );
      stocks = newStocks;
      carryover = nextCarryoverImpacts;

      for (const [id, bd] of Object.entries(breakdownByStock)) {
        if (bd.newsContribution > 0.001) {
          posTotal++;
          if (bd.actualChangePct > 0) posUp++;
          sumErr += Math.abs(bd.newsContribution - bd.actualChangePct);
          errCount++;
        } else if (bd.newsContribution < -0.001) {
          negTotal++;
          if (bd.actualChangePct < 0) negDown++;
          sumErr += Math.abs(bd.newsContribution - bd.actualChangePct);
          errCount++;
        }
        assert.equal(
          stocks[id].volumeHistory.length,
          stocks[id].priceHistory.length,
          '거래량 이력과 주가 이력 길이 일치'
        );
      }

      const nextPick = selectDailyNews(PREDEFINED_NEWS, level, usedIds, currentNews, 3);
      currentNews = nextPick.selected;
      usedIds = nextPick.nextUsedNewsIds;
    }
  }

  const posRate = (posUp / posTotal) * 100;
  const negRate = (negDown / negTotal) * 100;
  const avgErr = (sumErr / errCount) * 100;
  console.log(
    `   📊 [${level.padEnd(10)}] 호재→상승 ${posRate.toFixed(1)}% | 악재→하락 ${negRate.toFixed(1)}% | 표시vs실제 오차 ${avgErr.toFixed(2)}%p | 상충일 ${conflictDays}건`
  );

  if (level === 'elementary') {
    assert.ok(posRate >= 93, `초급 호재 상승률이 93% 이상이어야 합니다: ${posRate.toFixed(1)}%`);
    assert.ok(negRate >= 93, `초급 악재 하락률이 93% 이상이어야 합니다: ${negRate.toFixed(1)}%`);
    assert.equal(conflictDays, 0, '초급에서는 동일 섹터 상반 뉴스 충돌이 0건이어야 합니다.');
  }
  if (level === 'middle') {
    assert.ok(posRate >= 85, `중급 호재 상승률이 85% 이상이어야 합니다: ${posRate.toFixed(1)}%`);
    assert.equal(conflictDays, 0, '중급에서는 동일 섹터 상반 뉴스 충돌이 0건이어야 합니다.');
  }
  assert.ok(avgErr < 1.8, `표시 영향도와 실제 변동 오차가 1.8%p 미만이어야 합니다: ${avgErr.toFixed(2)}%p`);
}

// 스케일링 표시 검증
assert.equal(Number((getScaledImpact(0.08, 'elementary') * 100).toFixed(1)), 5.2);
assert.equal(Number((getScaledImpact(0.08, 'middle') * 100).toFixed(1)), 4.2);
assert.equal(Number((getScaledImpact(0.08, 'high') * 100).toFixed(1)), 3.6);

console.log('\n🎉 모든 법적·문해력·데이터·시뮬레이션 엔진 검증을 100% 통과했습니다!');
