import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Icons --- (No changes here)
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;
const RobotIcon = () => ( <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md ring-1 ring-white/20"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"> <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9ZM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" /> </svg> </div> );
const CommandPromptIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /> </svg> );
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
// --- End Icons ---

// --- Component --- (No logic changes, focusing on Tailwind classes)
function ChatArea({ messages = [], onSendMessage, chatId, activeThreadId, setThreadIdForLog, onToggleSidebar, activeChatTitle, isLoading }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null);
  const eventSourceRef = useRef(null);
  const currentAiMessageIdRef = useRef(null);

  // --- Callbacks & Effects --- (No changes to logic)
  const scrollToBottom = useCallback((behavior = 'smooth') => {
      setTimeout(() => {
         messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }, behavior === 'smooth' ? 100 : 0);
  }, []);

  useEffect(() => {
      scrollToBottom(messages.length > 1 ? 'smooth' : 'auto');
  }, [messages, chatId, scrollToBottom]);

  useEffect(() => {
      const textarea = inputRef.current;
      if (textarea) {
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          const maxHeight = 200; // Keep max height
          textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
          textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      }
  }, [inputValue]);

  useEffect(() => {
      if (chatId && !isLoading) {
          setTimeout(() => inputRef.current?.focus(), 100);
      }
       return () => {
           if (eventSourceRef.current) {
               console.log("Closing EventSource connection due to chat change.");
               eventSourceRef.current.close();
               eventSourceRef.current = null;
           }
           currentAiMessageIdRef.current = null;
           setIsSending(false);
       };
  }, [chatId, isLoading]);

  useEffect(() => {
      return () => {
          if (eventSourceRef.current) {
              console.log("Closing EventSource connection due to component unmount.");
              eventSourceRef.current.close();
              eventSourceRef.current = null;
          }
      };
  }, []);

  const handleSendCommand = useCallback(async (event) => {
    if (event) event.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isSending || !chatId) return;

    if (eventSourceRef.current) {
        console.log("Aborting previous EventSource stream.");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        if (currentAiMessageIdRef.current) {
            // Optionally mark as interrupted:
            // onSendMessage({ id: currentAiMessageIdRef.current, type: 'final', isError: true, text: '(Interrupted)' });
            currentAiMessageIdRef.current = null;
        }
        setIsSending(false);
    }

    const userMessageText = trimmedInput;
    onSendMessage({ text: userMessageText, sender: 'user', type: 'user' });
    setInputValue('');
    setIsSending(true);
    scrollToBottom("auto");
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'; // Reset height before recalculating
            // Recalculate might not be needed if value is empty, default minHeight applies
            // inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
            inputRef.current.focus();
        }
    }, 0);

    const aiMessageId = uuidv4();
    currentAiMessageIdRef.current = aiMessageId;
    onSendMessage({ id: aiMessageId, sender: 'ai', type: 'placeholder' });
    scrollToBottom("auto");

    let currentThreadId = activeThreadId;

    try {
        const initialResponse = await fetch('/api/generate-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: userMessageText, threadId: currentThreadId }),
        });

        if (!initialResponse.ok) {
            let errorData;
            try { errorData = await initialResponse.json(); }
            catch { errorData = { error: await initialResponse.text() }; }
            throw new Error(`Error ${initialResponse.status}: ${errorData?.error || 'Failed to initiate command.'}`);
        }

        const data = await initialResponse.json();
        const returnedThreadId = data.threadId;
        if (!returnedThreadId) throw new Error("Missing threadId from server.");

        if (returnedThreadId !== currentThreadId) {
            setThreadIdForLog(chatId, returnedThreadId);
            currentThreadId = returnedThreadId;
            console.log("Using new/updated threadId:", currentThreadId);
        } else {
            console.log("Using existing threadId:", currentThreadId);
        }

        console.log(`Connecting to SSE stream for threadId: ${currentThreadId}`);
        const es = new EventSource(`/api/stream-response?threadId=${currentThreadId}`);
        eventSourceRef.current = es;

        es.onopen = () => console.log("SSE Connection Opened");

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const currentAiMsgId = currentAiMessageIdRef.current;
                if (!currentAiMsgId) return; // Ignore if no active AI message

                if (data.type === 'chunk' && typeof data.text === 'string') {
                    onSendMessage({ id: currentAiMsgId, textChunk: data.text, type: 'update' });
                    scrollToBottom("auto");
                } else if (data.type === 'end') {
                    console.log("SSE Stream Ended");
                    onSendMessage({ id: currentAiMsgId, final: true, isError: false, type: 'final' });
                    setIsSending(false);
                    setTimeout(() => inputRef.current?.focus(), 0);
                    if (eventSourceRef.current === es) { es.close(); eventSourceRef.current = null; }
                    currentAiMessageIdRef.current = null;
                } else if (data.type === 'error') {
                    console.error("SSE Error Event:", data.message);
                    onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: data.message || 'Error during processing.', type: 'final' });
                    setIsSending(false);
                    setTimeout(() => inputRef.current?.focus(), 0);
                    if (eventSourceRef.current === es) { es.close(); eventSourceRef.current = null; }
                    currentAiMessageIdRef.current = null;
                } else {
                     console.warn("Received unknown SSE message type:", data.type, data);
                }
            } catch (error) {
                 console.error("Error parsing SSE message data:", error, "Raw data:", event.data);
                 const currentAiMsgId = currentAiMessageIdRef.current;
                 if (currentAiMsgId) {
                     onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Error processing response.', type: 'final' });
                 }
                 setIsSending(false);
                 setTimeout(() => inputRef.current?.focus(), 0);
                  if (eventSourceRef.current === es) { es.close(); eventSourceRef.current = null; }
                 currentAiMessageIdRef.current = null;
            }
        };

        es.onerror = (error) => {
            console.error("EventSource failed:", error);
            const currentAiMsgId = currentAiMessageIdRef.current;
            if (currentAiMsgId) {
                 onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Connection error.', type: 'final' });
            } else {
                 onSendMessage({ sender: 'ai', isError: true, text: 'Connection error.' }); // Add new error message if placeholder wasn't there
            }
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 0);
            if (eventSourceRef.current === es) { es.close(); eventSourceRef.current = null; }
            currentAiMessageIdRef.current = null;
        };

    } catch (error) {
        console.error("Failed during command sending process:", error);
        const currentAiMsgId = currentAiMessageIdRef.current;
        if (currentAiMsgId) {
            onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: `Error: ${error.message || 'Failed.'}`, type: 'final' });
        } else {
            onSendMessage({ sender: 'ai', isError: true, text: `Error: ${error.message || 'Failed.'}` });
        }
        setIsSending(false);
        setTimeout(() => inputRef.current?.focus(), 0);
        if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
        currentAiMessageIdRef.current = null;
    }
  }, [inputValue, isSending, chatId, activeThreadId, onSendMessage, setThreadIdForLog, scrollToBottom]);

  const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
         event.preventDefault();
         handleSendCommand();
      }
  };

  // --- UI Rendering --- (Applying responsive classes)
  return (
    // Main container: flex-1 to take space, flex-col, overflow-hidden is crucial
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">

      {/* Mobile Header: Only shown below 'md' breakpoint */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-gray-700/50 sticky top-0 bg-gray-800 z-10 flex-shrink-0">
           {/* Menu Toggle Button */}
           <button
             onClick={onToggleSidebar}
             className="p-2 -ml-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500" // Adjusted margin slightly
             aria-label="Open Menu"
           >
               <MenuIcon />
           </button>
           {/* Chat Title - Truncated */}
           <h2 className="text-sm font-semibold text-gray-100 truncate px-2 flex-1 text-center">
                {activeChatTitle || "Robot Control"}
           </h2>
           {/* Spacer to balance title */}
           <div className="w-6"></div> {/* Adjusted size slightly */}
      </div>

      {/* Message Display Area: flex-1 allows growth, overflow-y-auto for scrolling */}
      <div
        ref={chatAreaRef}
        // Responsive padding, consistent scrollbar styling (from index.css)
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5" // Slightly reduced mobile spacing
      >
         {/* --- Conditional Placeholders --- */}
         {isLoading ? (
              // Loading State - Centered
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <SpinnerIcon />
                  <p className="mt-2 text-sm">Loading...</p>
              </div>
         ) : !chatId ? (
            // No Chat Selected State - Centered, responsive text
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
                 <h2 className="text-lg md:text-xl font-medium mt-2">Select or start a task</h2>
                 <p className="text-sm mt-1">Your command history will appear here.</p>
             </div>
         ) : messages.length === 0 && chatId ? (
             // Empty Chat State - Centered, responsive elements
             <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in pt-4"> {/* Added fade-in animation */}
                 {/* Icon container with responsive size */}
                 <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-teal-500/50 rounded-full mb-4 md:mb-5 flex items-center justify-center shadow-lg">
                    <CommandPromptIcon /> {/* Icon size adjusted via className w-10 h-10 */}
                 </div>
                 {/* Heading with responsive text size */}
                 <h2 className="text-xl md:text-2xl font-semibold text-gray-200">Issue Robot Commands</h2>
                 {/* Helper text with responsive size and max-width */}
                 <p className="text-sm md:text-base text-gray-400 mt-2 max-w-md md:max-w-lg">
                   Use natural language (e.g., <code className="text-teal-300 bg-gray-700/80 px-1 py-0.5 rounded text-xs md:text-sm">'Fly forward 100 cm'</code> or <code className="text-teal-300 bg-gray-700/80 px-1 py-0.5 rounded text-xs md:text-sm">'Battery level?'</code>).
                 </p>
             </div>
         ) : (
           // --- Message Mapping ---
           messages.map((message, index) => (
            <div
                key={message.id || `msg-${index}`} // Use unique ID or fallback key
                // Responsive gap between icon and bubble
                className={`flex items-start gap-2.5 md:gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {/* AI Icon */}
                {message.sender === 'ai' && <RobotIcon />} {/* Icon size fixed via component */}

                {/* Message Bubble */}
                <div
                  // Responsive max-width, padding, text size. Added break-words.
                  className={`max-w-[85%] md:max-w-xl lg:max-w-2xl px-3.5 py-2 md:px-4 md:py-2.5 rounded-lg shadow-md break-words whitespace-pre-wrap text-sm md:text-base ${
                      message.sender === 'user'
                      ? 'bg-blue-600 text-white' // User bubble style
                      : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500/50' : 'border border-transparent'} ${message.streaming ? 'animate-pulse-subtle' : ''}` // AI bubble style + error/streaming indication
                  }`}
                  // ARIA attributes for accessibility on streaming AI messages
                  aria-live={message.sender === 'ai' && message.streaming ? 'polite' : undefined}
                  aria-atomic={message.sender === 'ai' && message.streaming ? 'false' : undefined}
                >
                  {/* Render text or streaming indicator */}
                   {(message.text ?? '') || (message.sender === 'ai' && message.streaming ? '...' : '')}
                   {/* Optional inline spinner (uncomment if desired) */}
                   {/* {message.sender === 'ai' && message.streaming && <SpinnerIcon className="w-3 h-3 inline-block ml-1 opacity-70" />} */}
                </div>

                {/* User Icon */}
                {message.sender === 'user' && <UserIcon />} {/* Icon size fixed via component */}
            </div>
            ))
         )}
         {/* --- End Message Mapping --- */}
         <div ref={messagesEndRef} className="h-1" /> {/* Scroll target, minimal height */}
      </div> {/* End Message Display Area */}


      {/* Command Input Area: Shown only if chat selected */}
      {chatId && (
        // flex-shrink-0 prevents shrinking. Responsive padding.
        <div className="flex-shrink-0 bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-2 pb-2 pt-2 md:px-4 md:pb-4 md:pt-3 border-t border-gray-700/50 shadow-inner">
            {/* Max-width container for the input form, centered on desktop */}
            <div className="max-w-full md:max-w-3xl mx-auto relative">
              {/* Form using flexbox for alignment */}
              <form onSubmit={handleSendCommand} className="relative flex items-end gap-2"> {/* Added gap-2 */}
                  {/* Textarea: flex-1 to grow, responsive padding/text size */}
                  <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isSending ? "Processing..." : "Enter command..."}
                      aria-label="Command input"
                      rows="1"
                      // Responsive padding (right padding accommodates button), text size, rounded corners
                      className="flex-1 resize-none border border-gray-600 bg-gray-700/80 rounded-xl py-2.5 pl-3 pr-10 md:pl-4 md:pr-12 text-sm md:text-base text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-colors duration-150 shadow-sm disabled:opacity-70" // Adjusted shadow, transition
                      style={{ minHeight: '44px' }} // Minimum height for touch target / baseline
                      disabled={isSending || !chatId || isLoading} // Disable input when busy/loading
                  />
                  {/* Send Button: flex-shrink-0 prevents resizing, consistent size */}
                  <button
                      type="submit"
                      // Consistent size (h-9 w-9), adjusted positioning via flex gap
                      className={`flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ease-in-out ${
                          inputValue.trim() && !isSending
                          ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-95' // Active state styling
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100' // Disabled state styling
                      }`}
                      disabled={!inputValue.trim() || isSending || !chatId || isLoading} // Disable button when busy/no input/loading
                      aria-label="Send command"
                      title="Send command"
                  >
                      {/* Consistent icon size */}
                      {isSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
              </form>
              {/* Helper Text: Hidden on mobile, shown centered on desktop */}
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