import { Hono } from "hono";
import { cors } from "hono/cors";

import { api } from "./api";

const app = new Hono();

app.use(
    "*",
    cors({
        origin: "*",
        allowMethods: ["GET", "POST", "PUT", "DELETE"],
        allowHeaders: ["Content-Type"],
    }),
);

app.route("/api", api);

app.get("/", (c) => c.text("Welcome to Partial Stream!"));

export default app;
