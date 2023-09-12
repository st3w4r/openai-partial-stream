import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const Stream = require("stream");
const writableStream = new Stream.Writable();



let buffer = "";
let list = [];

// class City {
//     name: string;
//     constructor(name: string) {
//         this.name = name;
//     }
// }

type City = {
    name: string;
}

let inString = false;

async function streamParser(content: any, entity: string) {

    
    
    // buffer += content;
    // List parser
    // if (buffer.startsWith("- ") && buffer.endsWith("\n")) {
    //     let s = buffer.slice(2, -1);
    //     list.push(s);
    //     buffer = "";
    //     // process.stdout.write(s);
    //     // process.stdout.write("\n");
    // }
    
    
    let start = buffer.indexOf("{");
    let end = buffer.indexOf("}");


    if (content.indexOf("{") || content.indexOf("}")) {
        inString = inString ? false : true;
    }
    if (inString) {
        buffer += content;
    } else {
        // buffer = "";
    }

    
    if (buffer.length) {

        let jsonString = buffer.slice(start, end + 1);

        // console.log(start, end);
        process.stdout.write(jsonString);


        // console.log(buffer);
        if (entity === "city") {
            try {
                let jsonEntity = JSON.parse(jsonString);
                console.log(jsonEntity);
                let city: City = {name: jsonEntity.name};
                list.push(city);
                buffer = "";
            } catch (e) {
            }
        }
    }

    // console.log(list);

}


export async function main(name: string) {

    const stream = await openai.chat.completions.create({
        messages: [
            { 
                role: "user", 
                content: "Give me a list of 5 cities in california. Bullet point them." 
            },
            { 
                role: "user", 
                content: 'Format to respect: json with [{"name": "city1"}, {"name": "city2"}]'
            },

        ],
        model: "gpt-3.5-turbo",
        stream: true,
    });

    for await (const msg of stream) {
        const content = msg.choices[0].delta.content

        // Print without new line:
        if (content) {
            streamParser(content, "city");
        }
    }
    process.stdout.write("\n");

}

main();
