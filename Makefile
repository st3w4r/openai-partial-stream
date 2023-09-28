all: install build

install:
	npm install turbo --global
	npm install

build: install
	turbo build

lib:
	turbo build --filter=openai-partial-stream

web:
	turbo build --filter=partial-ai-stream-website

server: build
	node apps/colors/dist/server.js

pack: lib
	cd packages/openai-partial-stream && npm pack

version:
	npx changeset

publish:
	npx changeset version
	npx changeset publish


.PHONY: all install build lib web server
