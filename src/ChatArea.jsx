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

  // --- UPDATED SEND MESSAGE LOGIC ---
  const handleSendCommand = useCallback(async (event) => {
       if (event) event.preventDefault();
       const trimmedInput = inputValue.trim();
       // Check if not processing and there's a command and an active log
       if (!trimmedInput || isSending || !chatId) return;

       setIsSending(true); // Robot starts processing
       setInputValue('');
       // Send user command to the log
       onSendMessage(trimmedInput, 'user');
       // Focus input immediately after clearing for better UX
       inputRef.current?.focus();
       // Force textarea resize calculation after clearing
       const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height before potential response
            textarea.style.height = `${textarea.scrollHeight}px`;
        }


       try {
         // Simulate robot processing time
         await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

         // --- ROBOT-LIKE SIMULATED RESPONSES ---
         let robotResponse;
         const lowerCaseInput = trimmedInput.toLowerCase();

         if (lowerCaseInput.startsWith("pick up") || lowerCaseInput.startsWith("get the")) {
             robotResponse = `Acknowledged. Executing: "${trimmedInput}".`;
         } else if (lowerCaseInput.startsWith("move") || lowerCaseInput.startsWith("go to")) {
             robotResponse = `Command received: "${trimmedInput}". Proceeding with movement.` ;
         } else if (lowerCaseInput.includes("status") || lowerCaseInput.includes("report")) {
             robotResponse = `Current Status: Idle. Battery: 87%. Awaiting next command.`;
         } else if (lowerCaseInput === "stop" || lowerCaseInput === "cancel") {
             robotResponse = `Execution halted. Awaiting further instructions.`;
         } else if (lowerCaseInput.includes("hello") || lowerCaseInput.includes("hi")) {
            robotResponse = "System online. Ready for commands.";
         } else {
             robotResponse = `Processing command: "${trimmedInput}"... Task simulated as complete.`;
         }

         // Send robot response to the log
         onSendMessage(robotResponse, 'ai'); // Use 'ai' sender type internally for styling

       } catch (error) {
         console.error("Error simulating robot response:", error);
         // Send error message to log
         onSendMessage("Error: Could not process the command.", 'ai', true); // Use 'ai' sender type with error flag
       } finally {
         setIsSending(false); // Robot finished processing
         // Ensure focus remains after response
         inputRef.current?.focus();
         // Scroll after response is rendered
         scrollToBottom("smooth");
       }
  }, [inputValue, isSending, chatId, onSendMessage, scrollToBottom]);

  // Handle Enter key to send command (unchanged)
  const handleKeyDown = (event) => {
       if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSendCommand();
       }
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">
      {/* Command/Response Display Area */}
      {/* Changed scrollbar color slightly */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-800">
        {!chatId ? (
           // State when no log is selected
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-600 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
              </svg>
             {/* Updated text */}
             <h2 className="text-xl font-medium mt-2">Select a task log or start a new one</h2>
             <p className="text-sm mt-1">Your command history will appear here.</p>
           </div>
        ) : messages.length === 0 && chatId ? (
           // --- UPDATED EMPTY STATE FOR ACTIVE LOG ---
           <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
             {/* Icon Container - using accent color */}
             <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-teal-500/50 rounded-full mb-5 flex items-center justify-center shadow-lg">
                <CommandPromptIcon /> {/* Changed icon */}
             </div>
             {/* Main Heading */}
             <h2 className="text-2xl font-semibold text-gray-200">
               Issue Robot Commands
             </h2>
             {/* Subheading with instructions */}
             <p className="text-base text-gray-400 mt-2 max-w-lg">
               Use simple, plain English to control the robot. Describe the task you want it to perform.
               <br /> Example: <code className="text-teal-300 bg-gray-700 px-1 py-0.5 rounded text-sm">'Pick up the red cube'</code> or <code className="text-teal-300 bg-gray-700 px-1 py-0.5 rounded text-sm">'Move forward 5 steps'</code>.
             </p>
           </div>
           // --- END OF UPDATED EMPTY STATE ---
        ) : (
          // Display commands and responses
           messages.map((message) => (
            <div
                key={message.id}
                className={`flex items-start gap-3 animate-fade-in ${
                // Keep user messages on the right
                message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {/* Use RobotIcon for 'ai' sender type */}
                {message.sender === 'ai' && <RobotIcon />}
                <div
                  // Styling for message bubbles (mostly unchanged, maybe slight color tweaks)
                  className={`max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-lg shadow-md break-words ${
                      message.sender === 'user'
                      ? 'bg-blue-600 text-white' // User command bubble
                      : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500' : 'border border-transparent'}` // Robot response bubble (added transparent border for consistency)
                  }`}
                >
                  {/* Keep line break handling */}
                  {message.text.split('\n').map((line, index, arr) => (
                      <React.Fragment key={index}>
                          {line}
                          {index < arr.length - 1 && <br />}
                      </React.Fragment>
                      ))}
                </div>
                {/* Keep UserIcon */}
                {message.sender === 'user' && <UserIcon />}
            </div>
            ))
        )}
        <div ref={messagesEndRef} className="h-1" /> {/* Scroll anchor */}
      </div>

      {/* Command Input Area */}
      {chatId && (
        // Added subtle top border gradient
        <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-4 pb-4 pt-3 border-t border-gray-700/50 shadow- ऊपर">
            <div className="max-w-3xl mx-auto relative">
              {/* Form uses handleSendCommand */}
              <form onSubmit={handleSendCommand} className="relative flex items-end">
                  <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      // Updated placeholder based on state
                      placeholder={isSending ? "Robot processing command..." : "Enter command for the robot..."}
                      aria-label="Command input" // Updated label
                      rows="1"
                      // Slightly adjusted styling for input
                      className="flex-1 resize-none border border-gray-600 bg-gray-700/80 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-all duration-150 shadow-inner"
                      style={{ minHeight: '52px' }} // Keep min height
                      disabled={isSending || !chatId} // Disable while processing or if no log selected
                  />
                  <button
                      type="submit"
                      // Adjusted button styling, using accent color
                      className={`absolute right-2.5 bottom-[11px] flex items-center justify-center h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ${
                          inputValue.trim() && !isSending
                          ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-100' // Active state
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100'
                      }`}
                      disabled={!inputValue.trim() || isSending || !chatId}
                      aria-label="Send command" // Updated label
                      title="Send command" // Updated title
                  >
                      {/* Use SpinnerIcon when processing */}
                      {isSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
              </form>
              {/* --- UPDATED DISCLAIMER --- */}
              <p className="text-xs text-gray-500 text-center mt-2 px-2">
                  Robot actions based on commands may require verification. Ensure commands are clear.
              </p>
            </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;