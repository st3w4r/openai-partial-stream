import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

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
