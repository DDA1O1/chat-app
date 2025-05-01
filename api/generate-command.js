// api/generate-command.js
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Assistant ID is NOT needed here anymore, only for streaming endpoint
// const assistantId = process.env.ASSISTANT_ID;

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Note: ASSISTANT_ID check removed, not needed for this step

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

        // 3. Return the threadId to the client
        // The client will use this ID to connect to the streaming endpoint
        return res.status(200).json({ threadId: threadId });

    } catch (error) {
        console.error("Error in generate-command handler:", error);
        // Ensure we always send a JSON error response on failure
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to process initial request.';
        return res.status(statusCode).json({ error: message });
    }
}