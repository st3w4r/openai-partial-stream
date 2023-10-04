import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";
import OpenAi from "openai";
import { z } from "zod";

// Intanciate OpenAI client with your API key
const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

// Schema of the entity
const TaglineSchema = z.object({
    tagline: z.string().optional(), // Optional because the model can return a partial result
});

async function main() {
    // Call the API with stream enabled and a function
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `
                Generate a tagline related to the following text:(MAXIUM 60 CHARACTERS)
                Partial Stream Spec is a specification for a stream of raw text or structured JSON that can be partially parsed and return early results for an early consumption.
                Use cases are:
                - LLM stream of token as JSON format.
                - OpenAI Function calling, handling stream of data.
                - Improve UI/UX by showing partial results to the end user.

                What is the goal of this project?:
                - Make AI apps more interactive and responsive. 
                `,
            },
        ],
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING
        temperature: 1.1,
        functions: [
            {
                name: "tagline",
                description: "Generate a tagline",
                parameters: {
                    type: "object",
                    properties: {
                        tagline: {
                            type: "string",
                            description: "The tagline generated",
                        },
                    },
                },
            },
        ],
        function_call: { name: "tagline" },
    });

    // Select the mode of the stream parser
    // - StreamObjectKeyValueTokens: (REALTIME)     Stream of JSON objects, key value pairs and tokens
    // - StreamObjectKeyValue:       (PROGRESSIVE)  Stream of JSON objects and key value pairs
    // - StreamObject:               (ONE-BY-ONE)   Stream of JSON objects
    // - NoStream:                   (ALL-TOGETHER) All the data is returned at the end of the process
    const mode = StreamMode.StreamObjectKeyValueTokens;

    // Create an instance of the handler
    const openAiHandler = new OpenAiHandler(mode);
    // Process the stream
    const entityStream = openAiHandler.process(stream);
    // Create an entity with the schema to validate the data
    const entityTagline = new Entity("tagline", TaglineSchema);
    // Parse the stream to an entity, using the schema to validate the data
    const taglineEntityStream = entityTagline.genParse(entityStream);

    // Iterate over the stream of entities
    for await (const item of taglineEntityStream) {
        if (item) {
            // Display the entity
            console.log(item);
        }
    }
}

main();
