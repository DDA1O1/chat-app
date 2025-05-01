import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const LOCAL_STORAGE_KEY = 'reactChatAppHistory';

function App() {
  const [chatHistory, setChatHistory] = useState([]); // Stores all chats: [{ id, title, messages: [], createdAt }]
  const [activeChatId, setActiveChatId] = useState(null); // ID of the currently selected chat

  // Load chat history AND set initial active chat
  useEffect(() => {
    let loadedSuccessfully = false;
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        let parsedHistory = JSON.parse(storedHistory);
        // Ensure it's an array before proceeding
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          // Sort history by createdAt descending (newest first)
          // Add fallback for potential old data without createdAt
          parsedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          setChatHistory(parsedHistory);
          setActiveChatId(parsedHistory[0].id); // Activate the newest chat
          loadedSuccessfully = true;
        }
      }
    } catch (error) {
      console.error("Failed to load or parse chat history from local storage:", error);
      // Proceed to default behavior (create new chat)
    }

    // If loading failed or history was empty, create a new chat
    if (!loadedSuccessfully) {
      console.log("No valid chat history found, creating a new chat.");
      const newChatId = uuidv4();
      const newChat = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        createdAt: Date.now()
      };
      setChatHistory([newChat]); // Initialize history with the new chat
      setActiveChatId(newChatId); // Activate the new chat
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial mount

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    // Prevent saving initial empty array if we immediately create a new chat
    if (chatHistory.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
       } catch (error) {
         console.error("Failed to save chat history to local storage:", error);
       }
    }
  }, [chatHistory]);

  // --- Rest of the App.jsx component remains the same ---
  // (activeChatMessages, handleNewChat, handleSelectChat, handleDeleteChat, addMessageToActiveChat, return statement)

  // Get messages for the currently active chat
  const activeChatMessages = useCallback(() => {
    const activeChat = chatHistory.find(chat => chat.id === activeChatId);
    return activeChat ? activeChat.messages : [];
  }, [chatHistory, activeChatId]);

  // Function to handle starting a new chat
  const handleNewChat = useCallback(() => {
    const newChatId = uuidv4();
    const newChat = {
        id: newChatId,
        title: 'New Chat', // Temporary title
        messages: [],
        createdAt: Date.now() // Track creation time
    };
    // Add to the beginning of the history state for immediate UI update
    setChatHistory(prevHistory => [newChat, ...prevHistory]);
    setActiveChatId(newChatId);
  }, []);

  // Function to select an existing chat
  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
  }, []);

   // Function to delete a chat
   const handleDeleteChat = useCallback((chatIdToDelete) => {
    setChatHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(chat => chat.id !== chatIdToDelete);
         // If the deleted chat was active, select the newest remaining chat, or null if none left
        if (activeChatId === chatIdToDelete) {
            if (updatedHistory.length > 0) {
                // Sort again to be sure the first one is the newest after deletion
                updatedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setActiveChatId(updatedHistory[0].id);
            } else {
                setActiveChatId(null); // No chats left
            }
        }
        return updatedHistory; // Return the filtered history
    });
   }, [activeChatId]);


  // Function to add a message to the active chat
  const addMessageToActiveChat = useCallback((text, sender, isError = false) => {
    if (!activeChatId) {
        console.warn("Attempted to add message with no active chat ID.");
        return;
    }

    setChatHistory(prevHistory =>
      prevHistory.map(chat => {
        if (chat.id === activeChatId) {
          const newTitle = (chat.title === 'New Chat' && sender === 'user' && chat.messages.length === 0)
            ? text.substring(0, 35).trim() + (text.length > 35 ? '...' : '')
            : chat.title;

          return {
            ...chat,
            title: newTitle,
            messages: [
              ...chat.messages,
              { id: uuidv4(), text, sender, timestamp: Date.now(), isError }
            ]
          };
        }
        return chat;
      }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) // Keep history sorted by creation date
    );
  }, [activeChatId]);


  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        // Ensure chatHistory is always sorted correctly before passing down
        chatHistory={chatHistory} // Already sorted by state updates
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Chat Area */}
      <ChatArea
        key={activeChatId || 'no-chat-selected'}
        messages={activeChatMessages()}
        onSendMessage={addMessageToActiveChat}
        chatId={activeChatId}
      />
    </div>
  );
}

export default App;