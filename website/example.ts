import OpenAI from "openai";
import { z } from "zod";

import { StreamMode } from "../src/utils.js";
import { OpenAiHandler } from "../src/openAiHandler.js";
import { Entity } from "../src/entity.js";


// Interface for developer how to use this library

// Setps:
// - Import openai library
// - Set an instance of openai
// - Use stream
// - Send the stream to the parser
// - Create an enity, with zod schema
// - Parse the valid json to entity


// OPENAI INSTANCE

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


// SCHEMA

const ColorSchema = z.object({
    hex: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});

const TaglineSchema = z.object({
    tagline: z.string().optional(),
});


// PROMPTS 

function getColorMessages(number: string): any[] {
    return [
        {
            role: "system",
            content: "Write JSON only"
        },
        {
            role: "user",
            content: "Give me a palette of "+number+" gorgeous color with the hex code, name and a description."
        },
    ];
}

function getTaglineMessages(): any[] {

    return [
        {
            "role": "system",
            "content": `
                Generate a tagline related to the following text:(MAXIUM 60 CHARACTERS)
                Partial Stream Spec is a specification for a stream of raw text or structured JSON that can be partially parsed and return early results for an early consumption.
                Use cases are:
                - LLM stream of token as JSON format.
                - OpenAI Function calling, handling stream of data.
                - Improve UI/UX by showing partial results to the end user.

                What is the goal of this project?:
                - Make AI apps more interactive and responsive. 
                - Elevate AI experiences to new interactive heights.
                - Bring your AI applications to life with dynamic interactivity.
                - Turbocharge your AI apps with unparalleled responsiveness.
                - Transforming AI apps from static to sensational.
                - Push the boundaries of AI with enhanced interactivity.
                - Elevate every AI interaction, every time.
                - Breathe life into AI: more dynamic, more responsive.
                - Where AI meets interactivity and redefines possibility.
                - Seamless interactivity is the future of AI applications.
                - Dive into the next-gen of immersive AI experiences.
                - Unlock the power of interactive AI experiences.
                - Elevate AI apps with partial parsing and early results.
                - Partial Stream Spec: Unleash the Power of Early Consumption
            `
        },

    ]
}

// FUNCTIONS

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
                                description: "The hexadecimal code of the color"
                            },
                            name: {
                                type: "string",
                                description: "The color name"
                            },
                            description: {
                                type: "string",
                                description: "The description of the color"
                            }
                        }
                    }
                }
            }
        },
    }
}

function getTaglineFunction() {
    return {
        name: "tagline",
        description: "Generate a tagline",
        parameters: {
            type: "object",
            properties: {
                tagline: {
                    type: "string",
                    description: "The tagline generated"
                }
            }
        }
    }
}

// CALLS

export async function callGenerateTagline(mode: StreamMode = StreamMode.StreamObjectKeyValueTokens) {

    const stream = await openai.chat.completions.create({
        messages: getTaglineMessages(),
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 1.1,
        functions: [
            getTaglineFunction(),
        ],
        function_call: {name: "tagline"}
    });

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);
    const entityTagline = new Entity("tagline", TaglineSchema);
    const taglineEntityStream = entityTagline.genParse(entityStream);

    return taglineEntityStream;
}


export async function callGenerateColors(mode: StreamMode = StreamMode.StreamObjectKeyValueTokens) {

    // Call OpenAI API, with function calling
    // Function calling: https://openai.com/blog/function-calling-and-other-api-updates
    const stream = await openai.chat.completions.create({
        messages: getColorMessages("5"),
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 1.3,
        functions: [
            getColorListFunction(),
        ],
        function_call: {name: "give_colors"}

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
