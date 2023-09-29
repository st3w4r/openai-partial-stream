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
    input.forEach(data => jsonCloser.append(data));
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
    runAndExpectClose(['{', '}'], `{}`);
});

test("closes empty JSON array", async () => {
    runAndExpectClose(['[', ']'], `[]`);
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
    runAndExpectClose([`{"a": 1, "b": {"ok": "super`], `{"a": 1, "b": {"ok": "super"}}`);
});

test("closes partial JSON array with nested objects", async () => {
    runAndExpectClose([`[{"a": 1,`,` "b":`, ` {"ok": "super"`], `[{"a": 1, "b": {"ok": "super"}}]`);
});

test("close partial JSON many appends", async () => {
    runAndExpectClose([
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
    ], `{"a": 1, "b": {"ok": "super"}}`);
});
