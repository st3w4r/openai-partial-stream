// TODO:
// - Handle escape characters
// - Handle nested objects
// - Handle nested arrays
// - Handle nested objects in arrays
// - Handle none json objects, simple bullet point list

import fs from "fs";


type Token = {
    name: string;
    value?: string;
}

type TokenInfo = {
    object: number;
    array: number;
    quote: number;
}

// Function to process a single line
function jsonLexerLine(line: string, prevType: string, hm: TokenInfo): { tokens: Token[], hm: TokenInfo, newType: string } {
    const tokens: Token[] = [];
    let buffer = "";
    let resChar: Token = { name: "" };
    let newType: string = "";

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
                        newType = "KEY";

                    } else if (quoteMod === 2) {
                        quoteNmae = "CLOSE_KEY";
                        newType = "STRING";


                    } else if (quoteMod === 3) {
                        quoteNmae = "OPEN_VALUE";
                        newType = "VALUE";

                    } else if (quoteMod === 0) {
                        quoteNmae = "CLOSE_VALUE";
                        hm["quote"] = hm["quote"] - 4;
                        newType = "STRING";

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
                "name": newType,
                "value": buffer,
            };
            tokens.push(resChar);
            buffer = "";
        }

    return { tokens, hm, newType };
}

// Function to aggregate results from all lines
function aggregateResults(lines: string[]): [Token[], TokenInfo] {
    const hm: TokenInfo = {
        "object": 0,
        "array": 0,
        "quote": 0,
    };
    const allTokens: Token[] = [];
    let prevType = "";

    for (const line of lines) {
        const { tokens, hm: updatedHm, newType: updatedPrevType } = jsonLexerLine(line, prevType, hm);
        allTokens.push(...tokens);
        Object.assign(hm, updatedHm);
        prevType = updatedPrevType;
    }

    return [allTokens, hm];
}

type ParseState = {
    keyBuffer: string;
    valueBuffer: string;
    inKey: boolean;
    inValue: boolean;
    objIdx: number;
    results: any[];
}

function initParseState(): ParseState {
    return {
        keyBuffer: "",
        valueBuffer: "",
        inKey: false,
        inValue: false,
        objIdx: 0,
        results: []
    };
}


function processSingleToken(token: Token, state: ParseState): ParseState {
    let res: any = {};

    if (token["name"] === "OPEN_KEY") {
        state.inKey = true;
    } else if (token["name"] === "CLOSE_KEY") {
        state.inKey = false;
    } else if (token["name"] === "OPEN_VALUE") {
        state.inValue = true;
    } else if (token["name"] === "CLOSE_VALUE") {
        state.inValue = false;

        res = {
            "index": state.objIdx,
            "key": state.keyBuffer,
            "value": state.valueBuffer,
        }

        state.results.push(res);
        state.keyBuffer = "";
        state.valueBuffer = "";

    } else if (token["name"] === "OPEN_OBJECT") {
        state.objIdx += 1;
    }

    if (state.inKey && token["name"] === "KEY") {
        state.keyBuffer += token["value"];
    } else if (state.inValue && token["name"] === "VALUE") {
        state.valueBuffer += token["value"];

        res = {
            "index": state.objIdx,
            "key": state.keyBuffer,
            "value": state.valueBuffer,
            "delta": token["value"],
        }

        state.results.push(res);
    }

    return state;
}

function processTokens(tokens: Token[]): any[] {
    let state = initParseState();

    for (const token of tokens) {
        state = processSingleToken(token, state);
    }

    return state.results;
}


const filename = "./output_postcode_partial.txt";
const lines = fs.readFileSync(filename, "utf8").split("\n");
// const [tokens, info] = jsonLexer(lines);
const [tokens, info] = aggregateResults(lines);
const results = processTokens(tokens);

console.log(tokens);
console.log(info);
console.log(results);
console.log("Stream parser");
