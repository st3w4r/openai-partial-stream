import OpenAI from "openai";
import * as fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const Stream = require("stream");
const writableStream = new Stream.Writable();



function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}


// Parser:
// List of json object: [{ }]
// Identify the beginning of a json object: {
// Identify the end of a json object: }
// In string, accumulate the content
// End of object detected,
// Clean the buffer
// Parse the json object

// class City {
    //     name: string;
//     constructor(name: string) {
    //         this.name = name;
    //     }
    // }

interface City {
    name: string;
}

interface State {
    name: string;
    code: string;
}


let buffer = "";
let inString = false;


function getJsonObject(buffer: string): any {
    try {
        let start = buffer.indexOf("{");
        let end = buffer.indexOf("}");
        let content = buffer.slice(start, end + 1);
        return JSON.parse(content);
    } catch (e) {
        return null
    }
}

function extractEntity({ buffer, entityType }: { buffer: string; entityType: string; }): City | State | null {
    const jsonEntity = getJsonObject(buffer);
    if (!jsonEntity) {
        return null;
    }

    if (entityType === "city") {
        let city: City = {name: jsonEntity.name};
        return city;
    } else if (entityType === "state") {
        let state: State = {name: jsonEntity.name, code: jsonEntity.code};
        return state;
    }
    return null;
}



async function streamParser(content: any, entityType: string) {


    let outputEntity: any = null;

    let start = content.indexOf("{");
    let end = content.indexOf("}");

    if (start !== -1) {
        inString = true;
    }
    if (end !== -1) {
        inString = false;
    }


    if (inString) {
        buffer += content;
    } else {

        // Flush
        if (end !== -1) {
            buffer += content;
        }

        if (buffer.length > 0) {

            outputEntity = extractEntity({ buffer, entityType })
        }
        buffer = "";
    }
    return outputEntity;
}

export async function readFileParseContent() {


    // readfile and parse
    const data = fs.readFileSync('output_state.txt', 'utf8');
    const lines = data.split(/\r?\n/);

    for (let line of lines) {
        let res = await streamParser(line, "state");
        if (res) {
            console.log(res);
        }
        await delay(10);

    }
}


export async function main(name: string) {

    const stream = await openai.chat.completions.create({
        messages: [
            // { 
            //     role: "user", 
            //     content: "Give me a list of 5 cities in california. Bullet point them." 
            // },
            // {
            //     role: "user", 
            //     content: 'Format to respect: json with [{"name": "city1"}, {"name": "city2"}]'
            // },
            { 
                role: "user", 
                content: "Give me a list of 5 state in USA." 
            },
            {
                role: "user",
                content: 'Format to respect: json with [{"name": "state1","code": "CA"}, {"name": "state2","code": "AL"}]'
            }
        ],
        model: "gpt-3.5-turbo",
        stream: true,
    });

    for await (const msg of stream) {
        const content = msg.choices[0].delta.content

        fs.appendFileSync('output.txt', content+"\n");

        // Print without new line:
        if (content) {
            streamParser(content, "state");
        }
    }
    process.stdout.write("\n");

}

// main();
readFileParseContent();
