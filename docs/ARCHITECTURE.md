<div align="center">

# 📐 시스템 아키텍처

**스탁스쿨 (StockSchool) — 기술 아키텍처 문서**

<p>
  <img src="https://img.shields.io/badge/Architecture-Client_Side_SPA-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/State-Zustand-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Backend-Firebase_BaaS-yellow?style=for-the-badge" />
</p>

</div>

---

## 📑 목차

- [1. 시스템 아키텍처 개요](#1--시스템-아키텍처-개요)
- [2. 프론트엔드 아키텍처](#2--프론트엔드-아키텍처)
- [3. 컴포넌트 계층 구조](#3--컴포넌트-계층-구조)
- [4. 상태 관리 아키텍처](#4--상태-관리-아키텍처)
- [5. 주가 시뮬레이션 엔진](#5--주가-시뮬레이션-엔진)
- [6. 데이터 모델](#6--데이터-모델)
- [7. 인증 플로우](#7--인증-플로우)
- [8. 난이도 시스템](#8--난이도-시스템)
- [9. 디렉토리 구조](#9--디렉토리-구조)

---

## 1. 🏗️ 시스템 아키텍처 개요

스탁스쿨은 **클라이언트 사이드 SPA (Single Page Application)** 아키텍처를 채택하고 있습니다. 별도의 백엔드 서버 없이 **Firebase BaaS(Backend as a Service)** 를 활용하여 인증과 데이터 영속성을 처리합니다.

```mermaid
graph TB
    subgraph Browser["🌐 브라우저 (클라이언트)"]
        direction TB
        React["⚛️ React 19 SPA"]
        Zustand["🗃️ Zustand<br/>상태 관리"]
        Router["🔀 React Router"]
        Charts["📊 차트 엔진<br/>Lightweight Charts + Recharts"]
        
        React --> Zustand
        React --> Router
        React --> Charts
        Zustand --> Charts
    end

    subgraph Firebase["☁️ Firebase (BaaS)"]
        direction TB
        Auth["🔐 Authentication<br/>Google OAuth 2.0"]
        Firestore["🗄️ Cloud Firestore<br/>NoSQL Database"]
    end

    subgraph StaticData["📦 정적 데이터 (빌드 시 포함)"]
        direction TB
        StockData["📈 stockData.ts<br/>30개 종목 정의"]
        NewsData["📰 newsData.ts<br/>60+ 뉴스 이벤트"]
        GlossaryData["📚 glossaryData.ts<br/>16개 금융 용어"]
    end

    React <-->|"로그인/로그아웃"| Auth
    Zustand <-->|"게임 상태<br/>저장/로드"| Firestore
    StaticData -->|"초기화 시<br/>로드"| Zustand

    style Browser fill:#0f172a,stroke:#334155,color:#e2e8f0
    style Firebase fill:#1a1a2e,stroke:#e94560,color:#fff
    style StaticData fill:#16213e,stroke:#0f3460,color:#e2e8f0
```

> [!NOTE]
> 스탁스쿨은 서버리스 아키텍처로 설계되었습니다. 모든 게임 로직(주가 시뮬레이션, 거래 처리 등)은 클라이언트 측에서 실행되며, Firebase는 인증과 데이터 영속성만 담당합니다.

---

## 2. ⚛️ 프론트엔드 아키텍처

### 기술 계층 다이어그램

```mermaid
graph TD
    subgraph PresentationLayer["🎨 프레젠테이션 계층"]
        Pages["📄 Pages<br/>(Login, Dashboard)"]
        Layout["📐 Layout<br/>(AppShell, Header)"]
        Trading["📈 Trading Components<br/>(StockList, PriceChart, etc.)"]
        UI["🧩 UI Primitives<br/>(shadcn/ui + Radix)"]
    end

    subgraph BusinessLayer["⚙️ 비즈니스 로직 계층"]
        GameStore["🗃️ gameStore.ts<br/>(Zustand)"]
        SimEngine["🎲 시뮬레이션 엔진<br/>(nextDay, buyStock, sellStock)"]
    end

    subgraph DataLayer["💾 데이터 계층"]
        FirebaseSDK["🔥 Firebase SDK"]
        StaticData2["📦 정적 데이터 모듈"]
        LocalStorage["💿 localStorage<br/>(테마 설정)"]
    end

    Pages --> Layout
    Layout --> Trading
    Trading --> UI
    Pages --> GameStore
    Trading --> GameStore
    GameStore --> SimEngine
    GameStore --> FirebaseSDK
    GameStore --> StaticData2
    GameStore --> LocalStorage

    style PresentationLayer fill:#1e3a5f,stroke:#4a90d9,color:#e2e8f0
    style BusinessLayer fill:#2d1b4e,stroke:#8b5cf6,color:#e2e8f0
    style DataLayer fill:#1a3636,stroke:#40a578,color:#e2e8f0
```

### 핵심 설계 원칙

| 원칙 | 설명 |
|:---:|:---|
| 🎯 **단일 Store** | Zustand 하나의 스토어로 모든 게임 상태를 중앙 관리 |
| 🔄 **단방향 데이터 흐름** | Store → UI → User Action → Store |
| 📦 **정적 데이터 분리** | 종목/뉴스/용어 데이터를 별도 모듈로 분리 |
| 💾 **자동 영속성** | 상태 변경 시 자동으로 Firestore에 저장 |
| 🎨 **컴포넌트 합성** | 작은 UI 프리미티브를 조합하여 복잡한 컴포넌트 구성 |

---

## 3. 🧩 컴포넌트 계층 구조

```mermaid
graph TD
    App["🏠 App.tsx<br/><small>루트 컴포넌트</small>"]
    
    App -->|"uid === null"| Login["🔐 Login.tsx<br/><small>로그인 & 난이도 선택</small>"]
    App -->|"uid !== null"| Dashboard["📊 Dashboard.tsx<br/><small>메인 대시보드</small>"]
    App --> Toaster["🔔 Toaster<br/><small>토스트 알림</small>"]
    
    Dashboard --> AppShell["📐 AppShell.tsx<br/><small>메인 레이아웃</small>"]
    
    AppShell --> Header["🔝 Header.tsx"]
    Header --> SchoolLogo["🎓 SchoolLogo.tsx"]
    
    AppShell --> StockList["📋 StockList.tsx<br/><small>종목 리스트</small>"]
    AppShell --> PriceChart["📈 PriceChart.tsx<br/><small>가격 차트</small>"]
    AppShell --> OrderPanel["🛒 OrderPanel.tsx<br/><small>매수/매도</small>"]
    AppShell --> OrderBook["📊 OrderBook.tsx<br/><small>호가창</small>"]
    AppShell --> Portfolio["💼 PortfolioPanel.tsx<br/><small>포트폴리오</small>"]
    AppShell --> News["📰 NewsPanel.tsx<br/><small>뉴스</small>"]
    AppShell --> CompanyInfo["🏢 CompanyInfoPanel.tsx<br/><small>기업 정보</small>"]
    AppShell --> Glossary["📚 GlossaryHub.tsx<br/><small>용어 사전</small>"]
    AppShell --> Tutorial["🎓 TutorialGuide.tsx<br/><small>튜토리얼</small>"]

    style App fill:#1e40af,stroke:#3b82f6,color:#fff
    style Login fill:#7c3aed,stroke:#8b5cf6,color:#fff
    style Dashboard fill:#059669,stroke:#10b981,color:#fff
    style AppShell fill:#0891b2,stroke:#22d3ee,color:#fff
```

### 워크스페이스 탭 구성

```mermaid
graph LR
    Dashboard --> Tab1["📈 트레이딩<br/><small>StockList + PriceChart<br/>+ OrderPanel + OrderBook</small>"]
    Dashboard --> Tab2["💼 포트폴리오<br/><small>PortfolioPanel</small>"]
    Dashboard --> Tab3["📰 뉴스<br/><small>NewsPanel</small>"]
    Dashboard --> Tab4["📚 용어사전<br/><small>GlossaryHub</small>"]

    style Tab1 fill:#dc2626,stroke:#ef4444,color:#fff
    style Tab2 fill:#2563eb,stroke:#3b82f6,color:#fff
    style Tab3 fill:#d97706,stroke:#f59e0b,color:#fff
    style Tab4 fill:#7c3aed,stroke:#8b5cf6,color:#fff
```

---

## 4. 🗃️ 상태 관리 아키텍처

### Zustand Store 구조

게임의 모든 상태는 단일 Zustand 스토어(`gameStore.ts`)에서 관리됩니다.

```mermaid
graph TD
    subgraph GameStore["🗃️ GameState (Zustand Store)"]
        direction TB
        
        subgraph AuthState["🔐 인증 상태"]
            uid["uid: string | null"]
            displayName["displayName: string | null"]
        end
        
        subgraph GameProgress["🎮 게임 진행 상태"]
            level["level: Level"]
            dayCount["dayCount: number"]
            cash["cash: number"]
            initialCash["initialCash: number"]
        end
        
        subgraph MarketData["📈 시장 데이터"]
            stocks["stocks: Record<string, StockState>"]
            currentNews["currentNews: NewsItem[]"]
            previousNews["previousNews: NewsItem[]"]
            usedNewsIds["usedNewsIds: string[]"]
        end
        
        subgraph Portfolio["💼 포트폴리오"]
            holdings["holdings: Record<string, Holding>"]
            totalAssetHistory["totalAssetHistory: number[]"]
        end
        
        subgraph UIState["🎨 UI 상태"]
            theme["theme: 'light' | 'dark'"]
            tutorialStep["tutorialStep: number | null"]
            isLoadingState["isLoadingState: boolean"]
        end
    end

    style GameStore fill:#0f172a,stroke:#334155,color:#e2e8f0
    style AuthState fill:#1e3a5f,stroke:#60a5fa,color:#e2e8f0
    style GameProgress fill:#1a3636,stroke:#4ade80,color:#e2e8f0
    style MarketData fill:#3b1f2b,stroke:#f472b6,color:#e2e8f0
    style Portfolio fill:#2d1b4e,stroke:#a78bfa,color:#e2e8f0
    style UIState fill:#1a1a2e,stroke:#fbbf24,color:#e2e8f0
```

### 상태 변경 & 영속성 플로우

```mermaid
sequenceDiagram
    participant UI as ⚛️ React UI
    participant Store as 🗃️ Zustand
    participant FS as ☁️ Firestore

    Note over UI, FS: 📥 로그인 시 상태 복원
    UI->>Store: setAuth(uid, name)
    Store->>FS: getDoc('users/{uid}')
    FS-->>Store: gameState 반환
    Store-->>UI: 상태 반영 → 리렌더링

    Note over UI, FS: 🛒 사용자 액션 시 자동 저장
    UI->>Store: buyStock('samsung-elec', 10)
    Store->>Store: 잔고 확인 & 상태 업데이트
    Store->>FS: setDoc('users/{uid}', gameState, merge)
    Store-->>UI: 업데이트된 상태 반영

    Note over UI, FS: ⏭️ 다음 날 진행
    UI->>Store: nextDay()
    Store->>Store: 주가 시뮬레이션
    Store->>Store: 뉴스 교체
    Store->>FS: setDoc('users/{uid}', gameState, merge)
    Store-->>UI: 새 가격 & 뉴스 반영
```

---

## 5. 🎲 주가 시뮬레이션 엔진

### 알고리즘 흐름도

```mermaid
flowchart TD
    Start["⏭️ nextDay() 호출"] --> CalcSector["📰 뉴스별 섹터 임팩트 합산"]
    CalcSector --> LoopStart["🔄 각 종목별 반복 시작"]
    
    LoopStart --> MF["📊 시장 요인 계산<br/><code>(random - 0.53) × 0.02</code>"]
    MF --> NI["📰 뉴스 임팩트<br/><code>rawImpact × 0.3</code>"]
    NI --> RV["🎲 랜덤 변동성<br/><code>(random - 0.5) × 0.04 × volatility</code>"]
    RV --> MR["📏 평균 회귀<br/><code>-deviation × 0.05</code>"]
    MR --> SE{"🌩️ 충격 이벤트?<br/><small>2.5% 확률</small>"}
    
    SE -->|"양(+) 충격"| PosShock["📈 양의 충격<br/><code>+(random×0.05+0.02)×vol</code>"]
    SE -->|"음(-) 충격"| NegShock["📉 음의 충격<br/><code>-(random×0.05+0.02)×vol</code>"]
    SE -->|"95% 무충격"| NoShock["➡️ 충격 없음"]
    
    PosShock --> Sum["➕ 합산"]
    NegShock --> Sum
    NoShock --> Sum
    
    Sum --> Cap["🔒 ±15% 캡 적용"]
    Cap --> NewPrice["💰 새 가격 = 현재가 × (1 + 변동률)<br/><small>최소 1원</small>"]
    NewPrice --> UpdateHistory["📊 가격 이력 추가"]
    UpdateHistory --> NextStock{"다음 종목?"}
    NextStock -->|"예"| LoopStart
    NextStock -->|"아니오"| LoadNews["📰 새 뉴스 3개 선택"]
    LoadNews --> Save["💾 Firestore 저장"]
    Save --> End["✅ 완료"]

    style Start fill:#2563eb,stroke:#3b82f6,color:#fff
    style End fill:#059669,stroke:#10b981,color:#fff
    style SE fill:#d97706,stroke:#f59e0b,color:#fff
```

### 시뮬레이션 공식 요약

| 구성 요소 | 공식 | 설명 |
|:---|:---|:---|
| 🌍 시장 요인 | `(Math.random() - 0.53) × 0.02` | 약간의 음의 편향으로 무한 상승 방지 |
| 📰 뉴스 임팩트 | `rawImpact × 0.3` | 뉴스의 섹터 영향도를 0.3배로 스케일링 |
| 🎲 랜덤 변동성 | `(Math.random() - 0.5) × 0.04 × volatility` | 종목별 변동성 반영 |
| 📏 평균 회귀 | `-((currentPrice - basePrice) / basePrice) × 0.05` | 기준가로 복귀하는 힘 |
| 🌩️ 충격 이벤트 | 2.5% 확률, `(random × 0.05 + 0.02) × volatility` | 희귀한 대폭 변동 |
| 🔒 변동 제한 | `Math.max(-0.15, Math.min(0.15, total))` | 일일 최대 ±15% |

---

## 6. 📦 데이터 모델

```mermaid
erDiagram
    StockDefinition {
        string id PK
        string name
        string sector
        number basePrice
        number volatility
        object descriptions
    }
    
    StockState {
        number currentPrice
        array priceHistory
    }
    
    NewsItem {
        string id PK
        string title
        string content
        string category
        number sentiment
        array relatedSectors
        object sectorImpact
        object explanations
        array difficulty
    }
    
    GlossaryItem {
        string id PK
        string term
        string category
        object definitions
    }
    
    Holding {
        number quantity
        number avgPrice
    }
    
    GameState {
        string uid FK
        string level
        number dayCount
        number cash
        object stocks
        object holdings
        array currentNews
    }
    
    StockDefinition ||--|| StockState : "extends"
    GameState ||--|{ StockState : "stocks"
    GameState ||--|{ Holding : "holdings"
    GameState ||--|{ NewsItem : "currentNews"
```

> 📖 상세 데이터 모델은 [DATA_MODELS.md](./DATA_MODELS.md)를 참조하세요.

---

## 7. 🔐 인증 플로우

```mermaid
sequenceDiagram
    participant U as 👤 사용자
    participant App as ⚛️ App.tsx
    participant Auth as 🔐 Firebase Auth
    participant Store as 🗃️ Zustand
    participant FS as 🗄️ Firestore

    U->>App: Google 로그인 버튼 클릭
    App->>Auth: signInWithPopup(GoogleProvider)
    Auth-->>Auth: Google OAuth 팝업
    U->>Auth: Google 계정 선택 & 인증
    Auth-->>App: UserCredential 반환
    
    Note over App: onAuthStateChanged 트리거
    App->>Store: setAuth(user.uid, user.displayName)
    Store->>FS: getDoc('users/{uid}')
    
    alt 기존 사용자 (문서 존재)
        FS-->>Store: 저장된 gameState 반환
        Store->>Store: 상태 복원
    else 신규 사용자 (문서 없음)
        Store->>Store: 기본 상태 유지
        Note over Store: initializeGame() 대기
    end
    
    Store-->>App: uid 설정 완료
    App->>App: Dashboard 렌더링
```

### Firestore 문서 구조

```
📁 users (Collection)
  └── 📄 {uid} (Document)
        ├── displayName: "홍길동"
        ├── updatedAt: "2026-05-20T..."
        └── gameState:
              ├── level: "elementary"
              ├── dayCount: 15
              ├── cash: 850000
              ├── initialCash: 1000000
              ├── stocks: { "samsung-elec": {...}, ... }
              ├── holdings: { "samsung-elec": { quantity: 5, avgPrice: 82000 } }
              ├── currentNews: [...]
              ├── previousNews: [...]
              ├── usedNewsIds: [...]
              ├── totalAssetHistory: [1000000, 1050000, ...]
              └── tutorialStep: null
```

---

## 8. 🎓 난이도 시스템

```mermaid
graph LR
    subgraph Elementary["🟢 초등학생"]
        E1["💰 초기자금: 100만원"]
        E2["📰 쉬운 뉴스"]
        E3["📖 이야기형 설명"]
    end
    
    subgraph Middle["🟡 중학생"]
        M1["💰 초기자금: 500만원"]
        M2["📰 산업 분석 뉴스"]
        M3["📖 전문 용어 도입"]
    end
    
    subgraph High["🔴 고등학생"]
        H1["💰 초기자금: 1,000만원"]
        H2["📰 밸류에이션 뉴스"]
        H3["📖 투자 전문가 수준"]
    end

    style Elementary fill:#059669,stroke:#10b981,color:#fff
    style Middle fill:#d97706,stroke:#f59e0b,color:#fff
    style High fill:#dc2626,stroke:#ef4444,color:#fff
```

| 항목 | 🟢 초등학생 | 🟡 중학생 | 🔴 고등학생 |
|:---|:---:|:---:|:---:|
| 초기 자금 | ₩1,000,000 | ₩5,000,000 | ₩10,000,000 |
| 뉴스 난이도 | 일상생활 소재 | 산업/경제 분석 | 밸류에이션/재무 |
| 종목 설명 | 이야기형 | 사업 분석 | 투자 전문가 |
| 용어 정의 | 비유/예시 중심 | 개념 정의 | 이론/공식 포함 |
| 난이도 레이블 | `elementary` | `middle` | `high` |

---

## 9. 📁 디렉토리 구조

| 경로 | 역할 |
|:---|:---|
| `src/` | 소스 코드 루트 |
| `src/components/layout/` | 앱 전체 레이아웃 (셸, 헤더, 로고) |
| `src/components/trading/` | 트레이딩 관련 모든 기능 컴포넌트 |
| `src/components/ui/` | 재사용 가능한 기초 UI 프리미티브 (shadcn/ui) |
| `src/lib/` | 유틸리티, Firebase 설정, 정적 데이터 모듈 |
| `src/pages/` | 페이지 단위 컴포넌트 (Login, Dashboard) |
| `src/stores/` | Zustand 상태 관리 스토어 |
| `src/assets/` | 이미지, SVG 등 정적 자산 |
| `public/` | Vite 정적 파일 (파비콘 등) |
| `docs/` | 프로젝트 문서 |

---

<div align="center">

[⬆️ 맨 위로](#-시스템-아키텍처) • [📖 README로 돌아가기](../README.md)

</div>
