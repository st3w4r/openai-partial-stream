import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



let buffer = "";
let list = [];

async function streamParser(content: any) {
    
    buffer += content;
    // List parser
    if (buffer.startsWith("- ") && buffer.endsWith("\n")) {
        let s = buffer.slice(2, -1);
        list.push(s);
        buffer = "";
        process.stdout.write(s);
        process.stdout.write("\n");
    } 
}


export async function main(name: string) {

    const stream = await openai.chat.completions.create({
        messages: [
            { 
                role: "user", 
                content: "Give me a list of 5 cities in california. Bullet point them." 
            }],
        model: "gpt-3.5-turbo",
        stream: true,
    });

    for await (const msg of stream) {
        // console.log(msg);
        const content = msg.choices[0].delta.content

        // Print without new line:
        if (content) {
            streamParser(content);
        }
    }
    process.stdout.write("\n");

}

main();
