import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './Sidebar'; // Assuming Sidebar is correct now
import ChatArea from './ChatArea'; // Assuming ChatArea is correct now

const LOCAL_STORAGE_KEY = 'robotControlAppHistory';

function App() {
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeLogId, setActiveLogId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Load history --- (Corrected Logic)
  useEffect(() => {
    let historySuccessfullyProcessed = false; // Renamed for clarity
    let initialState = []; // Default state if nothing loads
    let initialActiveId = null;

    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (storedHistory !== null) { // Check if the key exists at all
        let parsedHistory = JSON.parse(storedHistory); // Attempt parsing

        if (Array.isArray(parsedHistory)) { // Check if it's an array (can be empty)
          // Successfully parsed an array from storage
          initialState = parsedHistory.map(log => ({
              ...log,
              // Provide default values for potentially missing fields during load
              id: log.id || uuidv4(), // Ensure ID exists
              title: log.title || 'Untitled Task',
              messages: Array.isArray(log.messages) ? log.messages : [],
              createdAt: log.createdAt || Date.now(), // Ensure createdAt exists
              threadId: log.threadId || null
          })).sort((a, b) => b.createdAt - a.createdAt); // Sort by date descending (newest first)

          if (initialState.length > 0) {
            initialActiveId = initialState[0].id; // Activate the newest log if history is not empty
          }
          historySuccessfullyProcessed = true; // Mark as processed successfully
          console.log(`Loaded ${initialState.length} tasks from local storage.`);

        } else {
          // Data in storage was not an array - treat as invalid
          console.warn("Stored history is not an array. Clearing local storage for this key.");
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          // Keep defaults: initialState = [], initialActiveId = null, historySuccessfullyProcessed = false
        }
      }
      // If storedHistory was null, we proceed with defaults (historySuccessfullyProcessed = false)

    } catch (error) {
      console.error("Failed to load or parse command history from local storage:", error);
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted data
      // Keep defaults: initialState = [], initialActiveId = null, historySuccessfullyProcessed = false
    }

    // **Set the state based on what was loaded or the defaults**
    setCommandHistory(initialState);
    setActiveLogId(initialActiveId);

    // **Only create a new task if NO history was successfully processed from localStorage**
    // This means storage was empty, null, or contained invalid/non-array data.
    if (!historySuccessfullyProcessed) {
      console.log("No valid history in storage, creating initial task log.");
      // Create the new log data
      const newLogId = uuidv4();
      const newLog = {
         id: newLogId,
         title: 'New Task Sequence',
         messages: [],
         createdAt: Date.now(),
         threadId: null
      };
      // Set the state to contain only this new log
      setCommandHistory([newLog]);
      setActiveLogId(newLogId); // Activate the newly created log
    }

  // NOTE: The dependency array is empty `[]` ensuring this runs ONLY ONCE on initial mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // --- Save history ---
  useEffect(() => {
    // Save whenever commandHistory changes, but only if it's not the initial empty state
    // before the load useEffect finishes (though that's very fast).
    // A simple check prevents saving an empty array unnecessarily right at the start.
    if (commandHistory.length > 0 || localStorage.getItem(LOCAL_STORAGE_KEY)) {
       try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(commandHistory));
       } catch (error) {
          console.error("Failed to save command history to local storage:", error);
       }
    }
    // If commandHistory becomes empty (last item deleted), save the empty array
    if (commandHistory.length === 0 && localStorage.getItem(LOCAL_STORAGE_KEY)) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
         } catch (error) {
            console.error("Failed to save empty command history to local storage:", error);
         }
    }
 }, [commandHistory]);


  // --- Get active log & messages --- (useMemo is good)
  const activeLog = useMemo(() => {
      // Ensure activeLogId is valid before searching
      if (!activeLogId) return null;
      return commandHistory.find(log => log && log.id === activeLogId);
  }, [commandHistory, activeLogId]);

  const activeLogMessages = useMemo(() => {
      return activeLog ? activeLog.messages : [];
  }, [activeLog]);

  const activeLogTitle = useMemo(() => {
      return activeLog ? activeLog.title : 'No Task Selected';
  }, [activeLog]);


  // --- Handlers ---

  // handleNewTask remains mostly the same, but ensure it works correctly when history is empty
  const handleNewTask = useCallback(() => {
    const newLogId = uuidv4();
    const newLog = {
       id: newLogId,
       title: 'New Task Sequence',
       messages: [],
       createdAt: Date.now(),
       threadId: null
    };
    // Prepend the new log to the existing history
    setCommandHistory(prevHistory => [newLog, ...(Array.isArray(prevHistory) ? prevHistory : [])]);
    setActiveLogId(newLogId);    // Activate the new log
    setIsSidebarOpen(false);   // Close sidebar on mobile
    return newLogId; // Return ID for potential immediate use (though usually not needed)
 }, []); // No external dependencies needed here


  const setThreadIdForLog = useCallback((logId, threadId) => {
    if (!logId) return; // Don't proceed if logId is invalid
    setCommandHistory(prevHistory =>
       prevHistory.map(log =>
          log && log.id === logId ? { ...log, threadId: threadId } : log
       )
    );
    console.log(`Thread ID ${threadId} set for log ${logId}`);
 }, []);

 const getActiveThreadId = useCallback(() => {
   return activeLog ? activeLog.threadId : null;
 }, [activeLog]);

  const handleSelectLog = useCallback((logId) => {
    if (logId) { // Only set if logId is valid
        setActiveLogId(logId);
        setIsSidebarOpen(false);
    }
  }, []);

  // handleDeleteLog needs careful state management, especially when deleting the active/last log
  const handleDeleteLog = useCallback((logIdToDelete) => {
      if (!logIdToDelete) return; // Don't proceed if ID is invalid

      let nextActiveLogId = null; // Determine the next ID *before* setting state

      // Calculate the state *after* deletion
      const updatedHistory = commandHistory.filter(log => log && log.id !== logIdToDelete);

      if (updatedHistory.length === 0) {
          // If deleting the last log, create a new one automatically
          console.log("Last log deleted, creating a new one.");
          const newLogId = uuidv4();
          const newLog = { id: newLogId, title: 'New Task Sequence', messages: [], createdAt: Date.now(), threadId: null };
          setCommandHistory([newLog]); // Set history to *only* the new log
          setActiveLogId(newLogId);   // Activate the new log
          // No need to set nextActiveLogId here, state is set directly
      } else {
          // If logs remain
          if (activeLogId === logIdToDelete) {
              // If the deleted log was active, activate the newest remaining log
              // Sort again just to be absolutely sure the first item is the newest
              updatedHistory.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              nextActiveLogId = updatedHistory[0]?.id || null; // Get ID of the new newest, or null if something went wrong
          } else {
              // If the deleted log wasn't active, keep the current activeLogId
              nextActiveLogId = activeLogId;
          }
          // Update the history state and the active ID state together
          setCommandHistory(updatedHistory);
          setActiveLogId(nextActiveLogId);
      }
      setIsSidebarOpen(false); // Close sidebar after deletion if open
  }, [activeLogId, commandHistory]); // Depend on current activeId and the history itself


   // addMessageToActiveLog - Ensure robustness
   const addMessageToActiveLog = useCallback((messageData) => {
    // **Crucial: Check if there IS an active log ID before proceeding**
    if (!activeLogId) {
        console.warn("Attempted to add message with no active command log ID. Ignoring.");
        // Consider: Should we auto-create a task here? For now, just ignore.
        return;
    }

    setCommandHistory(prevHistory => {
        const logIndex = prevHistory.findIndex(log => log && log.id === activeLogId);

        // **If the active log ID somehow doesn't exist in the history, bail out**
        if (logIndex === -1) {
            console.error(`Active log ID "${activeLogId}" not found in history array. Cannot add message.`);
            return prevHistory; // Return previous state unchanged
        }

        const currentActiveLog = prevHistory[logIndex];
        // Ensure messages array exists
        let updatedMessages = Array.isArray(currentActiveLog.messages) ? [...currentActiveLog.messages] : [];
        let updatedTitle = currentActiveLog.title;
        const messageId = messageData.id || uuidv4(); // Ensure messages have IDs

        // Refined switch statement for clarity
        switch (messageData.type) {
            case 'placeholder':
                updatedMessages.push({ id: messageId, text: '', sender: 'ai', timestamp: Date.now(), isError: false, streaming: true });
                break;
            case 'update':
                updatedMessages = updatedMessages.map(msg => msg.id === messageData.id && msg.streaming ? { ...msg, text: (msg.text || '') + (messageData.textChunk || '') } : msg );
                break;
            case 'final':
                updatedMessages = updatedMessages.map(msg => msg.id === messageData.id ? { ...msg, streaming: false, isError: !!messageData.isError, text: msg.text || messageData.text || '' } : msg );
                break;
            case 'user': // Explicit user message type
            default: // Default handles user/ai messages without explicit 'type'
                 if(messageData.sender === 'user') {
                     // Update title only if it's the default and it's the first message
                     if (currentActiveLog.title === 'New Task Sequence' && updatedMessages.length === 0 && messageData.text) {
                         updatedTitle = messageData.text.substring(0, 35).trim() + (messageData.text.length > 35 ? '...' : '');
                     }
                     updatedMessages.push({ id: messageId, text: messageData.text || '', sender: 'user', timestamp: Date.now(), isError: false });
                 } else if (messageData.sender === 'ai') {
                     // Handles complete non-streaming AI messages (if ever used)
                     updatedMessages.push({ id: messageId, text: messageData.text || '', sender: 'ai', timestamp: Date.now(), isError: !!messageData.isError, streaming: false });
                 } else {
                    console.warn("addMessageToActiveLog received unknown message data:", messageData);
                    // Don't add unknown message types
                 }
                break;
        }

        // Create the updated log object
        const updatedLog = {
            ...currentActiveLog,
            title: updatedTitle,
            messages: updatedMessages,
            lastModified: Date.now() // Add/update a last modified timestamp
        };

        // Create the new history array
        const newHistory = [...prevHistory];
        newHistory[logIndex] = updatedLog;

        // Optionally re-sort if you want the modified chat to jump to the top of its date group (uncommon)
        // newHistory.sort((a, b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));

        return newHistory; // Return the updated history array
    });

}, [activeLogId]); // Dependency is correct

  // --- Render ---
  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-900 text-gray-100">
      <Sidebar
        commandHistory={commandHistory}
        activeLogId={activeLogId}
        onNewTask={handleNewTask}
        onSelectLog={handleSelectLog}
        onDeleteLog={handleDeleteLog}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <ChatArea
           key={activeLogId || 'no-log-selected'} // Key is important for re-rendering ChatArea on log change
           messages={activeLogMessages}
           onSendMessage={addMessageToActiveLog}
           setThreadIdForLog={setThreadIdForLog}
           chatId={activeLogId}
           activeThreadId={getActiveThreadId()}
           onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
           activeChatTitle={activeLogTitle}
           // Determine loading state more accurately: true only during the very initial mount before load effect finishes?
           // Or maybe simpler: just rely on chatId being null initially.
           // isLoading={!activeLogId && commandHistory.length === 0} // This might be briefly true even if history loads empty. Let's remove.
           isLoading={false} // We handle the "no chat selected" state directly in ChatArea
       />
    </div>
  );
}

export default App;