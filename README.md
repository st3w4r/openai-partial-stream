# Partial Stream - Unlock the potential of OpenAI function calling in streaming

To install dependencies:

```bash
npm install --save openai-partial-stream
```



## Usage with simple stream

Turn a stream of token into a parsable JSON object as soon as possible.

```javascript
const stream = await openai.chat.completions.create({
    messages: [{ role: "system",content: "Say hello to the world." }],
    model: "gpt-3.5-turbo", // OR "gpt-4"
    stream: true, // ENABLE STREAMING
    temperature: 1,
    functions: [{
            name: "say_hello",
            description: "say hello",
            parameters: {
                type: "object", properties: {
                sentence: { type: "string", description: "The sentence generated" }
                }
            }}],
    function_call: { name: "say_hello" }
});


const openAiHandler = new OpenAiHandler(StreamMode.StreamObjectKeyValueTokens;);
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

const stream = await openai.chat.completions.create({
    messages: [{ role: "system",content: "Say hello to the world." }],
    model: "gpt-3.5-turbo", // OR "gpt-4"
    stream: true, // ENABLE STREAMING
    temperature: 1,
    functions: [{
            name: "say_hello",
            description: "say hello",
            parameters: {
                type: "object", properties: {
                sentence: { type: "string", description: "The sentence generated" }
                }
            }}],
    function_call: { name: "say_hello" }
});


const openAiHandler = new OpenAiHandler(StreamMode.StreamObjectKeyValueTokens;);
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


# Modes

Select a mode from the list below that best suits your requirements:

1. **NoStream**
2. **StreamObject**
3. **StreamObjectKeyValue**
4. **StreamObjectKeyValueTokens**

---

### NoStream

Results are returned only after the entire query completes.

| **NoStream Details**                                         |
|--------------------------------------------------------------|
| ✅ **Pros:**                                                 |
| - Single query retrieves all data                            |
| - Reduces network traffic                                    |
| ❌ **Cons:**                                                 |
| - User experience may be compromised due to extended wait times |

---

### StreamObject

An event is generated for each item in the list. Items appear as they become ready.

| **StreamObject Details**                                     |
|--------------------------------------------------------------|
| ✅ **Pros:**                                                 |
| - Each message corresponds to a fully-formed item            |
| - Fewer messages                                            |
| - All required fields are received at once                  |
| ❌ **Cons:**                                                 |
| - Some delay: users need to wait until an item is fully ready to update the UI |

---

### StreamObjectKeyValue

Objects are received in fragments: both a key and its corresponding value are sent together.

| **StreamObjectKeyValue Details**                             |
|--------------------------------------------------------------|
| ✅ **Pros:**                                                 |
| - Users can engage with portions of the UI                   |
| - Supports more regular UI updates                           |
| ❌ **Cons:**                                                 |
| - Higher network traffic                                     |
| - Challenges in enforcing keys due to incomplete objects     |

---

### StreamObjectKeyValueTokens

Keys are received in full, while values are delivered piecemeal until they're complete. This method offers token-by-token UI updating.

| **StreamObjectKeyValueToken Details**                        |
|--------------------------------------------------------------|
| ✅ **Pros:**                                                 |
| - Offers a dynamic user experience                           |
| - Enables realtime content consumption                      |
| - Decreases user waiting times                              |
| ❌ **Cons:**                                                 |
| - Possible UI inconsistencies due to values arriving incrementally |
| - Augmented network traffic                                 |

