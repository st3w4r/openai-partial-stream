import { Response } from "express";

import { sendSSEEvent } from "./sse";

export type SSEErrorResponse = {
    code: string;
    message: string;
};

export type SSEErrorEvent = {
    status: "ERROR";
    data: {
        error: SSEErrorResponse;
    };
};

export function sendSSEErrorEvent(res: Response, error: SSEErrorResponse) {
    const event: SSEErrorEvent = {
        status: "ERROR",
        data: {
            error: error,
        },
    };
    sendSSEEvent(res, "ERROR", event);
}

export function sendRateLimitError(res: Response) {
    const error: SSEErrorResponse = {
        code: "RATE_LIMIT_ERROR",
        message: "Too many requests.",
    };
    sendSSEErrorEvent(res, error);
}
