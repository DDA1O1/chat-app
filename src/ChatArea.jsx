import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Icons ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;

const RobotIcon = () => (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md ring-1 ring-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
           <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9ZM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" />
        </svg>
    </div>
);

const CommandPromptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
);

// Default message structure expected by onSendMessage (example)
// onSendMessage({ id: uuidv4(), text: 'User text', sender: 'user' });
// onSendMessage({ id: aiMsgId, sender: 'ai', type: 'placeholder' });
// onSendMessage({ id: aiMsgId, textChunk: 'AI chunk...' });
// onSendMessage({ id: aiMsgId, final: true, isError: false }); // or isError: true

function ChatArea({ messages = [], onSendMessage, chatId, activeThreadId, setThreadIdForLog }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null); // Ref for the scrollable message container
  const eventSourceRef = useRef(null); // Ref to store EventSource instance
  const currentAiMessageIdRef = useRef(null); // Ref to track the ID of the AI message being streamed

  // Helper function to scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Effect to scroll down when new messages arrive
  useEffect(() => {
      // Scroll immediately for user messages or final AI messages, maybe 'auto' during streaming
      scrollToBottom('smooth');
  }, [messages, scrollToBottom]);

  // Effect to resize textarea based on content
  useEffect(() => {
      const textarea = inputRef.current;
      if (textarea) {
          textarea.style.height = 'auto'; // Reset height
          const scrollHeight = textarea.scrollHeight;
          // Consider maxHeight to prevent excessive growth
          // const maxHeight = 200;
          // textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
          textarea.style.height = `${scrollHeight}px`;
      }
  }, [inputValue]);

  // Effect to focus input when chat changes
  useEffect(() => {
      if (chatId) {
          inputRef.current?.focus();
      }
  }, [chatId]);

  // Effect to clean up EventSource on component unmount or chatId change
  useEffect(() => {
      return () => {
          if (eventSourceRef.current) {
              console.log("Closing EventSource connection due to component unmount or chat change.");
              eventSourceRef.current.close();
              eventSourceRef.current = null;
          }
      };
  }, [chatId]); // Dependency on chatId ensures cleanup when switching chats

  const handleSendCommand = useCallback(async (event) => {
      if (event) event.preventDefault();
      const trimmedInput = inputValue.trim();
      if (!trimmedInput || isSending || !chatId) return;

      // Abort previous stream if any (e.g., user sends new message quickly)
      if (eventSourceRef.current) {
           console.log("Aborting previous stream request.");
           eventSourceRef.current.close();
           eventSourceRef.current = null; // Clear the ref
      }

      // 1. Send user message immediately to UI
      // Assuming onSendMessage adds the message with a unique ID if needed internally
      onSendMessage({ text: trimmedInput, sender: 'user' });
      setInputValue('');
      setIsSending(true); // Show spinner, disable input/button
      scrollToBottom("smooth"); // Scroll after user message added

      // Force textarea resize after clearing (useEffect handles this based on inputValue change)
       inputRef.current?.focus(); // Keep focus on input

      // 2. Prepare for AI streaming response
      const aiMessageId = uuidv4(); // Generate ID for the upcoming AI message
      currentAiMessageIdRef.current = aiMessageId;
      // Add placeholder message - parent component uses this ID to update later
      onSendMessage({ id: aiMessageId, sender: 'ai', type: 'placeholder', text: '...' }); // Placeholder with some text
       scrollToBottom("smooth"); // Scroll after placeholder is added

      // 3. Connect to the SSE endpoint
      try {
        // *** IMPORTANT NOTE: Using POST with EventSource is non-standard! ***
        // Standard EventSource uses GET. This might only work with specific server setups or polyfills.
        // A more robust pattern is:
        // 1. Make a regular `fetch` POST request to send data and initiate the process.
        // 2. The POST response includes a unique ID (like a thread ID or task ID).
        // 3. Connect EventSource using GET with that ID in the URL query parameters (e.g., `/api/generate-command?threadId=xyz`).
        // The current implementation assumes the backend can handle POST or read the body on initial GET for the EventSource.
        const es = new EventSource('/api/generate-command', {
            method: 'POST', // Non-standard for EventSource
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: trimmedInput, threadId: activeThreadId }),
            // Note: The 'body' option is not part of the standard EventSource API.
            // This relies on server implementation or polyfills. Consider the robust pattern above.
        });
        eventSourceRef.current = es;

        es.onopen = () => {
            console.log("SSE Connection Opened");
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const currentAiMsgId = currentAiMessageIdRef.current; // Get ID for this stream

                if (!currentAiMsgId) {
                    console.warn("Received SSE message but no current AI message ID tracked.");
                    return;
                }

                if (data.type === 'threadId' && data.id && !activeThreadId) {
                    // Received new thread ID from backend for this specific chat
                    setThreadIdForLog(chatId, data.id);
                } else if (data.type === 'chunk' && typeof data.text === 'string') {
                     // Append text chunk to the streaming message
                     // The parent component needs logic to find the message by ID and append the chunk
                     onSendMessage({ id: currentAiMsgId, textChunk: data.text, type: 'update' });
                     scrollToBottom("auto"); // Keep scrolling as text arrives ('auto' might be less jumpy)
                } else if (data.type === 'end') {
                     console.log("SSE Stream Ended by Server");
                     // Mark the message as final (parent component updates/replaces placeholder)
                     onSendMessage({ id: currentAiMsgId, final: true, isError: false, type: 'final' });
                     setIsSending(false);
                     inputRef.current?.focus();
                     es.close();
                     eventSourceRef.current = null;
                     currentAiMessageIdRef.current = null; // Clear tracked ID
                } else if (data.type === 'error') {
                     console.error("SSE Error Event:", data.message);
                     // Mark the message as final and errored
                     onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: data.message || 'An error occurred.', type: 'final' });
                     setIsSending(false);
                     inputRef.current?.focus();
                     es.close();
                     eventSourceRef.current = null;
                     currentAiMessageIdRef.current = null; // Clear tracked ID
                } else {
                    console.warn("Received unknown SSE message type:", data);
                }

            } catch (error) {
                console.error("Failed to parse SSE message:", event.data, error);
                // Handle potential final partial message? Difficult. Mark as error.
                const currentAiMsgId = currentAiMessageIdRef.current;
                if (currentAiMsgId) {
                    onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Error processing response.', type: 'final' });
                }
                setIsSending(false);
                inputRef.current?.focus();
                es.close();
                eventSourceRef.current = null;
                currentAiMessageIdRef.current = null; // Clear tracked ID
            }
        };

        es.onerror = (error) => {
            console.error("EventSource failed (Network/Connection Error):", error);
             const currentAiMsgId = currentAiMessageIdRef.current;
             if (currentAiMsgId) {
                // Mark the corresponding message as errored
                 onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Connection error. Could not get response.', type: 'final' });
             } else {
                // If error happens before even placeholder is set (unlikely but possible)
                // Maybe notify user differently? For now, just log.
                console.error("EventSource error occurred before AI message ID was set.");
             }
            setIsSending(false);
            inputRef.current?.focus();
            // EventSource attempts to reconnect automatically on some errors.
            // Explicitly close if it's a fatal error or we want to stop retries.
            es.close();
            eventSourceRef.current = null;
            currentAiMessageIdRef.current = null; // Clear tracked ID
        };
      } catch (error) {
          // Catch potential errors during EventSource *creation* (e.g., invalid URL)
          console.error("Failed to create EventSource:", error);
          const currentAiMsgId = currentAiMessageIdRef.current;
          if (currentAiMsgId) {
               onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Failed to initiate connection.', type: 'final' });
          }
          setIsSending(false);
          inputRef.current?.focus();
          eventSourceRef.current = null; // Ensure it's null if creation failed
          currentAiMessageIdRef.current = null;
      }

  }, [inputValue, isSending, chatId, activeThreadId, onSendMessage, setThreadIdForLog, scrollToBottom]); // Added scrollToBottom dependency


  const handleKeyDown = (event) => {
      // Submit on Enter unless Shift is pressed
      if (event.key === 'Enter' && !event.shiftKey) {
         event.preventDefault(); // Prevent newline in textarea
         handleSendCommand();
      }
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">
      {/* Command/Response Display Area */}
      <div
        ref={chatAreaRef} // Attach ref here
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-800"
      >
         {!chatId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {/* You can add an icon here if desired */}
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
            // Ensure message object has a unique 'id' property for the key
            <div
                key={message.id || uuidv4()} // Fallback ID if needed, but prefer consistent IDs from parent
                className={`flex items-start gap-3 animate-fade-in ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {message.sender === 'ai' && <RobotIcon />}
                <div
                  className={`max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-lg shadow-md break-words whitespace-pre-wrap ${ // Use whitespace-pre-wrap
                      message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      // Highlight AI errors with red border/ring
                      : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500/50' : 'border border-transparent'}`
                  }`}
                >
                  {/* Display text, handling potential undefined/null */}
                  {message.text ?? ''}
                </div>
                {message.sender === 'user' && <UserIcon />}
            </div>
            ))
         )}
         {/* Invisible element to target for scrolling */}
         <div ref={messagesEndRef} className="h-1" />
      </div> {/* End Command/Response Display Area */}

      {/* Command Input Area */}
      {chatId && (
        // Corrected shadow class here
        <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-4 pb-4 pt-3 border-t border-gray-700/50 shadow-lg">
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
                      style={{ minHeight: '52px' }} // Ensures button alignment
                      disabled={isSending || !chatId} // Disable while AI is processing or no chat selected
                  />
                  <button
                      type="submit"
                      className={`absolute right-2.5 bottom-[11px] flex items-center justify-center h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ${
                          inputValue.trim() && !isSending
                          ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-100'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100' // Consistent scale
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