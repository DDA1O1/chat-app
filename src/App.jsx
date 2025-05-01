import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';

const LOCAL_STORAGE_KEY = 'robotControlAppHistory';

function App() {
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeLogId, setActiveLogId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  // --- Load history --- (No changes needed here, logic remains the same)
  useEffect(() => {
    let loadedSuccessfully = false;
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedHistory) {
        let parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          // Ensure createdAt exists and sort
          parsedHistory = parsedHistory.map(log => ({ ...log, createdAt: log.createdAt || 0 }));
          parsedHistory.sort((a, b) => b.createdAt - a.createdAt);
          setCommandHistory(parsedHistory);
          // Activate the newest valid log, handle potential null activeLogId later
          setActiveLogId(parsedHistory[0]?.id || null);
          loadedSuccessfully = true;
        }
      }
    } catch (error) {
      console.error("Failed to load or parse command history from local storage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
    }

    if (!loadedSuccessfully) {
      console.log("No valid command history found, creating a new task log.");
      handleNewTask(false); // Create initial task but don't set it active yet if history loaded but was empty/invalid
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // --- Save history --- (No changes needed)
  useEffect(() => {
    if (commandHistory.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(commandHistory));
       } catch (error) {
          console.error("Failed to save command history to local storage:", error);
       }
    }
 }, [commandHistory]);


  // --- Get active log & messages ---
  const activeLog = useMemo(() => {
      return commandHistory.find(log => log.id === activeLogId);
  }, [commandHistory, activeLogId]);

  const activeLogMessages = useMemo(() => {
      return activeLog ? activeLog.messages : [];
  }, [activeLog]);

  const activeLogTitle = useMemo(() => {
      return activeLog ? activeLog.title : 'No Task Selected';
  }, [activeLog]);


  // --- Handlers ---

  const handleNewTask = useCallback((setActive = true) => { // Added setActive flag
    const newLogId = uuidv4();
    const newLog = {
       id: newLogId,
       title: 'New Task Sequence',
       messages: [],
       createdAt: Date.now(),
       threadId: null
    };
    // Add to the beginning of the array
    setCommandHistory(prevHistory => [newLog, ...prevHistory]);
    if (setActive) {
        setActiveLogId(newLogId);
        setIsSidebarOpen(false); // Close sidebar on mobile when creating new task
    }
    // If called during initial load without valid history, this creates the first item
    // but doesn't set it active immediately if setActive is false.
    // If history *was* valid but empty, setActive=true makes it active.
     return newLogId; // Return ID for potential immediate use
 }, []);


  const setThreadIdForLog = useCallback((logId, threadId) => {
    setCommandHistory(prevHistory =>
       prevHistory.map(log =>
          log.id === logId ? { ...log, threadId: threadId } : log
       )
    );
    console.log(`Thread ID ${threadId} set for log ${logId}`);
 }, []);

 const getActiveThreadId = useCallback(() => {
   return activeLog ? activeLog.threadId : null;
 }, [activeLog]);

  const handleSelectLog = useCallback((logId) => {
    setActiveLogId(logId);
    setIsSidebarOpen(false); // Close sidebar on mobile when selecting a log
  }, []);

  const handleDeleteLog = useCallback((logIdToDelete) => {
    let nextActiveLogId = activeLogId;

    setCommandHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(log => log.id !== logIdToDelete);

        if (activeLogId === logIdToDelete) {
            if (updatedHistory.length > 0) {
                // Sort by date again to be sure (or rely on existing order if always prepended)
                updatedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                nextActiveLogId = updatedHistory[0].id;
            } else {
                nextActiveLogId = null; // No logs left
            }
        }

        // If no logs left after deletion, create a new one automatically
        if (updatedHistory.length === 0) {
             console.log("Last log deleted, creating a new one.");
             const newId = handleNewTask(false); // Create but don't activate yet
             nextActiveLogId = newId; // Set this new one as the next active
             // Note: handleNewTask already updated commandHistory, so just return [] to avoid double update?
             // Let's simplify: Let handleNewTask update state, then set the active ID.
             setActiveLogId(newId); // Directly set the new ID as active
             return []; // History will be set by handleNewTask's setState call
        } else {
             setActiveLogId(nextActiveLogId); // Update active ID if it changed
             return updatedHistory; // Return the filtered history
        }
    });
   }, [activeLogId, handleNewTask]); // Added handleNewTask dependency


   // Modified function to add messages (now handles AI streaming placeholder)
   const addMessageToActiveLog = useCallback((messageData) => {
    if (!activeLogId) {
        console.warn("Attempted to add message with no active command log ID.");
        // Optionally, create a new task if one isn't active? Or show an error.
        // For now, just return.
        return;
    }

    setCommandHistory(prevHistory => {
        const logIndex = prevHistory.findIndex(log => log.id === activeLogId);
        if (logIndex === -1) {
            console.error("Active log ID not found in history array!");
            return prevHistory;
        }

        const currentActiveLog = prevHistory[logIndex];
        let updatedMessages = [...currentActiveLog.messages];
        let updatedTitle = currentActiveLog.title;
        const messageId = messageData.id || uuidv4(); // Ensure messages have IDs

        switch (messageData.type) {
            case 'placeholder':
                updatedMessages.push({
                    id: messageId, // Use ID generated by ChatArea/caller
                    text: '', // Start empty
                    sender: 'ai',
                    timestamp: Date.now(),
                    isError: false,
                    streaming: true
                });
                break;
            case 'update': // Streaming update
                updatedMessages = updatedMessages.map(msg =>
                    msg.id === messageData.id && msg.streaming
                        ? { ...msg, text: msg.text + messageData.textChunk }
                        : msg
                );
                break;
            case 'final': // Stream end/error
                updatedMessages = updatedMessages.map(msg =>
                    msg.id === messageData.id
                        ? { ...msg, streaming: false, isError: !!messageData.isError, text: msg.text || messageData.text || '' } // Finalize error state & ensure text exists
                        : msg
                );
                break;
            case 'user': // User message (check if this is still how it's passed)
                 // Or handle user messages directly if type isn't explicitly passed
                 updatedTitle = (currentActiveLog.title === 'New Task Sequence' && currentActiveLog.messages.length === 0)
                 ? messageData.text.substring(0, 35).trim() + (messageData.text.length > 35 ? '...' : '')
                 : currentActiveLog.title;

                 updatedMessages.push({
                     id: messageId,
                     text: messageData.text,
                     sender: 'user',
                     timestamp: Date.now(),
                     isError: false
                 });
                 break;
             default: // Handle non-streaming AI or user messages without explicit type
                  if(messageData.sender === 'user') {
                     updatedTitle = (currentActiveLog.title === 'New Task Sequence' && currentActiveLog.messages.length === 0)
                         ? messageData.text.substring(0, 35).trim() + (messageData.text.length > 35 ? '...' : '')
                         : currentActiveLog.title;

                     updatedMessages.push({
                         id: messageId,
                         text: messageData.text,
                         sender: 'user',
                         timestamp: Date.now(),
                         isError: false
                     });
                  } else if (messageData.sender === 'ai') {
                      // Handle complete AI message if needed (though streaming handles this)
                      updatedMessages.push({
                         id: messageId,
                         text: messageData.text,
                         sender: 'ai',
                         timestamp: Date.now(),
                         isError: !!messageData.isError, // Capture potential error flag
                         streaming: false // Ensure not marked as streaming
                     });
                  } else {
                     console.warn("Unknown message data format:", messageData);
                  }
                 break;

        }


        const updatedLog = {
            ...currentActiveLog,
            title: updatedTitle,
            messages: updatedMessages,
            // Optionally update a 'lastModified' timestamp here
             lastModified: Date.now()
        };

        // Create the new history array, replacing the updated log
        const newHistory = [...prevHistory];
        newHistory[logIndex] = updatedLog;

        // Optional: Re-sort history if title change affects order (unlikely) or if lastModified is used for sorting
        // newHistory.sort((a, b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));

        return newHistory;
    });

}, [activeLogId]); // Removed dependency cycle with itself

  return (
    // Add relative positioning for absolute positioned mobile sidebar
    <div className="relative flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        commandHistory={commandHistory}
        activeLogId={activeLogId}
        onNewTask={handleNewTask}
        onSelectLog={handleSelectLog}
        onDeleteLog={handleDeleteLog}
        // Pass sidebar state and control for mobile
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Chat Area */}
      <ChatArea
           key={activeLogId || 'no-log-selected'} // Key ensures component remounts/resets state on log change
           messages={activeLogMessages}
           onSendMessage={addMessageToActiveLog}
           setThreadIdForLog={setThreadIdForLog}
           chatId={activeLogId}
           activeThreadId={getActiveThreadId()}
           // Pass sidebar toggle function and active chat title for mobile header
           onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
           activeChatTitle={activeLogTitle}
           isLoading={!activeLog && commandHistory.length > 0} // Indicate loading if history exists but no log selected yet
       />
    </div>
  );
}

export default App;