import clarinet from "clarinet";
import { log } from "console";
import fs, { stat } from "fs";
import { parseJsonSourceFileConfigFileContent } from "typescript";



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
        return this.stack;
    }

    closeJson() {

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

    parse() {
        try {
            const closedJson = this.closeJson();
            return JSON.parse(closedJson);
        } catch (error) {
            return null;
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
