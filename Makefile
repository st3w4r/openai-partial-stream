all: build run

install:
	npm install

build:
	npm run build

clean:
	npm run clean

lib: clean
	npm run build:lib

lib-esm:
	npm run build:lib:esm

lib-cjs:
	npm run build:lib:cjs

web:
	npm run build:web

server: build
	node web/server.js

pack: lib
	cp src/package.json dist/package.json
	cp src/package.json lib/package.json
	cd dist && npm pack
	cd lib && npm pack



.PHONY: all install build lib web server
