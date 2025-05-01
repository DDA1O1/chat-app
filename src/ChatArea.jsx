import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Icons --- (Assuming imported or defined above)
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;
const RobotIcon = () => ( <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md ring-1 ring-white/20"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"> <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9ZM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" /> </svg> </div> );
const CommandPromptIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /> </svg> );
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
// --- End Icons ---


// Accept onToggleSidebar and activeChatTitle props
function ChatArea({ messages = [], onSendMessage, chatId, activeThreadId, setThreadIdForLog, onToggleSidebar, activeChatTitle, isLoading }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null);
  const eventSourceRef = useRef(null);
  const currentAiMessageIdRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
      // Add a small delay to allow the DOM to update, especially for 'smooth' scroll
      setTimeout(() => {
         messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }, behavior === 'smooth' ? 100 : 0);
  }, []);


  // Scroll to bottom when messages change or chatId changes (new chat selected)
  useEffect(() => {
      // Use 'auto' for initial load/chat switch for instant positioning
      scrollToBottom(messages.length > 1 ? 'smooth' : 'auto');
  }, [messages, chatId, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
      const textarea = inputRef.current;
      if (textarea) {
          textarea.style.height = 'auto'; // Reset height
          const scrollHeight = textarea.scrollHeight;
          const maxHeight = 200; // Max height in pixels (approx 5-6 lines)
          textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
          // Enable scrollbar if content exceeds max height
          textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
  }, [inputValue]);

  // Focus input when chat is selected/ready
  useEffect(() => {
      if (chatId && !isLoading) {
          // Small delay can help ensure it's focusable after potential rerenders
          setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Clean up EventSource when chatId changes (user switches chats)
       return () => {
           if (eventSourceRef.current) {
               console.log("Closing EventSource connection due to chat change.");
               eventSourceRef.current.close();
               eventSourceRef.current = null;
           }
           currentAiMessageIdRef.current = null;
           setIsSending(false); // Reset sending state if user switches chat mid-request
       };
  }, [chatId, isLoading]); // Depend on chatId and loading state

  // Cleanup EventSource on component unmount
  useEffect(() => {
      return () => {
          if (eventSourceRef.current) {
              console.log("Closing EventSource connection due to component unmount.");
              eventSourceRef.current.close();
              eventSourceRef.current = null;
          }
      };
  }, []); // Empty dependency array for unmount cleanup


  // --- handleSendCommand Logic (Keep assistants API logic as is) ---
  const handleSendCommand = useCallback(async (event) => {
    if (event) event.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isSending || !chatId) return;

    // Abort previous stream if any
    if (eventSourceRef.current) {
        console.log("Aborting previous EventSource stream.");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        // If an AI message was being streamed, finalize it as interrupted (optional)
        if (currentAiMessageIdRef.current) {
            // Example: Update message to indicate interruption, or just leave as is
            // onSendMessage({ id: currentAiMessageIdRef.current, type: 'final', isError: true, text: 'Interrupted' });
            currentAiMessageIdRef.current = null; // Clear ref after closing
        }
        setIsSending(false); // Ensure sending state is reset if previous stream was manually closed
    }


    // --- UI Updates ---
    const userMessageText = trimmedInput; // Store before clearing
    onSendMessage({ text: userMessageText, sender: 'user', type: 'user' }); // Send user message to parent state
    setInputValue('');
    setIsSending(true);
    // Use 'auto' scroll after sending for immediate feedback
    scrollToBottom("auto");
    setTimeout(() => { // Reset textarea height *after* clearing value
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
            inputRef.current.focus();
        }
    }, 0);


    // --- Prepare for AI Response ---
    const aiMessageId = uuidv4();
    currentAiMessageIdRef.current = aiMessageId;
    onSendMessage({ id: aiMessageId, sender: 'ai', type: 'placeholder' });
    scrollToBottom("auto"); // Scroll again for placeholder

    let currentThreadId = activeThreadId; // Use existing thread ID if available

    try {
        // --- STEP 1: POST to generate-command ---
        // ********** FIX STARTS HERE **********
        const initialResponse = await fetch('/api/generate-command', {
            method: 'POST', // Explicitly set method to POST
            headers: {
                'Content-Type': 'application/json', // Set content type header
            },
            body: JSON.stringify({ // Send data in the body
                userPrompt: userMessageText,
                threadId: currentThreadId // Send existing threadId or null/undefined
            }),
        });
        // ********** FIX ENDS HERE **********

        // Check if the initial response was successful (e.g., 200 OK)
        if (!initialResponse.ok) {
            // Attempt to read error message from backend if possible
            let errorData;
            try {
                errorData = await initialResponse.json(); // Try parsing potential JSON error first
            } catch (parseError) {
                errorData = { error: await initialResponse.text() }; // Fallback to text response
            }
            // Throw an error including status and message
            throw new Error(`Error ${initialResponse.status}: ${errorData?.error || 'Failed to initiate command generation.'}`);
        }

        const data = await initialResponse.json(); // Now this should work if response is ok (200)
        const returnedThreadId = data.threadId;

        if (!returnedThreadId) {
            // Handle case where backend successfully responded but didn't include threadId
            throw new Error("Did not receive threadId from server even though request was successful.");
        }

        // Update threadId in parent state if it's new for this chat
        if (returnedThreadId !== currentThreadId) {
            setThreadIdForLog(chatId, returnedThreadId);
            currentThreadId = returnedThreadId; // Use the new ID for the SSE connection
            console.log("Using new/updated threadId:", currentThreadId);
        } else {
            console.log("Using existing threadId:", currentThreadId);
        }

        // --- STEP 2: GET from stream-response (SSE) ---
        console.log(`Connecting to SSE stream for threadId: ${currentThreadId}`);
        const es = new EventSource(`/api/stream-response?threadId=${currentThreadId}`);
        eventSourceRef.current = es;

        es.onopen = () => {
            console.log("SSE Connection Opened");
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const currentAiMsgId = currentAiMessageIdRef.current;

                // Add check: Only process if the message ID matches the current active one
                if (!currentAiMsgId || data.forMessageId && data.forMessageId !== currentAiMsgId) {
                     // console.warn("Received SSE event for a different/stale message ID. Ignoring.");
                     return; // Stale event or belongs to an interrupted request
                }


                if (data.type === 'chunk' && typeof data.text === 'string') {
                    onSendMessage({ id: currentAiMsgId, textChunk: data.text, type: 'update' });
                    // Use 'auto' during streaming for less jumpiness
                    scrollToBottom("auto");
                } else if (data.type === 'end') {
                    console.log("SSE Stream Ended");
                    onSendMessage({ id: currentAiMsgId, final: true, isError: false, type: 'final' });
                    setIsSending(false);
                    setTimeout(() => inputRef.current?.focus(), 0);
                    if (eventSourceRef.current === es) { // Only close if it's the current ref
                       es.close();
                       eventSourceRef.current = null;
                    }
                    currentAiMessageIdRef.current = null;
                } else if (data.type === 'error') {
                    console.error("SSE Error Event:", data.message);
                    onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: data.message || 'An error occurred during processing.', type: 'final' });
                    setIsSending(false);
                    setTimeout(() => inputRef.current?.focus(), 0);
                    if (eventSourceRef.current === es) { // Only close if it's the current ref
                        es.close();
                        eventSourceRef.current = null;
                    }
                    currentAiMessageIdRef.current = null;
                } else {
                    console.warn("Received unknown SSE message type:", data.type, data);
                }

            } catch (error) {
                 console.error("Error parsing SSE message data:", error, "Raw data:", event.data);
                 // Optionally update UI to show parsing error
                 const currentAiMsgId = currentAiMessageIdRef.current;
                 if (currentAiMsgId) {
                     onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Error processing response stream.', type: 'final' });
                 }
                 setIsSending(false);
                 setTimeout(() => inputRef.current?.focus(), 0);
                  if (eventSourceRef.current === es) { // Only close if it's the current ref
                     es.close();
                     eventSourceRef.current = null;
                  }
                 currentAiMessageIdRef.current = null;
            }
        };

        es.onerror = (error) => {
            console.error("EventSource failed:", error);
            const currentAiMsgId = currentAiMessageIdRef.current;
            if (currentAiMsgId) {
                 onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Connection error during response streaming.', type: 'final' });
            } else {
                onSendMessage({ sender: 'ai', isError: true, text: 'Connection error during response streaming.' });
            }
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 0);
            if (eventSourceRef.current === es) { // Only close if it's the current ref
                es.close(); // Close the connection on error
                eventSourceRef.current = null;
            }
            currentAiMessageIdRef.current = null; // Clear the ref
        };

    } catch (error) { // Catch errors from POST or EventSource setup
        console.error("Failed during command sending process:", error);
        const currentAiMsgId = currentAiMessageIdRef.current;
        if (currentAiMsgId) {
            // Update the placeholder message to show the error
            onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: `Error: ${error.message || 'Failed to get response.'}`, type: 'final' });
        } else {
            // If error happened before placeholder, add a new error message
            onSendMessage({ sender: 'ai', isError: true, text: `Error: ${error.message || 'Failed to initiate request.'}` });
        }
        setIsSending(false);
        setTimeout(() => inputRef.current?.focus(), 0);
        if (eventSourceRef.current) { // Ensure cleanup if EventSource was created before error
             eventSourceRef.current.close();
             eventSourceRef.current = null;
        }
        currentAiMessageIdRef.current = null; // Clear the ref
    }
}, [inputValue, isSending, chatId, activeThreadId, onSendMessage, setThreadIdForLog, scrollToBottom]); // Dependencies

  const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
         event.preventDefault();
         handleSendCommand();
      }
  };


  return (
    // flex-1 makes this take remaining space, overflow-hidden is crucial
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-700/50 sticky top-0 bg-gray-800 z-10 flex-shrink-0">
           <button
             onClick={onToggleSidebar}
             className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
             aria-label="Open Menu"
           >
               <MenuIcon />
           </button>
           <h2 className="text-sm font-semibold text-gray-100 truncate px-2 flex-1 text-center">
                {/* Display active chat title, fallback if none selected */}
                {activeChatTitle || "Robot Control"}
           </h2>
           <div className="w-8"></div> {/* Spacer to balance the title */}
      </div>

      {/* Command/Response Display Area */}
      <div
        ref={chatAreaRef}
        // flex-1 allows it to grow, overflow-y-auto enables scrolling
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-800/50"
      >
         {/* --- Conditional Rendering Logic --- */}
         {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <SpinnerIcon />
                  <p className="mt-2 text-sm">Loading...</p>
              </div>
         ) : !chatId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                 <h2 className="text-xl font-medium mt-2">Select or start a task</h2>
                 <p className="text-sm mt-1">Your command history will appear here.</p>
             </div>
         ) : messages.length === 0 && chatId ? (
             <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in pt-4"> {/* Added padding-top */}
                 <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-teal-500/50 rounded-full mb-4 md:mb-5 flex items-center justify-center shadow-lg">
                    <CommandPromptIcon />
                 </div>
                 <h2 className="text-xl md:text-2xl font-semibold text-gray-200">Issue Robot Commands</h2>
                 <p className="text-sm md:text-base text-gray-400 mt-2 max-w-md md:max-w-lg">
                   Use natural language (e.g., <code className="text-teal-300 bg-gray-700/80 px-1 py-0.5 rounded text-xs md:text-sm">'Fly forward 100 cm'</code> or <code className="text-teal-300 bg-gray-700/80 px-1 py-0.5 rounded text-xs md:text-sm">'Battery level?'</code>).
                 </p>
             </div>
         ) : (
           // --- Message Mapping ---
           messages.map((message, index) => ( // Add index for fallback key if needed
            <div
                // Use message.id if available, add defensive check
                key={message.id || `msg-${index}`} // Fallback key
                className={`flex items-start gap-2.5 md:gap-3 ${ /* Slightly smaller gap on mobile */
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {message.sender === 'ai' && <RobotIcon />}
                <div
                  className={`max-w-[85%] md:max-w-xl lg:max-w-2xl px-3.5 py-2 md:px-4 md:py-2.5 rounded-lg shadow-md break-words whitespace-pre-wrap text-sm md:text-base ${ /* Adjusted padding and font size */
                      message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500/50' : 'border border-transparent'} ${message.streaming ? 'animate-pulse-subtle' : ''}` // Subtle pulse for streaming
                  }`}
                  // Add ARIA live region attributes for AI messages for accessibility
                  aria-live={message.sender === 'ai' && message.streaming ? 'polite' : undefined}
                  aria-atomic={message.sender === 'ai' && message.streaming ? 'false' : undefined}
                >
                  {/* Render text, show placeholder if streaming and empty */}
                   {(message.text ?? '') || (message.sender === 'ai' && message.streaming ? '...' : '')}
                   {/* Optionally show a small spinner inside the bubble while streaming */}
                   {/* {message.sender === 'ai' && message.streaming && <SpinnerIcon className="w-3 h-3 inline-block ml-1 opacity-70" />} */}
                </div>
                {message.sender === 'user' && <UserIcon />}
            </div>
            ))
         )}
         {/* --- End Message Mapping --- */}
         <div ref={messagesEndRef} className="h-1" /> {/* Scroll target */}
      </div> {/* End Command/Response Display Area */}


      {/* Command Input Area (only show if a chat is selected) */}
      {chatId && (
        // flex-shrink-0 prevents this area from shrinking
        <div className="flex-shrink-0 bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-2 pb-2 pt-2 md:px-4 md:pb-4 md:pt-3 border-t border-gray-700/50 shadow-inner">
            {/* max-w-full on mobile, max-w-3xl on desktop */}
            <div className="max-w-full md:max-w-3xl mx-auto relative">
              <form onSubmit={handleSendCommand} className="relative flex items-end gap-2"> {/* Added gap */}
                  <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isSending ? "Processing..." : "Enter command..."} // Shorter placeholder for mobile
                      aria-label="Command input"
                      rows="1"
                      className="flex-1 resize-none border border-gray-600 bg-gray-700/80 rounded-xl py-2.5 pl-3 pr-10 md:pl-4 md:pr-12 text-sm md:text-base text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-all duration-150 shadow-inner disabled:opacity-70"
                      style={{ minHeight: '44px' }} // Adjusted min-height
                      disabled={isSending || !chatId || isLoading} // Disable while loading chat too
                  />
                  <button
                      type="submit"
                      // Position adjusted slightly, size increased for touch
                      className={`flex-shrink-0 flex items-center justify-center h-9 w-9 md:h-8 md:w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ease-in-out ${
                          inputValue.trim() && !isSending
                          ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-95' // Added active scale
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100'
                      }`}
                      disabled={!inputValue.trim() || isSending || !chatId || isLoading}
                      aria-label="Send command"
                      title="Send command"
                  >
                      {/* Icon size consistent */}
                      {isSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
              </form>
              {/* Reduced prominence of the helper text on mobile */}
              <p className="hidden md:block text-xs text-gray-500 text-center mt-2 px-2">
                  AI translates commands. Verify critical operations.
              </p>
            </div>
        </div>
      )} {/* End Command Input Area */}
    </div> // End ChatArea main container
  );
}

export default ChatArea;