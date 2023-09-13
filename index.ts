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

type City = {
    name: string;
}

type State = {
    name: string;
    code: string;
}


let buffer = "";
let list = [];
let inString = false;




async function streamParser(content: any, entity: string) {

    let output: any = null;

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

            let startContent = buffer.indexOf("{");
            let endContent = buffer.indexOf("}");
            content = buffer.slice(startContent, endContent + 1);

            // console.log(content);

            if (entity === "city") {
                try {
                    let jsonEntity = JSON.parse(content);
                    // console.log(jsonEntity);
                    let city: City = {name: jsonEntity.name};
                    list.push(city);

                    console.log(city);

                } catch (e) {
                    // Not a json object yet
                }
            } else if (entity === "state") {

                try {
                    let jsonEntity = JSON.parse(content);
                    let state: State = {name: jsonEntity.name, code: jsonEntity.code};
                    console.log(state);
                    output = state;
                } catch (e) {
                    // Not a json object yet
                }
            }
        }
        buffer = "";
    }
    return output;
}

export async function readFileParseContent() {


    // readfile and parse
    const data = fs.readFileSync('output_state.txt', 'utf8');
    const lines = data.split(/\r?\n/);

    for (let line of lines) {
        streamParser(line, "state");
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
