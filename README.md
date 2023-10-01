# Partial Stream - Unlock the potential of OpenAI function calling in streaming

![json_stream](https://pub-4dd8731c175f4032bb1e9f7019daccfe.r2.dev/json_stream_color.gif)

To install dependencies:

```bash
npm install --save openai-partial-stream
```

## Usage with simple stream

Turn a stream of token into a parsable JSON object as soon as possible.

```javascript
import OpenAi from "openai";

// Set your OpenAI API key as an environment variable: OPENAI_API_KEY
const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY });

const stream = await openai.chat.completions.create({
    messages: [{ role: "system", content: "Say hello to the world." }],
    model: "gpt-3.5-turbo", // OR "gpt-4"
    stream: true, // ENABLE STREAMING
    temperature: 1,
    functions: [
        {
            name: "say_hello",
            description: "say hello",
            parameters: {
                type: "object",
                properties: {
                    sentence: {
                        type: "string",
                        description: "The sentence generated",
                    },
                },
            },
        },
    ],
    function_call: { name: "say_hello" },
});

const openAiHandler = new OpenAiHandler(StreamMode.StreamObjectKeyValueTokens);
const entityStream = openAiHandler.process(stream);

for await (const item of entityStream) {
    console.log(item);
}
```

Output:

```js
{ index: 0, status: 'PARTIAL', data: {} }
{ index: 0, status: 'PARTIAL', data: { sentence: '' } }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hello' } }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hello,' } }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hello, world' } }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hello, world!' } }
{ index: 0, status: 'COMPLETED', data: { sentence: 'Hello, world!' } }
```

## Usage with stream and entity parsing

Validate the data against a schema and only return the data when it is valid.

```javascript
import OpenAi from "openai";

// Set your OpenAI API key as an environment variable: OPENAI_API_KEY
const openai = new OpenAi({ apiKey: process.env.OPENAI_API_KEY });

const stream = await openai.chat.completions.create({
    messages: [{ role: "system", content: "Say hello to the world." }],
    model: "gpt-3.5-turbo", // OR "gpt-4"
    stream: true, // ENABLE STREAMING
    temperature: 1,
    functions: [
        {
            name: "say_hello",
            description: "say hello",
            parameters: {
                type: "object",
                properties: {
                    sentence: {
                        type: "string",
                        description: "The sentence generated",
                    },
                },
            },
        },
    ],
    function_call: { name: "say_hello" },
});

const openAiHandler = new OpenAiHandler(StreamMode.StreamObjectKeyValueTokens);
const entityStream = openAiHandler.process(stream);

// Entity Parsing to validate the data
const HelloSchema = z.object({
    sentence: z.string().optional(),
});

const entityHello = new Entity("sentence", HelloSchema);
const helloEntityStream = entityHello.genParse(entityStream);

for await (const item of helloEntityStream) {
    console.log(item);
}
```

Output:

```js
{ index: 0, status: 'PARTIAL', data: {}, entity: 'sentence' }
{ index: 0, status: 'PARTIAL', data: { sentence: '' }, entity: 'sentence' }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hi' }, entity: 'sentence' }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hi,' }, entity: 'sentence' }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hi, world' }, entity: 'sentence' }
{ index: 0, status: 'PARTIAL', data: { sentence: 'Hi, world!' }, entity: 'sentence' }
{ index: 0, status: 'COMPLETED', data: { sentence: 'Hi, world!' }, entity: 'sentence'}
```

## Usage with stream and entity parsing with multiple entities

```javascript
// Intanciate OpenAI client with your API key
const openai = new OpenAi({
    apiKey: process.env.OPENAI_API_KEY,
});

// Call the API with stream enabled and a function
const stream = await openai.chat.completions.create({
    messages: [
        {
            role: "system",
            content: "Give me 3 cities and their postcodes in California.",
        },
    ],
    model: "gpt-3.5-turbo", // OR "gpt-4"
    stream: true, // ENABLE STREAMING
    temperature: 1.1,
    functions: [
        {
            name: "set_postcode",
            description: "Set a postcode and a city",
            parameters: {
                type: "object",
                properties: {
                    // The name of the entity
                    postcodes: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "Name of the city",
                                },
                                postcode: {
                                    type: "string",
                                    description: "The postcode of the city",
                                },
                                population: {
                                    type: "number",
                                    description: "The population of the city",
                                },
                            },
                        },
                    },
                },
            },
        },
    ],
    function_call: { name: "set_postcode" },
});

// Select the mode of the stream parser
// - StreamObjectKeyValueTokens: (REALTIME)     Stream of JSON objects, key value pairs and tokens
// - StreamObjectKeyValue:       (PROGRESSIVE)  Stream of JSON objects and key value pairs
// - StreamObject:               (ONE-BY-ONE)   Stream of JSON objects
// - NoStream:                   (ALL-TOGETHER) All the data is returned at the end of the process
const mode = StreamMode.StreamObject;

// Create an instance of the handler
const openAiHandler = new OpenAiHandler(mode);
// Process the stream
const entityStream = openAiHandler.process(stream);
// Create an entity with the schema to validate the data
const entityPostcode = new Entity("postcodes", PostcodeSchema);
// Parse the stream to an entity, using the schema to validate the data
const postcodeEntityStream = entityPostcode.genParseArray(entityStream);

// Iterate over the stream of entities
for await (const item of postcodeEntityStream) {
    if (item) {
        // Display the entity
        console.log(item);
    }
}
```

Output:

```js
{ index: 0, status: 'COMPLETED', data: { name: 'Los Angeles', postcode: '90001', population: 3971883 }, entity: 'postcodes' }
{ index: 1, status: 'COMPLETED', data: { name: 'San Francisco', postcode: '94102', population: 883305 }, entity: 'postcodes' }
{ index: 2, status: 'COMPLETED', data: { name: 'San Diego', postcode: '92101', population: 1425976 }, entity: 'postcodes'}
```

# Modes

Select a mode from the list below that best suits your requirements:

1. **NoStream**
2. **StreamObject**
3. **StreamObjectKeyValue**
4. **StreamObjectKeyValueTokens**

---

### NoStream

Results are returned only after the entire query completes.

| **NoStream Details**                                             |
| ---------------------------------------------------------------- |
| ✅ Single query retrieves all data                               |
| ✅ Reduces network traffic                                       |
| ⚠️ User experience may be compromised due to extended wait times |

---

### StreamObject

An event is generated for each item in the list. Items appear as they become ready.

| **StreamObject Details**                                                        |
| ------------------------------------------------------------------------------- |
| ✅ Each message corresponds to a fully-formed item                              |
| ✅ Fewer messages                                                               |
| ✅ All essential fields are received at once                                    |
| ⚠️ Some delay: users need to wait until an item is fully ready to update the UI |

---

### StreamObjectKeyValue

Objects are received in fragments: both a key and its corresponding value are sent together.

| **StreamObjectKeyValue Details**                          |
| --------------------------------------------------------- |
| ✅ Users can engage with portions of the UI               |
| ✅ Supports more regular UI updates                       |
| ⚠️ Higher network traffic                                 |
| ⚠️ Challenges in enforcing keys due to incomplete objects |

---

### StreamObjectKeyValueTokens

Keys are received in full, while values are delivered piecemeal until they're complete. This method offers token-by-token UI updating.

| **StreamObjectKeyValueToken Details**                               |
| ------------------------------------------------------------------- |
| ✅ Offers a dynamic user experience                                 |
| ✅ Enables step-by-step content consumption                         |
| ✅ Decreases user waiting times                                     |
| ⚠️ Possible UI inconsistencies due to values arriving incrementally |
| ⚠️ Augmented network traffic                                        |

## Demo

![stream_colors](https://pub-4dd8731c175f4032bb1e9f7019daccfe.r2.dev/Color_Streaming_Mode_3_colors.gif)
