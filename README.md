# 📈 Stock Dashboard - Frontend

> 실시간 주식 데이터 조회, AI 분석, JWT 인증 기반 주식 대시보드 프론트엔드

---

## 📌 프로젝트 소개

개인 포트폴리오 프로젝트로, 실시간 주식 데이터 시각화 및 AI 분석 기능을 제공하는 SPA(Single Page Application)입니다.
React + Vite 기반으로 구현되었으며 JWT 인증, WebSocket 실시간 통신, 모듈화된 CSS를 활용합니다.

---

## 🛠 기술 스택

- **Language** : JavaScript (ES6+)
- **Framework** : React 18
- **Build Tool** : Vite
- **Routing** : React Router
- **상태 관리** : Zustand
- **HTTP 통신** : Axios
- **실시간 통신** : WebSocket (STOMP)
- **스타일** : CSS Modules
- **기타** : ESLint

---

## ✨ 주요 기능

### 🔐 JWT 로그인 / 회원가입
- Access Token / Refresh Token 기반 인증
- 소셜 로그인 (OAuth) 지원
- 이메일 인증, 휴대폰 인증 단계별 회원가입
- 인증 상태 전역 관리 (`authStore`)

### 📊 주식 실시간 조회 및 차트
- 실시간 주식 가격 데이터 조회
- 캔들스틱 차트 (`CandlestickChart`)
- 주식 종목 비교 페이지 (`ComparePage`)
- 실시간 주식 티커 (`StockTicker`)

### 🤖 AI 분석
- 주식 데이터 기반 AI 분석 리포트 조회
- AI 분석 결과 시각화 (`AiAnalysis`)

### 💼 포트폴리오 관리
- 보유 종목 등록 / 수정 / 삭제
- 포트폴리오 수익률 시각화 (`SummaryCards`)

### 🔔 가격 알림
- 목표 주가 알림 설정 (`AlertSetter`)
- WebSocket 기반 실시간 알림 수신 (`AlertNotification`)
- 알림 전역 상태 관리 (`alertStore`)

### 📰 뉴스 조회
- 주식 관련 최신 뉴스 조회 (`NewsSection`)

### 💬 실시간 채팅
- WebSocket 기반 실시간 채팅 (`StockChat`)

---

## 📁 프로젝트 구조

```
src/
├── api/
│   └── axiosInstance.js
├── assets/
├── components/
│   ├── AiAnalysis.jsx
│   ├── AlertNotification.jsx
│   ├── AlertSetter.jsx
│   ├── AppLayout.jsx
│   ├── CandlestickChart.jsx
│   ├── EmailVerifyStep.jsx
│   ├── ErrorBoundary.jsx
│   ├── Header.jsx
│   ├── NewsSection.jsx
│   ├── PhoneVerifyStep.jsx
│   ├── SignupFormStep.jsx
│   ├── StockCharts.jsx
│   ├── StockChat.jsx
│   ├── StockModal.jsx
│   ├── StockTable.jsx
│   ├── StockTicker.jsx
│   └── SummaryCards.jsx
├── hooks/
│   ├── useAlertSocket.js
│   ├── useDarkMode.js
│   └── useQueries.js
├── pages/
│   ├── ComparePage.jsx
│   ├── DashboardPage.jsx
│   ├── LoginPage.jsx
│   ├── OAuthCallbackPage.jsx
│   ├── ProfilePage.jsx
│   └── SignupPage.jsx
├── router/
│   └── index.jsx
├── store/
│   ├── alertStore.js
│   └── authStore.js
├── styles/
│   ├── components/
│   ├── pages/
│   └── global.css
├── App.jsx
└── main.jsx
```

---

## ⚙️ 실행 방법

### 사전 요구사항
- Node.js 18 이상
- npm 9 이상

### 1. 레포지토리 클론
```bash
git clone https://github.com/Youkjooyoung/stock-dashboard-frontend.git
cd stock-dashboard-frontend
```

### 2. 패키지 설치
```bash
npm install
```

### 3. 환경 설정
`.env` 파일 생성 후 값 입력:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

### 4. 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 🔗 관련 레포지토리

- **Backend** : [stock-dashboard-backend](https://github.com/Youkjooyoung/stock-dashboard-backend)

---

## 👨‍💻 개발자

- **Youkjooyoung** : [@Youkjooyoung](https://github.com/Youkjooyoung)
