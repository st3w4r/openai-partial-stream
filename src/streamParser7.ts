import clarinet from "clarinet";
import { log } from "console";
import fs, { stat, truncate } from "fs";
import { parseJsonSourceFileConfigFileContent } from "typescript";

import { StreamMode } from "./utils.js";


function randomlySplit(str: string, numPieces: any) {
    // If the desired number of pieces is 1 or less, return the string in an array
    if (numPieces <= 1) return [str];

    let splitIndexes: any[] = [];
    for (let i = 0; i < numPieces - 1; i++) {
        // Generate a random index between 1 and str.length - 1
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * (str.length - 1)) + 1;
        } while (splitIndexes.includes(randomIndex));
        splitIndexes.push(randomIndex);
    }

    // Sort the indexes to split the string sequentially
    splitIndexes.sort((a, b) => a - b);

    let lastSplit = 0;
    let result = [];
    for (let i = 0; i < splitIndexes.length; i++) {
        result.push(str.substring(lastSplit, splitIndexes[i]));
        lastSplit = splitIndexes[i];
    }
    result.push(str.substring(lastSplit));

    return result;
}



// Read from file
const filename = "./spec/data/color_1_fc_arguments.json";
const content = fs.readFileSync(filename, "utf8");

// Random split over te text
const tokens = randomlySplit(content, 150);

console.log(tokens);


export class JsonCloser {

    private mode: StreamMode;

    private buffer = "";
    private stack: any[] = [];

    private prevSize = 0;

    private closedObject = false;
    private closedArray = false;
    // private reset = false;

    // private completeEntityStack: any[] = [];

    constructor(mode: StreamMode = StreamMode.StreamObject) {

        this.mode = mode;
    }

    append(chunk: string) {
        // let entityCompleted = false;

        // if (this.reset) {
        //     this.buffer = "";
        //     this.stack = [];
        //     this.reset = false;
        // }

        for (const char of chunk) {
            // // When a new entity is found, reset the buffer and the stack
            // if (char === "{") {
            //     this.buffer = "";
            //     this.stack = [];
            // }
            
            // // Avoid adding extra characters that can break the JSON
            // if (entityCompleted === true) {
            //     break;
            // }

            this.buffer += char;

            // // Set the reset flag to reset on the next chunk append
            // if (char === "}") {
            //     entityCompleted = true;
            //     this.reset = true;
            // }

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
        // return entityCompleted;
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

                    if (this.mode === StreamMode.StreamObjectKeyValueTokens) {
                        closeBuffer += "\"";
                    }

                    break;
                default:
                    break;
            }
        }

        return closeBuffer;
    }

    parse(): [boolean, any] {
        try {
            const closedJson = this.closeJson();
            const jsonRes = JSON.parse(closedJson);

            const size = JSON.stringify(jsonRes).length;


            let hasChanged = false;
            if (size > this.prevSize) {
                this.prevSize = size;
                hasChanged = true;
            }
            // XOR operation to check if one of the two is true, but not both
            // Do not process twice if the array and the object get closed.
            else if (this.closedObject !== this.closedArray) {
                // If the object have been closed consider it as a change
                // If the array have been close the object have been closed too
                // No need to consider it as a change
                // This is to avoid processing twice the same completion
                hasChanged = this.closedObject;
                this.closedObject = false;
            }

            return [hasChanged, jsonRes];
        } catch (error) {
            return [false, null];
        }
    }
}


// Usage example:
// const builder = new JsonCloser();
// console.log(builder.append('{"key": "value", "list": ['));  // {"key": "value", "list": []}
// console.log(builder.closeJson());
// console.log(builder.append('1, 2, '));  // {"key": "value", "list": [1, 2, ]}
// console.log(builder.closeJson());
// console.log(builder.append('{"subkey": "subvalue"'));  // {"key": "value", "list": [1, 2, {"subkey": "subvalue"}]}

// const res = builder.closeJson();
// const jsonRes = JSON.parse(res);
// console.log(jsonRes);


const builder = new JsonCloser();

let counter = 100;

for (const token of tokens) {
    const stack = builder.append(token);
    const closedRes = builder.closeJson();
    const jsonRes = builder.parse();
    
    
    // console.log(closedRes);
    console.log(jsonRes);

    if (counter <= 0) {
        break;
    }
    counter -= 1;


}
