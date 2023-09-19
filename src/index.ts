import OpenAI from "openai";

import * as fs from 'fs';
import { z } from "zod";
import { zodToTs, printNode } from "zod-to-ts";
import { Stream } from "stream";
import { STATUS_CODES } from "http";

import { PassThrough } from "stream";
import { StreamMode } from "./utils.js";

// import { JsonChunk } from "./streamParser4.js";

import { StreamParser } from "./streamParser5.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


// const Stream = require("stream");
// const writableStream = new Stream.Writable();


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

// interface City {
//     name: string;
//     state_code?: string;
//     population: number;
// }

const CitySchema = z.object({
    name: z.string(),
    state_code: z.string().optional(),
    population: z.number().optional(),
    // population: z.string(),
});

type City = z.infer<typeof CitySchema>;

// interface State {
//     name: string;
//     code: string;
// }

const StateSchema = z.object({
    name: z.string(),
    code: z.string(),
})

type State = z.infer<typeof StateSchema>;

type EntityType = "city" | "state";

type Entity = City | State;

// type EntitySchemaType = z.ZodType<City> | z.ZodType<State> | z.ZodTypeAny;

// type EntitySchemaType = z.ZodType<Entity>



interface EntityMap {
    city: City;
    state: State;
}


type EntityFactoryMap = {
    [K in EntityType]: (data: any) => EntityMap[K] | null;
}


function parseEntity<D extends Entity, S extends z.ZodType<D>>({data, schema} : {data: any, schema: S}): D | null {
    const parserRes = schema.safeParse(data);
    return parserRes.success ? parserRes.data : null;
}

type EntitySchemaMap = {
    [K in EntityType]: z.ZodTypeAny;
}

const mapEntitySchema: EntitySchemaMap = {
    city: CitySchema,
    state: StateSchema
}

const entityFactories: EntityFactoryMap = {
    city: (data: any): City | null => parseEntity({data, schema: CitySchema}),
    state:  (data: any): State | null => parseEntity({data, schema: StateSchema})
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
    const entity: EntityMap[E] | null = factory(jsonEntity);


    // const schema: EntitySchemaMap[E] = mapEntitySchema[entityType];
    // const entity = parseEntity({data: jsonEntity, schema});

    // const entity = parseEntity({data: jsonEntity, schema: CitySchema});

    // const entity = entityFactories[E](jsonEntity);

    return entity;
}


function simpleExtractEntity(buffer: string, schema: z.ZodTypeAny) {
    const jsonEntity = getJsonObject(buffer);
    if (!jsonEntity) {
        return null;
    }
    const entity = parseEntity({data: jsonEntity, schema});
    return entity;
}


function hasKeyValuePattern(s: string): boolean {
    // Regular expression for the pattern "key": "value"
    const regex = /(?<!\\)"[^"]+":\s*(?<!\\)"[^"]*"/;
    return regex.test(s);
}


let nbKey = 0;
let prevValueLen = 0;

function partialStreamParserKeyValueTokens(content: any, schema: z.ZodTypeAny) {

    let start = content.indexOf("{");
    let end = content.indexOf("}");

    if (start !== -1) {
        inString = true;
    }
    if (end !== -1) {
        inString = false;
    }

    function extractKeyValuePairsWithCorrection(s: string): string[] {
        // 1. Regular expression for complete "key": "value" pairs
        const completeRegex = /(?<!\\)"[^"]+"\s*:\s*(?<!\\)"[^"]*"/g;

        // 2. Regular expression for "key": "incompleteValue patterns
        const incompleteRegex = /(?<!\\)"([^"]+)"\s*:\s*(?<!\\)"([^"]+)$/;

        let result: string[] = [...s.match(completeRegex) || []];

        const incompleteMatch = s.match(incompleteRegex);
        if (incompleteMatch) {
            const corrected = `"${incompleteMatch[1]}": "${incompleteMatch[2]}"`; // close the incomplete value
            result.push(corrected);
        }
    
        return result;
    }
    
    const kvList = extractKeyValuePairsWithCorrection(buffer);

    if (kvList.length === 0) {
        return null;
    }

    // Detect if changes happened 
    if (kvList.length > nbKey) {
        // Reset value length because new key is added
        prevValueLen = 0;
    }

    // Detect change in the value
    const maxKey = kvList.length - 1 > 0 ? kvList.length - 1 : 0;

    const valueLen = kvList[maxKey].length;
    console.log(kvList[maxKey], valueLen, prevValueLen, nbKey, kvList.length)


    if (valueLen <= prevValueLen) {
        // console.log("no new content added to value");
        return null
    }

    prevValueLen = valueLen;

    if (end !== -1) {
        nbKey = 0;
        prevValueLen = 0;
    }


    let jsonObj = kvList?.join(",")

    jsonObj = "{" + jsonObj + "}"

    const outputEntity = simpleExtractEntity(jsonObj, schema);

    nbKey = kvList.length;


    return outputEntity;
}





let nbKeyValue = 0;

function partialStreamParser(content: any, schema: z.ZodTypeAny) {

    let start = content.indexOf("{");
    let end = content.indexOf("}");

    if (start !== -1) {
        inString = true;
    }
    if (end !== -1) {
        inString = false;
    }

    function extractKeyValuePairs(s: string): string[] {
        // Regular expression for the pattern "key": "value"
        const regex = /(?<!\\)"[^"]+"\s*:\s*(?<!\\)"[^"]*"/g;
        return s.match(regex) || [];
    }

    const kvList = extractKeyValuePairs(buffer);

    if (kvList.length === 0) {
        return null;
    }

    // Detect if changes happened    
    if (kvList.length <= nbKeyValue) {
        // console.log("no new value");
        return null
    }

    if (end !== -1) {
        nbKeyValue = 0;
    }


    let jsonObj = kvList?.join(",")

    jsonObj = "{" + jsonObj + "}"
    // console.log(jsonObj);


    const outputEntity = simpleExtractEntity(jsonObj, schema);

    if (outputEntity) {
        nbKeyValue = kvList.length;
        // partialBuffer = "";
    }

    return outputEntity;
}

let enableTokenValueStream = true

function simpleStreamParser(content: any, schema: z.ZodTypeAny, mode: StreamMode) {
    
    let completed = false;
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
        
        completed = false;

        
        if (mode == StreamMode.StreamObjectKeyValueTokens) {
            outputEntity = partialStreamParserKeyValueTokens(buffer, schema);

        } else if (mode == StreamMode.StreamObjectKeyValue) {
            outputEntity = partialStreamParser(buffer, schema);
        }

    } else {

        completed = true;

        // Flush
        if (end !== -1) {
            buffer += content;
        }

        if (buffer.length > 0) {
            outputEntity = simpleExtractEntity(buffer, schema);
        }
        buffer = "";
        nbKeyValue = 0;
        nbKey = 0;
        prevValueLen = 0;
    }

    return [outputEntity, completed];
}


export async function streamParser<E extends EntityType>(content: any, entityType: E) {

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


// Enum for status

enum Status {
    COMPLETED = "COMPLETED",
    PARTIAL = "PARTIAL",
    FAILED = "FAILED",
}

type StreamResponseWrapper = {
    index: number;
    status: Status;
    data: any;
}


export async function* readFileAndStreamContent(filename: string) {

    const data = fs.readFileSync(filename, "utf-8");

    const lines = data.split(/\r?\n/);

    for (let line of lines) {
        await delay(50);
        yield line
    }
}

export async function readFileParseContent() {



    // readfile and parse
    const data = fs.readFileSync('output_state.txt', 'utf8');
    const lines = data.split(/\r?\n/);

    let itemIdx = 0;
    for (let line of lines) {
        let res = await streamParser<"state">(line, "state");
        
        
        if (res) {

            const streamRes: StreamResponseWrapper = {
                index: itemIdx,
                status: Status.COMPLETED,
                data: res,
            }

            // console.log("Item index:", itemIdx);
            console.log(streamRes);
            itemIdx++;
        }
        await delay(10);

    }
}


export function genPromptSchema(schema: z.ZodTypeAny, entityName: string) {
    const { node } = zodToTs(schema, entityName);
    const nodeString = printNode(node);
    console.log(nodeString);
    const prompt = `
    Format an array of json object to respect this json TypeScript definition:
    ${nodeString}

    Output as a json array:
    example: [{"name": "value"}, {"name": "value"}]

    Now convert to the JSON format, write directly to JSON. No explanation needed.
    `;
    return prompt;
}


function generateEntityJsonPrompt(entityType: EntityType) {

    const entitySchema = mapEntitySchema[entityType];
    const { node } = zodToTs(entitySchema, entityType);
    const nodeString = printNode(node);
    console.log(nodeString);

    const prompt = `
    Format a list of json object to respect this json TypeScript definition: ${nodeString}
    `;

    return prompt;
}





export async function* handleMockResponse(stream: any, schema: z.AnyZodObject, mode: StreamMode) {
 
    let itemIdx = 0;

    let noStreamBufferList: any = [];

    for await (const content of stream) {
        
        // process.stdout.write(content);
        
        if (content) {

            let [res, completed] = simpleStreamParser(content, schema, mode);


            if (res) {
                const streamRes: StreamResponseWrapper = {
                    index: itemIdx,
                    status: completed? Status.COMPLETED: Status.PARTIAL,
                    data: res,
                }

                if (completed === true) {
                    itemIdx++;
                }

                // resString = JSON.stringify(streamRes)

                // process.stdout.write("\n\n");

                if (mode === StreamMode.NoStream) {
                    if (completed === true) {
                        noStreamBufferList.push(res);
                    }
                } else {

                    yield streamRes;
                }

                // writableStream.write(streamRes);
                // console.log(streamRes);
            } else {
                // process.stdout.write(content);
            }
        }
    }



    if (mode === StreamMode.NoStream) {
        const streamRes: StreamResponseWrapper = {
            index: itemIdx,
            status: Status.COMPLETED,
            data: noStreamBufferList,
        }
        yield streamRes;
    }


    yield null;
}


// export async function* handleOpenAiResponse2(stream: any, schema: z.ZodTypeAny, mode: StreamMode) {
    
//     let itemIdx = 0;
//     let objBuilder:any = {}
//     let prevIndex = 0;
//     let prevObject = {};


//     let noStreamBufferList: any = [];
    
    
//     const parser = new StreamParser();

//     for await (const msg of stream) {
//         const content = msg.choices[0].delta.content + "";
        
//         process.stdout.write(content);
        
//         if (content) {


//             const chunks: JsonChunk[] = parser.processChunk(content);

//             for (const chunk of chunks) {
//                 // Reset if new object
//                 if (chunk.index > prevIndex) {
//                     prevObject = 
//                     prevIndex = chunk.index;
//                     objBuilder = {};
//                 }

//                 objBuilder[chunk.key] = chunk.value;

//                 const objStr = JSON.stringify(objBuilder);
//                 // console.log(objStr);

//                 const outputEntity = simpleExtractEntity(objStr, schema);
//                 // console.log(outputEntity);
//                 if (outputEntity) {
//                     const streamRes: StreamResponseWrapper = {
//                         index: chunk.index,
//                         status: chunk.completed ? Status.COMPLETED : Status.PARTIAL,
//                         data: outputEntity,
//                     }

//                     if (mode === StreamMode.NoStream) {
//                         if (chunk.completed === true) {
//                             noStreamBufferList.push(chunk);
//                         }
//                     } else {
//                         yield streamRes;
//                     }
//                 }
//             }
//         }
//     }


//     if (mode === StreamMode.NoStream) {
//         const streamRes: StreamResponseWrapper = {
//             index: itemIdx,
//             status: Status.COMPLETED,
//             data: noStreamBufferList,
//         }
//         yield streamRes;
//     }


//     yield null;
// }



export async function* handleOpenAiResponse(stream: any, schema: z.ZodTypeAny, mode: StreamMode) {
    
    let itemIdx = 0;


    let noStreamBufferList: any = [];

    for await (const msg of stream) {
        let content = "";
        content = msg.choices[0].delta.content;

        if (!content) {
            content = msg.choices[0]?.delta?.function_call?.arguments + "";
        }
        
        process.stdout.write(content);
        
        if (content) {

            let [res, completed] = simpleStreamParser(content, schema, mode);
            if (res) {
                const streamRes: StreamResponseWrapper = {
                    index: itemIdx,
                    status: completed? Status.COMPLETED: Status.PARTIAL,
                    data: res,
                }

                if (completed === true) {
                    itemIdx++;
                }

                // resString = JSON.stringify(streamRes)
                
                // process.stdout.write("\n\n");

                if (mode === StreamMode.NoStream) {
                    if (completed === true) {
                        noStreamBufferList.push(res);
                    }
                } else {

                    yield streamRes;
                }

                // writableStream.write(streamRes);
                // console.log(streamRes);
            } else {
                // process.stdout.write(content);
            }
        }
    }


    if (mode === StreamMode.NoStream) {
        const streamRes: StreamResponseWrapper = {
            index: itemIdx,
            status: Status.COMPLETED,
            data: noStreamBufferList,
        }
        yield streamRes;
    }


    yield null;
}

export async function* handleOpenAiResponse3(stream: any, schema: z.ZodTypeAny, mode: StreamMode) {
    
    let itemIdx = 0;
    let noStreamBufferList: any = [];

    const parser = new StreamParser(mode);


    for await (const msg of stream) {

        let content = "";
        content = msg.choices[0].delta.content;

        if (!content) {
            content = msg.choices[0]?.delta?.function_call?.arguments + "";
            console.log("FUNCTION CALL");
        }

        process.stdout.write(content);

        const res = parser.parse(content);


        if (mode === StreamMode.NoStream || mode === StreamMode.Batch) {
            if (res?.status === Status.COMPLETED) {
                noStreamBufferList.push(res);
            }
        } else if (res) {
            yield res;
        }

    }


    if (mode === StreamMode.NoStream) {
        for (const item of noStreamBufferList) {
            yield item;
        }
    } else if (mode === StreamMode.Batch) {
        const streamRes: StreamResponseWrapper = {
            index: itemIdx,
            status: Status.COMPLETED,
            data: noStreamBufferList.map((item: any) => item.data),
        }
        yield streamRes;
    }


    yield null;
}


export async function main() {

    const entityPrompt = generateEntityJsonPrompt("city");

    const stream = await openai.chat.completions.create({
        messages: [
            { 
                role: "user", 
                content: "Give me 5 cities in california." 
            },
            {
                role: "user",
                content: entityPrompt,
            },
            // {
            //     role: "user",
            //     content: "When refering a number revert each digit. For example 1234 becomes 4321. Rewrite the entire JSON",
            // }
            // {
            //     role: "user", 
            //     content: 'Format to respect: json with [{"name": "city1"}, {"name": "city2"}]'
            // },
            // {
            //     role: "user", 
            //     content: 'Add the property state_code to each city in the json.'
            // },
            // {
            //     role: "user", 
            //     content: 'Add the property population to each city in the json.'
            // },
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
        // model: "gpt-4",
        stream: true,
        temperature: 0.7,
    });

    for await (const msg of stream) {
        const content = msg.choices[0].delta.content + "";

        fs.appendFileSync('output.txt', content);

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

// main();
// readFileParseContent();
