export enum StreamMode {
    Batch = "Batch",
    NoStream = "NoStream",
    StreamObject = "StreamObject",
    StreamObjectKeyValue = "StreamObjectKeyValue",
    StreamObjectKeyValueTokens = "StreamObjectKeyValueTokens",
}

export enum Status {
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    FAILED = "FAILED",
}

export type StreamResponseWrapper = {
    entity?: string;
    index: number;
    status: Status;
    data: any;
};

export type ErrorResponse = {
    code: string;
    error: string;
    message: string;
};
