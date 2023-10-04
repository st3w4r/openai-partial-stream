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
                - Partial Stream Spec: Enable the Power of Early Consumption
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
        temperature: 1.1,
        functions: [getTaglineFunction()],
        function_call: { name: "tagline" },
    });

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);
    const entityTagline = new Entity("tagline", TaglineSchema);
    const taglineEntityStream = entityTagline.genParse(entityStream);

    return taglineEntityStream;
}
