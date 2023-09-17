// TODO:
// - Handle escape characters
// - Handle nested objects
// - Handle nested arrays
// - Handle nested objects in arrays
// - Handle none json objects, simple bullet point list


import fs from "fs";


type JsonChunk = {
    index: number;
    key: string;
    value?: string;
    delta?: string;
}

type Token = {
    name: string;
    value?: string;
}

type TokenInfo = {
    object: number;
    array: number;
    quote: number;
}

type ParseState = {
    keyBuffer: string;
    valueBuffer: string;
    inKey: boolean;
    inValue: boolean;
    objIdx: number;
    results: any[];
}

class StreamParser {
    private lexerState: { tokenCounters: TokenInfo, prevType: string };
    private parserState: ParseState;

    constructor() {
        this.lexerState = {
            tokenCounters: {
                "object": 0,
                "array": 0,
                "quote": 0,
            },
            prevType: ""
        };
        this.parserState = this.initParseState();
    }

    private initParseState(): ParseState {
        return {
            keyBuffer: "",
            valueBuffer: "",
            inKey: false,
            inValue: false,
            objIdx: 0,
            results: []
        };
    }

    public processChunk(chunk: string): JsonChunk[] {
        // Lexing the line
        const { tokens, tokenCounters, prevType } = jsonLexerLine(chunk, this.lexerState.prevType, this.lexerState.tokenCounters);
        this.lexerState.tokenCounters = tokenCounters;
        this.lexerState.prevType = prevType;

        // Parsing the tokens
        let resTokens: JsonChunk[] = [];
        for (const token of tokens) {
            const res: JsonChunk = processSingleToken(token, this.parserState);
            if (res.key.length) {
                resTokens.push(res);
            }
        }
        // console.log(resTokens);
        return resTokens;
    }

    public getResults(): any[] {
        return this.parserState.results;
    }

    public reset(): void {
        this.lexerState = {
            tokenCounters: {
                "object": 0,
                "array": 0,
                "quote": 0,
            },
            prevType: ""
        };
        this.parserState = this.initParseState();
    }
}
// Function to process a single line
function jsonLexerLine(line: string, prevType: string, tokenCounters: TokenInfo): { tokens: Token[], tokenCounters: TokenInfo, prevType: string } {
    const tokens: Token[] = [];
    let buffer = "";
    let resChar: Token = { name: "" };

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
                    tokenCounters["object"] = tokenCounters["object"] +1;

                    resChar = {
                        "name": "OPEN_OBJECT",
                    }
                } else if (char === "}") {
                    tokenCounters["object"] = tokenCounters["object"] -1;

                    resChar = {
                        "name": "CLOSE_OBJECT",
                    }
                } else if (char === "[") {
                    tokenCounters["array"] = tokenCounters["array"] +1;

                    resChar = {
                        "name": "OPEN_ARRAY",
                    }
                } else if (char === "]") {
                    tokenCounters["array"] = tokenCounters["array"] -1;

                    resChar = {
                        "name": "CLOSE_ARRAY",
                    }
                } else if (char === '"') {
                    tokenCounters["quote"] = tokenCounters["quote"] + 1;

                    // resChar = {
                    //     "name": tokenCounters["quote"] % 2 === 0 ? "CLOSE_QUOTE" : "OPEN_QUOTE",
                    // }

                    // if 1 or 3, then open quote
                    // if 2 or 4, then close quote

                    // if 1 Open quote for key
                    // if 2 Close quote for key
                    // if 3 Open quote for value
                    // if 4 Close quote for value

                    let quoteMod = tokenCounters["quote"] % 4;
                    let quoteNmae = ""

                    if (quoteMod === 1) {
                        quoteNmae = "OPEN_KEY";
                        prevType = "KEY";

                    } else if (quoteMod === 2) {
                        quoteNmae = "CLOSE_KEY";
                    } else if (quoteMod === 3) {
                        quoteNmae = "OPEN_VALUE";
                        prevType = "VALUE";

                    } else if (quoteMod === 0) {
                        quoteNmae = "CLOSE_VALUE";
                        tokenCounters["quote"] = tokenCounters["quote"] - 4;
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

    return { tokens, tokenCounters, prevType };
}


function processSingleToken(token: Token, state: ParseState): JsonChunk {
    let res: JsonChunk = {
        "index": state.objIdx,
        "key": "",
        "value": "",
    }

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

    return res;
}


// External file handling:

const filename = "./output_postcode_partial.txt";
const lines = fs.readFileSync(filename, "utf8").split("\n");

const parser = new StreamParser();

lines.forEach((line) => {
    const res = parser.processChunk(line);
    for (const token of res) {
        console.log(token);
    }
});
