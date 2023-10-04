import express, { Request, Response } from "express";

import { StreamMode } from "openai-partial-stream";
import { callGenerateColors } from "./entityColors";
import { callGenerateTagline } from "./entitytTagline";
import { callGenerateSF } from "./entitySf";
import {
    setSSEHeaders,
    closeSSEConnection,
    senderHandler,
    sendSSEEvent,
} from "./sse";
import OpenAI from "openai";
import { sendRateLimitError, sendSSEErrorEvent } from "./error";

// Express setup
const app = express();
const PORT: number = 8080;

// OPENAI INSTANCE
if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY environment variable not found");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to handle POST data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use((req: Request, res: Response, next: Function) => {
    // Setting headers to handle the CORS issues
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept",
    );

    // Proceed to the next middleware
    next();
});

// SSE setup
app.use((req: Request, res: Response, next: Function) => {
    res.header("Cache-Control", "no-cache");
    res.header("Connection", "keep-alive");
    next();
});

app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to Partial Stream!");
});

// Common error handling
function handleError(e: any, res: Response) {
    console.error(e);
    if (e?.status === 429) {
        sendRateLimitError(res);
    } else {
        sendSSEErrorEvent(res, {
            code: "INTERNAL_SERVER_ERROR",
            message: "Something went wrong on the server side.",
        });
    }
}

// Retry logic
async function processWithRetry(
    callback: () => Promise<any>,
    maxRetries: number,
) {
    let nbMsgSent = 0;
    let retryCount = 0;
    while (nbMsgSent === 0 && retryCount < maxRetries) {
        nbMsgSent = await callback();
        retryCount++;
    }
    console.log(`Retry count: ${retryCount - 1}`);
}

// Unified SSE handler
async function handleSSE(
    req: Request,
    res: Response,
    mainLogic: () => Promise<any>,
) {
    const mode: StreamMode = req.query.mode as StreamMode;
    setSSEHeaders(res);

    req.on("close", () => {
        console.log("Client disconnected");
        // TODO: Stop processing
    });

    try {
        await mainLogic();
    } catch (e: any) {
        handleError(e, res);
    } finally {
        closeSSEConnection(res);
        console.log("Done");
    }
}

// Endpoints using the refactored functions
app.get("/sse/tagline", (req, res) => {
    handleSSE(req, res, async () => {
        const gen = await callGenerateTagline(
            openai,
            req.query.mode as StreamMode,
        );
        await senderHandler(res, gen);
    });
});

app.get("/sse/colors", (req, res) => {
    handleSSE(req, res, async () => {
        await processWithRetry(async () => {
            const gen = await callGenerateColors(
                openai,
                req.query.mode as StreamMode,
            );
            return await senderHandler(res, gen);
        }, 3);
    });
});

app.get("/sse/sf", (req, res) => {
    handleSSE(req, res, async () => {
        await processWithRetry(async () => {
            const gen = await callGenerateSF(
                openai,
                req.query.mode as StreamMode,
            );
            return await senderHandler(res, gen);
        }, 3);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
