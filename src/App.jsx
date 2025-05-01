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
    if (commandHistory.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
         // Updated save message
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(commandHistory));
       } catch (error) {
         // Updated error message
         console.error("Failed to save command history to local storage:", error);
       }
    }
  }, [commandHistory]);

  // Get messages for the currently active command log
  const activeLogMessages = useCallback(() => {
    const activeLog = commandHistory.find(log => log.id === activeLogId);
    return activeLog ? activeLog.messages : [];
  }, [commandHistory, activeLogId]);

  // Function to handle starting a new task/command log
  const handleNewTask = useCallback(() => {
    const newLogId = uuidv4();
    const newLog = {
        id: newLogId,
        // Changed default title
        title: 'New Task Sequence', // Temporary title
        messages: [],
        createdAt: Date.now() // Track creation time
    };
    // Add to the beginning of the history state
    setCommandHistory(prevHistory => [newLog, ...prevHistory]);
    setActiveLogId(newLogId);
  }, []);

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


  // Function to add a message (command or response) to the active log
  const addMessageToActiveLog = useCallback((text, sender, isError = false) => {
    if (!activeLogId) {
        // Updated warning
        console.warn("Attempted to add message with no active command log ID.");
        return;
    }

    setCommandHistory(prevHistory =>
      prevHistory.map(log => {
        if (log.id === activeLogId) {
          // Update title based on the first user command, if it's the default title
          const newTitle = (log.title === 'New Task Sequence' && sender === 'user' && log.messages.length === 0)
            ? text.substring(0, 35).trim() + (text.length > 35 ? '...' : '') // Keep title generation logic
            : log.title;

          return {
            ...log,
            title: newTitle,
            messages: [
              ...log.messages,
              { id: uuidv4(), text, sender, timestamp: Date.now(), isError }
            ]
          };
        }
        return log;
      }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) // Keep history sorted
    );
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

      {/* Main Command/Response Area */}
      <ChatArea
        key={activeLogId || 'no-log-selected'} // Updated key
        messages={activeLogMessages()}          // Get messages for the active log
        onSendMessage={addMessageToActiveLog}   // Handler to add messages/commands
        chatId={activeLogId} // Pass the active log ID (prop name kept generic for ChatArea reusability, but conceptually it's a log ID)
      />
    </div>
  );
}

export default App;