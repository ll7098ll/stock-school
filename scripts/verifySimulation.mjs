/**
 * 스탁스쿨(StockSchool) 데이터 정합성 · 상표/실기업명 누출 · 주가 시뮬레이션 엔진 자동 검증 스크립트
 * 실행: node scripts/verifySimulation.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_SECTORS } from '../src/lib/types.ts';
import { INITIAL_STOCKS, STOCK_BY_ID } from '../src/lib/stockData.ts';
import { PREDEFINED_NEWS } from '../src/lib/newsData.ts';
import { GLOSSARY_TERMS } from '../src/lib/glossaryData.ts';
import {
  createInitialStocks,
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

console.log('🔍 2. 뉴스 데이터 정합성 및 전 난이도 섹터 균형 검증...');
assert.equal(PREDEFINED_NEWS.length, 588, '총 뉴스 수는 588건(레벨당 196건)이어야 합니다.');
const newsIdSet = new Set();
const validCategories = new Set(['macro', 'sector', 'company', 'global', 'social']);

for (const news of PREDEFINED_NEWS) {
  assert.ok(!newsIdSet.has(news.id), `중복 뉴스 ID: ${news.id}`);
  newsIdSet.add(news.id);
  assert.ok(validCategories.has(news.category), `유효하지 않은 카테고리: ${news.id} -> ${news.category}`);
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
}

for (const level of ['elementary', 'middle', 'high']) {
  const pool = PREDEFINED_NEWS.filter((n) => n.difficulty.includes(level));
  assert.equal(pool.length, 196, `${level} 뉴스 수는 196건(단독 94 + 개별기업 102)이어야 합니다.`);
  const cov = Object.fromEntries(ALL_SECTORS.map((s) => [s, { pos: 0, neg: 0 }]));
  for (const n of pool) {
    for (const [sec, val] of Object.entries(n.sectorImpact)) {
      if (val > 0) cov[sec].pos++;
      if (val < 0) cov[sec].neg++;
    }
  }
  for (const [sec, c] of Object.entries(cov)) {
    assert.ok(c.pos >= 2, `${level} 난이도 ${sec} 호재 뉴스 부족!`);
    assert.ok(c.neg >= 2, `${level} 난이도 ${sec} 악재 뉴스 부족!`);
  }
}
console.log('   ✅ 588건 뉴스(+24종 시나리오 255편 = 총 843편) 전 난이도·전 17개 섹터 호재/악재 균형 통과');

console.log('🔍 3. 실제 기업명·등록 상표·부적절 문구 누출 검사...');
const forbiddenPattern =
  /삼성전자|SK하이닉스|현대차|현대모비스|현대건설|HD현대중공업|LG에너지솔루션|LG화학|삼성바이오로직스|셀트리온|한화에어로스페이스|삼양식품|CJ제일제당|아모레퍼시픽|삼성물산|삼성생명|삼성SDI|POSCO홀딩스|포스코퓨처엠|KB금융|신한지주|SK이노베이션|SK텔레콤|S-Oil|\bHMM\b|네이버|카카오톡|카카오뱅크|엔비디아|NVIDIA|TSMC|테슬라|아람코|우시바이오|불닭볶음면|햇반|비비고|설화수|라네즈|에버랜드|구도일|힐스테이트|갤럭시|아이오닉|쏘나타|아반떼|그랜저|제네시스|쏘렌토|카니발|스포티지|유튜브|틱톡|아마존|코스트코|월마트|올리브영|카지노|톱픽|사법리스크|라인야후/i;

const dataFilesToScan = [
  'src/lib/stockData.ts',
  'src/lib/news/elementaryNews.ts',
  'src/lib/news/middleNews.ts',
  'src/lib/news/highNews.ts',
  'src/lib/news/elementaryExtra.ts',
  'src/lib/news/middleExtra.ts',
  'src/lib/news/highExtra.ts',
  'src/lib/news/companyNewsTechAuto.ts',
  'src/lib/news/companyNewsEnergyBio.ts',
  'src/lib/news/companyNewsIndFin.ts',
  'src/lib/scenarios/macroGeoScenarios.ts',
  'src/lib/scenarios/techMobScenarios.ts',
  'src/lib/scenarios/corpBioTrendScenarios.ts',
  'src/lib/glossaryData.ts',
  'src/components/trading/NewsPanel.tsx',
  'src/components/trading/ScenarioModal.tsx',
  'src/components/trading/CompanyInfoPanel.tsx',
  'src/components/trading/TutorialGuide.tsx',
];

for (const file of dataFilesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(forbiddenPattern);
  assert.equal(match, null, `금지된 실기업명/상표/문구 발견 (${file}): ${match?.[0]}`);
}

const loginContent = fs.readFileSync('src/pages/Login.tsx', 'utf8').replace(/카카오톡/g, '');
const loginMatch = loginContent.match(forbiddenPattern);
assert.equal(loginMatch, null, `Login.tsx에 금지된 실기업명/상표/문구 발견: ${loginMatch?.[0]}`);
assert.ok(GLOSSARY_TERMS.length >= 18, '용어사전 항목 수 확인');
console.log('   ✅ 실제 기업명·상표·부적절 문구 0건 통과');

console.log('🔍 4. 호가 단위(Tick Size) 및 환율 차별화(수출형 vs 내수형) 단위 테스트...');
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
console.log('   ✅ KRX 호가 단위 반올림 및 수출/내수 환율 차별화 통과');

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
      // 동일 섹터 상반 뉴스 충돌 카운트
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

console.log('\n🎉 모든 법적·데이터·시뮬레이션 엔진 검증을 100% 통과했습니다!');
