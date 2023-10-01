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
    index: number;
    status: Status;
    data: Record<string, unknown | undefined>;
};

export type ParsedResponse<K extends string, T> = {
    entity: K;
    index: number;
    status: Status;
    data: T;
};

export type ErrorResponse = {
    code: string;
    error: string;
    message: string;
};
