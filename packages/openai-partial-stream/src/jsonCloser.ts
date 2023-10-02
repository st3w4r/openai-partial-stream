import { StreamMode } from "./utils";

export class JsonCloser {
    private mode: StreamMode;

    private buffer = "";
    private stack: any[] = [];

    private prevSize = 0;

    private closedObject = false;
    private closedArray = false;

    constructor(mode: StreamMode = StreamMode.StreamObject) {
        this.mode = mode;
    }

    append(chunk: string) {
        for (const char of chunk) {
            this.buffer += char;

            switch (char) {
                case "{":
                    this.stack.push(char);
                    this.closedObject = false;
                    break;
                case "}":
                    if (this.stack[this.stack.length - 1] === "{") {
                        this.stack.pop();
                    }
                    this.closedObject = true;
                    break;
                case "[":
                    this.stack.push(char);
                    this.closedArray = false;
                    break;
                case "]":
                    if (this.stack[this.stack.length - 1] === "[") {
                        this.stack.pop();
                    }
                    this.closedArray = true;
                    break;
                case '"':
                    if (this.stack[this.stack.length - 1] === '"') {
                        this.stack.pop();
                    } else {
                        this.stack.push(char);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    closeJson(): string {
        let closeBuffer = this.buffer.trim();

        for (const char of [...this.stack].reverse()) {
            switch (char) {
                case "{":
                    if (closeBuffer[closeBuffer.length - 1] === ",") {
                        closeBuffer = closeBuffer.slice(0, -1);
                    }
                    closeBuffer += "}";
                    break;
                case "[":
                    if (closeBuffer[closeBuffer.length - 1] === ",") {
                        closeBuffer = closeBuffer.slice(0, -1);
                    }
                    closeBuffer += "]";
                    break;
                case '"':
                    if (this.mode === StreamMode.StreamObjectKeyValueTokens) {
                        closeBuffer += '"';
                    }
                    break;
                default:
                    break;
            }
        }

        return closeBuffer;
    }

    parse(): [boolean, any, any[]] {
        try {
            const closedJson = this.closeJson();
            const jsonRes = JSON.parse(closedJson);

            const size = JSON.stringify(jsonRes).length;

            let hasChanged = false;
            if (size > this.prevSize) {
                this.prevSize = size;
                hasChanged = true;
            }
            // Do not process twice if the array and the object get closed.
            // XOR operation to check if either the array or object get closed but not both
            else if (this.closedObject !== this.closedArray) {
                // If the object have been closed consider it as a change
                // If the array have been close the object have been closed too
                // No need to consider it as a change
                // This is to avoid processing twice the same completion
                hasChanged = this.closedObject;
                this.closedObject = false;
            }

            return [hasChanged, jsonRes, this.stack];
        } catch (error) {
            return [false, null, this.stack];
        }
    }
}
