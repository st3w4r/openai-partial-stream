import {test, expect} from "@jest/globals";
import {JsonCloser} from "../src/jsonCloser";


test("JsonCloser", async () => {
    const jsonCloser = new JsonCloser();
    jsonCloser.append(`{"a": 1, "b": 2, "c": 3}`);
    const closedJson = jsonCloser.closeJson();
    expect(closedJson).toBe(`{"a": 1, "b": 2, "c": 3}`);
});
