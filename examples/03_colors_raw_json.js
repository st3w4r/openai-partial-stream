import OpenAI from "openai";

import { StreamMode, OpenAiHandler } from "openai-partial-stream";

// OPENAI INSTANCE
if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable not found");
    process.exit(1);
}

// Intanciate OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function callGenerateColors(
    mode = StreamMode.StreamObjectKeyValueTokens,
) {
    // Call OpenAI API, with function calling
    // Function calling: https://openai.com/blog/function-calling-and-other-api-updates
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "user",
                content:
                    "Give me a palette of 5 gorgeous color with the hex code, name and a description.",
            },
        ],
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING
        temperature: 1.3,
        functions: [
            {
                name: "give_colors",
                description: "Give a list of color",
                parameters: {
                    type: "object",
                    properties: {
                        colors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    hex: {
                                        type: "string",
                                        description:
                                            "The hexadecimal code of the color",
                                    },
                                    name: {
                                        type: "string",
                                        description: "The color name",
                                    },
                                    description: {
                                        type: "string",
                                        description:
                                            "The description of the color",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ],
        function_call: { name: "give_colors" },
    });

    // Handle the stream from OpenAI client
    const openAiHandler = new OpenAiHandler(mode);
    // Parse the stream to valid JSON
    const entityStream = openAiHandler.process(stream);

    return entityStream;
}

async function main() {
    // Select the mode of the stream parser
    const mode = StreamMode.StreamObject; // ONE-BY-ONE
    const colorEntityStream = await callGenerateColors(mode);

    for await (const item of colorEntityStream) {
        if (item) {
            console.log(item.data);
        }
    }
}

main();
