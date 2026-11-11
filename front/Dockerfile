FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
COPY front/package.json front/package.json
RUN npm ci

COPY shared shared
COPY front front
RUN npm run build -w @workflow/front

FROM nginx:1.27-alpine

COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/front/dist /usr/share/nginx/html

EXPOSE 80
