# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Injected args from docker-compose
ARG REACT_APP_GOOGLE_CLIENT_ID
ARG REACT_APP_API_BASE_URL

ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config to handle React Router (SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app — craco builds to /build, NOT /dist
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
