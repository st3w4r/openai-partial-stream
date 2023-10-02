import { StreamMode } from "./utils";
import { JsonCloser } from "./jsonCloser";
import { Status, StreamResponseWrapper, ErrorResponse } from "./utils";

export class StreamParser {
    private jsonCloser: JsonCloser;
    private mode: StreamMode;
    private entityIndex: number = 0;

    constructor(mode: StreamMode = StreamMode.StreamObject) {
        this.mode = mode;
        this.jsonCloser = new JsonCloser(mode);
    }

    // Write to the buffer
    // Return a value if the parsing is possible
    // if not return empty or null
    // Output only if there was a change
    // Return based on the mode
    parse(chunk: string): StreamResponseWrapper | null {
        let index = this.entityIndex;
        let completed = false;
        let outputEntity: any = null;
        let end = chunk.indexOf("}");
        let error = null;

        this.jsonCloser.append(chunk);

        const [hasChanged, resJson, stack] = this.jsonCloser.parse();

        // If an object have been closed
        // Check if an array is open or if the stack is empty
        // Meaning the object is completed and a new entity can be created
        if (
            end !== -1 &&
            ("[" === stack[stack.length - 1] || stack.length === 0)
        ) {
            this.entityIndex += 1;
            completed = true;
        }

        if (hasChanged && resJson) {
            outputEntity = resJson;
        } else {
            outputEntity = null;
        }

        if (
            completed === false &&
            (this.mode === StreamMode.StreamObject ||
                this.mode === StreamMode.NoStream)
        ) {
            return null;
        }

        if (outputEntity) {
            const streamRes: StreamResponseWrapper = {
                index: index,
                status: completed ? Status.COMPLETED : Status.PARTIAL,
                data: outputEntity,
            };
            return streamRes;
        } else if (error) {
            const streamRes: StreamResponseWrapper = {
                index: index,
                status: Status.FAILED,
                data: error,
            };
            return streamRes;
        }
        return null;
    }
}
