import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

// Changed key for clarity, reflects the new purpose
const LOCAL_STORAGE_KEY = 'robotControlAppHistory';

function App() {
  // State variable names kept for simplicity, but conceptually they hold 'tasks' or 'command logs'
  const [commandHistory, setCommandHistory] = useState([]); // Stores all command logs: [{ id, title, messages: [], createdAt }]
  const [activeLogId, setActiveLogId] = useState(null); // ID of the currently selected command log

  // Load command history AND set initial active log
  useEffect(() => {
    let loadedSuccessfully = false;
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        let parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          parsedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Newest first
          setCommandHistory(parsedHistory);
          setActiveLogId(parsedHistory[0].id); // Activate the newest log
          loadedSuccessfully = true;
        }
      }
    } catch (error) {
      // Updated error message
      console.error("Failed to load or parse command history from local storage:", error);
    }

    // If loading failed or history was empty, create a new log
    if (!loadedSuccessfully) {
      // Updated log message
      console.log("No valid command history found, creating a new task log.");
      const newLogId = uuidv4();
      const newLog = {
        id: newLogId,
        // Changed default title
        title: 'New Task Sequence',
        messages: [],
        createdAt: Date.now()
      };
      setCommandHistory([newLog]); // Initialize history with the new log
      setActiveLogId(newLogId); // Activate the new log
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on initial mount

  // Save command history to local storage whenever it changes
  useEffect(() => {
    // Save threadId along with other data
    if (commandHistory.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(commandHistory));
       } catch (error) {
          console.error("Failed to save command history to local storage:", error);
       }
    }
 }, [commandHistory]);

  // Get messages for the currently active command log
  const activeLogMessages = useCallback(() => {
    const activeLog = commandHistory.find(log => log.id === activeLogId);
    return activeLog ? activeLog.messages : [];
  }, [commandHistory, activeLogId]);

  const handleNewTask = useCallback(() => {
    const newLogId = uuidv4();
    const newLog = {
       id: newLogId,
       title: 'New Task Sequence',
       messages: [],
       createdAt: Date.now(),
       threadId: null // Initialize threadId
    };
    setCommandHistory(prevHistory => [newLog, ...prevHistory]);
    setActiveLogId(newLogId);
 }, []);

  // Function to update threadId for a log
  const setThreadIdForLog = useCallback((logId, threadId) => {
    setCommandHistory(prevHistory =>
       prevHistory.map(log =>
          log.id === logId ? { ...log, threadId: threadId } : log
       )
    );
    console.log(`Thread ID ${threadId} set for log ${logId}`);
 }, []);


 // Get active thread ID
 const getActiveThreadId = useCallback(() => {
   const activeLog = commandHistory.find(log => log.id === activeLogId);
   return activeLog ? activeLog.threadId : null;
 }, [commandHistory, activeLogId]);


  // Function to select an existing command log
  const handleSelectLog = useCallback((logId) => {
    setActiveLogId(logId);
  }, []);

   // Function to delete a command log
   const handleDeleteLog = useCallback((logIdToDelete) => {
    setCommandHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(log => log.id !== logIdToDelete);
        // If the deleted log was active, select the newest remaining log
        if (activeLogId === logIdToDelete) {
            if (updatedHistory.length > 0) {
                updatedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setActiveLogId(updatedHistory[0].id);
            } else {
                setActiveLogId(null); // No logs left
            }
        }
        return updatedHistory; // Return the filtered history
    });
   }, [activeLogId]);


   // Modified function to add messages (now handles AI streaming placeholder)
   const addMessageToActiveLog = useCallback((messageData) => {
    // messageData could be:
    // { text, sender, isError } for user message or complete AI message
    // { id, sender, type: 'placeholder' } for starting AI stream
    // { id, textChunk } for streaming update
    // { id, isError, final: true } for stream end/error

    if (!activeLogId) {
        console.warn("Attempted to add message with no active command log ID.");
        return;
    }

    setCommandHistory(prevHistory => {
        // Find the index of the active log
        const logIndex = prevHistory.findIndex(log => log.id === activeLogId);
        if (logIndex === -1) return prevHistory; // Should not happen

        const activeLog = prevHistory[logIndex];
        let updatedMessages = [...activeLog.messages];
        let updatedTitle = activeLog.title;

        if (messageData.type === 'placeholder' && messageData.sender === 'ai') {
            // Add a placeholder message object for the AI response
            updatedMessages.push({
                id: messageData.id, // Use ID generated by ChatArea
                text: '', // Start empty
                sender: 'ai',
                timestamp: Date.now(),
                isError: false,
                streaming: true // Flag for ongoing stream
            });
        } else if (messageData.id && messageData.textChunk) {
            // Find the streaming message and append the chunk
            updatedMessages = updatedMessages.map(msg =>
                msg.id === messageData.id && msg.streaming
                    ? { ...msg, text: msg.text + messageData.textChunk }
                    : msg
            );
        } else if (messageData.id && messageData.final !== undefined) {
            // Mark the streaming message as complete
            updatedMessages = updatedMessages.map(msg =>
                msg.id === messageData.id
                    ? { ...msg, streaming: false, isError: !!messageData.isError } // Finalize error state
                    : msg
            );
        } else if (messageData.sender === 'user') {
            // Handle user message (update title if needed)
            updatedTitle = (activeLog.title === 'New Task Sequence' && activeLog.messages.length === 0)
               ? messageData.text.substring(0, 35).trim() + (messageData.text.length > 35 ? '...' : '')
               : activeLog.title;

            updatedMessages.push({
                id: uuidv4(),
                text: messageData.text,
                sender: 'user',
                timestamp: Date.now(),
                isError: false
            });
        }
        // Add handling for complete non-streaming AI messages if needed

        // Create the updated log object
        const updatedLog = {
            ...activeLog,
            title: updatedTitle,
            messages: updatedMessages
        };

        // Create the new history array
        const newHistory = [...prevHistory];
        newHistory[logIndex] = updatedLog;

        // Keep history sorted (optional, if you prefer strict chronological order)
        // newHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return newHistory;
    });

}, [activeLogId]);


  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        // Pass down history and active ID
        commandHistory={commandHistory} // Pass the history (conceptually command logs)
        activeLogId={activeLogId}      // Pass the active ID
        onNewTask={handleNewTask}       // Pass the handler for creating new logs
        onSelectLog={handleSelectLog}   // Pass the handler for selecting logs
        onDeleteLog={handleDeleteLog}   // Pass the handler for deleting logs
      />

      <ChatArea
           key={activeLogId || 'no-log-selected'}
           messages={activeLogMessages()}
           // Pass down necessary functions and data for streaming
           onSendMessage={addMessageToActiveLog} // Handles adding user message & stream updates
           setThreadIdForLog={setThreadIdForLog} // To update thread ID in App state
           chatId={activeLogId}
           activeThreadId={getActiveThreadId()} // Pass current thread ID
           />
    </div>
  );
}

export default App;