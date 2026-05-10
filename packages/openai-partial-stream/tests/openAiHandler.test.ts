import { test, expect } from "@jest/globals";

import { OpenAiHandler } from "../src/openAiHandler";
import { StreamMode } from "../src/utils";

async function* openAiFunctionCallStream(chunks: string[]) {
    for (const chunk of chunks) {
        yield {
            choices: [
                {
                    delta: {
                        function_call: {
                            arguments: chunk,
                        },
                    },
                },
            ],
        };
    }
}

test("stream object key value emits ready values inside OpenAI chunks", async () => {
    const chunks = [
        "",
        '{"',
        "colors",
        '":[{',
        '"',
        "name",
        '":"',
        "A",
        "by",
        "ss",
        "al",
        " Te",
        "al",
        '","',
        "hex",
        '":"',
        "#",
        "007",
        "C",
        "89",
        '","',
        "description",
        '":"',
        "A",
        " deep",
        '."',
        "}",
        "]}",
    ];

    const handler = new OpenAiHandler(StreamMode.StreamObjectKeyValue);
    const results = [];

    for await (const item of handler.process(openAiFunctionCallStream(chunks))) {
        if (item) {
            results.push(item);
        }
    }

    expect(results).toEqual([
        { index: 0, status: "PARTIAL", data: {} },
        { index: 0, status: "PARTIAL", data: { colors: [] } },
        { index: 0, status: "PARTIAL", data: { colors: [{}] } },
        {
            index: 0,
            status: "PARTIAL",
            data: { colors: [{ name: "Abyssal Teal" }] },
        },
        {
            index: 0,
            status: "PARTIAL",
            data: { colors: [{ name: "Abyssal Teal", hex: "#007C89" }] },
        },
        {
            index: 0,
            status: "PARTIAL",
            data: {
                colors: [
                    {
                        name: "Abyssal Teal",
                        hex: "#007C89",
                        description: "A deep.",
                    },
                ],
            },
        },
        {
            index: 0,
            status: "COMPLETED",
            data: {
                colors: [
                    {
                        name: "Abyssal Teal",
                        hex: "#007C89",
                        description: "A deep.",
                    },
                ],
            },
        },
    ]);
});
