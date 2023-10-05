import { OpenAI } from "openai";

import { Hono } from "hono";
import { callGenerateTagline } from "./entitytTagline";
import { StreamMode } from "openai-partial-stream";

type Bindings = {
    OPENAI_API_KEY: string;
    AWESOME: string;
};

const api = new Hono<{ Bindings: Bindings }>();

api.use("*", async (c, next) => {
    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    console.log(c.env.AWESOME);
    console.log(openai);
    next();
});

api.get("/", (c) => {
    return c.json({
        message: "Welcome to Partial Stream!",
    });
});

api.get("/sse/tagline", (c) => {
    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });

    // Set SSE headers
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    return c.stream(async (stream) => {
        const gen = await callGenerateTagline(
            openai,
            StreamMode.StreamObjectKeyValueTokens,
        );

        for await (const data of gen) {
            const jsonStr = JSON.stringify(data);
            stream.write(`data: ${jsonStr}\n\n`);
        }
        // Stream is done
        stream.write(`event: CLOSE\n`);
        stream.write(`data: [DONE]\n\n`);
    });
});

export { api };
