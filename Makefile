all: build run

install:
	npm install

build:
	npm run build

lib:
	npm run build:lib

web:
	npm run build:website

server: build
	node dist/server.js

.PHONY: all install build lib web server
