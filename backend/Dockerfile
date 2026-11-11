FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY front/package.json front/package.json
RUN npm ci

COPY shared shared
COPY backend backend

ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend/src/main.ts"]
