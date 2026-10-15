# 📈 주식 대시보드 — 프론트엔드

국내 주식 시세 차트, 관심종목·포트폴리오, 목표가 알림, 종목 채팅, AI 분석 화면을 제공하는 주식 대시보드의 웹 프론트엔드(SPA)입니다.

- 서비스: https://jyyouk.shop
- 백엔드: [stock-dashboard-backend](https://github.com/Youkjooyoung/stock-dashboard-backend)

---

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 언어·프레임워크 | JavaScript, React 19, Vite 8 |
| 라우팅·상태 | React Router 7, Zustand(로그인·알림 상태), TanStack Query(서버 데이터) |
| 통신 | Axios(토큰 자동 갱신), STOMP + SockJS(실시간) |
| 차트·화면 | Chart.js, lightweight-charts(캔들 차트), CSS Modules, motion |
| 품질 | ESLint, Vitest, Testing Library |
| 배포 | GitHub Actions, AWS S3 + CloudFront |

---

## 주요 화면

| 경로 | 화면 |
|---|---|
| `/` | 대시보드: 종목 시세 표, 캔들 차트, 관심종목, 뉴스, 종목 채팅, AI 분석 |
| `/compare` | 여러 종목 기간별 비교 |
| `/profile` | 내 정보, 포트폴리오, 가격 알림, 소셜 계정 연동, 비밀번호 변경·탈퇴 |
| `/login`, `/signup` | 로그인(이메일·카카오·구글), 본인인증 기반 회원가입 |
| `/admin` | 관리자: 회원·알림·채팅·종목 현황 |
| `/docs` | 프로젝트 문서 보기 |

---

## 프로젝트 구조

```
src
├── api/         # axiosInstance (토큰 첨부, 401 시 자동 재발급)
├── components/  # 화면 구성 요소 (차트, 채팅, 알림, 회원가입 단계 등)
├── hooks/       # React Query 훅, 웹소켓 훅(useStomp, useAlertSocket)
├── pages/       # 라우트별 페이지
├── router/      # 라우트 정의 (페이지 지연 로딩)
├── store/       # Zustand 전역 상태 (authStore, alertStore)
├── styles/      # 디자인 토큰, CSS Modules
├── config/      # 환경변수 (API 주소)
└── utils/       # 날짜·마스킹 등 공통 함수
docs/            # 프로젝트 문서 (아키텍처, API, ERD)
infra/           # S3·CloudFront CloudFormation 템플릿
```

---

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 입력
npm run dev                  # http://localhost:5173
```

### 환경변수

| 변수 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 주소 (예: `http://localhost:8443`). 웹소켓은 이 주소 뒤에 `/ws`를 붙여 연결합니다 |
| `VITE_PORTONE_IMP_KEY` | PortOne 가맹점 식별 코드 (본인인증 창) |

`VITE_`로 시작하는 값은 빌드 결과물에 그대로 들어가 누구나 볼 수 있습니다. API 키·비밀번호 같은 비밀값은 넣지 말고 백엔드에서만 관리합니다.

---

## 검사·빌드

```bash
npm run lint      # ESLint
npm run test:run  # Vitest
npm run build     # dist/ 생성
```

`package-lock.json`을 바꿨다면 `rm -rf node_modules && npm ci`로 깨끗한 설치가 되는지 확인합니다. CI는 `npm ci`를 사용합니다.

---

## 배포

`main`에 머지하면 GitHub Actions가 자동으로 배포합니다.

1. **Frontend CI**: 설치(`npm ci`) → 린트 → 테스트 → 빌드 (Node 20)
2. **Frontend Auto Deploy**: S3 업로드(`index.html`은 캐시 안 함, `assets/`는 1년 캐시) → CloudFront 캐시 무효화

---

## 참고

- 코드 작성 규칙과 보안 규칙: [`AGENTS.md`](AGENTS.md)
- 아키텍처·API·ERD 문서: [`docs/`](docs)

---

## 개발자

| 이름 | GitHub |
|---|---|
| 육주영 | [@Youkjooyoung](https://github.com/Youkjooyoung) |
