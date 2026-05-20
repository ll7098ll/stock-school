<div align="center">

# 🚀 배포 가이드

**스탁스쿨 (StockSchool) — 프로덕션 배포 가이드**

</div>

---

## 📋 빌드 프로세스

### 빌드 명령

```bash
npm run build
```

- TypeScript 컴파일 + Vite 번들링
- 출력 디렉토리: `dist/`
- 트리 쉐이킹 & 코드 스플리팅 자동 적용

### 빌드 결과물 미리보기

```bash
npm run preview
```

---

## 🔥 Firebase Hosting 배포

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
firebase login
```

### 2. 프로젝트 초기화

```bash
firebase init hosting
```

설정 시 응답:
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub auto deploys: `No` (선택)

### 3. 배포

```bash
npm run build
firebase deploy --only hosting
```

---

## ▲ Vercel 배포

### 1. GitHub 저장소 연결

1. [vercel.com](https://vercel.com) 접속
2. **"New Project"** → GitHub 저장소 선택
3. Framework Preset: **Vite**
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **"Deploy"** 클릭

### 2. 환경 변수 설정

Vercel 대시보드 → Settings → Environment Variables에서 Firebase 설정값을 추가합니다.

---

## 🌐 Netlify 배포

### 1. 드래그 & 드롭

```bash
npm run build
# dist/ 폴더를 Netlify 대시보드에 드래그 & 드롭
```

### 2. CI/CD 연동

1. [netlify.com](https://netlify.com) → **"New site from Git"**
2. Build command: `npm run build`
3. Publish directory: `dist`

---

## 📄 GitHub Pages 배포

### 1. vite.config.ts 수정

```typescript
export default defineConfig({
  base: '/stock-school/',  // 저장소 이름
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } }
});
```

### 2. GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## ⚡ 성능 최적화 팁

| 최적화 | 방법 |
|:---|:---|
| **코드 스플리팅** | `React.lazy()` + `Suspense` 적용 |
| **이미지 최적화** | SVG 아이콘 사용 (Lucide), WebP 이미지 |
| **번들 분석** | `npx vite-bundle-visualizer` |
| **캐싱** | Vite의 content hash 파일명으로 자동 캐시 무효화 |
| **Preload** | 중요 폰트에 `<link rel="preload">` 적용 |

---

<div align="center">

[⬆️ 맨 위로](#-배포-가이드) • [📖 README](../README.md)

</div>
