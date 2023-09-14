import OpenAI from "openai";
import { z } from "zod";
import { readFileParseContent, genPromptSchema, handleOpenAiResponse, readFileAndStreamContent, handleMockResponse } from "./index.js";


// Interface for developer how to use this library


// Setps:
// Import openai library
// Set an instance of openai
// Use stream
// Create an enity, with interface or zod schema
// Transform the zod schema to a json object
// Add to the prompt the json object and instruction
// Send the prompt to openai
// Send the stream to the parser


// const openai = "";

// import { readFileParseContent } from "./src/readFileParseContent";

// Import the file from ./src/readFileParseContent


// Schema

const PostCodeSchema = z.object({
    postcode: z.string().optional(),
    councilName: z.string().optional(),
    country: z.string().optional(),
});

const ColorSchema = z.object({
    name: z.string().optional(),
    hex: z.string().optional(),
    description: z.string().optional(),
});

type PostCode = z.infer<typeof PostCodeSchema>;
type Color = z.infer<typeof ColorSchema>;


// API call

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function callGenerateColors() {

    const stream = await openai.chat.completions.create({
        messages: [
            // { 
            //     role: "user", 
            //     content: "Give me 5 postcode in London with their council name." 
            // },
            // { 
                //     role: "user", 
                //     content: genPromptSchema(PostCodeSchema, "PostCode"),
                // },
            { 
                role: "user", 
                content: "Give me 3 color with the name and hex code, and a description." 
            },
            { 
                role: "user", 
                content: genPromptSchema(ColorSchema, "Color"),
            },
        ],
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        stream: true, // ENABLE STREAMING
        temperature: 0.7,
    });




    // Parser
    // API proposal:
    // const entityStream = streamParser(stream, PostCodeSchema);

    const entityStream = handleOpenAiResponse(stream, ColorSchema);

    // for await (const entity of entityStream) {
    //     console.log(entity);
    // }

    return entityStream;

}


// await callGenerateColors();

// console.log("Start");
// for await (const data of callGenerateColors()) {
//     console.log(data);
// }


// for await (const entity of entityStream) {
//     console.log(entity);
// }



// Mock

// // mock stream
// const mockStream = readFileAndStreamContent("./output_postcode_partial.txt");
// // Parser
// const mockEnitytStream = handleMockResponse(mockStream, PostCodeSchema);

// for await (const entity of mockEnitytStream) {
//     console.log(entity);
// }

