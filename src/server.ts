import express, { Request, Response } from 'express';
import { callGenerateColors } from './example.js';

const app = express();
const PORT: number = 3000;

// Middleware to handle POST data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS setup
app.use((req: Request, res: Response, next: Function) => {
    // Setting headers to handle the CORS issues
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    // Proceed to the next middleware
    next();
});

// SSE setup
app.use((req: Request, res: Response, next: Function) => {
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    next();
});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, World!');
});


import { StreamMode } from "./utils.js";


app.get('/sse', async (req: Request, res: Response) => {

    // Extract mode from the query parameter
    const mode: StreamMode = req.query.mode as StreamMode;

    
    // Set response headers for SSE
    res.header('Content-Type', 'text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with the client

    // On client disconnect, remove them from the clients list
    req.on('close', () => {
        console.log("Client disconnected");
        // TODO: Stop processing
    });

    const gen = await callGenerateColors(mode);
    
    for await (const data of gen) {
        console.log(data);
        if (data === null) {
            break;
        }
        res.write(`data: ${JSON.stringify({ message: data })}\n\n`);
    }

    console.log("Done");
    res.write('event: CLOSE\n');
    res.write('data: Done, closing connection\n\n');
    res.end();
    
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
