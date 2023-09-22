import { Response } from 'express';

export function setSSEHeaders(res: Response) {
    // Set response headers for SSE
    res.header('Content-Type', 'text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client
}

export function sendSSEResponse(res: Response, data: any) {
    // const msg = { "message": data }
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function closeSSEConnection(res: Response) {
    res.write("event: CLOSE\n")
    res.write("data: [DONE]\n\n");
    res.end();
}

export async function senderHandler(res: Response, gen: any) {
    for await (const data of gen) {
        console.log(data);
        if (data === null) {
            break;
        }
        sendSSEResponse(res, data);
    }
}
