import {test, expect} from "@jest/globals";

import { StreamMode, StreamResponseWrapper } from "../src/utils";
import { StreamParser } from "../src/streamParser";
import { z } from "zod";
import { Entity } from "../src/entity";

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

test("stream partial parser tokens", async () => {

    const streamParser = new StreamParser(StreamMode.StreamObjectKeyValueTokens);

    let content = [
        `{"a":`,
        ` "ok`,
        ` su`,
        `per",`,
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
        { index: 0, status: 'PARTIAL', data: { a: "ok" } },
        { index: 0, status: 'PARTIAL', data: { a: "ok su" } },
        { index: 0, status: 'PARTIAL', data: { a: "ok super" } },
        { index: 0, status: 'PARTIAL', data: { a: "ok super", b: 2 } },
        null,
        { index: 0, status: 'COMPLETED', data: { a: "ok super", b: 2, c: 3 } },
    ]

    expect(results).toEqual(expected);

});


async function* arrayToGenerator<T>(arr: T[]): AsyncGenerator<T> {
    for await (const item of arr) {
        yield item;
    }
}


test("stream partial array", async () => {

    const ColorSchema = z.object({
        hex: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
    });

    const inputs = {
        colors: [
            {
                hex: "#cd5268",
                name: "Passionate Pink",
                description:
                    "This is a vibrant, dramatic pink with a romantic charm. It adds a fashionable and bold accent to your designs.",
            },
            {
                hex: "#287d8e",
                name: "Serene Ocean",
                description:
                    "A calming yet energetic shade of blue that represents the ocean. It provides a sense of tranquility and inspiration.",
            },
            {
                hex: "#fcdab7",
                name: "Soft Peach",
                description:
                    "A delicate and warm peach color. It carries a sense of freshness, gentleness, and positivity.",
            },
        ],
    };

    const jsonInputs = JSON.stringify(inputs);


    const streamParser = new StreamParser(StreamMode.StreamObject);

    const entityColors = new Entity("colors", ColorSchema);

    let results: (StreamResponseWrapper|null)[] = [];

    for (const item of jsonInputs) {
        results.push(streamParser.parse(item))
    }

    let streamGen = arrayToGenerator(results);

    const colorEntityStream = entityColors.genParseArray(streamGen);

    let colors: any[] = [];

    for await (const item of colorEntityStream) {
        if (item) {
            colors.push(item);
        }
    }

    expect(colors.length).toEqual(3);

    const expectedFirst = {
        index: 0,
        status: 'COMPLETED',
        data: {
            hex: '#cd5268',
            name: 'Passionate Pink',
            description: 'This is a vibrant, dramatic pink with a romantic charm. It adds a fashionable and bold accent to your designs.'
        },
        entity: 'colors'
    };
    const expectedSecond = {
        index: 1,
        status: 'COMPLETED',
        data: {
            hex: '#287d8e',
            name: 'Serene Ocean',
            description: 'A calming yet energetic shade of blue that represents the ocean. It provides a sense of tranquility and inspiration.'
        },
        entity: 'colors'
    };

    const expectedLast = {
        index: 2,
        status: 'COMPLETED',
        data: {
            hex: '#fcdab7',
            name: 'Soft Peach',
            description: 'A delicate and warm peach color. It carries a sense of freshness, gentleness, and positivity.'
        },
        entity: 'colors'
    };

    expect(colors[0]).toEqual(expectedFirst);
    expect(colors[1]).toEqual(expectedSecond);
    expect(colors[2]).toEqual(expectedLast);

});
