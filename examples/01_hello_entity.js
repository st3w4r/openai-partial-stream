import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";
import OpenAi from "openai";
import { z } from "zod";

const HelloSchema = z.object({
    sentence: z.string().optional(),
});

// Intanciate OpenAI client with your API key
const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    // Call the API with stream enabled and a function
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Say hi to the world.",
            },
        ],
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING
        temperature: 1,
        functions: [
            {
                name: "say_hello",
                description: "say hello",
                parameters: {
                    type: "object",
                    properties: {
                        sentence: {
                            type: "string",
                            description: "The sentence generated",
                        },
                    },
                },
            },
        ],
        function_call: { name: "say_hello" },
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
    const entityHello = new Entity("sentence", HelloSchema);
    // Parse the stream to an entity, using the schema to validate the data
    const helloEntityStream = entityHello.genParse(entityStream);

    // Iterate over the stream of entities
    for await (const item of helloEntityStream) {
        if (item) {
            // Display the entity
            console.log(item);
        }
    }
}

main();
