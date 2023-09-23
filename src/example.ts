import OpenAI from "openai";
import { z } from "zod";
import { readFileParseContent, genPromptSchema, handleOpenAiResponse, handleOpenAiResponse3, readFileAndStreamContent, handleMockResponse } from "./index.js";

import { StreamMode } from "./utils.js";

import { OpenAiHandler } from "./openAiHandler.js";

import { Entity } from "./entity.js";

import * as fs from "fs";
import * as readline from "readline";
import { Stream } from "stream";

// Interface for developer how to use this library


// Setps:
// Import openai library
// Set an instance of openai
// Use stream
// Create an enity, with interface or zod schema
// Transform the zod schema to a json object
// Add to the prompt the json object and instruction
// Send the prompt to openai
// Send the stream to the parser


// const openai = "";

// import { readFileParseContent } from "./src/readFileParseContent";

// Import the file from ./src/readFileParseContent


// Schema

const PostCodeSchema = z.object({
    postcode: z.string().optional(),
    councilName: z.string().optional(),
    country: z.string().optional(),
});

const ColorSchema = z.object({
    hex: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
});

const FrenchCorrectorSchema = z.object({
    text_input_7: z.string().optional(),
    text_input_15: z.string().optional(),
});

const CodeActionSchema = z.object({
    actions: z.array(z.string()).optional(),
});

const TaglineSchema = z.object({
    tagline: z.string().optional(),
});


// Exmaple
// {
//     "name": "Coffea arabica",
//     "common_name": "Arabica",
//     "production_percentage": "60-70%",
//     "characteristics": [
//        "Smooth, mild flavor",
//        "Aromatic qualities",
//        "Less caffeine than Robusta"
//     ],
//     "sub_varieties": ["Typica", "Bourbon", "Geisha", "SL28"]
//  },
const CoffeeOrigin = z.object({
    name: z.string().optional(),
    common_name: z.string().optional(),
    production_percentage: z.string().optional(),
    characteristics: z.array(z.string()).optional(),
    sub_varieties: z.array(z.string()).optional(),
});

type PostCode = z.infer<typeof PostCodeSchema>;
type Color = z.infer<typeof ColorSchema>;
type CoffeeOrigin = z.infer<typeof CoffeeOrigin>;


// API call

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


function getCoffeeMessages(entity: Entity): any[] {
    return [
        {
            role: "system",
            content: "Write JSON only"
        },
        {
            role: "user",
            content: "Give me a list of 5 coffee origin with their name, common name, production percentage, characteristics and sub varieties."
        },
        {
            role: "user",
            content: entity.generatePromptSchema(),
        },
    ];
}

function getColorMessages(number: string, entity: Entity): any[] {
    return [
        {
            role: "system",
            content: "Write JSON only"
        },
        {
            role: "user",
            content: "Give me a palette of "+number+" gorgeous color with the hex code, name and a description."
        },
        // {
        //     role: "user",
        //     content: entity.generatePromptSchema(),
        // },
    ];
}

function getFrenchCorrectorMessages(): any[] {

    return [
		{
			"role": "user",
			"content": "Correct this french text: salut sa va?"
		}
	]
}

function getTaglineMessages(): any[] {

    return [
        {
            "role": "system",
            "content": `
                Generate a tagline related to the following text:(MAXIUM 60 CHARACTERS)
                Partial Stream Spec is a specification for a stream of raw text or structured JSON that can be partially parsed and return early results for an early consumption.
                Use cases are:
                - LLM stream of token as JSON format.
                - OpenAI Function calling, handling stream of data.
                - Improve UI/UX by showing partial results to the end user.

                What is the goal of this project?:
                - Make AI apps more interactive and responsive. 
                - Elevate AI experiences to new interactive heights.
                - Bring your AI applications to life with dynamic interactivity.
                - Turbocharge your AI apps with unparalleled responsiveness.
                - Transforming AI apps from static to sensational.
                - Push the boundaries of AI with enhanced interactivity.
                - Elevate every AI interaction, every time.
                - Breathe life into AI: more dynamic, more responsive.
                - Where AI meets interactivity and redefines possibility.
                - Seamless interactivity is the future of AI applications.
                - Dive into the next-gen of immersive AI experiences.
            `
        },
        // Unlock the power of interactive AI experiences.
        // Elevate AI apps with partial parsing and early results.
        // Partial Stream Spec: Unleash the Power of Early Consumption

        // {
        //     "role": "user",
        //     "content": `
        //     Generate a tagline by getting inspiration from that: (MAXIUM 60 CHARACTERS)
        //     Make AI apps more interactive and responsive. 
        //     Elevate AI experiences to new interactive heights.
        //     Bring your AI applications to life with dynamic interactivity.
        //     Turbocharge your AI apps with unparalleled responsiveness.
        //     Transforming AI apps from static to sensational.
        //     Push the boundaries of AI with enhanced interactivity.
        //     Elevate every AI interaction, every time.
        //     Breathe life into AI: more dynamic, more responsive.
        //     Where AI meets interactivity and redefines possibility.
        //     Seamless interactivity is the future of AI applications.
        //     Dive into the next-gen of immersive AI experiences.
        //     `
        // }
    ]
}

function getCodeActionMessages(): any[] {
    return [
		{
			"role": "system",
			"content": "Detect which action the user whants to do. Only from the enum list"
		},
		{
			"role": "user",
			"content": "The code have change"
		}
	];
}


function getColorFunction() {
    return {
        name: "addColors",
        description: "Add a list of color",
        parameters: {
            type: "object",
            properties: {
                hex: {
                    type: "string",
                    description: "The hexadecimal code of the color"
                },
                name: {
                    type: "string",
                    description: "The color name"
                },
                description: {
                    type: "string",
                    description: "The description of the color"
                }
            }
        }
    }
}

function getColorListFunction() {
    return {
        name: "give_colors",
        description: "Give a list of color",
        parameters: {
            type: "object",
            properties: {
                colors: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            hex: {
                                type: "string",
                                description: "The hexadecimal code of the color"
                            },
                            name: {
                                type: "string",
                                description: "The color name"
                            },
                            description: {
                                type: "string",
                                description: "The description of the color"
                            }
                        }
                    }
                }
            }
        },
    }
}

function frenchCorrectorFunction() {
    return {
        name: "french_corrector",
        description: "Terminé le 0/20",
        parameters: {
            type: "object",
            properties: {
                user_inputs: {
                    type: "object",
                    description: "User inputs fields",
                    properties: {
                        text_input_7: {
                            type: "object",
                            properties: {
                                value: {
                                    type: "string",
                                    description: "Entrer le text que vous voulez faire corriger."
                                }
                            },
                            required: ["value"]
                        },
                        text_input_15: {
                            type: "object",
                            properties: {
                                value: {
                                    type: "string",
                                    description: "Explication des erreurs",
                                    enum: [
                                        "Activé",
                                        "Desactivé"
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            required: [
                "user_inputs"
            ]
        }
    };
}

function codeActionFunction() {
    return {
        name: "trigger_action",
        description: "Trigger the corresponding action",
        parameters: {
            type: "object",
            properties: {
                actions: {
                    type: "array",
                    description: "The action return only the one from the enum lower case with underscore",
                    items: {
                        type: "string",
                        enum: [
                            "refactor",
                            "update_function",
                            "add_function",
                            "delete_function",
                            "create_file",
                            "delete_file",
                            "rename_file",
                            "UNKNOWN"
                        ]
                    }
                }
            },
            required: [
                "trigger_action"
            ]
        }
    };
}

function getTaglineFunction() {
    return {
        name: "tagline",
        description: "Generate a tagline",
        parameters: {
            type: "object",
            properties: {
                tagline: {
                    type: "string",
                    description: "The tagline generated"
                }
            }
        }
    }
}


async function* readAndParseFile(filePath: string) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    try {
        for await (const line of rl) {
            // Parse the line as needed.
            // await new Promise((resolve) => setTimeout(resolve, 10));
            yield JSON.parse(line);
        }
    } catch (error) {
        console.log(error);
    } finally {
        // This will be executed after all lines are read or if an error occurs.
        fileStream.close();
        // yield {};
    }
}
const stream = readAndParseFile("./spec/data/color_stream_fc_5.jsonl");




export async function callGenerateTagline(mode: StreamMode = StreamMode.StreamObjectKeyValueTokens) {

    const stream = await openai.chat.completions.create({
        messages: getTaglineMessages(),
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        stream: true, // ENABLE STREAMING
        temperature: 1.1,
        // Functions:
        functions: [
            getTaglineFunction(),
        ],
        function_call: {name: "tagline"}
    });

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);
    const entityTagline = new Entity("tagline", TaglineSchema);
    const taglineEntityStream = entityTagline.genParse(entityStream);

    return taglineEntityStream;
}


export async function callGenerateColors(mode: StreamMode = StreamMode.StreamObjectKeyValueTokens) {

    const entity = new Entity("colors", ColorSchema);
    const entityPostCode = new Entity("PostCode", PostCodeSchema);
    const entityCoffee = new Entity("CoffeeOrigin", CoffeeOrigin);
    const entityFrenchCorrector = new Entity("user_inputs", FrenchCorrectorSchema);

    const entityCodeAction = new Entity("actions", CodeActionSchema);


    const stream = await openai.chat.completions.create({
        messages: getColorMessages("5", entity),
        // messages: getCodeActionMessages(),
        model: "gpt-3.5-turbo",
        // model: "gpt-4",
        stream: true, // ENABLE STREAMING
        // temperature: 0.7,
        temperature: 1.3,
        // temperature: 2,

        // Functions:
        functions: [
            // getColorFunction(),
            getColorListFunction(),
            // frenchCorrectorFunction(),
            // codeActionFunction(),
        ],
        function_call: {name: "give_colors"}
        // function_call: {name: "french_corrector"}
        // function_call: {name: "trigger_action"}

    });

    // Mock stream
    // const stream = readAndParseFile("./spec/data/color_stream_fc_5.jsonl");


    console.log(entity.generatePromptSchema());


    // Parser
    // API proposal:
    // const entityStream = streamParser(stream, PostCodeSchema);

    // const entityStream = handleOpenAiResponse(stream, ColorSchema, mode);
    
    // Version 2
    // const entityStream = handleOpenAiResponse2(stream, ColorSchema, mode);

    // Version 3
    // const entityStream = handleOpenAiResponse3(stream, ColorSchema, mode);

    // Version 4

    const openAiHandler = new OpenAiHandler(mode);
    const entityStream = openAiHandler.process(stream);


    // return entityStream;
    // COLOR
    // const colorEntityStream = entity.genParse(entityStream);
    const entityColors = new Entity("colors", ColorSchema);
    const colorEntityStream = entityColors.genParseArray(entityStream);
    return colorEntityStream;

    // const entityPostCode = new Entity("PostCode", PostCodeSchema);
    // const postCodeStream = entityPostCode.genParseArray(entityStream);

    // const resStream = entityFrenchCorrector.genParseArray(entityStream);

    // const resStream = entityCodeAction.genParse(entityStream);
    // const resStream = entityCodeAction.genParseArray(entityStream);
    // return resStream;

}


// await callGenerateColors();

// console.log("Start");
// for await (const data of await callGenerateColors()) {
//     console.log(data);
// }


// for await (const entity of entityStream) {
//     console.log(entity);
// }



// Mock

// mock stream
const mockStream = readFileAndStreamContent("./output_postcode_partial.txt");
// Parser
const mockEnitytStream = handleMockResponse(mockStream, PostCodeSchema, StreamMode.StreamObjectKeyValueTokens);

for await (const entity of mockEnitytStream) {
    console.log(entity);
}

