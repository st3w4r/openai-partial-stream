

// Read the file output_postcode_partial.txt


import fs from "fs";
import { printNode } from "zod-to-ts";


class Stack<T> {
    private items: T[] = [];

    push(element: T): void {
        this.items.push(element);
    }

    pop(): T | undefined {
        return this.items.pop();
    }

    peek(): T | undefined {
        return this.items[this.items.length - 1];
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    size(): number {
        return this.items.length;
    }

    clear(): void {
        this.items = [];
    }

    print(): void {
        console.log(this.items);
    }
}

// Example usage
const numberStack = new Stack<number>();
numberStack.push(5);
numberStack.push(10);
numberStack.push(15);
console.log(numberStack.peek());  // Outputs: 15
numberStack.print();              // Outputs: [5, 10, 15]
numberStack.pop();




// fs.readFile("./output_postcode_partial.txt", "utf8", (err: any, data: any) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     console.log(data);
// });

const charStack = new Stack<string>();

const hm = {
    "object": 0,
    "array": 0,
    "quote": 0,
};

let is_key = false;
let is_value = false;

const lines = fs.readFileSync("./output_postcode_partial.txt", "utf8").split("\n");


function jsonLexer(lines: string[]) {

    const tokens: any[] = [];

    let prevType = "";


    for (const line of lines) {

        // console.log(line);

        let buffer = "";
        let bufferKey = "";
        let bufferValue = "";
        let resChar:any = {};

        for (const char of line) {


            if (['[', '{', '"', '}', ']'].includes(char)) {
                charStack.push(char);

                if (bufferKey.length) {
                    resChar = {
                        "name": "KEY",
                        "value": bufferKey,
                    };
                    tokens.push(resChar);
                    bufferKey = "";
                } else if (bufferValue.length) {
                    resChar = {
                        "name": "VALUE",
                        "value": bufferValue,
                    };
                    tokens.push(resChar);
                    bufferValue = "";
                } else if (buffer.length) {
                    // buffer += char;
                    resChar = {
                        "name": "CHAR",
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
                        is_key = true;

                    } else if (quoteMod === 2) {
                        quoteNmae = "CLOSE_KEY";
                        is_key = false;
                    } else if (quoteMod === 3) {
                        quoteNmae = "OPEN_VALUE";
                        is_value = true;

                    } else if (quoteMod === 0) {
                        quoteNmae = "CLOSE_VALUE";
                        hm["quote"] = hm["quote"] - 4;
                        is_value = false;
                    }

                    resChar = {
                        "name": quoteNmae,
                    }
                } 
                // else if (char === ":") {
                //     resChar = {
                //         "name": "COLON",
                //     }
                // }
                // else if (char === ",") {
                //     resChar = {
                //         "name": "COMMA",
                //     }
                // }
                tokens.push(resChar);
            } else {

                if (is_key) {
                    bufferKey += char;
                    // resChar = {
                    //     "name": "KEY",
                    //     "value": char,
                    // }
                } else if (is_value) {
                    bufferValue += char;
                    // resChar = {
                    //     "name": "VALUE",
                    //     "value": char,
                    // }
                } else {
                    buffer += char;
                    // resChar = {
                    //     "name": "CHAR",
                    //     "value": char,
                    // }
                }

            }
            
            // console.log(resChar, hm);

            // Appends to the tokens
            // tokens.push(resChar);
        }


        if (bufferKey.length) {
            resChar = {
                "name": "KEY",
                "value": bufferKey,
            };
            tokens.push(resChar);
            bufferKey = "";
        }
        
        if (bufferValue.length) {
            resChar = {
                "name": "VALUE",
                "value": bufferValue,
            };
            tokens.push(resChar);
            bufferValue = "";
        }

        if (buffer.length) {
            resChar = {
                "name": "CHAR",
                "value": buffer,
            };
            tokens.push(resChar);
            buffer = "";
        }

    }

    return tokens;
}


const tokens = jsonLexer(lines);

// console.log(charStack);

console.log(tokens);
console.log(hm);


function parseTokens(tokens: any[]) {

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


const results = parseTokens(tokens);

console.log(results);


console.log("Stream parser")
