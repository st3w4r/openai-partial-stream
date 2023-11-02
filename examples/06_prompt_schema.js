import { OpenAiHandler, StreamMode, Entity } from "openai-partial-stream";
import OpenAi from "openai";
import { z } from "zod";

// Intanciate OpenAI client with your API key
const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

// Schema of the entity
const PostcodeSchema = z.object({
    name: z.string().optional(),
    postcode: z.string().optional(),
});

async function main() {
    // Create an entity with the schema to validate the data
    const entityPostcode = new Entity("postcodes", PostcodeSchema);
    // Parse the stream to an entity, using the schema to validate the data
    const promptSchema = entityPostcode.generatePromptSchema();
    // Call the API with stream enabled and a function
    const stream = await openai.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Give me 3 cities and their postcodes in California.",
            },
            {
                role: "system",
                content: promptSchema,
            },
        ],
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING
        temperature: 1.1,
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
    // Parse the stream to an entity, using the schema to validate the data
    const postcodeEntityStream = entityPostcode.genParseArray(entityStream);

    // Iterate over the stream of entities
    for await (const item of postcodeEntityStream) {
        if (item) {
            // Display the entity
            console.log(item);
        }
    }
}

main();
