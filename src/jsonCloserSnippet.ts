// JSON Closer
// Able to close a JSON string that is not closed yet.
// Close object, array and values, but not keys.


export class JsonCloser {

    private buffer = "";
    private stack: any[] = [];

    constructor() {
    }

    append(chunk: string) {

        for (const char of chunk) {
            
            this.buffer += char;

            switch (char) {

                case "{":
                    this.stack.push(char);
                    break;
                case "}":
                    if (this.stack[this.stack.length - 1] === "{") {
                        this.stack.pop();
                    }
                    break;
                case "[":
                    this.stack.push(char);
                    break;
                case "]":
                    if (this.stack[this.stack.length - 1] === "[") {
                        this.stack.pop();
                    }
                    break;
                case "\"":
                    if (this.stack[this.stack.length - 1] === "\"") {
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
                case "\"":
                    closeBuffer += "\"";
                    break;
                default:
                    break;
            }
        }

        return closeBuffer;
    }

    parse(): any {
        try {
            const closedJson = this.closeJson();
            const jsonRes = JSON.parse(closedJson);
            return jsonRes;
        } catch (error) {
            return null;
        }
    }
}


// Usage example:
const builder = new JsonCloser();

builder.append('{"key": "value", "list": [');  // {"key": "value", "list": []}
console.log(builder.closeJson());
builder.append('1, 2, ');  // {"key": "value", "list": [1, 2, ]}
console.log(builder.closeJson());
builder.append('{"subkey": "subvalue"');  // {"key": "value", "list": [1, 2, {"subkey": "subvalue"}]}

const res = builder.parse();
console.log(res);
