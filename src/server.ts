import express, { Request, Response } from 'express';

import { callGenerateColors } from './example.js';

const app = express();
const PORT: number = 3000;

let clients: Response[] = [];

// Middleware to handle POST data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SSE setup
app.use((req: Request, res: Response, next: Function) => {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, World!');
});


app.get('/sse', async (req: Request, res: Response) => {
    // Set response headers for SSE
    res.header('Content-Type', 'text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client

    // Add client to clients list
    clients.push(res);
    // On client disconnect, remove them from the clients list
    req.on('close', () => {
        clients = clients.filter(client => client !== res);
    });

    const gen = await callGenerateColors()
    
    for await (const data of gen) {
        console.log(data);
        if (data === null) {
            break;
        }
        res.write(`data: ${JSON.stringify({ message: data })}\n\n`);

    }
    console.log("Done");
    clients = clients.filter(client => client !== res);
    res.end();
});

// Simulate some data sending every 5 seconds
// setInterval(() => {
//     clients.forEach(client =>
//         client.write(`data: ${JSON.stringify({ message: 'Hello from SSE!' })}\n\n`)
//     );
// }, 5000);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
