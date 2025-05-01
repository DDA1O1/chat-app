// api/generate-command.js
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.ASSISTANT_ID; // Get Assistant ID from env vars

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!assistantId) {
         console.error("ASSISTANT_ID environment variable is not set.");
         return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
        const { userPrompt, threadId: existingThreadId } = req.body;

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ error: 'Invalid prompt provided.' });
        }

        // --- Assistants API Logic ---

        // 1. Get or Create Thread
        let threadId = existingThreadId;
        if (!threadId) {
            const thread = await openai.beta.threads.create();
            threadId = thread.id;
            console.log("Created new thread:", threadId);
        } else {
             console.log("Using existing thread:", threadId);
        }


        // 2. Add User Message to Thread
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: userPrompt,
        });
        console.log("Added user message to thread:", threadId);


        // --- Streaming Response using Server-Sent Events (SSE) ---
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders(); // Send headers immediately

        // Helper function to send SSE data
        const sendEvent = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        // Send the threadId back immediately if it was newly created
        if (!existingThreadId) {
            sendEvent({ type: 'threadId', id: threadId });
        }

        // 3. Create and Stream the Run
        const stream = openai.beta.threads.runs.stream(threadId, {
            assistant_id: assistantId,
            // Instructions can be overridden here if needed, but usually set in Assistant settings
        });

        // Handle stream events
        stream.on('textDelta', (delta, snapshot) => {
             if (delta.value) {
                // Send text chunks as they arrive
                sendEvent({ type: 'chunk', text: delta.value });
             }
        });

        stream.on('messageDone', (message) => {
            // Can optionally signal message completion if needed
            console.log("Message processing done for thread:", threadId);
        });

        stream.on('end', () => {
            console.log("Stream ended for thread:", threadId);
            sendEvent({ type: 'end' }); // Signal end of stream
            res.end(); // Close the connection
        });

        stream.on('error', (error) => {
             console.error("Stream error:", error);
             sendEvent({ type: 'error', message: 'An error occurred during processing.' });
             res.end(); // Close connection on error
        });

        // Handle client closing connection prematurely
        req.on('close', () => {
            console.log(`Client disconnected, closing stream for thread: ${threadId}`);
            // You might want to attempt to cancel the run if possible/needed,
            // but OpenAI's streaming helpers might handle this gracefully.
            res.end();
        });


    } catch (error) {
        console.error("Error in generate-command handler:", error);
        // If headers haven't been sent, send a JSON error
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process request.' });
        } else {
             // If headers were sent (SSE started), try to send an error event and end
             try {
                const sendEvent = (data) => { res.write(`data: ${JSON.stringify(data)}\n\n`); };
                sendEvent({ type: 'error', message: 'An internal server error occurred.' });
             } catch (sseError) {
                 console.error("Error sending SSE error event:", sseError);
             }
             res.end();
        }
    }
}