// api/generate-command.js
import OpenAI from 'openai';

// Initialize OpenAI client using the API key from Vercel's environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// --- Tello SDK Command Information (Crucial for the Prompt!) ---
// Extract the key command details from your PDF/document.
// Be precise about parameters, units (cm, degrees), and ranges.
const telloCommandsDocumentation = `
Control Commands (Respond with 'ok' or 'error'):
- command: Enter SDK mode. (Initial command required)
- takeoff: Auto takeoff.
- land: Auto landing.
- streamon: Enable video stream.
- streamoff: Disable video stream.
- emergency: Stop motors immediately.
- stop: Hovers in the air.
- up x: Ascend x cm (20-500).
- down x: Descend x cm (20-500).
- left x: Fly left x cm (20-500).
- right x: Fly right x cm (20-500).
- forward x: Fly forward x cm (20-500).
- back x: Fly backward x cm (20-500).
- cw x: Rotate x degrees clockwise (1-360).
- ccw x: Rotate x degrees counterclockwise (1-360).
- flip x: Flip in direction x (l=left, r=right, f=forward, b=back).
- go x y z speed: Fly to coordinates x y z at speed cm/s. x,y,z (-500-500), speed (10-100). Cannot be -20 to 20 simultaneously.
- curve x1 y1 z1 x2 y2 z2 speed: Fly curve. Params similar to 'go', speed (10-60). Arc radius must be 0.5-10 meters.
- speed x: Set speed to x cm/s (10-100).
- wifi ssid pass: Set Wi-Fi ssid and password.

Read Commands (Respond with value):
- speed?: Obtain current speed (cm/s). Returns 10-100.
- battery?: Obtain current battery percentage. Returns 0-100.
- time?: Obtain current flight time. Returns time string.
- wifi?: Obtain Wi-Fi SNR. Returns SNR string.
- sdk?: Obtain Tello SDK version. Returns SDK version string.
- sn?: Obtain Tello serial number. Returns serial number string.

Mission Pad Commands (Require Mission Pad Detection enabled - mon/mdirection):
- go x y z speed mid: Fly to coordinates relative to Mission Pad mid (m1-m8).
- curve x1 y1 z1 x2 y2 z2 speed mid: Fly curve relative to Mission Pad mid.
- jump x y z speed yaw mid1 mid2: Fly to x,y,z relative to mid1, recognize mid2, rotate to yaw.
- mon: Enable mission pad detection (forward and downward).
- moff: Disable mission pad detection.
- mdirection x: Set mission pad detection direction (0=downward, 1=forward, 2=both).
`;

// The handler function for the serverless endpoint
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { userPrompt } = req.body;

        if (!userPrompt || typeof userPrompt !== 'string') {
            return res.status(400).json({ error: 'Invalid prompt provided.' });
        }

        // --- Construct the Prompt for OpenAI ---
        const systemMessage = `You are an AI assistant primarily designed to translate natural language commands into specific SDK commands for a Tello drone. You should be helpful and friendly when appropriate.

        **Primary Task:**
        1.  Analyze the user's input.
        2.  If the input is a request to control the Tello drone or ask about its status (like speed, battery), use the Tello SDK documentation below to generate the precise SDK command(s).
        3.  Pay close attention to command syntax, parameters, units (cm, degrees), and value ranges.
        4.  If a command requires parameters and the user doesn't provide valid ones, respond with "Error: Missing or invalid parameters."
        5.  If the user's request seems like a drone command but is ambiguous or doesn't match any known command, respond with "Please clarify more"
        6.  If generating SDK commands or specific errors, respond ONLY with the raw SDK command string(s) or the specific error message.

        **Secondary Task (Conversational Fallback):**
        1.  If the user's input is *clearly not* a drone command or status request (e.g., greetings like 'hi', 'hello', questions about you like 'who are you?', 'how are you?', 'what model are you using?'), then respond in a brief, friendly, and conversational manner.
        2.  Do *not* generate SDK commands in conversational responses.
        3.  When asked about your identity or model, you can state that you are an AI assistant powered by OpenAI's GPT technology.

        **Tello SDK Documentation:**
        ${telloCommandsDocumentation}`;

        const userMessage = `User command: "${userPrompt}"`;

        // --- Call OpenAI API ---
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Or "gpt-4" if you have access and need higher accuracy
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage },
            ],
            temperature: 0.2, // Lower temperature for more deterministic command generation
            max_tokens: 100, // Adjust as needed, commands are usually short
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
        });

        const generatedCommand = completion.choices[0]?.message?.content?.trim();

        if (!generatedCommand) {
             throw new Error("OpenAI response was empty.");
        }

        // --- Send Response Back to Frontend ---
        // The response should be the raw command string(s) or an error message
        res.status(200).json({ command: generatedCommand });

    } catch (error) {
        console.error("Error calling OpenAI or processing request:", error);
        // Send a generic error back to the frontend
        res.status(500).json({ error: 'Failed to generate command. Please try again.' });
    }
}