# 시스템 아키텍처

## 1. 전체 시스템 구성도

```mermaid
graph TB
    subgraph Client["클라이언트 레이어"]
        Browser["브라우저\n(jyyouk.shop)"]
        React["React 19.2 + Vite 8.0\nZustand · React Query\nChart.js · lightweight-charts"]
    end

    subgraph CDN["프론트엔드 서버\nAWS EC2 52.79.153.252"]
        Nginx1["Nginx\n(정적 파일 서빙)"]
    end

    subgraph BE["백엔드 서버\nAWS EC2 3.37.153.11"]
        Nginx2["Nginx\n(리버스 프록시 + SSL)"]
        Spring["Spring Boot 3.3.10\n(Docker 컨테이너)"]
        Redis["Redis 7\n(캐시 레이어)"]
    end

    subgraph DB["데이터 레이어"]
        MySQL["MySQL 8.0\nstock_dashboard"]
    end

    subgraph External["외부 서비스"]
        Kakao["카카오 OAuth2"]
        Google["구글 OAuth2"]
        PortOne["PortOne V1\n(본인인증)"]
        S3["AWS S3\n(프로필 이미지)"]
        OpenAI["OpenAI\n(AI 분석)"]
        Resend["Resend API\n(이메일)"]
        KRX["공공데이터 포털\n(주식 시세)"]
    end

    subgraph Observability["관측성"]
        Prometheus["Prometheus"]
        Grafana["Grafana\n(6-패널 대시보드)"]
    end

    Browser --> Nginx1
    Nginx1 --> React
    React -->|"HTTPS REST"| Nginx2
    React -.->|"WSS STOMP"| Nginx2
    Nginx2 --> Spring
    Spring <--> Redis
    Spring <--> MySQL
    Spring --> Kakao
    Spring --> Google
    Spring --> PortOne
    Spring --> S3
    Spring --> OpenAI
    Spring --> Resend
    Spring --> KRX
    Spring -->|"/actuator/prometheus"| Prometheus
    Prometheus --> Grafana
```

---

## 2. 백엔드 레이어 구조

```mermaid
graph LR
    subgraph Filter["필터 레이어"]
        JwtFilter["JwtAuthFilter\n(토큰 검증)"]
        Security["SecurityConfig\n(CORS · permitAll 설정)"]
    end

    subgraph Controller["Controller 레이어"]
        Auth["AuthController\n/api/auth/**"]
        User["UserController\n/api/user/**"]
        Stock["StockController\n/api/stock/**"]
        Portfolio["PortfolioController"]
        Alert["PriceAlertController\n/api/alert/**"]
        Admin["AdminController\n/api/admin/**"]
        AI["AiAnalysisController\n/api/ai/**"]
        Chat["ChatController\nWebSocket"]
        News["NewsController\n/api/news/**"]
    end

    subgraph Service["Service 레이어"]
        UserSvc["UserService"]
        StockSvc["StockService\n(@Cacheable)"]
        AdminSvc["AdminService"]
        AiSvc["AiAnalysisService"]
        EmailSvc["EmailService"]
        S3Svc["S3Service"]
    end

    subgraph DAO["DAO 레이어\n(MyBatis @Mapper)"]
        UserDao["UserDao"]
        StockDao["StockDao"]
        PortfolioDao["PortfolioDao"]
        AlertDao["PriceAlertDao"]
        RefreshDao["RefreshTokenDao"]
        ChatDao["ChatDao"]
        AdminDao["AdminDao"]
    end

    subgraph Cache["캐시 레이어"]
        RedisCache["Redis / ConcurrentMap\nlatestPrices·allItems·priceByTicker"]
    end

    JwtFilter --> Controller
    Controller --> Service
    Service --> DAO
    Service --> Cache
    StockSvc --> Cache
```

---

## 3. JWT 인증 플로우

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant F as JwtAuthFilter
    participant A as AuthController
    participant S as UserService
    participant D as RefreshTokenDao
    participant DB as MySQL

    Note over C,DB: 로그인
    C->>A: POST /api/auth/login {email, password}
    A->>S: login(request)
    S->>DB: findByEmail(email)
    DB-->>S: UserDto
    S->>S: BCrypt.matches(password)
    S->>S: JwtUtil.generateAccessToken() [1시간]
    S->>S: JwtUtil.generateRefreshToken() [7일]
    S->>D: insertRefreshToken(userId, token, expiredAt)
    S-->>A: {accessToken, refreshToken, userId, role}
    A-->>C: 200 OK

    Note over C,DB: 인증 요청
    C->>F: GET /api/user/info\nAuthorization: Bearer <accessToken>
    F->>F: JwtUtil.validateToken(accessToken)
    F->>F: SecurityContext에 인증 정보 등록
    F-->>C: 통과

    Note over C,DB: 토큰 갱신 (401 감지)
    C->>A: POST /api/auth/refresh {refreshToken}
    A->>D: findByToken(refreshToken)
    D-->>A: RefreshTokenDto (EXPIRED_AT 검증)
    A->>S: JwtUtil.generateAccessToken()
    A->>S: JwtUtil.generateRefreshToken()
    A->>D: delete + insert (토큰 교체)
    A-->>C: {accessToken, refreshToken}
```

---

## 4. OAuth2 소셜 로그인 플로우

```mermaid
sequenceDiagram
    participant U as 사용자
    participant FE as 프론트엔드
    participant BE as Spring Boot
    participant OAuth as 카카오/구글

    U->>FE: 소셜 로그인 버튼 클릭
    FE->>BE: GET /api/auth/kakao/login
    BE-->>U: 302 Redirect → 카카오 인증 화면

    U->>OAuth: 로그인 동의
    OAuth->>BE: GET /api/auth/kakao/callback?code=XXX

    BE->>OAuth: code로 accessToken 요청
    OAuth-->>BE: kakaoAccessToken

    BE->>OAuth: kakaoAccessToken으로 사용자 정보 요청
    OAuth-->>BE: {email, nickname, ...}

    alt 가입된 이메일
        BE->>BE: USER_SOCIAL 레코드 확인/생성
        BE->>BE: issueTokens() — JWT 발급
        BE-->>FE: 302 Redirect → /oauth?token=...&userId=...&role=...
    else 미가입 이메일
        BE-->>FE: 302 Redirect → /oauth?error=not_found
    end

    FE->>FE: fragment에서 토큰 추출 → localStorage 저장
    FE->>FE: /로 이동 (대시보드)
```

---

## 5. Redis 캐시 레이어

```mermaid
graph LR
    Client["클라이언트"] -->|GET /api/stock/prices| StockCtrl["StockController"]
    StockCtrl -->|@Cacheable\n'latestPrices'| CacheLayer

    subgraph CacheLayer["캐시 레이어"]
        direction TB
        Check{캐시 히트?}
        Redis[(Redis 7\nstock-dashboard::)]
        ConcurrentMap[(ConcurrentMapCache\n로컬 개발)]
    end

    subgraph TTL["캐시별 TTL"]
        L1["latestPrices\n10분"]
        L2["allItems\n1시간"]
        L3["priceByTicker\n30분"]
        L4["기본\n5분"]
    end

    Check -->|"HIT"| Client
    Check -->|"MISS"| StockSvc["StockService\n(DB 조회)"]
    StockSvc --> MySQL[(MySQL 8.0)]
    MySQL -->|결과 캐시 저장| Redis

    subgraph Profile["프로파일 분기"]
        Local["spring.cache.type=simple\n→ ConcurrentMapCacheManager"]
        Prod["spring.cache.type=redis\n→ RedisCacheManager\n(GenericJackson2JsonRedisSerializer)"]
    end
```

---

## 6. WebSocket 실시간 시세 플로우

```mermaid
sequenceDiagram
    participant C as 클라이언트
    participant WS as WebSocketConfig\n(/ws/stock)
    participant Scheduler as StockScheduler
    participant KRX as 공공데이터 포털

    Note over Scheduler,KRX: 주기적 시세 수집
    Scheduler->>KRX: HTTP 시세 조회 (java.net.http.HttpClient)
    KRX-->>Scheduler: 종목별 시세 데이터

    Scheduler->>Scheduler: DB 저장 + 캐시 무효화(@CacheEvict)
    Scheduler->>WS: SimpMessagingTemplate.convertAndSend\n("/topic/stock-price", priceData)

    Note over C,WS: 클라이언트 구독
    C->>WS: STOMP CONNECT (SockJS)
    WS-->>C: CONNECTED
    C->>WS: SUBSCRIBE /topic/stock-price

    Note over C,WS: 실시간 수신
    WS-->>C: MESSAGE (JSON 시세 데이터)
    C->>C: UI 업데이트 (AnimatedNumber, StockTable)
```

---

## 7. 프론트엔드 아키텍처

```mermaid
graph TB
    subgraph Router["react-router-dom 7.13"]
        AppLayout["AppLayout\n(인증 가드)"]
        Public["Public Routes\n/login · /signup · /oauth/**\n/verify-email · /forgot-password\n/reset-password · /admin · /change-password · /docs"]
        Protected["Protected Routes\n/ · /compare · /profile"]
    end

    subgraph State["상태 관리"]
        Zustand["Zustand 5.0\nauthStore — JWT · user · role\nalertStore — 알림 뱃지"]
        ReactQuery["React Query 5.95\n서버 상태 캐시"]
    end

    subgraph API["API 레이어"]
        Axios["axiosInstance.js\nbaseURL · timeout 10s\nRequest Interceptor: JWT 첨부\nResponse Interceptor: 401 재갱신\n(isRefreshing + failedQueue)"]
    end

    subgraph Bundle["번들 최적화 (manualChunks)"]
        VendorReact["vendor-react\nreact · react-dom · react-router-dom"]
        VendorChart["vendor-chart\nchart.js · react-chartjs-2 · recharts"]
        VendorStomp["vendor-stomp\n@stomp · sockjs"]
        Vendor["vendor\n나머지 node_modules"]
    end

    Router --> State
    State --> API
    API -->|REST| Spring["Spring Boot"]
    API -.->|STOMP WS| Spring
```

---

## 인프라 배포 구성

| 구분 | 서버 | 배포 방식 |
|------|------|-----------|
| 프론트엔드 | AWS EC2 (jyyouk.shop) | GitHub Actions → SCP → Nginx 원자 교체 |
| 백엔드 | AWS EC2 (api.jyyouk.shop) | GitHub Actions → SSH → mvn package → systemctl restart |
| DB | 백엔드 서버 내 MySQL | — |
| 컨테이너 | Docker (백엔드) | Dockerfile + docker-compose.yml |
| SSL | Let's Encrypt | Nginx + Certbot |
| DNS | AWS Route53 | A Record |
