import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Icons ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;

// --- NEW ROBOT ICON ---
const RobotIcon = () => (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md ring-1 ring-white/20"> {/* Changed background */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
           <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9ZM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" />
        </svg>
    </div>
);

// --- NEW PLACEHOLDER ICON --- (More abstract/command oriented)
const CommandPromptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

// Prop `chatId` is kept for internal consistency, but it represents the active log ID
function ChatArea({ messages = [], onSendMessage, chatId }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false); // Represents processing command
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null); // Keep ref for scrolling

  const scrollToBottom = useCallback((behavior = "smooth") => {
      // Adding a small delay before scroll sometimes helps with dynamic content height
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 50);
  }, []);

  // Scroll effect (unchanged)
  useEffect(() => {
    scrollToBottom(messages.length > 1 ? "smooth" : "auto");
  }, [messages, chatId, scrollToBottom]);

  // Textarea auto-resize (unchanged)
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200; // Max height before scrolling
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputValue]);

  // Focus input on log switch (unchanged)
   useEffect(() => {
     if (chatId) {
         setTimeout(() => inputRef.current?.focus(), 100); // Slightly longer delay maybe
     }
  }, [chatId]);

  // --- UPDATED SEND COMMAND LOGIC ---
  const handleSendCommand = useCallback(async (event) => {
    if (event) event.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isSending || !chatId) return;

    // 1. Send user message immediately to UI
    onSendMessage(trimmedInput, 'user');
    setInputValue(''); // Clear input field
    setIsSending(true); // Show spinner, disable input/button

    // Force textarea resize calculation after clearing
    const textarea = inputRef.current;
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }
    // Focus input after clearing
    inputRef.current?.focus();
    // Scroll after user message is added
    scrollToBottom("smooth");


    try {
      // 2. Call the Vercel Serverless Function
      const response = await fetch('/api/generate-command', { // Relative path to your function
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userPrompt: trimmedInput }),
      });

      if (!response.ok) {
          // Handle HTTP errors (e.g., 500 from the function)
          const errorData = await response.json().catch(() => ({})); // Try to parse error JSON
          console.error("API Error Response:", errorData);
          throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiGeneratedCommand = data.command; // Get the command string from the JSON response

      // 3. Send AI response (the generated command or error) to the log
      const isErrorResponse = aiGeneratedCommand.toLowerCase().startsWith('error:');
      onSendMessage(aiGeneratedCommand, 'ai', isErrorResponse); // Use 'ai' sender type, flag if it's an error

    } catch (error) {
      console.error("Error sending command or fetching AI response:", error);
      // Send generic error message to log
      onSendMessage(`Error: Failed to get response. ${error.message}`, 'ai', true); // Use 'ai' sender type with error flag
    } finally {
      setIsSending(false); // Re-enable input/button
      // Ensure focus remains after response
      inputRef.current?.focus();
      // Scroll after AI response is rendered
      scrollToBottom("smooth");
    }
}, [inputValue, isSending, chatId, onSendMessage, scrollToBottom]); // Dependencies

const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
       event.preventDefault();
       handleSendCommand();
    }
};


return (
  <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">
    {/* Command/Response Display Area (Keep this section as is) */}
    <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-800">
      {/* ... existing logic for displaying messages, empty states ... */}
       {!chatId ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
              {/* ... no chat selected icon and text ... */}
              <h2 className="text-xl font-medium mt-2">Select a task log or start a new one</h2>
              <p className="text-sm mt-1">Your command history will appear here.</p>
          </div>
       ) : messages.length === 0 && chatId ? (
           <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
               <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-teal-500/50 rounded-full mb-5 flex items-center justify-center shadow-lg">
                  <CommandPromptIcon />
               </div>
               <h2 className="text-2xl font-semibold text-gray-200">Issue Robot Commands</h2>
               <p className="text-base text-gray-400 mt-2 max-w-lg">
                 Use natural language to control the robot (e.g., <code className="text-teal-300 bg-gray-700 px-1 py-0.5 rounded text-sm">'Fly forward 100 cm'</code> or <code className="text-teal-300 bg-gray-700 px-1 py-0.5 rounded text-sm">'What's the battery level?'</code>).
               </p>
           </div>
       ) : (
         messages.map((message) => (
          <div
              key={message.id}
              className={`flex items-start gap-3 animate-fade-in ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
              {message.sender === 'ai' && <RobotIcon />}
              <div
                className={`max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-lg shadow-md break-words ${
                    message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    // Highlight AI errors with red border
                    : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500' : 'border border-transparent'}`
                }`}
              >
                {/* Display multi-line commands correctly */}
                {message.text.split('\n').map((line, index, arr) => (
                    <React.Fragment key={index}>
                        {line}
                        {index < arr.length - 1 && <br />}
                    </React.Fragment>
                    ))}
              </div>
              {message.sender === 'user' && <UserIcon />}
          </div>
          ))
       )}
       <div ref={messagesEndRef} className="h-1" />
    </div> {/* End Command/Response Display Area */}

    {/* Command Input Area (Keep mostly as is, placeholder/labels updated) */}
    {chatId && (
      <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-4 pb-4 pt-3 border-t border-gray-700/50 shadow- ઉપર">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSendCommand} className="relative flex items-end">
                <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isSending ? "AI generating command..." : "Enter natural language command..."}
                    aria-label="Command input"
                    rows="1"
                    className="flex-1 resize-none border border-gray-600 bg-gray-700/80 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-all duration-150 shadow-inner"
                    style={{ minHeight: '52px' }}
                    disabled={isSending || !chatId} // Disable while AI is processing
                />
                <button
                    type="submit"
                    className={`absolute right-2.5 bottom-[11px] flex items-center justify-center h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ${
                        inputValue.trim() && !isSending
                        ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-100'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100'
                    }`}
                    disabled={!inputValue.trim() || isSending || !chatId}
                    aria-label="Send command to AI"
                    title="Send command to AI"
                >
                    {isSending ? <SpinnerIcon /> : <SendIcon />}
                </button>
            </form>
            {/* Updated Disclaimer */}
            <p className="text-xs text-gray-500 text-center mt-2 px-2">
                AI will translate your command. Verify generated SDK commands before execution if possible.
            </p>
          </div>
      </div>
    )} {/* End Command Input Area */}
  </div>
);
}

export default ChatArea;