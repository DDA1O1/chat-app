import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Icons --- (Keep existing icons)
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;
const RobotIcon = () => ( <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md ring-1 ring-white/20"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"> <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9ZM8.25 9.75A.75.75 0 0 1 9 9h6a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H9Z" clipRule="evenodd" /> </svg> </div> );
const CommandPromptIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white"> <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /> </svg> );


function ChatArea({ messages = [], onSendMessage, chatId, activeThreadId, setThreadIdForLog }) {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null);
  const eventSourceRef = useRef(null); // Still needed to manage the SSE connection
  const currentAiMessageIdRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
      messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
      scrollToBottom('smooth');
  }, [messages, scrollToBottom]);

  useEffect(() => {
      const textarea = inputRef.current;
      if (textarea) {
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          textarea.style.height = `${scrollHeight}px`;
      }
  }, [inputValue]);

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
          // Also clear the ref tracking the AI message ID when chat changes
          currentAiMessageIdRef.current = null;
          setIsSending(false); // Ensure sending state is reset
      };
  }, [chatId]);

  const handleSendCommand = useCallback(async (event) => {
      if (event) event.preventDefault();
      const trimmedInput = inputValue.trim();
      if (!trimmedInput || isSending || !chatId) return;

      // Abort previous stream if any (user sends new message quickly)
      if (eventSourceRef.current) {
           console.log("Aborting previous stream request.");
           eventSourceRef.current.close();
           eventSourceRef.current = null;
      }

      // 1. Send user message immediately to UI
      onSendMessage({ text: trimmedInput, sender: 'user' });
      const userInputValue = trimmedInput; // Store it before clearing
      setInputValue('');
      setIsSending(true);
      scrollToBottom("smooth");
      inputRef.current?.focus();

      // 2. Prepare for AI streaming response (placeholder)
      const aiMessageId = uuidv4();
      currentAiMessageIdRef.current = aiMessageId;
      onSendMessage({ id: aiMessageId, sender: 'ai', type: 'placeholder', text: '...' });
      scrollToBottom("smooth");

      let returnedThreadId = activeThreadId; // Use existing threadId if available

      try {
        // --- STEP 1: Send prompt via POST ---
        const initialResponse = await fetch('/api/generate-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userPrompt: userInputValue, threadId: activeThreadId }),
        });

        if (!initialResponse.ok) {
            const errorData = await initialResponse.json().catch(() => ({})); // Try parsing error
            throw new Error(errorData.error || `HTTP error! status: ${initialResponse.status}`);
        }

        const data = await initialResponse.json();
        returnedThreadId = data.threadId; // Get the threadId from the response

        // If it's a new thread, update the parent state
        if (returnedThreadId && !activeThreadId) {
            setThreadIdForLog(chatId, returnedThreadId);
        }

        // --- STEP 2: Connect to SSE stream using GET ---
        if (!returnedThreadId) {
             throw new Error("Did not receive threadId from server.");
        }

        // *** Correct: Use GET and pass threadId in query string ***
        const es = new EventSource(`/api/stream-response?threadId=${returnedThreadId}`);
        eventSourceRef.current = es; // Store the reference

        es.onopen = () => {
            console.log(`SSE Connection Opened for thread ${returnedThreadId}`);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const currentAiMsgId = currentAiMessageIdRef.current;

                if (!currentAiMsgId) return; // Ignore if no longer tracking this message

                // Note: No 'threadId' event expected here anymore
                if (data.type === 'chunk' && typeof data.text === 'string') {
                     onSendMessage({ id: currentAiMsgId, textChunk: data.text, type: 'update' });
                     scrollToBottom("auto");
                } else if (data.type === 'end') {
                     console.log("SSE Stream Ended by Server");
                     onSendMessage({ id: currentAiMsgId, final: true, isError: false, type: 'final' });
                     setIsSending(false);
                     inputRef.current?.focus();
                     es.close();
                     eventSourceRef.current = null;
                     currentAiMessageIdRef.current = null;
                } else if (data.type === 'error') {
                     console.error("SSE Error Event:", data.message);
                     onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: data.message || 'An error occurred.', type: 'final' });
                     setIsSending(false);
                     inputRef.current?.focus();
                     es.close();
                     eventSourceRef.current = null;
                     currentAiMessageIdRef.current = null;
                } else {
                    console.warn("Received unknown SSE message type:", data);
                }

            } catch (error) {
                console.error("Failed to parse SSE message:", event.data, error);
                const currentAiMsgId = currentAiMessageIdRef.current;
                if (currentAiMsgId) {
                    onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Error processing response stream.', type: 'final' });
                }
                setIsSending(false);
                inputRef.current?.focus();
                if (eventSourceRef.current) eventSourceRef.current.close();
                eventSourceRef.current = null;
                currentAiMessageIdRef.current = null;
            }
        };

        es.onerror = (error) => {
            console.error("EventSource failed (Network/Connection Error):", error);
             const currentAiMsgId = currentAiMessageIdRef.current;
             if (currentAiMsgId) {
                 onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: 'Connection error during streaming.', type: 'final' });
             }
             setIsSending(false);
             inputRef.current?.focus();
             // EventSource might try to reconnect; explicitly close if we know it's fatal
             if (eventSourceRef.current) eventSourceRef.current.close();
             eventSourceRef.current = null;
             currentAiMessageIdRef.current = null;
        };

      } catch (error) {
          // Catch errors from initial POST fetch or EventSource creation
          console.error("Failed during command sending process:", error);
          const currentAiMsgId = currentAiMessageIdRef.current;
          if (currentAiMsgId) {
               onSendMessage({ id: currentAiMsgId, final: true, isError: true, text: `Error: ${error.message || 'Could not connect or process request.'}`, type: 'final' });
          } else {
               // If error happened even before placeholder was set (unlikely)
               // Maybe show a general error notification?
               console.error("Failed before AI response placeholder could be added.");
          }
          setIsSending(false);
          inputRef.current?.focus();
          if (eventSourceRef.current) eventSourceRef.current.close(); // Ensure cleanup
          eventSourceRef.current = null;
          currentAiMessageIdRef.current = null;
      }

  }, [inputValue, isSending, chatId, activeThreadId, onSendMessage, setThreadIdForLog, scrollToBottom]); // Added dependencies


  const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
         event.preventDefault();
         handleSendCommand();
      }
  };


  // --- JSX Structure (Return statement) remains the same ---
  // No changes needed to the rendering part of ChatArea.jsx
  return (
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">
      {/* Command/Response Display Area */}
      <div
        ref={chatAreaRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-500 hover:scrollbar-thumb-gray-400 scrollbar-track-gray-800"
      >
         {!chatId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
                key={message.id || uuidv4()}
                className={`flex items-start gap-3 animate-fade-in ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {message.sender === 'ai' && <RobotIcon />}
                <div
                  className={`max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-lg shadow-md break-words whitespace-pre-wrap ${
                      message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500/50' : 'border border-transparent'}`
                  }`}
                >
                  {message.text ?? ''}
                </div>
                {message.sender === 'user' && <UserIcon />}
            </div>
            ))
         )}
         <div ref={messagesEndRef} className="h-1" />
      </div> {/* End Command/Response Display Area */}

      {/* Command Input Area */}
      {chatId && (
        <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-4 pb-4 pt-3 border-t border-gray-700/50 shadow-lg">
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSendCommand} className="relative flex items-end">
                  <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isSending ? "Processing..." : "Enter natural language command..."} // Updated placeholder
                      aria-label="Command input"
                      rows="1"
                      className="flex-1 resize-none border border-gray-600 bg-gray-700/80 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-all duration-150 shadow-inner"
                      style={{ minHeight: '52px' }}
                      disabled={isSending || !chatId}
                  />
                  <button
                      type="submit"
                      className={`absolute right-2.5 bottom-[11px] flex items-center justify-center h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ${
                          inputValue.trim() && !isSending
                          ? 'bg-teal-600 hover:bg-teal-700 text-white scale-100 hover:scale-105 active:scale-100'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed scale-100'
                      }`}
                      disabled={!inputValue.trim() || isSending || !chatId}
                      aria-label="Send command" // Simplified label
                      title="Send command" // Simplified title
                  >
                      {isSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
              </form>
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