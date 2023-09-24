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
	node web/server.js

pack: lib
	cp src/package.json lib/package.json
	cd lib && npm pack



.PHONY: all install build lib web server
