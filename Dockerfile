FROM node:22-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS build-server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx tsc --noEmit || true

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV SERVE_CLIENT=true
ENV DB_PATH=/data/finance.db

RUN apk add --no-cache python3 make g++

COPY server/package*.json ./server/
RUN npm ci --prefix server

COPY server/ ./server/
COPY --from=build-client /app/client/dist ./client/dist

RUN mkdir -p /data

VOLUME /data
EXPOSE 3001

CMD ["npm", "start", "--prefix", "server"]
