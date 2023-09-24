import express, { Request, Response } from 'express';

import { StreamMode } from "../lib/utils.js";
import { callGenerateColors, callGenerateTagline } from './example.js';
import { setSSEHeaders, closeSSEConnection, senderHandler } from './sse.js';

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
    res.send('Welcome to Partial Stream!');
});

app.get("/sse/tagline", async (req: Request, res: Response) => {

    // Extract mode from the query parameter
    const mode: StreamMode = req.query.mode as StreamMode;

    // Open SSE connection
    setSSEHeaders(res);

    // On client disconnect, remove them from the clients list
    req.on('close', () => {
        console.log("Client disconnected");
        // TODO: Stop processing
    });

    const gen = await callGenerateTagline(mode);
    // Send each message to the client via SSE
    await senderHandler(res, gen);
    // Close SSE connection
    closeSSEConnection(res);
    console.log("Done");

});

app.get('/sse/colors', async (req: Request, res: Response) => {

    // Extract mode from the query parameter
    const mode: StreamMode = req.query.mode as StreamMode;

    // Open SSE connection
    setSSEHeaders(res);
    
    // On client disconnect, remove them from the clients list
    req.on('close', () => {
        console.log("Client disconnected");
        // TODO: Stop processing
    });

    // Retry 3 times if no message is sent
    let nbMsgSent = 0;
    let retryCount = 0;
    while (nbMsgSent === 0 && retryCount < 3) {
        const gen = await callGenerateColors(mode);
        // Send each message to the client via SSE
        nbMsgSent = await senderHandler(res, gen);
        retryCount++;
    }
    console.log(`Retry count: ${retryCount-1}`);

    // Close SSE connection
    closeSSEConnection(res);
    console.log("Done");

});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
