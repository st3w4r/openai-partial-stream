import OpenAI from "openai";
import * as fs from "fs";
import { z } from "zod";

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
    state_code: string;
}

const CitySchema = z.object({
    name: z.string(),
    state_code: z.string().optional(),
    population: z.number().default(0),
});

interface State {
    name: string;
    code: string;
}

const StateSchema = z.object({
    name: z.string(),
    code: z.string(),
})

type EntityType = "city" | "state";

interface EntityMap {
    city: City;
    state: State;
}


type EntityFactoryMap = {
    [K in EntityType]: (data: any) => EntityMap[K];
}


function parseEntity<E extends z.ZodTypeAny>({data, schema} : {data: any, schema: E}): E | null {
    const parserRes = schema.safeParse(data);
    return parserRes.success ? parserRes.data : null;
}

const entityFactories: EntityFactoryMap = {
    city: (data: any): City => parseEntity({data, schema: CitySchema}),
    state:  (data: any): State => parseEntity({data, schema: StateSchema})
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

function extractEntity<E extends EntityType>({ buffer, entityType }: { buffer: string; entityType: E}): EntityMap[E] | null {
    const jsonEntity = getJsonObject(buffer);
    if (!jsonEntity) {
        return null;
    }
    // const entity: EntityMap[E] = jsonEntity as EntityMap[E];

    const factory: EntityFactoryMap[E] = entityFactories[entityType];
    const entity: EntityMap[E] = factory(jsonEntity);

    // const entity = entityFactories[E](jsonEntity);

    return entity;
}




async function streamParser<E extends EntityType>(content: any, entityType: E) {

    let outputEntity: EntityMap[E] | null = null;

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

            outputEntity = extractEntity<E>({ buffer, entityType});
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
        let res = await streamParser<"state">(line, "state");

        if (res) {
            console.log(res);
        }
        await delay(10);

    }
}


export async function main() {

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
            {
                role: "user", 
                content: 'Add the property state_code to each city in the json.'
            },
            {
                role: "user", 
                content: 'Add the property population to each city in the json.'
            },
            // { 
            //     role: "user", 
            //     content: "Give me a list of 5 state in USA." 
            // },
            // {
            //     role: "user",
            //     content: 'Format to respect: json with [{"name": "state1","code": "CA"}, {"name": "state2","code": "AL"}]'
            // }
        ],
        model: "gpt-3.5-turbo",
        stream: true,
    });

    for await (const msg of stream) {
        const content = msg.choices[0].delta.content

        fs.appendFileSync('output.txt', content+"\n");

        // Print without new line:
        if (content) {
            let res = await streamParser<"city">(content, "city");
            if (res) {
                console.log(res);
            }
        }
    }
    process.stdout.write("\n");

}

main();
// readFileParseContent();
