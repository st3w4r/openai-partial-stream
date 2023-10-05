import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
        allowHeaders: ["Content-Type"],
    }),
);

app.get("/", (c) => c.text("Hello Hono!"));

app.get("/hello", (c) => {
    return c.json({
        message: `Hello Hono!`,
    });
});

app.get("/hello/:name", (c) => {
    const { name } = c.req.param();
    return c.json({
        message: `Hello ${name}!`,
    });
});

app.get("/hello/:name/:age", (c) => {
    const { name, age } = c.req.param();

    return c.text(`Hello ${name}! You are ${age} years old!`);
});

const helloRoute = app.get(
    "/hello",
    zValidator(
        "query",
        z.object({
            name: z.string().min(3).max(10),
        }),
    ),
    (c) => {
        const { name } = c.req.valid("query");

        console.log(name);

        return c.jsonT({
            message: `Hello ${name}!`,
        });
    },
);

app.get("/stream", (c) => {
    return c.stream(async (stream) => {
        await stream.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
        await stream.write("world");
    });
});

app.get("/stream/json", (c) => {
    c.header("Content-Type", "text/event-stream");
    return c.stream(async (stream) => {
        const jsonString = JSON.stringify({ hello: "world" });

        const retry = 5000;
        await stream.write(`retry: ${retry}\n\n`);

        await stream.write(`data: ${jsonString}\n\n`);
        await stream.sleep(1000);
        await stream.write(`data: ${jsonString}\n\n`);
        await stream.sleep(1000);
        await stream.write(`data: ${jsonString}\n\n`);
        await stream.write(`data: [DONE]\n\n`);
    });
});

app.get("/stream/text", (c) => {
    return c.streamText(async (stream) => {
        await stream.write("Hello");
        await stream.writeln("World");
        await stream.sleep(1000);
        await stream.write("Jack");
    });
});

export type AppType = typeof helloRoute;

export default app;
