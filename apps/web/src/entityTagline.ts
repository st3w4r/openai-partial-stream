import OpenAI from "openai";
import { z } from "zod";

import { StreamMode, OpenAiHandler, Entity } from "openai-partial-stream";

const TaglineSchema = z.object({
    tagline: z.string().optional(),
});

function getTaglineMessages(): any[] {
    return [
        {
            role: "system",
            content: `
            Write for developers who are skilled into frontend, backend, API, who build AI app based on Large Language Model.
            The project:
            Partial Stream Spec is a specification for a stream of raw text or structured JSON that can be partially parsed and return early results for an early consumption.
            Use cases are:
            - Parse Partial JSON Stream
            - Turn your slow AI app into an engaging real-time app
            - Convert a stream of token into a parsable JSON object before the stream ends.
            - Implement Streaming UI in LLM-based AI application.
            - Leverage OpenAI Function Calling for early stream processing.
            - Parse JSON streams into distinct entities.
            - Engage your users with a real-time experience.
            Keywords:
            - Parse
            - Json
            - Stream
            - UI
            - LLM
            - APP
            - Fast
            - Realtime
            - User experience
            - Blocking UI
            Ban words:
            - Elevate
            - Unleash

            Generate a technical tagline with the keywords without the banned words. (MAXIUM 60 CHARACTERS)"
            `,
        },
    ];
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
                    description: "The tagline generated",
                },
            },
        },
    };
}

export async function callGenerateTagline(
    openai: OpenAI,
    mode: StreamMode = StreamMode.StreamObjectKeyValueTokens,
) {
    const stream = await openai.chat.completions.create({
        messages: getTaglineMessages(),
        model: "gpt-3.5-turbo", // OR "gpt-4"
        stream: true, // ENABLE STREAMING - Server Sent Event (SSE)
        temperature: 0.8,
        functions: [getTaglineFunction()],
        function_call: { name: "tagline" },
    });

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);
    const entityTagline = new Entity("tagline", TaglineSchema);
    const taglineEntityStream = entityTagline.genParse(entityStream);

    return taglineEntityStream;
}
