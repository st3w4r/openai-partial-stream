import OpenAI from "openai";
import { z } from "zod";

import { StreamMode, OpenAiHandler, Entity } from "openai-partial-stream";

const SFSchema = z.object({
    name: z.string().optional(),
    postcode: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
});

function getSFListFunction() {
    return {
        name: "get_sf_neighborhoods",
        description: "Give a list of SF neighborhoods",
        parameters: {
            type: "object",
            properties: {
                neighborhoods: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string",
                                description: "The name of the neighborhood",
                            },
                            postcode: {
                                type: "string",
                                description: "The postcode of the neighborhood",
                            },
                            date: {
                                type: "string",
                                description:
                                    "The date of the creation of the neighborhood",
                            },
                            description: {
                                type: "string",
                                description:
                                    "The description of the neighborhood",
                            },
                        },
                    },
                },
            },
        },
    };
}
export async function callGenerateSF(
    openai: OpenAI,
    mode: StreamMode = StreamMode.StreamObjectKeyValueTokens,
) {
    // Call OpenAI API, with function calling
    // Function calling: https://openai.com/blog/function-calling-and-other-api-updates
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "user",
                content:
                    "Give me a 10 neighborhoods in San Francisco with the name, the description, date of creation, and the postcode.",
            },
        ],
        model: "gpt-3.5-turbo", // gpt-4
        // model: "gpt-4",
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 0.7,
        functions: [getSFListFunction()],
        function_call: { name: "get_sf_neighborhoods" },
    });

    // Handle the stream from OpenAI client
    const openAiHandler = new OpenAiHandler(mode);
    // Parse the stream to valid JSON
    const entityStream = openAiHandler.process(stream);
    // return entityStream;
    // Handle the JSON to specific entity, return null if the JSON does not match the schema
    const entitySF = new Entity("neighborhoods", SFSchema);
    // Transfrom each item of an array to a unique entity
    const sfEntityStream = entitySF.genParseArray(entityStream);
    // Return the stream of entity
    return sfEntityStream;
}
