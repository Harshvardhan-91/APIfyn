# APIfyn API Dockerfile
FROM node:20-alpine AS base

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/api/package.json packages/api/package.json
COPY packages/database/package.json packages/database/package.json

RUN pnpm install --frozen-lockfile --filter @apifyn/api...

COPY packages/api packages/api
COPY packages/database packages/database

RUN pnpm --filter @apifyn/api build

EXPOSE 5000

CMD ["pnpm", "--filter", "@apifyn/api", "start"]
