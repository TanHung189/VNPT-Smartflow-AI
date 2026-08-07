# ── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Build-time args injected từ docker-compose
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_API_BASE_URL=http://localhost:8000/api

ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Disable CRA ESLint cứng để tránh build fail do warning
ENV DISABLE_ESLINT_PLUGIN=true
ENV CI=false

RUN npm run build

# ── Production Stage ─────────────────────────────────────────
FROM nginx:alpine

# Custom nginx config để handle React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# craco build output nằm ở /build (không phải /dist)
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
