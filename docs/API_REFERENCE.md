<div align="center">

# 📡 API 레퍼런스

**스탁스쿨 (StockSchool) — Store & 함수 API 문서**

</div>

---

## 🗃️ Zustand Store API (`gameStore.ts`)

### State 필드

| 필드 | 타입 | 기본값 | 설명 |
|:---|:---|:---|:---|
| `uid` | `string \| null` | `null` | Firebase 인증 사용자 ID |
| `displayName` | `string \| null` | `null` | 사용자 표시 이름 |
| `level` | `Level` | `'elementary'` | 현재 난이도 |
| `isLoadingState` | `boolean` | `false` | Firestore 로딩 상태 |
| `dayCount` | `number` | `1` | 현재 게임 일수 |
| `cash` | `number` | `1_000_000` | 보유 현금 (원) |
| `initialCash` | `number` | `1_000_000` | 초기 자금 |
| `stocks` | `Record<string, StockState>` | `{}` | 전체 종목 상태 |
| `usedNewsIds` | `string[]` | `[]` | 사용된 뉴스 ID |
| `currentNews` | `NewsItem[]` | `[]` | 현재 일자 뉴스 (3개) |
| `previousNews` | `NewsItem[]` | `[]` | 이전 일자 뉴스 (해설용) |
| `holdings` | `Record<string, Holding>` | `{}` | 보유 종목 |
| `totalAssetHistory` | `number[]` | `[]` | 총 자산 변동 이력 |
| `theme` | `'light' \| 'dark'` | localStorage 또는 `'light'` | 테마 |
| `tutorialStep` | `number \| null` | `null` | 튜토리얼 단계 |

---

### Actions (함수)

#### `setAuth(uid, displayName)`

```typescript
setAuth(uid: string | null, displayName: string | null): Promise<void>
```

| 매개변수 | 설명 |
|:---|:---|
| `uid` | Firebase 사용자 ID (로그아웃 시 `null`) |
| `displayName` | 사용자 이름 |

- `uid`가 있으면 → Firestore에서 저장된 게임 상태를 로드
- `uid`가 `null`이면 → 모든 게임 상태를 초기값으로 리셋

---

#### `initializeGame(level)`

```typescript
initializeGame(level: Level): void
```

새 게임을 초기화합니다.

- 난이도별 초기 자금 설정
- 30개 종목을 기준가 ±5% 랜덤으로 초기화
- 뉴스 3개를 랜덤 선택
- Firestore에 저장

---

#### `buyStock(stockId, quantity)`

```typescript
buyStock(stockId: string, quantity: number): boolean
```

| 반환값 | 조건 |
|:---|:---|
| `true` | 매수 성공 |
| `false` | 잔고 부족 또는 유효하지 않은 입력 |

**평균 매수가 계산:**
```
newAvgPrice = (기존수량 × 기존평균가 + 매수금액) / 총수량
```

---

#### `sellStock(stockId, quantity)`

```typescript
sellStock(stockId: string, quantity: number): boolean
```

| 반환값 | 조건 |
|:---|:---|
| `true` | 매도 성공 |
| `false` | 보유량 초과 또는 유효하지 않은 입력 |

- 전량 매도 시 해당 종목의 `holding`이 삭제됩니다.

---

#### `nextDay()`

```typescript
nextDay(): void
```

다음 날로 진행합니다:
1. 현재 뉴스의 섹터 임팩트 합산
2. 모든 종목 가격 시뮬레이션 (5가지 요소)
3. 총 자산 기록
4. 새 뉴스 3개 선택
5. `dayCount` 증가
6. Firestore 저장

---

#### `toggleTheme()`

```typescript
toggleTheme(): void
```

라이트/다크 테마를 전환합니다. `localStorage`에 설정을 저장합니다.

---

#### `setTutorialStep(step)`

```typescript
setTutorialStep(step: number | null): void
```

튜토리얼 단계를 설정합니다. `null`로 설정하면 튜토리얼이 비활성화됩니다.

---

## 🔧 헬퍼 함수

### `getInitialCash(level)`

```typescript
const getInitialCash = (level: Level): number => {
  if (level === 'elementary') return 1_000_000;
  if (level === 'middle')     return 5_000_000;
  return 10_000_000;
};
```

### `initializeStocks()`

모든 종목을 `basePrice ± 5%` 랜덤 변동으로 초기화합니다.

### `saveGameState(uid, state)`

Firestore `users/{uid}` 문서에 게임 상태를 저장합니다 (`merge: true`).

---

## 🛠️ 유틸리티 함수

### `cn(...classes)` — `src/lib/utils.ts`

```typescript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### `shuffleArray<T>(arr)` — `src/lib/newsData.ts`

Fisher-Yates 알고리즘으로 배열을 셔플합니다.

### `getCategoryLabel(category)` — `src/lib/glossaryData.ts`

| 입력 | 출력 |
|:---|:---|
| `'basic'` | `'주식 기초'` |
| `'analysis'` | `'주식 분석'` |
| `'macro'` | `'거시 경제'` |
| `'advanced'` | `'심화 지식'` |

---

<div align="center">

[⬆️ 맨 위로](#-api-레퍼런스) • [📐 아키텍처](./ARCHITECTURE.md) • [📖 README](../README.md)

</div>
