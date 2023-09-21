// TODO:
// - Handle escape characters
// - Handle nested objects
// - Handle nested arrays
// - Handle nested objects in arrays
// - Handle none json objects, simple bullet point list

import fs from "fs";
import { StreamMode } from "./utils.js";
import { JsonCloser } from "./streamParser7.js";
import { threadId } from "worker_threads";

enum Status {
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    FAILED = "FAILED",
}

type StreamResponseWrapper = {
    index: number,
    status: Status,
    data: any,
}

type ErrorResponse = {
    code: string,
    error: string,
    message: string,
}


export class StreamParser {

    private jsonCloser: JsonCloser;
    private buffer = "";
    private mode: StreamMode;
    private inJsonObject = false;
    private nbKeyValue = 0;
    private prevValueLen = 0;
    private entityIndex: number = 0;

    constructor(mode: StreamMode = StreamMode.StreamObject) {
        this.mode = mode;
        this.jsonCloser = new JsonCloser();
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
        let start = chunk.indexOf("{");
        let end = chunk.indexOf("}");
        let error = null;

        this.jsonCloser.append(chunk);

        console.log(this.jsonCloser.closeJson());

        const resJson = this.jsonCloser.parse();


        console.log(resJson);
        // if (resJson) {
        //     outputEntity = resJson;
        // }
        // if (end !== -1 && resJson) {
        //     this.entityIndex += 1;
        //     completed = true;
        // }

        if (resJson) {
            try {
                // console.log("INDEX", index);
                // console.log("OUTPUT ENTITY:", index, outputEntity);

                outputEntity = resJson;

            } catch {
                outputEntity = null;
            }
        }

        if (end !== -1 && resJson) {
            completed = true;
            this.entityIndex = index;
        }

        // if (index > this.entityIndex) {
        //     completed = true;
        //     this.entityIndex = index;
        // }
        // error = null;


        // if (end !== -1) {
        //     this.entityIndex += 1;
        //     completed = true;
        // }


        // -------------


        // if (start !== -1) {
        //     this.inJsonObject = true;
        // }
        // if (end !== -1) {
        //     this.inJsonObject = false;
        //     // Reset
        //     this.nbKeyValue = 0;
        //     this.prevValueLen = 0;
        // } 
        
        // if (this.inJsonObject) {

        //     if (start !== -1) {
        //         this.buffer += chunk.slice(start);
        //     } else {
        //         this.buffer += chunk;
        //     }


        //     this.jsonCloser.closeJson();
        //     const resJson = this.jsonCloser.parse();

        //     if (resJson) {
        //         try {
        //             outputEntity = resJson["colors"][index];
        //             console.log("OUTPUT ENTITY:", index, outputEntity);
        //         } catch {
        //             outputEntity = null;
        //         }
        //     }
        //     error = null;
            

        //     if (this.mode == StreamMode.StreamObjectKeyValueTokens) {
        //         [outputEntity, error] = this.partialStreamParserKeyValueTokens(this.buffer);
        //     } else if (this.mode == StreamMode.StreamObjectKeyValue) {
        //         [outputEntity, error] = this.partialStreamParserKeyValue(this.buffer);
        //     }

        // } else {

        //     if (end !== -1) {
        //         completed = true;
        //         this.buffer += chunk.slice(0, end+1);
        //         // Keep track of the number of objects
        //         this.entityIndex += 1;
        //     }

        //     if (this.buffer.length) {

        //         [outputEntity, error] = this.parseJsonObject(this.buffer);
        //     }
        //     this.buffer = "";

        // }


        if (outputEntity) {   
            const streamRes: StreamResponseWrapper = {
                index: index,
                status: completed ? Status.COMPLETED : Status.PARTIAL,
                data: outputEntity,
            }
            return streamRes;
        } else if (error) {
            const streamRes: StreamResponseWrapper = {
                index: index,
                status: Status.FAILED,
                data: error,
            }
            return streamRes;
        }

        return null;
    }

    private parseJsonObject(content: string): any|any  {
        let entity = null

        try {
            entity = JSON.parse(content);
        } catch (error) {
            console.log("Error:", error);
            console.log("Content:", content);
            const err: ErrorResponse = {
                code: "JSON_PARSE_ERROR",
                error: "JSON Parse Error",
                message: content,
            }
            return [null, err];
        }
        return [entity, null];
    }

    private partialStreamParserKeyValueTokens(content: string) {
        
        function extractKeyValuePairsWithCorrection(s: string): string[] {
            // 1. Regular expression for complete "key": "value" pairs
            const completeRegex = /(?<!\\)"[^"]+"\s*:\s*(?<!\\)"[^"]*"/g;
    
            // 2. Regular expression for "key": "incompleteValue patterns
            const incompleteRegex = /(?<!\\)"([^"]+)"\s*:\s*(?<!\\)"([^"]+)$/;
    
            let result: string[] = [...s.match(completeRegex) || []];
    
            const incompleteMatch = s.match(incompleteRegex);
            if (incompleteMatch) {
                const corrected = `"${incompleteMatch[1]}": "${incompleteMatch[2]}"`; // close the incomplete value
                result.push(corrected);
            }
        
            return result;
        }

        const kvList = extractKeyValuePairsWithCorrection(content);

        if (kvList.length === 0) {
            return [null, null];
        }

        // Detect if changes happened 
        if (kvList.length > this.nbKeyValue) {
            // Reset value length because new key have been added
            this.prevValueLen = 0;
        }
        
        const maxKey = kvList.length - 1 > 0 ? kvList.length - 1 : 0;
        const valueLen = kvList[maxKey].length;

        if (valueLen <= this.prevValueLen) {
            // No new content added to value.
            return [null, null];
        }

        this.prevValueLen = valueLen;


        let jsonObj = kvList?.join(",");
        jsonObj = "{" + jsonObj + "}";

        const [entity, error] = this.parseJsonObject(jsonObj);

        return [entity, error];
    }

    private partialStreamParserKeyValue(content: string): any {

        function extractKeyValuePairs(s: string): string[] {
            // Regular expression for the pattern "key": "value"
            const regex = /(?<!\\)"[^"]+"\s*:\s*(?<!\\)"[^"]*"/g;
            return s.match(regex) || [];
        }

        const kvList = extractKeyValuePairs(content);

        if (kvList.length === 0) {
            return [null, null];
        }

        if (kvList.length <= this.nbKeyValue) {
            return [null, null];
        }

        let jsonObj = kvList?.join(",");

        jsonObj = "{" + jsonObj + "}";

        const [entity, error] = this.parseJsonObject(jsonObj);

        if (entity) {
            this.nbKeyValue = kvList.length;
        }


        return [entity, error];

    }
}


const filename = "./output_postcode_partial.txt";
const lines = fs.readFileSync(filename, "utf8").split("\n");


const parser = new StreamParser(StreamMode.StreamObjectKeyValueTokens);

for (const line of lines) {
    const res = parser.parse(line);

    if (res) {
        console.log(res);
    }    
}
