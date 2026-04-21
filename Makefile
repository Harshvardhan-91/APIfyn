.PHONY: install dev web api build lint db-generate

install:
	pnpm install

dev:
	pnpm dev

web:
	pnpm dev:web

api:
	pnpm dev:api

build:
	pnpm build

lint:
	pnpm lint

db-generate:
	pnpm db:generate
