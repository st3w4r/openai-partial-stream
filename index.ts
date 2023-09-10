import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const chatCompletion = await openai.chat.completions.create({
    messages: [
        { 
            role: "user", 
            content: "Say this is a test" 
        }],
    model: "gpt-3.5-turbo",
    stream: true,
});

export function sayHello(name: string):string {

    console.log(chatCompletion);

    return `Hello via Bun ${name}`;
}

const res = sayHello("jay");
console.log(res);
