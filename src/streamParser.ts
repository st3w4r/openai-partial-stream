

// Read the file output_postcode_partial.txt


import fs from "fs";


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


const lines = fs.readFileSync("./output_postcode_partial.txt", "utf8").split("\n");

for (const line of lines) {

    // console.log(line);

    for (const char of line) {

        let resChar = {};

        if (['[', '{', '"', '}', ']'].includes(char)) {
            charStack.push(char);

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

                } else if (quoteMod === 2) {
                    quoteNmae = "CLOSE_KEY";
                } else if (quoteMod === 3) {
                    quoteNmae = "OPEN_VALUE";

                } else if (quoteMod === 0) {
                    quoteNmae = "CLOSE_VALUE";
                    hm["quote"] = hm["quote"] - 4;
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
        } else {
            resChar = {
                "name": "CHAR",
                "value": char,
            }

        }
        
        console.log(resChar, hm);
    }
}

// console.log(charStack);

console.log(hm);



console.log("Stream parser")
