import {test, expect} from "@jest/globals";

import { StreamMode, StreamResponseWrapper } from "../src/utils";
import { StreamParser } from "../src/streamParser";

test("stream parser", async () => {
    
    const streamParser = new StreamParser(StreamMode.StreamObject);

    let content = [
        `{"a":`,
        ` 1, `,
        `"b": 2`,
        `, "c": `,
        `3}`,
    ];

    let results: (StreamResponseWrapper|null)[] = [];

    for (const item of content) {
        const res = streamParser.parse(item);
        results.push(res);
    }

    const expected = [
        null,
        null,
        null,
        null,
        { index: 0, status: 'COMPLETED', data: { a: 1, b: 2, c: 3 } }
    ]

    expect(results).toEqual(expected);

});


test("stream partial parser", async () => {

    const streamParser = new StreamParser(StreamMode.StreamObjectKeyValue);

    let content = [
        `{"a":`,
        ` 1, `,
        `"b": 2`,
        `, "c": `,
        `3}`,
    ];

    let results: (StreamResponseWrapper|null)[] = [];

    for (const item of content) {
        results.push(streamParser.parse(item))
    }

    const expected = [
        null,
        { index: 0, status: 'PARTIAL', data: { a: 1 } },
        { index: 0, status: 'PARTIAL', data: { a: 1, b: 2 } },
        null,
        { index: 0, status: 'COMPLETED', data: { a: 1, b: 2, c: 3 } },
    ]

    expect(results).toEqual(expected);

});
