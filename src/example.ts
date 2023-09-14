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
import OpenAI from "openai";
import { z } from "zod";
import { readFileParseContent, genPromptSchema, handleOpenAiResponse } from "./index.js";


// Schema

const PostCodeSchema = z.object({
    postcode: z.string(),
    councilName: z.string(),
});

type PostCode = z.infer<typeof PostCodeSchema>;


// API call

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const stream = await openai.chat.completions.create({
    messages: [
        { 
            role: "user", 
            content: "Give me 5 postcode in London with their council name." 
        },
        { 
            role: "user", 
            content: genPromptSchema(PostCodeSchema, "PostCode"),
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

const entityStream = handleOpenAiResponse(stream, PostCodeSchema);


for await (const entity of entityStream) {
    console.log(entity);
}



