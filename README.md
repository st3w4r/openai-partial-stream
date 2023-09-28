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


## Modes

- NoStream
- StreamObject
- StreamObjectKeyValue
- StreamObjectKeyValueTokens


**NoStream:**
- The entire query will wait to be completed before returning anything

Pros:
- One query to receive the whole data
- Low network traffic

Cons:
- User experience is impacted, user can not consume anything user have to wait long time

**StreamObject:**
- Will return a SSE event for each item in the list.
- The whole object will appear in the list when it is ready

Pros:

- One message is one item. The object is completed when it arrive. It can be use straight away in the UI, no update needed.
- Low message number
- All the required fields arrive in the same time

Cons:

- Less realtime, the user have to wait the entire object to cosume the UI.


**StreamObjectKeyValue:**

- The object will arrive partially, the key and value will be available.
- Each key and it’s associated value will arrive in the same time.

Pros:

- User can consume part of the interface
- UI can be upadted with more update.

Cons:

- Increase the network traffic
- Partial object, can not enforce required key


**StreamObjectKeyValueToken:**

- Each Key will arrive entirely, the value will arrive partially until the full value is completed
- Enhance the power to token per token for UI

Pros:

- Feeling really interactive
- Can consume the content progressively
- Minium waiting time for the user

Cons:

- Can cause UI flashing, for example if a color or number arrive token per token the value may not be known.
- Increase network traffic.
