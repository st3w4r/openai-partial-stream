all: build run

build:
	tsc

run: build
	node dist/index.js
