all: install build

install:
	npm install

build:
	turbo build

lib:
	turbo build --filter=partial-ai-stream-lib

web:
	turbo build --filter=partial-ai-stream-website

server: build
	node apps/colors/dist/server.js

pack: lib
	cd packages/partial-ai-stream && npm pack

version:
	npx changeset

publish:
	npx changeset version
	npx changeset publish


.PHONY: all install build lib web server
