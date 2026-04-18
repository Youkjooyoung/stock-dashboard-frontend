# API 명세서

**Base URL**: `https://api.jyyouk.shop` (운영) / `https://localhost:8443` (로컬)

## 인증

모든 인증 필요 엔드포인트는 `Authorization` 헤더에 Bearer 토큰을 포함해야 합니다.

```http
Authorization: Bearer <accessToken>
```

**토큰 정보**
- Access Token 유효기간: **1시간**
- Refresh Token 유효기간: **7일** (DB 저장, 서버 사이드 무효화 가능)
- 서명 알고리즘: HMAC SHA
- Payload 클레임: `sub` (이메일), `role` (USER / ADMIN)

Access Token 만료 시 `/api/auth/refresh`로 재발급합니다.

---

## 1. 인증 (`/api/auth`)

> 모든 인증 엔드포인트는 인증 불필요 (permitAll)

### POST /api/auth/login

로그인 후 Access Token + Refresh Token 발급.

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123!"
}
```

**Response 200**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "userId": 1,
  "role": "USER"
}
```

**에러**
| 상태 | 메시지 |
|------|--------|
| 400 | 이메일 인증이 필요합니다. |
| 400 | 존재하지 않는 이메일입니다. |
| 400 | 비밀번호가 올바르지 않습니다. |
| 400 | 계정이 잠겨있습니다. |

---

### POST /api/auth/register

신규 회원 즉시 생성 (레거시/관리자용). 실제 사용자 회원가입 플로우는 `/api/auth/signup`을 사용.

---

### POST /api/auth/signup

회원가입 (PortOne 본인인증 선행 필요).

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "password123!",
  "name": "홍길동",
  "nickname": "길동이",
  "phone": "01012345678",
  "address": "서울시 강남구",
  "addressDetail": "101호",
  "residentNo": "901010-1234567"
}
```

**Response 200**
```json
{ "message": "이메일 인증 메일을 발송했습니다." }
```

---

### POST /api/auth/logout

로그아웃 (Refresh Token DB 삭제).

**Request Body**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1..." }
```

**Response 200** — `text/plain` 문자열 반환
```
로그아웃 완료
```

---

### POST /api/auth/refresh

Access Token 재발급.

**Request Body**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1..." }
```

**Response 200**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1..."
}
```

---

### POST /api/auth/certify

PortOne 본인인증 검증.

**Request Body**
```json
{ "impUid": "imp_123456789" }
```

**Response 200**
```json
{ "message": "본인인증이 완료되었습니다." }
```

---

### POST /api/auth/verify-identity

로그인된 사용자 본인인증 (비밀번호 변경·탈퇴 전 재인증).

**Headers**: `Authorization: Bearer <token>`

**Request Body**
```json
{ "impUid": "imp_123456789" }
```

**Response 200**
```json
{ "verifyToken": "...", "message": "본인인증이 완료되었습니다." }
```

---

### POST /api/auth/forgot-password

비밀번호 재설정 이메일 발송.

**Request Body**
```json
{ "email": "user@example.com" }
```

**Response 200**
```json
{ "message": "비밀번호 재설정 이메일을 발송했습니다." }
```

---

### POST /api/auth/reset-password

비밀번호 재설정 실행 (이메일 링크, 1시간 유효).

**Request Body**
```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123!"
}
```

**Response 200**
```json
{ "message": "비밀번호가 변경되었습니다." }
```

---

### GET /api/auth/verify-email

이메일 인증 완료.

**Query Params**: `token=<email-verify-token>`

**Response 200** → 이메일 인증 완료 처리

---

### POST /api/auth/check-email

이메일 중복 확인.

**Request Body**
```json
{ "email": "user@example.com" }
```

**Response 200**
```json
{ "exists": true }
```

---

### POST /api/auth/resend-verify

이메일 인증 메일 재발송 (60초 쿨타임).

**Request Body**
```json
{ "email": "user@example.com" }
```

---

### POST /api/auth/check-deleted

탈퇴 계정 여부 확인.

**Request Body**
```json
{ "email": "user@example.com" }
```

**Response 200**
```json
{ "deleted": true }
```

---

### POST /api/auth/recover-account

탈퇴 계정 복구 (임시 비밀번호 발급 + 강제 변경).

**Request Body**
```json
{
  "email": "user@example.com",
  "name": "홍길동",
  "phone": "01012345678"
}
```

---

### OAuth2 소셜 로그인

| 경로 | 설명 |
|------|------|
| `GET /api/auth/kakao/login` | 카카오 인증 화면으로 리다이렉트 |
| `GET /api/auth/google/login` | 구글 인증 화면으로 리다이렉트 |
| `GET /api/auth/kakao/callback?code=` | 카카오 콜백 — 토큰 발급 후 프론트 리다이렉트 |
| `GET /api/auth/google/callback?code=` | 구글 콜백 — 토큰 발급 후 프론트 리다이렉트 |
| `GET /api/auth/kakao/exchange` | 단기 교환 토큰을 Access/Refresh Token으로 교환 |
| `GET /api/auth/google/exchange` | 단기 교환 토큰을 Access/Refresh Token으로 교환 |

### 소셜 계정 연동

| 경로 | 설명 |
|------|------|
| `GET /api/auth/kakao/link?token=` | 기존 계정에 카카오 연동 시작 |
| `GET /api/auth/google/link?token=` | 기존 계정에 구글 연동 시작 |
| `GET /api/auth/kakao/link/callback?code=&token=` | 카카오 연동 콜백 |
| `GET /api/auth/google/link/callback?code=&token=` | 구글 연동 콜백 |

---

## 2. 사용자 (`/api/user`)

> 모든 엔드포인트 인증 필요 (`Authorization: Bearer <token>`)

### GET /api/user/info

내 프로필 정보 조회.

**Response 200**
```json
{
  "userId": 1,
  "email": "user@example.com",
  "nickname": "길동이",
  "name": "홍길동",
  "phone": "01012345678",
  "profileImageUrl": "https://s3.amazonaws.com/...",
  "role": "USER",
  "emailVerified": true,
  "forcePwChange": "N"
}
```

---

### PUT /api/user/nickname

닉네임 변경.

**Request Body**
```json
{ "nickname": "새닉네임" }
```

---

### GET /api/user/nickname/check

닉네임 중복 확인.

**Query Params**: `nickname=<닉네임>`

**Response 200**
```json
{ "available": true }
```

---

### PUT /api/user/password

비밀번호 변경.

**Request Body**
```json
{
  "currentPassword": "oldPassword123!",
  "newPassword": "newPassword123!"
}
```

---

### PUT /api/user/profile-image

프로필 이미지 업로드 (AWS S3 저장).

**Content-Type**: `multipart/form-data`

**Form Field**: `file` — 이미지 파일

**Response 200**
```json
{ "imageUrl": "https://s3.amazonaws.com/..." }
```

---

### DELETE /api/user/account

회원탈퇴 (2주 소프트 삭제 보류).

**Request Body**
```json
{
  "verifyToken": "...",
  "deleteReason": "탈퇴 사유"
}
```

---

### GET /api/user/social

소셜 연동 목록.

**Response 200**
```json
[
  { "provider": "KAKAO", "providerEmail": "user@kakao.com" },
  { "provider": "GOOGLE", "providerEmail": "user@gmail.com" }
]
```

---

### POST /api/user/social/link

소셜 계정 연동.

**Request Body**
```json
{
  "provider": "KAKAO",
  "providerEmail": "user@kakao.com"
}
```

---

### DELETE /api/user/social/unlink/{provider}

소셜 연동 해제.

**Path Params**: `provider` — `KAKAO` 또는 `GOOGLE`

---

### GET /api/user/watchlist

즐겨찾기 종목 목록.

**Response 200**
```json
[
  { "itemId": 1, "ticker": "005930", "itemNm": "삼성전자", "market": "KOSPI" }
]
```

---

### GET /api/user/watchlist/detail

즐겨찾기 종목 상세 (최신 시세 포함).

---

### POST /api/user/watchlist/{itemId}

즐겨찾기 추가.

**Path Params**: `itemId` — 종목 ID

---

### DELETE /api/user/watchlist/{itemId}

즐겨찾기 삭제.

---

## 3. 포트폴리오 (`/api/portfolio`)

> 인증 필요. **Base path는 `/api/user`가 아닌 `/api/portfolio`** 에 유의.

### GET /api/portfolio

포트폴리오 목록.

**Response 200**
```json
[
  {
    "portfolioId": 1,
    "ticker": "005930",
    "stockName": "삼성전자",
    "quantity": 10,
    "buyPrice": 70000.00,
    "buyDate": "2026-01-15",
    "createdAt": "2026-01-15"
  }
]
```

---

### POST /api/portfolio

포트폴리오 항목 추가.

**Request Body**
```json
{
  "ticker": "005930",
  "stockName": "삼성전자",
  "quantity": 10,
  "buyPrice": 70000.00,
  "buyDate": "2026-01-15"
}
```

---

### DELETE /api/portfolio/{id}

포트폴리오 항목 삭제.

**Path Params**: `id` — 포트폴리오 ID

---

## 4. 주식 (`/api/stock`)

> `GET /api/stock/prices`, `GET /api/stock/prices/**`, `GET /api/stock/items` — 인증 불필요

### GET /api/stock/prices

전체 종목 최신 시세 목록.

**캐시**: `latestPrices` (TTL 10분)

**Response 200**
```json
[
  {
    "ticker": "005930",
    "itemNm": "삼성전자",
    "market": "KOSPI",
    "closePrice": 75000,
    "openPrice": 74000,
    "highPrice": 75500,
    "lowPrice": 73500,
    "volume": 12000000,
    "tradeDate": "20260417"
  }
]
```

---

### GET /api/stock/prices/{ticker}

종목 상세 시세 (최근 N일).

**캐시**: `priceByTicker` (TTL 30분)

**Path Params**: `ticker` — 종목코드 (예: `005930`)

---

### GET /api/stock/items

전체 종목 마스터 목록.

**캐시**: `allItems` (TTL 1시간)

**Response 200**
```json
[
  { "itemId": 1, "ticker": "005930", "itemNm": "삼성전자", "market": "KOSPI" }
]
```

---

### GET /api/stock/prices/{ticker}/range

기간별 시세 조회.

**Query Params**: `startDate=20260101&endDate=20260417`

---

> `/api/stock/collect/**` 이하 모든 수집 엔드포인트는 **ADMIN 역할 필수** (`SecurityConfig`에서 `hasRole("ADMIN")` 제한).

### GET /api/stock/collect

공공데이터 포털에서 지정 일자 시세를 즉시 수집.

**Query Params**: `basDt=20260417` (필수, `YYYYMMDD`)

---

### GET /api/stock/collect/range

기간 지정 시세 수집.

**Query Params**: `startDate=20260101&endDate=20260417` (둘 다 필수, `YYYYMMDD`)

---

### POST /api/stock/collect/history/all

전체 종목 과거 이력 일괄 수집 (`@Async` 비동기 실행).

**Query Params**: `startDate`, `endDate` (필수), `fromIndex` (기본 0), `skipExisting` (기본 false)

---

### GET /api/stock/collect/history/status

비동기 수집 진행 상태 조회.

**Response 200**
```json
{ "status": "RUNNING", "current": 1250, "total": 2800 }
```

---

### POST /api/stock/prices/{ticker}/collect

단일 종목 과거 시세 수집.

**Path Params**: `ticker` — 종목코드

---

## 5. 알림 (`/api/alert`)

> 인증 필요

### GET /api/alert

내 목표가 알림 목록.

**Response 200**
```json
[
  {
    "alertId": 1,
    "ticker": "005930",
    "stockName": "삼성전자",
    "targetPrice": 80000,
    "alertType": "ABOVE",
    "isTriggered": false,
    "createdAt": "2026-04-01T10:00:00"
  }
]
```

---

### POST /api/alert

알림 추가.

**Request Body**
```json
{
  "ticker": "005930",
  "stockName": "삼성전자",
  "targetPrice": 80000,
  "alertType": "ABOVE"
}
```

`alertType`: `ABOVE` (목표가 이상) / `BELOW` (목표가 이하)

---

### DELETE /api/alert/{alertId}

알림 삭제.

**Path Params**: `alertId` — 알림 ID

---

## 6. AI 분석 / 뉴스 / 채팅

### POST /api/ai/analyze

AI 종목 분석 (Anthropic Claude API).

**인증 필요**

**Request Body** — 질문 전체를 **단일 `prompt` 필드**로 전송
```json
{ "prompt": "삼성전자(005930)의 현재 매수 타이밍을 분석해주세요." }
```

**Response 200**
```json
{ "analysis": "Anthropic API 응답 텍스트..." }
```

**Response 400** — `prompt` 누락/공백
```json
{ "error": "prompt가 필요합니다." }
```

---

### GET /api/news

전체 뉴스 조회.

**인증 불필요**

**Query Params**: `query` (기본 `주식`), `display` (기본 10, 최대 네이버 뉴스 API 제한)

---

### GET /api/news/{stockName}

특정 종목 관련 뉴스 조회. 서버 내부에서 `stockName + " 주식"` 키워드로 네이버 뉴스 API 호출.

**인증 불필요**

**Path Params**: `stockName` — 종목명(한글, 예: `삼성전자`)

**Query Params**: `display` (기본 5)

---

### GET /api/chat/{ticker}

종목 채팅방 최근 **50건** 메시지 조회 (페이지네이션 없음).

**인증 불필요**

**Path Params**: `ticker` — 종목코드 (예: `005930`)

**Response 200**
```json
[
  {
    "msgId": 123,
    "ticker": "005930",
    "userEmail": "user@example.com",
    "nickname": "길동이",
    "content": "실적 발표가 기대됩니다.",
    "createdAt": "2026-04-17T10:20:00.000+09:00"
  }
]
```

---

### WebSocket — `/ws/stock` (STOMP)

**인증**: SockJS 연결은 permitAll, 메시지 publish 시 `Authorization: Bearer <token>` 헤더 필수 (채팅용).

**연결**
```javascript
const client = new Client({
  webSocketFactory: () => new SockJS('/ws/stock'),
});
client.activate();
```

**① 실시간 시세 수신** (구독 전용, 서버가 스케줄러에서 브로드캐스트)
```javascript
client.subscribe('/topic/stock-price', (msg) => {
  const price = JSON.parse(msg.body);
});
```

**② 종목별 채팅** (양방향)

- **구독**: `/topic/chat/{ticker}` — 해당 종목 채팅방 신규 메시지 수신
- **전송**: `/app/chat/{ticker}` — `ChatController.@MessageMapping("/chat/{ticker}")`가 처리
  - Headers: `Authorization: Bearer <accessToken>` (필수, JWT에서 email 추출)
  - Payload: `{ "nickname": "길동이", "content": "메시지" }`
  - 서버가 DB 저장 후 `/topic/chat/{ticker}`로 브로드캐스트

```javascript
client.subscribe('/topic/chat/005930', (msg) => {
  const chatMsg = JSON.parse(msg.body);
});

client.publish({
  destination: '/app/chat/005930',
  headers: { Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ nickname: '길동이', content: '안녕하세요' }),
});
```

---

## 7. 관리자 (`/api/admin`)

> ADMIN 역할 필요

### GET /api/admin/stats

대시보드 통계 (전체 회원, 오늘 가입, 이메일 인증, 계정 잠금, 즐겨찾기 TOP5).

### GET /api/admin/users

회원 목록 (검색, 권한 필터, 상태 필터, 컬럼 정렬, 페이지네이션).

**Query Params**: `keyword=`, `role=`, `status=`, `sort=`, `page=`, `size=`

### POST /api/admin/users/{userId}/unlock

계정 잠금 해제.

### POST /api/admin/users/{userId}/resend-verify

인증 메일 재발송.

### POST /api/admin/users/{userId}/role

권한 변경.

**Request Body**
```json
{ "role": "ADMIN" }
```

### GET /api/admin/watchlist/top

즐겨찾기 TOP 종목.

### GET /api/admin/stocks

주식 종목 목록 (STOCK_ITEM).

### GET /api/admin/alerts

전체 알림 목록 (PRICE_ALERT).

### GET /api/admin/chats

AI 채팅 이력 (최신 500건, CHAT_MESSAGE).

---

## 공통 에러 응답

```json
{ "message": "에러 메시지" }
```

| HTTP 상태 | 예외 타입 | 설명 |
|-----------|-----------|------|
| 400 | RuntimeException | 비즈니스 로직 오류 |
| 400 | IllegalArgumentException | 잘못된 요청 파라미터 |
| 401 | SecurityException | 인증 실패 / 토큰 만료 |
| 500 | Exception | 서버 내부 오류 (`"서버 오류가 발생했습니다."`) |
