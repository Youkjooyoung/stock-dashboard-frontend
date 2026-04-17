# 주식 대시보드 — 포트폴리오 프로젝트 소개서

**기간**: 2026-01 ~ 2026-04 (3개월) | **역할**: 풀스택 개발 (프론트엔드 + 백엔드) | **팀**: 개발자 2명, 디자이너 1명

---

## 프로젝트 배경 및 목적

국내 주식 정보를 한 화면에서 조회·분석하고, 포트폴리오를 직접 관리할 수 있는 웹 대시보드가 필요했습니다. 단순 CRUD를 넘어 **실시간 시세(WebSocket)**, **소셜 로그인(OAuth2)**, **AI 종목 분석(Anthropic API)**, **보안 본인인증(PortOne V1)** 등 실무 수준의 기술을 직접 설계·구현하며 풀스택 역량을 증명하는 것이 목표였습니다.

---

## 담당 역할

| 영역 | 세부 내용 |
|------|-----------|
| **백엔드 설계** | Spring Boot 3.3.10 + MyBatis 아키텍처 설계, REST API 50+ 엔드포인트 구현 |
| **인증 시스템** | JWT Access/Refresh Token 이중 발급, Spring Security 6.x 필터 체인 구성 |
| **소셜 로그인** | 카카오·구글 OAuth2 콜백 플로우, 기존 계정 자동 연동 로직 |
| **본인인증** | PortOne V1 API 연동, 주민등록번호 AES-256 암호화 저장 |
| **실시간 기능** | WebSocket/STOMP 기반 실시간 주식 시세 브로드캐스트 |
| **캐시 전략** | Redis + Spring Cache 레이어 설계 (TTL 3단계 분리) |
| **프론트엔드** | React 19.2 + Vite 8.0, 번들 최적화(manualChunks + lazy loading) |
| **관측성** | Actuator + Prometheus + Grafana 6-패널 대시보드 구성 |
| **CI/CD** | GitHub Actions 빌드·테스트·배포 파이프라인 구성 |

---

## 주요 기술 도전 과제

### 1. JWT 이중 토큰 (Access / Refresh Token)

**문제**: 짧은 유효기간 토큰만 쓰면 UX가 나쁘고, 긴 토큰은 탈취 시 위험.

**해결**: Access Token(1시간) + Refresh Token(7일) 이중 구조를 설계했습니다.
- Refresh Token은 `REFRESH_TOKEN` 테이블에 DB 저장 → 서버 사이드 무효화(로그아웃·탈취 감지) 가능
- 프론트엔드 Axios 인터셉터에 `isRefreshing` 플래그 + `failedQueue` 패턴 구현 → 동시 401 요청 시 토큰 중복 갱신 방지
- HMAC SHA 알고리즘, subject=이메일, role 클레임 포함

### 2. Redis 캐시 레이어 (DB 부하 감소)

**문제**: 주식 시세 조회가 트래픽의 80% 이상을 차지하며, 매 요청마다 DB를 조회하면 커넥션 풀이 고갈될 위험.

**해결**: `spring-boot-starter-data-redis` 도입, `@Cacheable` + 캐시별 TTL 분리:
```
latestPrices  → 10분  (전체 시세 목록 — 변경 빈도 낮음)
allItems      → 1시간 (종목 마스터 — 거의 불변)
priceByTicker → 30분  (종목별 상세 — 중간 빈도)
```
- 로컬 개발: `ConcurrentMapCacheManager` (Redis 불필요), 운영: `RedisCacheManager` — `spring.cache.type` 프로파일 분기
- 네임스페이스: `stock-dashboard::` prefix로 키 충돌 방지

### 3. WebSocket/STOMP 실시간 시세

**문제**: 폴링(polling) 방식은 서버 부하가 크고 지연이 발생.

**해결**: `@stomp/stompjs 7.3 + sockjs-client 1.6`으로 클라이언트 STOMP 연결, 백엔드 `WebSocketConfig`에서 `/ws/stock` 엔드포인트 등록. 스케줄러(`StockScheduler`)가 외부 API로 수집한 시세를 STOMP 토픽으로 브로드캐스트.

### 4. PortOne V1 본인인증 + AES-256 암호화

**문제**: 회원가입 시 주민등록번호 수집이 필요하나, 원문 저장은 개인정보보호법 위반.

**해결**: PortOne V1 `imp_uid` 검증 후, 주민등록번호 뒷자리를 `AesEncryptor` (AES-256-CBC)로 암호화하여 DB 저장. 보안 키패드(가상 키패드, 랜덤 배치)로 화면 캡처 공격 방지. 비밀번호 변경·회원탈퇴에도 본인인증 필수.

### 5. OAuth2 소셜 로그인 + 계정 연동

**문제**: 동일 이메일로 가입한 일반 계정과 소셜 계정을 별도 계정으로 분리하면 UX가 나쁨.

**해결**: `USER_SOCIAL` 테이블에 `(USER_ID, PROVIDER)` 복합 연동 구조. 소셜 콜백 시 이메일 일치 시 자동 매칭, 이미 가입된 계정에 소셜을 후속 연동할 때 `state` 파라미터에 JWT를 인코딩하여 인증 상태 유지.

### 6. 탈퇴 계정 소프트 삭제 + 복구

**문제**: 즉시 삭제 시 데이터 복구 불가, 규정 위반 가능성.

**해결**: `USERS.DELETED_AT` 컬럼으로 2주 소프트 삭제. 재가입 감지 시 임시 비밀번호 발급 + `FORCE_PW_CHANGE='Y'` 플래그로 강제 변경 유도.

---

## 성과 지표

| 지표 | 내용 |
|------|------|
| **번들 최적화** | Vite `manualChunks` 4개 청크 분리 (`vendor-react`, `vendor-chart`, `vendor-stomp`, `vendor`) + `lazy()` 전 페이지 적용 → 초기 로딩 청크 최소화 |
| **테스트 커버리지** | 백엔드: JUnit5 + Mockito 단위 35케이스, Testcontainers MySQL 통합 7케이스 / 프론트: Vitest + RTL 28케이스 |
| **캐시 효과** | Redis TTL 도입으로 주식 시세 조회 API DB 히트 제거 (로컬: ConcurrentMap, 운영: Redis 7-alpine) |
| **관측성** | Prometheus + Grafana 6-패널 대시보드 (JVM Heap, CPU, HTTP req/rate, p95 latency, HikariCP, 캐시 hit/miss) |
| **보안** | 5분 만료 보안 검증 토큰(sessionStorage), 다이렉트 URL 접근 차단, 계정 잠금(5회 실패) |

---

## 구현 완료 기능 요약

**인증/회원**: 회원가입(PortOne 본인인증 → 주민번호 교차검증 → 이메일인증), 보안 키패드, 로그인/로그아웃(JWT), 이메일 미인증 차단, 비밀번호 찾기/재설정, 카카오·구글 소셜 로그인, 소셜 연동/해제, S3 프로필 이미지, 비밀번호 변경, 회원탈퇴(2주 소프트삭제), 탈퇴 계정 복구

**주식 기능**: 시세 조회/즐겨찾기, 포트폴리오 관리, 목표가 알림, WebSocket 실시간 시세, AI 종목 분석(Anthropic API), 뉴스 조회

**관리자**: 통계 대시보드, 회원 관리(검색/필터/정렬/페이지네이션), 계정 잠금해제, 권한 변경, 주식·알림·채팅 이력 관리

---

## 향후 개선 계획

- [ ] Resend 이메일 커스텀 도메인 전환 (현재 sandbox)
- [ ] GitHub Actions Secrets 등록 후 CI/CD 실전 검증
- [ ] Docker Compose 백엔드 + DB 통합 로컬 환경 완성
- [ ] 포트폴리오 손익 분석 고도화 (섹터별 분산도, 리스크 지표)

---

## 링크

- **서비스**: https://jyyouk.shop
- **백엔드 API**: https://api.jyyouk.shop
- **README**: [README.md](README.md)
- **API 명세**: [api-reference.md](api-reference.md)
- **아키텍처**: [architecture.md](architecture.md)
- **ERD**: [erd.md](erd.md)
