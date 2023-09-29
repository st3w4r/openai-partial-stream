all: install build

install:
	npm install

build:
	turbo build

lib:
	turbo build --filter=openai-partial-stream

web:
	turbo build --filter=partial-ai-stream-website

test:
	turbo test

test-watch:
	turbo test:watch

server: build
	node apps/colors/dist/server.js

pack: lib
	cd packages/openai-partial-stream && npm pack

version:
	npx changeset

publish:
	npx changeset version
	npx changeset publish


.PHONY: all install build lib web test test-watch server pack version publish
