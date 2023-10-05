import { Hono } from "hono";
import { OpenAI } from "openai";
import { z } from "zod";

import { callGenerateTagline } from "./entityTagline";
import { callGenerateColors } from "./entityColors";
import { StreamMode } from "openai-partial-stream";
import { zValidator } from "@hono/zod-validator";

type Bindings = {
    OPENAI_API_KEY: string;
    AWESOME: string;
};

type Variables = {
    openai: OpenAI;
};

const api = new Hono<{ Bindings: Bindings; Variables: Variables }>();

api.use("*", async (c, next) => {
    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    c.set("openai", openai);
    await next();
});

api.get("/", (c) => {
    return c.json({
        message: "Welcome to Partial Stream API!",
    });
});

api.use("/sse/*", async (c, next) => {
    // Set SSE headers
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    await next();
});

api.get("/sse/tagline", (c) => {
    const openai = c.get("openai");

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

api.get(
    "/sse/colors",
    zValidator(
        "query",
        z.object({
            mode: z.enum([
                StreamMode.StreamObjectKeyValueTokens,
                StreamMode.StreamObjectKeyValue,
                StreamMode.StreamObject,
                StreamMode.NoStream,
            ]),
        }),
    ),
    (c) => {
        const { mode } = c.req.valid("query");
        const openai = c.get("openai");

        return c.stream(async (stream) => {
            const gen = await callGenerateColors(openai, mode);

            for await (const data of gen) {
                const jsonStr = JSON.stringify(data);
                // const itemIndex = data.index;g
                // stream.write(`id: ${itemIndex}\n`);
                stream.write(`data: ${jsonStr}\n\n`);
            }
            // Stream is done
            stream.write(`event: CLOSE\n`);
            stream.write(`data: [DONE]\n\n`);
        });
    },
);

export { api };
