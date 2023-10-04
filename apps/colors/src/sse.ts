import { Response } from "express";

export function setSSEHeaders(res: Response) {
    // Set response headers for SSE
    res.header("Content-Type", "text/event-stream");
    res.header("Cache-Control", "no-cache");
    res.header("Connection", "keep-alive");
    res.flushHeaders(); // flush the headers to establish SSE with the client
}

export function sendSSEResponse(res: Response, data: any) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function closeSSEConnection(res: Response) {
    res.write("event: CLOSE\n");
    res.write("data: [DONE]\n\n");
    res.end();
}

export function sendSSEEvent(res: Response, event: string, data: any) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function senderHandler(res: Response, gen: any): Promise<number> {
    let counter = 0;
    for await (const data of gen) {
        console.log(data);
        if (data === null) {
            break;
        }
        sendSSEResponse(res, data);
        counter++;
    }
    console.log(`Sent ${counter} messages`);
    return counter;
}
