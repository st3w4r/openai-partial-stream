export enum StreamMode {
    Batch = "Batch",
    NoStream = "NoStream",
    StreamObject = "StreamObject",
    StreamObjectKeyValue = "StreamObjectKeyValue",
    StreamObjectKeyValueTokens = "StreamObjectKeyValueTokens"
}


export enum Status {
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    FAILED = "FAILED",
}

export type StreamResponseWrapper = {
    index: number;
    status: Status;
    data: any;
}
