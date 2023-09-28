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

Choose from one of the following modes based on your needs:

1. **NoStream**
2. **StreamObject**
3. **StreamObjectKeyValue**
4. **StreamObjectKeyValueTokens**

---

### NoStream

The entire query will be completed before returning any results.

| ✅ **Pros**                                           | ❌ **Cons**                                                                                   |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| One query to fetch the entire data                  | User experience is affected: users must wait a considerable time before consuming any data    |
| Minimizes network traffic                           |                                                                                               |

---

### StreamObject

Returns an SSE event for each item in the list. Each object appears in the list when it's ready.

| ✅ **Pros**                                           | ❌ **Cons**                                                                                   |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Each message corresponds to a complete item         | Slightly delayed: users must wait for the entire object to be ready before updating the UI    |
| Low message count                                   |                                                                                               |
| All required fields arrive simultaneously            |                                                                                               |

---

### StreamObjectKeyValue

Objects arrive partially; both the key and its associated value become available simultaneously.

| ✅ **Pros**                                           | ❌ **Cons**                                                                                   |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Users can interact with parts of the interface      | Increased network traffic                                                                     |
| Enables more frequent UI updates                    | Partial objects make it hard to enforce required keys                                         |

---

### StreamObjectKeyValueToken

Each key arrives fully, but the value arrives in parts until completion. This approach enhances the ability to update the UI token by token.

| ✅ **Pros**                                           | ❌ **Cons**                                                                                   |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Highly interactive experience                       | Potential UI flashing: values arriving token by token may produce unexpected visuals          |
| Progressive content consumption                     | Increased network traffic                                                                     |
| Reduces user wait times                             |                                                                                               |

---

Remember, when using tables in a GitHub README, ensure they're formatted correctly. This should make your README look more structured and visually appealing.
