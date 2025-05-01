import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Icons (Keep these as they are) ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /> </svg> );
const SpinnerIcon = () => ( <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> );
const UserIcon = () => <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">U</div>;
const AIIcon = () => <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">AI</div>;
// Using a different icon for the placeholder - perhaps a conversation bubble?
const ConversationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
    </svg>
);


function ChatArea({ messages = [], onSendMessage, chatId }) {
  // ... (useState, useRef, useEffect hooks remain the same) ...
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatAreaRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length > 1 ? "smooth" : "auto");
  }, [messages, chatId, scrollToBottom]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200;
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [inputValue]);

   useEffect(() => {
     if (chatId) {
         // Add a small delay to ensure the input is definitely rendered after chat switch
         setTimeout(() => inputRef.current?.focus(), 50);
     }
  }, [chatId]);

  const handleSendMessageInternal = useCallback(async (event) => {
      // ... (handleSendMessageInternal logic remains the same) ...
       if (event) event.preventDefault();
       const trimmedInput = inputValue.trim();
       if (!trimmedInput || isSending || !chatId) return;

       setIsSending(true);
       setInputValue('');
       onSendMessage(trimmedInput, 'user');

       try {
         await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
         let aiTextResponse = `Simulated response to: "${trimmedInput}". This is just a placeholder demonstrating the flow.`;
          if (trimmedInput.toLowerCase().includes('hello')) {
              aiTextResponse = "Hello there! 👋 How can I assist you today?";
          } else if (trimmedInput.toLowerCase().includes('help')) {
              aiTextResponse = "I can help with various tasks! Ask me about coding, writing, brainstorming, or just chat. What's on your mind?";
          } else if (trimmedInput.length > 50) {
              aiTextResponse = "That's an interesting thought! Let me process that...\n\nOkay, regarding your detailed query, here are some points to consider...";
          }
         onSendMessage(aiTextResponse, 'ai');
       } catch (error) {
         console.error("Error simulating AI response:", error);
         onSendMessage("Sorry, I encountered an error trying to respond.", 'ai', true);
       } finally {
         setIsSending(false);
         inputRef.current?.focus();
         setTimeout(() => scrollToBottom("smooth"), 50);
       }
  }, [inputValue, isSending, chatId, onSendMessage, scrollToBottom]);

  const handleKeyDown = (event) => {
      // ... (handleKeyDown logic remains the same) ...
       if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSendMessageInternal();
       }
  };


  return (
    <div className="flex-1 flex flex-col bg-gray-800 text-gray-100 overflow-hidden">
      {/* Message Display Area */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {!chatId ? (
           // State when no chat is selected (Keep this as is)
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <h2 className="text-xl font-medium mt-4">Select a chat or start a new one</h2>
           </div>
        ) : messages.length === 0 && chatId ? (
           // ***** MODIFIED SECTION *****
           // Initial Empty State for an *active* chat
           <div className="flex flex-col items-center justify-center h-full text-center px-4">
             {/* Icon Container */}
             <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full mb-5 flex items-center justify-center shadow-lg">
                <ConversationIcon />
             </div>
             {/* Main Heading */}
             <h2 className="text-2xl font-semibold text-gray-200">
               Chat Naturally
             </h2>
             {/* Subheading */}
             <p className="text-base text-gray-400 mt-2 max-w-md">
               Use simple, plain English to interact. No complex commands or coding language needed. Just start typing!
             </p>
           </div>
           // ***** END OF MODIFIED SECTION *****
        ) : (
          // Display messages (Keep this section as is)
           messages.map((message) => (
            <div
                key={message.id}
                className={`flex items-start gap-3 animate-fade-in ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
                {message.sender === 'ai' && <AIIcon />}
                <div
                className={`max-w-xl lg:max-w-2xl px-4 py-2.5 rounded-lg shadow-md break-words ${
                    message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : `bg-gray-700 text-gray-100 ${message.isError ? 'border border-red-500 ring-1 ring-red-500' : ''}`
                }`}
                >
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
        <div ref={messagesEndRef} className="h-1" /> {/* Scroll anchor */}
      </div>

      {/* Input Area (Keep this section as is) */}
      {chatId && (
        <div className="bg-gradient-to-t from-gray-900 via-gray-800 to-gray-800 px-4 pb-4 pt-3 border-t border-gray-700/50">
            {/* ... form and input elements ... */}
            <div className="max-w-3xl mx-auto relative">
              <form onSubmit={handleSendMessageInternal} className="relative flex items-end">
                  <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isSending ? "AI thinking..." : "Send a message..."}
                      aria-label="Chat input"
                      rows="1"
                      className="flex-1 resize-none border border-gray-600 bg-gray-700 rounded-xl py-3 pl-4 pr-12 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 transition-all duration-150"
                      style={{ minHeight: '52px' }}
                      disabled={isSending || !chatId}
                  />
                  <button
                      type="submit"
                      className={`absolute right-2.5 bottom-[11px] flex items-center justify-center h-8 w-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-150 ${
                          inputValue.trim() && !isSending
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={!inputValue.trim() || isSending || !chatId}
                      aria-label="Send message"
                      title="Send message"
                  >
                      {isSending ? <SpinnerIcon /> : <SendIcon />}
                  </button>
              </form>
              <p className="text-xs text-gray-500 text-center mt-2 px-2">AI can make mistakes. Consider checking important information.</p>
            </div>
        </div>
      )}
    </div>
  );
}

export default ChatArea;