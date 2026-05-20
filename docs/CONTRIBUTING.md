<div align="center">

# 🤝 기여 가이드

**스탁스쿨 (StockSchool) — Contributing Guide**

<p>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Contributors-Welcome-blue?style=for-the-badge" />
</p>

</div>

---

스탁스쿨에 관심을 가져주셔서 감사합니다! 🎉 모든 형태의 기여를 환영합니다.

> [!TIP]
> 처음 기여하시는 분은 `good first issue` 라벨이 붙은 이슈부터 시작해 보세요!

---

## 📑 목차

- [1. 행동 강령](#1--행동-강령)
- [2. 개발 환경 설정](#2--개발-환경-설정)
- [3. 브랜치 전략](#3--브랜치-전략)
- [4. 커밋 컨벤션](#4--커밋-컨벤션)
- [5. Pull Request 가이드](#5--pull-request-가이드)
- [6. 코드 스타일 가이드](#6--코드-스타일-가이드)
- [7. 새로운 종목 추가하기](#7--새로운-종목-추가하기)
- [8. 새로운 뉴스 추가하기](#8--새로운-뉴스-추가하기)
- [9. 새로운 용어 추가하기](#9--새로운-용어-추가하기)
- [10. 이슈 리포팅](#10--이슈-리포팅)

---

## 1. 📜 행동 강령

이 프로젝트는 [행동 강령(Code of Conduct)](./CODE_OF_CONDUCT.md)을 따릅니다. 참여함으로써 이 규범을 준수하는 데 동의하는 것입니다. 부적절한 행동은 프로젝트 관리자에게 보고해 주세요.

---

## 2. 💻 개발 환경 설정

### 사전 요구사항

| 도구 | 최소 버전 | 확인 명령 |
|:---:|:---:|:---|
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |
| Git | 2.30+ | `git --version` |

### 설정 단계

```bash
# 1. 저장소 포크 (GitHub에서 Fork 버튼)

# 2. 포크한 저장소 클론
git clone https://github.com/YOUR_USERNAME/stock-school.git
cd stock-school

# 3. 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/ORIGINAL_OWNER/stock-school.git

# 4. 의존성 설치
npm install

# 5. 개발 서버 실행
npm run dev
```

> [!IMPORTANT]
> Firebase 설정이 필요합니다. `src/lib/firebase.ts` 파일에 본인의 Firebase 프로젝트 설정값을 입력하세요. 상세 설정은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참조하세요.

---

## 3. 🌿 브랜치 전략

```mermaid
gitgraph
    commit id: 초기 커밋
    branch develop
    checkout develop
    commit id: 개발 시작
    branch feature/new-stock
    checkout feature/new-stock
    commit id: 새 종목 추가
    commit id: 테스트 완료
    checkout develop
    merge feature/new-stock
    branch fix/price-calc
    checkout fix/price-calc
    commit id: 가격 계산 수정
    checkout develop
    merge fix/price-calc
    checkout main
    merge develop id: v1.1.0 릴리즈
```

| 브랜치 | 용도 | 예시 |
|:---|:---|:---|
| `main` | 프로덕션 릴리즈 | - |
| `develop` | 통합 개발 브랜치 | - |
| `feature/*` | 새 기능 개발 | `feature/add-etf-trading` |
| `fix/*` | 버그 수정 | `fix/price-calculation-error` |
| `docs/*` | 문서 작업 | `docs/update-readme` |
| `refactor/*` | 리팩토링 | `refactor/store-structure` |

---

## 4. 📝 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org/) 규격을 따릅니다.

### 형식

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### 타입

| 타입 | 설명 | 예시 |
|:---:|:---|:---|
| `feat` | ✨ 새 기능 | `feat(trading): 지정가 주문 기능 추가` |
| `fix` | 🐛 버그 수정 | `fix(chart): 가격 이력 렌더링 오류 수정` |
| `docs` | 📝 문서 변경 | `docs: README 게임 가이드 업데이트` |
| `style` | 💄 코드 포맷팅 | `style: 들여쓰기 통일` |
| `refactor` | ♻️ 리팩토링 | `refactor(store): 뉴스 선택 로직 개선` |
| `test` | ✅ 테스트 | `test: buyStock 유닛 테스트 추가` |
| `chore` | 🔧 빌드/설정 | `chore: ESLint 규칙 업데이트` |

### 스코프 (선택)

`components`, `stores`, `lib`, `pages`, `ui`, `trading`, `layout`

---

## 5. 🔀 Pull Request 가이드

### PR 작성 시 체크리스트

- [ ] `develop` 브랜치에서 최신 코드를 pull 했습니다
- [ ] 코드가 정상적으로 빌드됩니다 (`npm run build`)
- [ ] ESLint 오류가 없습니다 (`npm run lint`)
- [ ] 커밋 메시지가 컨벤션을 따릅니다
- [ ] 필요한 경우 문서를 업데이트했습니다

### PR 템플릿

```markdown
## 📋 변경 사항
<!-- 무엇을 변경했는지 설명해 주세요 -->

## 🎯 관련 이슈
<!-- Fixes #123 -->

## 📸 스크린샷 (UI 변경 시)
<!-- UI 변경이 있다면 전후 스크린샷을 첨부해 주세요 -->

## ✅ 테스트
<!-- 어떤 테스트를 수행했는지 설명해 주세요 -->
```

---

## 6. 📏 코드 스타일 가이드

### 파일 네이밍

| 대상 | 규칙 | 예시 |
|:---|:---|:---|
| 컴포넌트 | PascalCase | `StockList.tsx`, `OrderPanel.tsx` |
| 유틸리티 | camelCase | `utils.ts`, `firebase.ts` |
| 데이터 파일 | camelCase | `stockData.ts`, `newsData.ts` |
| 스토어 | camelCase | `gameStore.ts` |

### 임포트 순서

```typescript
// 1. React 및 외부 라이브러리
import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

// 2. 컴포넌트
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// 3. 유틸리티 & 데이터
import { cn } from '@/lib/utils';

// 4. 타입 (type-only imports)
import type { StockState } from '@/lib/stockData';

// 5. 아이콘
import { TrendingUp, Search } from 'lucide-react';
```

### TypeScript 규칙

- `strict` 모드 활성화
- 인터페이스 사용 선호 (`interface` > `type`)
- `any` 타입 사용 최소화
- Optional chaining (`?.`) 적극 활용

---

## 7. 📈 새로운 종목 추가하기

`src/lib/stockData.ts`의 `INITIAL_STOCKS` 배열에 추가합니다.

```typescript
{
  id: "company-id",          // 고유 ID (kebab-case)
  name: "회사명",             // 한글 회사명
  sector: "섹터(Sector)",    // 섹터명 (한글(영문) 형식)
  basePrice: 50000,          // 기준가 (원)
  volatility: 1.0,           // 변동성 계수 (0.5 ~ 1.8)
  descriptions: {
    elementary: "초등학생 눈높이 설명...",
    middle: "중학생 수준 산업 분석...",
    high: "고등학생 투자 전문가 수준 설명..."
  }
}
```

> [!WARNING]
> - `volatility`는 **0.5 ~ 1.8** 범위를 권장합니다
> - `descriptions`는 반드시 **3단계 모두** 작성해야 합니다
> - `sector`는 기존 섹터와 동일한 형식으로 작성하세요

---

## 8. 📰 새로운 뉴스 추가하기

`src/lib/newsData.ts`의 `PREDEFINED_NEWS` 배열에 추가합니다.

```typescript
{
  id: "news-mid-99",
  title: "뉴스 헤드라인",
  content: "상세한 뉴스 본문 내용...",
  category: "sector",     // macro | sector | company | global
  sentiment: 2,           // -2 ~ +2 (악재 ~ 호재)
  relatedSectors: ["기술(Tech)"],
  sectorImpact: {
    "기술(Tech)": 0.06    // 해당 섹터에 미치는 영향도
  },
  explanations: {
    elementary: "초등학생용 쉬운 해설...",
    middle: "중학생용 분석적 해설...",
    high: "고등학생용 전문 해설..."
  },
  difficulty: ["middle", "high"]  // 표시 대상 레벨
}
```

---

## 9. 📚 새로운 용어 추가하기

`src/lib/glossaryData.ts`의 `GLOSSARY_TERMS` 배열에 추가합니다.

```typescript
{
  id: "g-17",
  term: "용어명 (English Term)",
  category: "basic",      // basic | analysis | macro | advanced
  definitions: {
    elementary: "초등학생 비유/예시 중심 설명...",
    middle: "중학생 개념 정의...",
    high: "고등학생 이론/공식 설명..."
  }
}
```

---

## 10. 🐛 이슈 리포팅

### 버그 리포트

```markdown
## 🐛 버그 설명
<!-- 버그를 간단히 설명해 주세요 -->

## 📋 재현 단계
1. '...'로 이동
2. '...'를 클릭
3. '...'가 발생

## ✅ 기대 동작
<!-- 정상적으로 동작해야 하는 방식 -->

## ❌ 실제 동작
<!-- 실제로 발생하는 동작 -->

## 🖥️ 환경
- OS: Windows 11
- 브라우저: Chrome 120
- Node.js: 20.11.0
```

### 기능 제안

```markdown
## 💡 기능 설명
<!-- 제안하는 기능을 설명해 주세요 -->

## 🎯 해결하려는 문제
<!-- 이 기능이 필요한 이유 -->

## 📋 제안 구현 방안
<!-- (선택) 어떻게 구현하면 좋을지 -->
```

---

<div align="center">

감사합니다! 여러분의 기여가 스탁스쿨을 더 나은 교육 플랫폼으로 만듭니다. 🚀

[⬆️ 맨 위로](#-기여-가이드) • [📖 README](../README.md)

</div>
