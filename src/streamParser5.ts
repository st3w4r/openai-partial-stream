// TODO:
// - Handle escape characters
// - Handle nested objects
// - Handle nested arrays
// - Handle nested objects in arrays
// - Handle none json objects, simple bullet point list

import fs from "fs";
import { parse } from "path";
import { buffer, json } from "stream/consumers";
import { StreamMode } from "./utils.js";
import { z } from "zod";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import { Stream } from "stream";


type Token = {
    name: string;
    value?: string;
}

type TokenInfo = {
    object: number;
    array: number;
    quote: number;
}

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


class StreamParser {

    private buffer = "";
    private mode: StreamMode;
    private inJsonObject = false;
    private nbKeyValue = 0;
    private prevValueLen = 0;
    private entityIndex: number = 0;

    constructor(mode: StreamMode = StreamMode.StreamObject) {
        this.mode = mode;
    }
    
    // Write to the buffer
    // Return a value if the parsing is possible
    // if not return empty or null
    // Output only if there was a change
    // Return based on the mode
    parse(chunk: string): any {

        let index = this.entityIndex;
        let completed = false;
        let outputEntity: any = null;
        let start = chunk.indexOf("{");
        let end = chunk.indexOf("}");

        if (start !== -1) {
            this.inJsonObject = true;
        }
        if (end !== -1) {
            this.inJsonObject = false;
            // Reset
            this.nbKeyValue = 0;
            this.prevValueLen = 0;
        } 
        
        if (this.inJsonObject) {

            if (start !== -1) {
                this.buffer += chunk.slice(start);
            } else {
                this.buffer += chunk;
            }

            if (this.mode == StreamMode.StreamObjectKeyValueTokens) {
                outputEntity = this.partialStreamParserKeyValueTokens(this.buffer);
            } else if (this.mode == StreamMode.StreamObjectKeyValue) {
                outputEntity = this.partialStreamParserKeyValue(this.buffer);
            }

        } else {

            
            if (end !== -1) {
                completed = true;
                this.buffer += chunk.slice(0, end+1);
            }

            if (this.buffer.length) {

                outputEntity = this.parseJsonObject(this.buffer);
            }
            this.buffer = "";

            // Keep track of the number of objects
            this.entityIndex += 1;
        }


        const streamRes: StreamResponseWrapper = {
            index: index,
            status: completed ? Status.COMPLETED : Status.PARTIAL,
            data: outputEntity,
        }

        return streamRes;
    }

    private parseJsonObject(content: string): any {
        let entity = null

        try {
            entity = JSON.parse(content);
        } catch (error) {
            console.log("Error:", error);
        }
        return entity;
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
            return null;
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
            return null;
        }

        this.prevValueLen = valueLen;


        let jsonObj = kvList?.join(",");
        jsonObj = "{" + jsonObj + "}";

        const entity = this.parseJsonObject(jsonObj);

        return entity
    }

    private partialStreamParserKeyValue(content: string): any {

        function extractKeyValuePairs(s: string): string[] {
            // Regular expression for the pattern "key": "value"
            const regex = /(?<!\\)"[^"]+"\s*:\s*(?<!\\)"[^"]*"/g;
            return s.match(regex) || [];
        }

        const kvList = extractKeyValuePairs(content);

        if (kvList.length === 0) {
            return null;
        }

        if (kvList.length <= this.nbKeyValue) {
            return null;
        }

        let jsonObj = kvList?.join(",");

        jsonObj = "{" + jsonObj + "}";

        const entity = this.parseJsonObject(jsonObj);

        if (entity) {
            this.nbKeyValue = kvList.length;

        }

        return entity;

    }
}


const filename = "./output_postcode_partial.txt";
const lines = fs.readFileSync(filename, "utf8").split("\n");

const ColorSchema = z.object({
    hex: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});


const parser = new StreamParser(StreamMode.StreamObjectKeyValueTokens);

for (const line of lines) {
    const res = parser.parse(line);

    if (res.data) {
        console.log(res);
        // console.log("ENTITY", index, "STATUS:", completed ? "COMPLETED" : "PARTIAL  ", "-",  res);
    }    
}
