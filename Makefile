all: build run

build:
	npm run build

lib:
	npm run build:lib

web:
	npm run build:website

server: build
	node dist/server.js

.PHONY: all build lib web server
