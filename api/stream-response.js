// api/stream-response.js
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const assistantId = process.env.ASSISTANT_ID; // Get Assistant ID from env vars

export default async function handler(req, res) {
    // This endpoint handles GET requests for streaming
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!assistantId) {
         console.error("ASSISTANT_ID environment variable is not set.");
         // Don't send JSON here, as client expects SSE or nothing
         return res.status(500).end("Server configuration error.");
    }

    const threadId = req.query.threadId; // Get threadId from query param

    if (!threadId || typeof threadId !== 'string') {
        console.error("Missing or invalid threadId query parameter.");
        return res.status(400).end("Missing or invalid threadId.");
    }

    try {
        console.log(`Starting stream for thread: ${threadId}`);

        // --- Streaming Response using Server-Sent Events (SSE) ---
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Explicitly set CORS headers if your frontend is on a different domain/port during development
        // res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your frontend domain
        res.flushHeaders(); // Send headers immediately

        // Helper function to send SSE data
        const sendEvent = (data) => {
            // Check if connection is still open before writing
            if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            } else {
                console.warn(`Attempted to write to closed stream for thread: ${threadId}`);
            }
        };

        // Create and Stream the Run
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
            console.log(`Message processing done for thread: ${threadId}`);
            // Example: sendEvent({ type: 'message_done', messageId: message.id });
        });

        stream.on('end', () => {
            console.log(`Stream ended for thread: ${threadId}`);
            sendEvent({ type: 'end' }); // Signal end of stream
            if (!res.writableEnded) {
                res.end(); // Close the connection
            }
        });

        stream.on('error', (error) => {
             console.error(`Stream error for thread ${threadId}:`, error);
             // Attempt to send an error event before closing
             try {
                 sendEvent({ type: 'error', message: 'An error occurred during processing.' });
             } catch(sendErr) {
                 console.error("Error sending SSE error event:", sendErr);
             } finally {
                 if (!res.writableEnded) {
                     res.end(); // Close connection on error
                 }
             }
        });

        // Handle client closing connection prematurely
        req.on('close', () => {
            console.log(`Client disconnected, closing stream for thread: ${threadId}`);
            // Attempt to cancel the run (best effort, might not always be possible/effective immediately)
             stream.abort(); // Use the stream's abort method if available
             console.log(`Attempted to abort run for thread: ${threadId}`);
            if (!res.writableEnded) {
                res.end();
            }
        });

    } catch (error) {
        console.error(`Error starting stream for thread ${threadId}:`, error);
        // If headers haven't been sent (error happened before streaming setup)
        if (!res.headersSent) {
             res.status(500).end('Failed to start stream.');
        } else {
             // If headers were sent, try to send an error event and end
             try {
                const sendEvent = (data) => { if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`); };
                sendEvent({ type: 'error', message: 'An internal server error occurred initiating stream.' });
             } catch (sseError) {
                 console.error("Error sending SSE error event:", sseError);
             } finally {
                 if (!res.writableEnded) {
                    res.end();
                 }
             }
        }
    }
}