# 주식 대시보드 프로젝트

포트폴리오용 주식 정보 대시보드 웹 애플리케이션
개발 기간: 3개월 | 개발자 2명, 디자이너 1명

---

## Tech Stack

**Backend**
- Java 17, Spring Boot 3.3
- MyBatis (ORM)
- MySQL 8.0
- Spring Security + JWT (Access/Refresh Token)
- WebSocket/STOMP (실시간 시세)
- OAuth2 (Kakao, Google)
- PortOne V1 (본인인증)
- Resend API (이메일 인증)
- AES-256 (주민등록번호 암호화)
- AWS S3 (프로필 이미지)
- Anthropic API (AI 분석)

**Frontend**
- React 18, Vite
- Zustand (전역 상태)
- React Query (@tanstack/react-query)
- Axios (HTTP)
- Chart.js / react-chartjs-2
- CSS Modules

**Infra**
- AWS EC2 (프론트/백 분리 서버)
- Nginx (리버스 프록시)
- Let's Encrypt SSL
- Route53 DNS

---

## Project Structure

**Frontend**
```
src/
├── api/
│   ├── axiosInstance.js           # Axios 인터셉터 (JWT 자동 첨부, 401 refresh)
│   └── profileApi.js              # S3 프로필 이미지 업로드
├── components/
│   ├── AddressSearch.jsx          # 주소 검색
│   ├── AiAnalysis.jsx             # AI 종목 분석 패널
│   ├── AlertNotification.jsx      # 목표가 알림 토스트
│   ├── AlertSetter.jsx            # 목표가 설정 폼
│   ├── AppLayout.jsx              # 공통 레이아웃 (Header + 본문)
│   ├── CandlestickChart.jsx       # 캔들차트
│   ├── EmailVerifyStep.jsx        # 회원가입 이메일 인증 단계
│   ├── ErrorBoundary.jsx          # 전역 에러 경계
│   ├── Header.jsx                 # 상단 네비게이션
│   ├── NewsSection.jsx            # 종목 뉴스
│   ├── PhoneVerifyStep.jsx        # 회원가입 전화/본인인증 단계
│   ├── ProfileImageUpload.jsx     # S3 이미지 업로드 UI
│   ├── SecureKeypad.jsx           # 주민번호 뒷자리 보안 키패드
│   ├── SignupFormStep.jsx         # 회원가입 정보입력 단계
│   ├── StockCharts.jsx            # 주가 라인차트
│   ├── StockChat.jsx              # WebSocket 실시간 채팅
│   ├── StockListSkeleton.jsx      # 종목 리스트 스켈레톤 UI
│   ├── StockModal.jsx             # 종목 상세 모달
│   ├── StockModalSkeleton.jsx     # 종목 모달 스켈레톤 UI
│   ├── StockTable.jsx             # 종목 테이블
│   ├── StockTicker.jsx            # 실시간 시세 티커
│   ├── SummaryCards.jsx           # 요약 카드 (포트폴리오 등)
│   └── Toast.jsx                  # 토스트 알림
├── hooks/
│   └── useQueries.js              # React Query 훅 집중 관리
├── pages/
│   ├── AdminPage.jsx              # 관리자 페이지 (탭 5개)
│   ├── ComparePage.jsx            # 종목 비교
│   ├── DashboardPage.jsx          # 메인 대시보드
│   ├── ForgotPasswordPage.jsx     # 비밀번호 찾기
│   ├── LoginPage.jsx              # 로그인
│   ├── OAuthCallbackPage.jsx      # 소셜 로그인 콜백
│   ├── OAuthLinkCallbackPage.jsx  # 소셜 연동 콜백
│   ├── ProfilePage.jsx            # 마이페이지
│   ├── ResetPasswordPage.jsx      # 비밀번호 재설정
│   ├── SignupPage.jsx             # 회원가입 (3단계)
│   └── VerifyEmailPage.jsx        # 이메일 인증
├── router/
│   └── index.jsx                  # 라우터 (코드 스플리팅 + role 분기)
├── store/
│   └── authStore.js               # Zustand (user, role, token, logout)
└── styles/
    ├── global.css                 # CSS 변수, 전역 리셋
    ├── components/                # 컴포넌트별 .module.css
    └── pages/                     # 페이지별 .module.css
```

**Backend**
```
src/main/java/com/stock/dashboard/
├── config/          # CacheConfig, GlobalExceptionHandler
├── controller/      # Admin, AiAnalysis, Auth, Chat, News, Portfolio,
│                    # PriceAlert, Stock, User
├── dao/             # MyBatis Mapper 인터페이스
├── dto/             # DTO 클래스 (@Data 롬복)
├── scheduler/       # StockScheduler (시세 자동 수집)
├── service/         # 비즈니스 로직
├── util/            # AesEncryptor
├── JwtUtil.java
├── JwtAuthFilter.java
├── SecurityConfig.java
└── WebSocketConfig.java
```

---

## Server Info

| 구분 | 도메인 | IP |
|------|--------|----|
| Frontend | jyyouk.shop | 52.79.153.252 |
| Backend | api.jyyouk.shop | 3.37.153.11 |

**로컬 개발**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080` (로컬), `https://localhost:8443` (SSL)
- DB: `localhost:3306/stock_dashboard`

**환경변수 파일**
- 운영: `.env` (`VITE_API_BASE_URL=https://api.jyyouk.shop`)
- 로컬: `.env.local` (`VITE_API_BASE_URL=https://localhost:8443`)

---

## Commands

**Frontend**
```bash
# 로컬 실행
npm run dev

# 빌드
npm run build

# 운영 배포 (MobaXterm)
cd ~/stock-dashboard-frontend
git pull origin main
npm install
npm run build
sudo systemctl restart nginx
```

**Backend**
```bash
# 로컬 실행
./mvnw spring-boot:run

# 빌드
./mvnw clean package -DskipTests

# 운영 배포 (MobaXterm)
cd ~/stock-dashboard-backend
git pull origin main
./mvnw clean package -DskipTests
sudo systemctl restart stock-dashboard
```

**DB**
```bash
mysql -u root -p stock_dashboard
```

---

## Code Style

**공통 규칙**
- 주석 사용 금지
- 메소드명 알파벳 순서 정렬
- CSS, JS, JSX 파일 모듈화 유지

**Frontend (React)**
- CSS Modules 사용 (`styles.className`), 인라인 스타일 금지
- 전역 스타일은 `global.css`, 컴포넌트별 스타일은 `모듈명.module.css`
- React Query 훅은 `useQueries.js`에 집중 관리
- Zustand store는 `store/` 디렉토리
- `key` prop은 인덱스 대신 고유 ID 사용

**Backend (Java)**
- CRUD 순서로 메소드 정렬 (Create → Read → Update → Delete)
- private 헬퍼 메소드는 하단에 배치
- DTO는 @Data 롬복 사용

---

## API Endpoints (주요)

```
# 인증
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/portone/verify
POST /api/auth/forgot-password
POST /api/auth/reset-password

# OAuth2 소셜 로그인
GET  /api/auth/kakao/login
GET  /api/auth/google/login
GET  /api/auth/kakao/link          # 소셜 연동용
GET  /api/auth/google/link         # 소셜 연동용

# 사용자
GET  /api/user/profile
PUT  /api/user/profile
POST /api/user/profile-image
GET  /api/user/social
POST /api/user/social/link
DEL  /api/user/social/unlink/{provider}

# 주식 / 즐겨찾기 / 포트폴리오 / 알림
GET  /api/stock/prices
GET  /api/user/watchlist
GET  /api/user/portfolio
GET  /api/alert

# AI / 뉴스
POST /api/ai/analyze
GET  /api/news/{ticker}
WS   /ws/stock

# 관리자
GET  /api/admin/stats
GET  /api/admin/users
GET  /api/admin/watchlist/top
GET  /api/admin/stocks
GET  /api/admin/alerts
GET  /api/admin/chats
POST /api/admin/users/{userId}/unlock
POST /api/admin/users/{userId}/resend-verify
POST /api/admin/users/{userId}/role
```

---

## Git Workflow

```
main        # 운영 배포 브랜치
develop     # 개발 통합 브랜치
feat/*      # 기능 개발
fix/*       # 버그 수정
```

**커밋 컨벤션**
```
feat: 소셜 계정 연동 기능 추가
fix: 카카오 콜백 URL 오류 수정
refactor: UserService 메소드 정렬
style: ProfilePage CSS 수정
design: 네이버페이 스타일 UI 리디자인
chore: gitignore 추가
```

---

## 구현 완료

**인증/회원**
- [x] 회원가입 (PortOne 본인인증 → 주민번호 교차검증 → 정보입력 → 이메일인증)
- [x] 보안 키패드 (주민번호 뒷자리 가상 키패드, 랜덤 배치, 마스킹)
- [x] 로그인/로그아웃 (JWT Access/Refresh Token)
- [x] 이메일 미인증 로그인 차단 + 재발송 버튼 (60초 쿨타임)
- [x] 비밀번호 찾기/재설정 (이메일 링크 방식, 1시간 유효)
- [x] 카카오/구글 소셜 로그인
- [x] 소셜 계정 연동/해제 (SVG 로고, 연동 상태 배지)
- [x] 프로필 이미지 업로드 (AWS S3)

**주식 기능**
- [x] 주식 시세 조회 / 즐겨찾기
- [x] 포트폴리오 관리
- [x] 목표가 알림
- [x] WebSocket 실시간 시세
- [x] AI 종목 분석 (Anthropic API)
- [x] 뉴스 조회

**UI/UX**
- [x] 네이버페이 스타일 UI 리디자인 (CSS 변수 기반)
- [x] 스켈레톤 UI (종목 리스트, 상세 모달)
- [x] 토스트 알림
- [x] ErrorBoundary
- [x] 번들 최적화 (코드 스플리팅, lazy import)

**관리자**
- [x] 로그인 시 ADMIN → /admin 자동 이동 (role 기반 라우터 분기)
- [x] 통계 탭 (전체회원/오늘가입/이메일인증/계정잠금, 즐겨찾기 TOP5)
- [x] 회원 관리 탭 (잠금해제, 메일재발송, 권한변경)
- [x] 주식 관리 탭 (STOCK_ITEM 종목 목록)
- [x] 알림 관리 탭 (PRICE_ALERT 전체 목록)
- [x] AI 채팅 이력 탭 (CHAT_MESSAGE 최신 500건)

## 진행 중 / 예정

- [ ] develop → main 머지 후 운영 배포 (관리자 탭 3개 추가분)
- [ ] 소셜 연동 운영 배포 검증
