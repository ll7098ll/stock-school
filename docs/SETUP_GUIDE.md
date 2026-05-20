<div align="center">

# 📥 설치 가이드

**스탁스쿨 (StockSchool) — 상세 설치 & Firebase 설정 가이드**

</div>

---

## 📋 사전 요구사항

| 도구 | 최소 버전 | 설치 방법 |
|:---:|:---:|:---|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.0+ | Node.js와 함께 설치됨 |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com/) |
| **브라우저** | 최신 | Chrome, Firefox, Edge 권장 |

---

## 🚀 빠른 시작

### 1단계: 프로젝트 클론

```bash
git clone https://github.com/your-username/stock-school.git
cd stock-school
```

### 2단계: 의존성 설치

```bash
npm install
```

### 3단계: 개발 서버 실행

```bash
npm run dev
```

> 🌐 `http://localhost:5173`에서 앱이 실행됩니다.

---

## 🔥 Firebase 프로젝트 설정 (상세)

### Step 1: Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름 입력 (예: `stock-school`)
4. Google Analytics 설정 (선택사항)
5. **"프로젝트 만들기"** 클릭

### Step 2: 웹 앱 등록

1. 프로젝트 대시보드에서 **웹 아이콘 (`</>`)** 클릭
2. 앱 닉네임 입력 (예: `StockSchool Web`)
3. **Firebase Hosting 설정** 체크 (선택)
4. **"앱 등록"** 클릭
5. 표시되는 Firebase 설정값을 복사

### Step 3: Authentication 활성화

1. 좌측 메뉴 → **Build** → **Authentication**
2. **"시작하기"** 클릭
3. **Sign-in method** 탭
4. **Google** 제공업체 → **사용 설정** 활성화
5. 프로젝트 지원 이메일 입력 → **저장**

### Step 4: Firestore Database 생성

1. 좌측 메뉴 → **Build** → **Firestore Database**
2. **"데이터베이스 만들기"** 클릭
3. 위치 선택: `asia-northeast3` (서울) 권장
4. **테스트 모드**로 시작 → **만들기**

### Step 5: 설정값 반영

`src/lib/firebase.ts` 파일을 열고 Firebase 설정값을 입력합니다:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 🔒 Firestore 보안 규칙

**Firestore Rules** 탭에서 아래 규칙을 설정합니다:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
  }
}
```

> [!IMPORTANT]
> 이 규칙은 인증된 사용자만 자신의 문서에 접근할 수 있도록 제한합니다.

---

## 📦 빌드 & 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview

# ESLint 코드 검사
npm run lint
```

---

## 🔧 트러블슈팅

| 문제 | 해결 방법 |
|:---|:---|
| `npm install` 실패 | Node.js 18+ 확인, `npm cache clean --force` 후 재시도 |
| Firebase Auth 팝업 안 뜸 | Firebase Console에서 Auth 도메인에 `localhost` 추가 |
| Firestore 권한 오류 | 보안 규칙 설정 확인 |
| HMR 작동 안 함 | Vite 캐시 삭제: `node_modules/.vite` 폴더 삭제 후 재시작 |
| 빌드 TypeScript 에러 | `npm run lint`로 에러 확인 후 수정 |

---

<div align="center">

[⬆️ 맨 위로](#-설치-가이드) • [📖 README](../README.md)

</div>
