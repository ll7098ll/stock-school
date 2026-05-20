# 📈 모의 주식 투자 앱 (StockEdu) - 구현 계획서

## 1. 프로젝트 개요

### 기존 앱 분석 (app.py)
| 항목 | 기존 | 신규 |
|------|------|------|
| **프레임워크** | Streamlit (Python) | React + Vite (TypeScript) |
| **뉴스 생성** | OpenAI API 실시간 호출 | Firebase DB 사전 저장 → 랜덤 로드 |
| **DB** | Supabase | Firebase (Firestore + Auth) |
| **UI** | Streamlit 기본 위젯 | shadcn/ui + Tailwind CSS (HTS 스타일) |
| **주식 데이터** | 15개 섹터 / 36개 종목 | 동일 구조 유지 + 최신 한국 시장 반영 |
| **수준별 학습** | 초등/중등/고등 3단계 | 동일 유지 |

### 핵심 변경사항
1. **뉴스 사전 생성**: 500+ 뉴스를 Firestore에 미리 저장, 게임 시 랜덤 5개 로드
2. **뉴스 해설 사전 생성**: 각 뉴스별 3단계 해설 + 관련 섹터 + 감성 점수 사전 저장
3. **HTS 스타일 UI**: 키움증권/삼성증권 참고한 다크 테마 트레이딩 인터페이스
4. **실시간 차트**: Lightweight Charts (TradingView) 기반 캔들스틱/라인 차트

---

## 2. 기술 스택

```
Frontend:  React 18 + TypeScript + Vite
Styling:   Tailwind CSS v4 + shadcn/ui
Charts:    lightweight-charts (TradingView) + recharts
State:     Zustand (전역 상태 관리)
Backend:   Firebase (Auth + Firestore + Hosting)
Icons:     Lucide React
Font:      Pretendard (한국어 최적화)
```

---

## 3. Firebase 데이터 구조

### 3.1 Firestore Collections

```
📁 news/
  └─ {newsId}
      ├─ title: string              // 뉴스 제목
      ├─ content: string            // 뉴스 본문
      ├─ category: string           // "macro" | "sector" | "company" | "global"
      ├─ sentiment: number          // -3 ~ +3 감성 점수
      ├─ relatedSectors: string[]   // ["기술(Tech)", "반도체"]
      ├─ sectorImpact: map          // { "기술(Tech)": 0.05, "에너지(Energy)": -0.02 }
      ├─ explanations: map
      │   ├─ elementary: string     // 초등 해설
      │   ├─ middle: string         // 중등 해설
      │   └─ high: string           // 고등 해설
      ├─ difficulty: string[]       // ["elementary","middle","high"]
      └─ tags: string[]             // 검색/필터용 태그

📁 stocks/
  └─ {stockId}
      ├─ name: string
      ├─ sector: string
      ├─ basePrice: number          // 기준가 (시뮬레이션 시작 가격 범위)
      ├─ descriptions: map
      │   ├─ elementary: string
      │   ├─ middle: string
      │   └─ high: string
      └─ volatility: number         // 변동성 계수

📁 users/
  └─ {uid}
      ├─ displayName: string
      ├─ level: string              // "elementary" | "middle" | "high"
      ├─ createdAt: timestamp
      └─ gameState: map
          ├─ cash: number
          ├─ dayCount: number
          ├─ holdings: map          // { "삼성전자": { qty, avgPrice } }
          ├─ priceHistory: map      // { "삼성전자": [price1, price2, ...] }
          ├─ usedNewsIds: string[]  // 이미 사용한 뉴스 ID (중복 방지)
          └─ totalAssetHistory: number[]  // 날짜별 총 자산 추이

📁 glossary/
  └─ {termId}
      ├─ term: string
      ├─ definitions: map
      │   ├─ elementary: string
      │   ├─ middle: string
      │   └─ high: string
      └─ category: string
```

### 3.2 사전 생성 뉴스 카테고리 (총 500+ 건)

| 카테고리 | 설명 | 수량 목표 |
|----------|------|-----------|
| **거시경제** | 금리, 환율, GDP, 물가 등 | ~80건 |
| **섹터별** | 15개 섹터 × ~20건 | ~300건 |
| **글로벌** | 미중관계, 유가, 국제무역 등 | ~60건 |
| **이벤트** | 실적시즌, IPO, M&A, 정책 등 | ~60건 |

> 뉴스는 **Seed Script**로 Gemini/GPT API 활용해 일괄 생성 후 Firestore에 업로드합니다.

---

## 4. 프로젝트 구조

```
stock-edu/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # 전체 레이아웃 (HTS 스타일)
│   │   │   ├── Sidebar.tsx        # 좌측 사이드바 (계좌/포트폴리오)
│   │   │   ├── Header.tsx         # 상단 헤더 (시장 요약 티커)
│   │   │   └── StatusBar.tsx      # 하단 상태바
│   │   ├── trading/
│   │   │   ├── OrderPanel.tsx     # 매수/매도 주문 패널
│   │   │   ├── OrderBook.tsx      # 호가창 (시각적 효과)
│   │   │   └── OrderConfirm.tsx   # 주문 확인 다이얼로그
│   │   ├── market/
│   │   │   ├── StockTable.tsx     # 종목 리스트 테이블
│   │   │   ├── StockDetail.tsx    # 종목 상세 정보
│   │   │   ├── PriceChart.tsx     # 주가 차트 (TradingView)
│   │   │   ├── SectorMap.tsx      # 섹터별 히트맵
│   │   │   └── MarketTicker.tsx   # 상단 시세 티커
│   │   ├── portfolio/
│   │   │   ├── Holdings.tsx       # 보유 종목 테이블
│   │   │   ├── AssetSummary.tsx   # 자산 요약 카드
│   │   │   ├── ProfitChart.tsx    # 수익률 차트
│   │   │   └── AssetPieChart.tsx  # 자산 배분 파이차트
│   │   ├── news/
│   │   │   ├── NewsFeed.tsx       # 뉴스 피드 리스트
│   │   │   ├── NewsCard.tsx       # 개별 뉴스 카드
│   │   │   └── NewsAnalysis.tsx   # 뉴스 해설 뷰
│   │   ├── education/
│   │   │   ├── GlossaryPanel.tsx  # 용어 사전 패널
│   │   │   └── LevelSelector.tsx  # 수준 선택기
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── AuthGuard.tsx
│   ├── hooks/
│   │   ├── useGameEngine.ts       # 게임 로직 (주가 변동, 날짜 진행)
│   │   ├── useNews.ts             # 뉴스 로드/관리
│   │   ├── usePortfolio.ts        # 포트폴리오 관리
│   │   └── useAuth.ts             # Firebase Auth
│   ├── stores/
│   │   └── gameStore.ts           # Zustand 스토어
│   ├── lib/
│   │   ├── firebase.ts            # Firebase 초기화
│   │   ├── priceEngine.ts         # 주가 변동 엔진
│   │   ├── stockData.ts           # 종목 기본 데이터 (로컬)
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts               # TypeScript 타입 정의
│   ├── pages/
│   │   ├── Landing.tsx            # 랜딩/로그인 페이지
│   │   ├── Dashboard.tsx          # 메인 대시보드 (HTS 메인)
│   │   └── Settings.tsx           # 설정 페이지
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── seedNews.ts                # 뉴스 사전 생성 스크립트
├── firebase.json
├── firestore.rules
├── tailwind.config.ts
└── package.json
```

---

## 5. UI/UX 디자인 (HTS 스타일)

### 5.1 디자인 컨셉

> **"실제 HTS(키움증권 영웅문, 삼성증권 POP)의 다크 테마를 교육용으로 재해석"**

#### 컬러 시스템
```css
/* 다크 테마 (HTS 기본) */
--bg-primary:    #0D1117;     /* 최상위 배경 */
--bg-secondary:  #161B22;     /* 카드/패널 배경 */
--bg-tertiary:   #21262D;     /* 호버/액티브 배경 */
--border:        #30363D;     /* 테두리 */

/* 주가 색상 (한국 증시 규칙) */
--price-up:      #FF3B3B;     /* 상승 - 빨강 */
--price-down:    #3B82F6;     /* 하락 - 파랑 */
--price-flat:    #9CA3AF;     /* 보합 - 회색 */

/* 액센트 */
--accent-buy:    #FF3B3B;     /* 매수 버튼 */
--accent-sell:   #3B82F6;     /* 매도 버튼 */
--accent-gold:   #F59E0B;     /* 강조/골드 */

/* 텍스트 */
--text-primary:  #E6EDF3;
--text-secondary:#8B949E;
--text-muted:    #484F58;
```

### 5.2 레이아웃 (4분할 HTS 스타일)

```
┌─────────────────────────────────────────────────────────┐
│  Header: 마켓 티커 (실시간 주요 종목 가격 스크롤)         │
├────────────┬────────────────────────┬───────────────────┤
│            │                        │                   │
│  Sidebar   │   Main Content Area    │   Order Panel     │
│            │                        │                   │
│ • 계좌정보  │  • 종목 테이블/차트      │  • 매수/매도 폼    │
│ • 자산요약  │  • 뉴스 피드            │  • 호가 시각화     │
│ • 보유종목  │  • 섹터 히트맵          │  • 주문 확인       │
│ • 용어사전  │  (탭 전환)              │                   │
│ • Day 진행  │                        │                   │
│            │                        │                   │
├────────────┴────────────────────────┴───────────────────┤
│  StatusBar: Day N | 수준: 초등 | 총 자산 | 수익률          │
└─────────────────────────────────────────────────────────┘
```

### 5.3 주요 UI 컴포넌트 상세

#### 종목 테이블 (StockTable)
- HTS 시세창 스타일: 섹터별 그룹핑, 등락률 색상 코딩
- 컬럼: 종목명 | 현재가 | 전일대비 | 등락률 | 거래량(시뮬) | 미니차트
- 행 클릭 → 우측 차트/상세 패널 연동

#### 주가 차트 (PriceChart)
- TradingView Lightweight Charts 사용
- 캔들스틱 + 라인차트 토글
- 이동평균선 표시 (5일, 20일)
- 하단 거래량 바 차트

#### 주문 패널 (OrderPanel)
- 매수/매도 탭 전환 (빨강/파랑 색상)
- 수량 입력 + 슬라이더 (10%, 25%, 50%, 100%)
- 예상 금액 실시간 계산
- 확인 다이얼로그 (모달)

#### 뉴스 피드 (NewsFeed)
- 카드형 뉴스 목록 (감성 색상 인디케이터)
- 뉴스 클릭 → 해설 패널 슬라이드
- 수준별 해설 토글

---

## 6. 핵심 로직

### 6.1 주가 변동 엔진 (priceEngine.ts)

기존 `app.py`의 로직을 TypeScript로 이식:

```typescript
// 핵심 알고리즘 (기존 유지)
function updatePrices(stocks, newsImpacts) {
  for (const [sector, sectorStocks] of Object.entries(stocks)) {
    const sectorImpact = newsImpacts[sector] || 0;
    for (const stock of sectorStocks) {
      const randomChange = randomUniform(-0.02, 0.02);
      const totalChange = clamp(randomChange + sectorImpact, -0.15, 0.15);
      stock.currentPrice = Math.max(1, Math.round(stock.currentPrice * (1 + totalChange)));
      stock.priceHistory.push(stock.currentPrice);
    }
  }
}
```

### 6.2 뉴스 로드 및 영향도 계산

```typescript
// Firestore에서 미사용 뉴스 5개 랜덤 로드
async function loadDailyNews(usedNewsIds: string[], level: string) {
  const newsRef = collection(db, 'news');
  // 전체 뉴스 중 미사용 + 해당 수준 포함 뉴스 필터
  const allNews = await getDocs(query(newsRef, where('difficulty', 'array-contains', level)));
  const available = allNews.docs.filter(d => !usedNewsIds.includes(d.id));
  // 랜덤 5개 선택
  const selected = shuffleArray(available).slice(0, 5);
  return selected;
}

// 뉴스의 sectorImpact를 직접 사용 (기존 감성분석 키워드 대체)
function calculateImpacts(newsItems) {
  const impacts = {};
  for (const news of newsItems) {
    for (const [sector, impact] of Object.entries(news.sectorImpact)) {
      impacts[sector] = (impacts[sector] || 0) + impact;
    }
  }
  return impacts;
}
```

### 6.3 게임 흐름

```
1. 로그인 → 수준 선택 → 게임 시작
2. 뉴스 로드 (Firestore에서 랜덤 5개)
3. 뉴스 읽기 → 투자 판단
4. 매수/매도 실행
5. "하루 지나기" 클릭
   → 뉴스 영향도 기반 주가 변동
   → 이전 뉴스 해설 표시
   → 새 뉴스 5개 로드
6. 반복 (Day N 진행)
```

---

## 7. 사전 생성 데이터 (Seed Script)

### 7.1 뉴스 생성 스크립트 (`scripts/seedNews.ts`)

Gemini API를 활용해 500+ 뉴스를 일괄 생성 후 Firestore에 업로드합니다.

**생성 데이터 포맷:**
```json
{
  "title": "반도체 업계, AI 수요 급증에 사상 최대 실적 전망",
  "content": "글로벌 AI 산업의 급성장으로 반도체 수요가...(10-15문장)",
  "category": "sector",
  "sentiment": 2,
  "relatedSectors": ["기술(Tech)"],
  "sectorImpact": { "기술(Tech)": 0.04, "에너지(Energy)": 0.01 },
  "explanations": {
    "elementary": "AI라는 똑똑한 컴퓨터를 만들려면...",
    "middle": "AI 산업 성장으로 반도체 칩 수요가...",
    "high": "생성형 AI의 확산으로 HBM 등 고성능..."
  },
  "difficulty": ["elementary", "middle", "high"],
  "tags": ["반도체", "AI", "HBM", "수출"]
}
```

### 7.2 최신 한국 주식시장 반영 주제

- 2026년 한국 시장 트렌드: AI/반도체, K-콘텐츠, 2차전지, 방산, 원전
- 거시경제: 한은 금리 동결/인하, 원/달러 환율, 수출 동향
- 글로벌: 미중 무역갈등, 유가 변동, 글로벌 공급망
- 정책: 밸류업 프로그램, 공매도 재개, 금투세 논의

---

## 8. 구현 단계 (Phase)

### Phase 1: 프로젝트 셋업 & 기반 (Day 1)
- [ ] Vite + React + TypeScript 프로젝트 초기화
- [ ] Tailwind CSS + shadcn/ui 설정
- [ ] Firebase 프로젝트 연결 (Auth + Firestore)
- [ ] 기본 라우팅 및 레이아웃 셸(AppShell) 구현
- [ ] Zustand 스토어 설정
- [ ] 타입 정의 (types/index.ts)

### Phase 2: 인증 & 데이터 시드 (Day 1-2)
- [ ] Firebase Auth (이메일/비밀번호 or 익명 로그인)
- [ ] 로그인/회원가입 UI
- [ ] Firestore 보안 규칙 설정
- [ ] 뉴스 시드 스크립트 작성 및 실행 (500+ 뉴스 생성)
- [ ] 용어 사전 데이터 시드
- [ ] 종목 기본 데이터 로컬 정의

### Phase 3: 핵심 게임 로직 (Day 2-3)
- [ ] 주가 변동 엔진 (priceEngine.ts)
- [ ] 뉴스 로드 훅 (useNews.ts) - Firestore 랜덤 로드
- [ ] 포트폴리오 관리 훅 (usePortfolio.ts) - 매수/매도
- [ ] 게임 엔진 훅 (useGameEngine.ts) - Day 진행
- [ ] Firestore 게임 상태 저장/로드

### Phase 4: HTS 스타일 UI 구현 (Day 3-5)
- [ ] Header (마켓 티커 애니메이션)
- [ ] Sidebar (계좌 정보, 보유 종목, 자산 요약)
- [ ] StockTable (섹터별 종목 리스트, 등락률 색상)
- [ ] PriceChart (TradingView Lightweight Charts)
- [ ] OrderPanel (매수/매도 주문)
- [ ] NewsFeed + NewsCard + NewsAnalysis
- [ ] Holdings + AssetSummary + ProfitChart
- [ ] SectorMap (섹터 히트맵)
- [ ] GlossaryPanel (용어 사전)
- [ ] StatusBar (하단 상태바)

### Phase 5: 폴리시 & 배포 (Day 5-6)
- [ ] 반응형 레이아웃 (모바일 대응)
- [ ] 마이크로 애니메이션 (가격 변동, 주문 확인)
- [ ] 에러 핸들링 & 로딩 상태
- [ ] Firebase Hosting 배포
- [ ] 성능 최적화

---

## 9. 주요 결정 사항 (피드백 요청)

> [!IMPORTANT]
> 아래 항목에 대한 피드백을 부탁드립니다.

1. **인증 방식**: 기존처럼 아이디/비밀번호? 또는 Firebase Auth (Google 로그인 / 익명 로그인)?
2. **뉴스 생성 API**: 시드 스크립트에서 Gemini API vs OpenAI API 중 어떤 것을 사용?
3. **난이도별 주식 수**: 기존 36개 종목 전체 유지? 초등은 종목 수를 줄일지?
4. **모바일 대응**: PC 전용 HTS 스타일? 또는 모바일 반응형까지?
5. **프로젝트 폴더명**: `stock-edu` 또는 다른 이름?
6. **Tailwind CSS 버전**: v3 또는 v4?
