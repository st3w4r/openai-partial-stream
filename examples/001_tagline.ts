import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";
import OpenAi from "openai";
import { z } from "zod";


const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

const TaglineSchema = z.object({
    tagline: z.string().optional(),
});

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
                `
        },
    ]
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

async function callGenerateTagline(mode: StreamMode = StreamMode.StreamObjectKeyValueTokens) {

    const stream = await openai.chat.completions.create({
        messages: getTaglineMessages(),
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 1.1,
        functions: [
            getTaglineFunction(),
        ],
        function_call: { name: "tagline" }
    });

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);
    const entityTagline = new Entity("tagline", TaglineSchema);
    const taglineEntityStream = entityTagline.genParse(entityStream);

    return taglineEntityStream;
}


async function main() {
    const taglineStream = await callGenerateTagline(StreamMode.StreamObjectKeyValueTokens);

    console.log("Tagline Stream:");

    for await (const item of taglineStream) {
        if (item) {
            console.log(item);

        }
    }
    console.log("Tagline Stream: END");
}

main();
