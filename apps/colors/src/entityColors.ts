import OpenAI from "openai";
import { z } from "zod";

import { StreamMode, OpenAiHandler, Entity } from "openai-partial-stream";

const ColorSchema = z.object({
    hex: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});

function getColorMessages(number: string, prompt: string): any[] {
    return [
        {
            role: "system",
            content: "Write JSON only",
        },
        {
            role: "system",
            content:
                "Give me a palette of " +
                number +
                " gorgeous color with the hex code, name and a description.",
        },
        {
            role: "user",
            content: "The palette will have the ton and theme of:" + prompt,
        },
    ];
}

function getColorListFunction() {
    return {
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
                                description: "The description of the color",
                            },
                        },
                    },
                },
            },
        },
    };
}

export async function callGenerateColors(
    openai: OpenAI,
    mode: StreamMode = StreamMode.StreamObjectKeyValueTokens,
    number: number = 5,
    prompt: string = "",
) {
    // Call OpenAI API, with function calling
    // Function calling: https://openai.com/blog/function-calling-and-other-api-updates
    const stream = await openai.chat.completions.create({
        messages: getColorMessages(number.toString(), prompt),
        // model: "gpt-3.5-turbo", // OR "gpt-4"
        model: "gpt-4",
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 1.1,
        functions: [getColorListFunction()],
        function_call: { name: "give_colors" },
    });

    // Handle the stream from OpenAI client
    const openAiHandler = new OpenAiHandler(mode);
    // Parse the stream to valid JSON
    const entityStream = openAiHandler.process(stream);
    // Handle the JSON to specific entity, return null if the JSON does not match the schema
    const entityColors = new Entity("colors", ColorSchema);
    // Transfrom each item of an array to a unique entity
    const colorEntityStream = entityColors.genParseArray(entityStream);
    // Return the stream of entity
    return colorEntityStream;
}
