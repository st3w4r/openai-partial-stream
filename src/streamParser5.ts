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


class StreamParser {

    private buffer = "";
    private schema: z.ZodTypeAny;
    private mode: StreamMode;
    private inJsonObject = false;
    private nbKeyValue = 0;

    constructor(schema: z.ZodTypeAny, mode: StreamMode = StreamMode.StreamObject) {
        this.schema = schema;
        this.mode = mode;
    }
    
    // Write to the buffer
    // Return a value if the parsing is possible
    // if not return empty or null
    // Output only if there was a change
    // Return based on the mode
    write(chunk: string): any {

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
        } 
        
        if (this.inJsonObject) {

            if (start !== -1) {
                this.buffer += chunk.slice(start);
            } else {
                this.buffer += chunk;
            }


            if (this.mode == StreamMode.StreamObjectKeyValueTokens) {

            } else if (this.mode == StreamMode.StreamObjectKeyValue) {
                outputEntity = this.partialStreamParserKeyValue(this.buffer);
            }

        } else {

            completed = true;

            if (end !== -1) {
                this.buffer += chunk.slice(0, end+1);
            }

            if (this.buffer.length) {

                outputEntity = this.parseJsonObject(this.buffer);
            }
            this.buffer = "";
        }

        return [outputEntity, completed];
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

        let entity = null;
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

        let entity = this.parseJsonObject(jsonObj);

        if (entity) {
            this.nbKeyValue = kvList.length;

        }

        return entity;

    }
}




function jsonChunkLexer(chunk: string) {

    for (const char of chunk) {

        switch (char) {
            case "{":
                break;
            case "}":
                break;
            case "[":
                break;
            case "]":
                break;
            case '"':
                break;
            default:
                break;
    }
    }

}


function jsonLexer(lines: string[]): [Token[], TokenInfo] {
    const hm: TokenInfo = {
        "object": 0,
        "array": 0,
        "quote": 0,
    };
    const tokens: Token[] = [];
    let prevType = "";

    for (const line of lines) {
        let buffer = "";
        let resChar:Token = {name: ""};

        for (const char of line) {

            if (['[', '{', '"', '}', ']'].includes(char)) {

                if (buffer.length) {
                    resChar = {
                        "name": prevType,
                        "value": buffer,
                    };
                    tokens.push(resChar);
                    buffer = "";
                }

                if (char === "{") {
                    hm["object"] = hm["object"] +1;

                    resChar = {
                        "name": "OPEN_OBJECT",
                    }
                } else if (char === "}") {
                    hm["object"] = hm["object"] -1;

                    resChar = {
                        "name": "CLOSE_OBJECT",
                    }
                } else if (char === "[") {
                    hm["array"] = hm["array"] +1;

                    resChar = {
                        "name": "OPEN_ARRAY",
                    }
                } else if (char === "]") {
                    hm["array"] = hm["array"] -1;

                    resChar = {
                        "name": "CLOSE_ARRAY",
                    }
                } else if (char === '"') {
                    hm["quote"] = hm["quote"] + 1;

                    // resChar = {
                    //     "name": hm["quote"] % 2 === 0 ? "CLOSE_QUOTE" : "OPEN_QUOTE",
                    // }

                    // if 1 or 3, then open quote
                    // if 2 or 4, then close quote

                    // if 1 Open quote for key
                    // if 2 Close quote for key
                    // if 3 Open quote for value
                    // if 4 Close quote for value

                    let quoteMod = hm["quote"] % 4;
                    let quoteNmae = ""

                    if (quoteMod === 1) {
                        quoteNmae = "OPEN_KEY";
                        prevType = "KEY";

                    } else if (quoteMod === 2) {
                        quoteNmae = "CLOSE_KEY";

                        prevType = "STRING";
                    } else if (quoteMod === 3) {
                        quoteNmae = "OPEN_VALUE";
                        prevType = "VALUE";

                    } else if (quoteMod === 0) {
                        quoteNmae = "CLOSE_VALUE";
                        hm["quote"] = hm["quote"] - 4;
                        prevType = "STRING";

                    }

                    resChar = {
                        "name": quoteNmae,
                    }
                } 
                // Appends to the tokens
                tokens.push(resChar);
            } else {
                buffer += char;
            }
            
        }

        if (buffer.length) {
            resChar = {
                "name": prevType,
                "value": buffer,
            };
            tokens.push(resChar);
            buffer = "";
        }
    }
    return [tokens, hm];
}


function parseTokens(tokens: Token[]) {

    let keyBuffer = "";
    let valueBuffer = "";

    let inKey = false;
    let inValue = false;

    let objIdx = 0;

    let results: any[] = []

    tokens.forEach((token) => {

        let res: any = {};

        if (token["name"] === "OPEN_KEY") {
            inKey = true;
        } else if (token["name"] === "CLOSE_KEY") {
            inKey = false;
        } else if (token["name"] === "OPEN_VALUE") {
            inValue = true;
        } else if (token["name"] === "CLOSE_VALUE") {
            inValue = false;

            res = {
                "index": objIdx,
                "key": keyBuffer,
                "value": valueBuffer,
            }

            results.push(res);
            keyBuffer = "";
            valueBuffer = "";

        } else if (token["name"] === "OPEN_OBJECT") {
            objIdx += 1;
        }

        if (inKey && token["name"] === "KEY") {
            keyBuffer += token["value"];
        } else if (inValue && token["name"] === "VALUE") {
            valueBuffer += token["value"];

            res = {
                "index": objIdx,
                "key": keyBuffer,
                "value": valueBuffer,
                "delta": token["value"],
            }

            results.push(res);
        }

    });
    return results;
}

const filename = "./output_postcode_partial.txt";
const lines = fs.readFileSync(filename, "utf8").split("\n");
// const [tokens, info] = jsonLexer(lines);
// const results = parseTokens(tokens);

// console.log(tokens);
// console.log(info);
// console.log(results);
// console.log("Stream parser")



const ColorSchema = z.object({
    hex: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});


const parser = new StreamParser(ColorSchema, StreamMode.StreamObjectKeyValue);

for (const line of lines) {
    const [res, completed] = parser.write(line);
    
    
    console.log("ENTITY","STATUS:", completed ? "COMPLETED" : "PARTIAL  ", "-",  res);
}
