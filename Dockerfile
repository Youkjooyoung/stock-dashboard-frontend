# ── Stage 1: 의존성 설치 ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: 빌드 ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시점 환경변수 (Vite는 빌드 타임에 주입되어야 함)
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ARG VITE_PORTONE_IMP_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_PORTONE_IMP_KEY=$VITE_PORTONE_IMP_KEY

RUN npm run build

# ── Stage 3: 실행 (nginx 정적 서빙) ───────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
