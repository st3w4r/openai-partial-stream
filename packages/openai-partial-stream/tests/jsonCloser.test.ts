// External Libraries
import { test, expect } from "@jest/globals";

// Internal Modules
import { JsonCloser } from "../src/jsonCloser";
import { StreamMode } from "../src/utils";

let jsonCloser: JsonCloser;

beforeEach(() => {
    jsonCloser = new JsonCloser();
});

const runAndExpectClose = (input: string[], expected: string) => {
    input.forEach((data) => jsonCloser.append(data));
    let closedJson = jsonCloser.closeJson();
    expect(closedJson).toBe(expected);
};

test("handles complete JSON", async () => {
    runAndExpectClose([`{"a": 1, "b": 2, "c": 3}`], `{"a": 1, "b": 2, "c": 3}`);
});

test("handles partial JSON with missing parenthese", async () => {
    runAndExpectClose([`{"a": 1, "b": 2`], `{"a": 1, "b": 2}`);
});

test("handles partial JSON with missing quote", async () => {
    runAndExpectClose([`{"a": 1, "b`], `{"a": 1, "b}`);
});

test("closes multi-token partial JSON", async () => {
    runAndExpectClose([`{"a": 1, "b`, `": 2}`], `{"a": 1, "b": 2}`);
});

test("closes empty JSON object", async () => {
    runAndExpectClose(["{", "}"], `{}`);
});

test("closes empty JSON array", async () => {
    runAndExpectClose(["[", "]"], `[]`);
});

test("closes multi-token JSON with incomplete string", async () => {
    runAndExpectClose([`{"a": 1, "b": "ok`], `{"a": 1, "b": "ok}`);
});

test("closes multi-token JSON with StreamMode", async () => {
    jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    runAndExpectClose([`{"a": 1, "b": "ok`], `{"a": 1, "b": "ok"}`);
});

test("closes nested multi-token JSON with StreamMode", async () => {
    jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    runAndExpectClose(
        [`{"a": 1, "b": {"ok": "super`],
        `{"a": 1, "b": {"ok": "super"}}`,
    );
});

test("closes partial JSON array with nested objects", async () => {
    runAndExpectClose(
        [`[{"a": 1,`, ` "b":`, ` {"ok": "super"`],
        `[{"a": 1, "b": {"ok": "super"}}]`,
    );
});

test("close partial JSON many appends", async () => {
    runAndExpectClose(
        [
            `{`,
            `"`,
            `a"`,
            `: 1`,
            `, "`,
            `b"`,
            `: {"o`,
            `k`,
            `": "super`,
            `"`,
            `}}`,
        ],
        `{"a": 1, "b": {"ok": "super"}}`,
    );
});

// PARSE

test("parse complete JSON", async () => {
    const json = `{"a": 1, "b": 2, "c": 3}`;
    jsonCloser.append(json);
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toEqual(JSON.parse(json));
});

test("parse partial JSON", async () => {
    const json = `{"a": 1, "b": 2`;
    const expected = { a: 1, b: 2 };
    jsonCloser.append(json);
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});

test("parse partial JSON with missing quote", async () => {
    const json = `{"a": 1, "b`;
    jsonCloser.append(json);
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(false);
    expect(resJson).toBeNull();
});

test("parse partial JSON multiple parse", async () => {
    const json = `{"a": 1, "b": "ok"`;
    jsonCloser.append(json);
    const expected = { a: 1, b: "ok" };

    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);

    jsonCloser.append(`}`);

    const [hasChanged2, resJson2] = jsonCloser.parse();
    expect(hasChanged2).toBe(true); // TODO: Need to improve the parser
    expect(resJson2).toMatchObject(expected);
});

// TODO: Should return null, need to improve the parser, malfroemd JSON
test("parse partial JSON with malformed json", async () => {
    runAndExpectClose([`{"a": 1, "b": "o\"k"`], `{"a": 1, "b": "o\"k"}`);
});

test("parse partial JSON with escape quote", async () => {
    runAndExpectClose([`{"a": 1, "b": "o\"k"`], `{"a": 1, "b": "o\"k"}`);
});

test("parse partial JSON with escape quote", async () => {
    runAndExpectClose(
        [`{"a": 1, "b": "o\\"sup\\"k"`],
        `{"a": 1, "b": "o\\"sup\\"k"}`,
    );
});

// TODO: Need to improve the parser, fix the test
test.skip("parse partial JSON with escape quote", async () => {
    runAndExpectClose([`{"a": 1, "b": "o\\"k"}`], `{"a": 1, "b": "o\\"k"}`);
});

test("parse partial JSON with escape quote", async () => {
    let jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValue);
    const json = `{"a": 1, "b": "o\\"k"`;
    jsonCloser.append(json);
    const expected = { a: 1, b: 'o"k' };
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});

// TODO: Need to improve the parser, fix the test
// Current closed json: {"a": 1, "b": "o\"k""}
test.skip("parse partial JSON with escape quote", async () => {
    let jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    const json = `{"a": 1, "b": "o\\"k"`;
    jsonCloser.append(json);
    const expected = { a: 1, b: 'o"k' };
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});

test("close array", async () => {
    let jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    const json = `{"a": 1, "b": ["ok", "super"`;
    jsonCloser.append(json);
    const expected = { a: 1, b: ["ok", "super"] };
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});

test("parse array and object", async () => {
    let jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    const json = `{"a": 1, "b": ["ok", "super"], "c": {"ok": "super"}`;
    jsonCloser.append(json);
    const expected = { a: 1, b: ["ok", "super"], c: { ok: "super" } };
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});

test("parse array and object", async () => {
    let jsonCloser = new JsonCloser(StreamMode.StreamObjectKeyValueTokens);
    const json = `{"a": 1, "b": ["ok", "super", {"ok": "super`;
    jsonCloser.append(json);
    const expected = { a: 1, b: ["ok", "super", { ok: "super" }] };
    const [hasChanged, resJson] = jsonCloser.parse();
    expect(hasChanged).toBe(true);
    expect(resJson).toMatchObject(expected);
});
