import React from 'react';

// --- Icons --- (Assuming they are correct and imported/defined)
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const NewTaskIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const AppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-teal-400"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.855a1.5 1.5 0 0 1-1.415 1.415l-2.033.171c-.904.076-1.567.83-1.567 1.732v3.582c0 .902.663 1.656 1.567 1.732l2.033.171a1.5 1.5 0 0 1 1.415 1.415l.178 2.033c.076.904.83 1.567 1.732 1.567h3.582c.902 0 1.656-.663 1.732-1.567l.171-2.033a1.5 1.5 0 0 1 1.415-1.415l2.033-.171c.904-.076 1.567-.83 1.567-1.732V8.582c0-.902-.663-1.656-1.567-1.732l-2.033-.171a1.5 1.5 0 0 1-1.415-1.415l-.171-2.033c-.076-.904-.83-1.567-1.732-1.567h-3.582ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" clipRule="evenodd" /></svg>);
// --- End Icons ---

function Sidebar({ commandHistory = [], activeLogId, onNewTask, onSelectLog, onDeleteLog, isSidebarOpen, setIsSidebarOpen }) {

  // --- Grouping and Sorting Logic ---

  // **Robust formatDateHeading Implementation**
  const formatDateHeading = (timestamp) => {
    const date = new Date(timestamp);
    // Check for invalid date right at the beginning
    if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp detected in formatDateHeading:", timestamp);
        return "Unknown Date"; // Provide a consistent fallback key
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Set hours to 0 to compare dates only, avoids time zone issues affecting date comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === yesterday.getTime()) return "Yesterday";

    // Use a consistent, sortable format if needed, or a readable one
    // Example readable format:
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    // Example sortable format (YYYY-MM-DD):
    // return date.toISOString().split('T')[0];
  };

  // **Robust Grouping with Error Handling**
  const groupedLogs = React.useMemo(() => {
     // Use useMemo to avoid recalculating on every render unless commandHistory changes
     try {
        return commandHistory.reduce((acc, log) => {
          // **DEFENSIVE CHECK 1: Skip null/undefined log items**
          if (!log || typeof log !== 'object') {
            console.warn("Skipping invalid item in commandHistory:", log);
            return acc; // **CRUCIAL: Always return the accumulator**
          }

          // Use fallback if createdAt is missing or invalid
          const timestamp = log.createdAt && !isNaN(new Date(log.createdAt).getTime()) ? log.createdAt : Date.now();
          const dateKey = formatDateHeading(timestamp);

          // **DEFENSIVE CHECK 2: Ensure dateKey is a string** (formatDateHeading should guarantee this now)
          if (typeof dateKey !== 'string') {
              console.error("formatDateHeading returned non-string:", dateKey, "for timestamp:", timestamp);
              return acc; // Skip if the key is invalid
          }

          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }

          // Push log data, ensuring critical fields have fallbacks
          acc[dateKey].push({
              id: log.id || `fallback-id-${Math.random()}`, // **CRITICAL: Ensure every log has an ID for keys/selection**
              title: log.title || 'Untitled Task',
              createdAt: timestamp // Keep the calculated timestamp
          });

          return acc; // **CRUCIAL: Ensure accumulator is returned at the end**
        }, {}); // Initial value is an empty object
     } catch (error) {
         console.error("Error during command history grouping:", error);
         return {}; // Return an empty object in case of unexpected errors during reduce
     }
  }, [commandHistory]); // Dependency array for useMemo

  // **Robust Sorting with Error Handling**
  const sortedGroupKeys = React.useMemo(() => {
      // **DEFENSIVE CHECK 3: Ensure groupedLogs is an object before getting keys**
      if (!groupedLogs || typeof groupedLogs !== 'object') {
          console.error("Cannot sort keys, groupedLogs is not a valid object:", groupedLogs);
          return []; // Return empty array if groupedLogs is invalid
      }

      try {
          return Object.keys(groupedLogs).sort((a, b) => {
             // Helper to get a comparable value (timestamp or order value) from the date key
             const getDateValue = (key) => {
                 if (key === "Today") {
                     const today = new Date();
                     return today.setHours(0, 0, 0, 0);
                 }
                 if (key === "Yesterday") {
                     const yesterday = new Date();
                     yesterday.setDate(yesterday.getDate() - 1);
                     return yesterday.setHours(0, 0, 0, 0);
                 }
                 if (key === "Unknown Date") {
                     // Sort "Unknown Date" last or first based on preference
                     return Infinity; // Sorts last when comparing numbers
                 }
                 // Attempt to parse the date string key generated by formatDateHeading
                 // This needs to be robust based on the format used in formatDateHeading
                 // If using toLocaleDateString, parsing back can be tricky.
                 // Using ISOString().split('T')[0] (YYYY-MM-DD) in formatDateHeading makes sorting easier.
                 // Assuming a parseable format like default toLocaleDateString or YYYY-MM-DD:
                 const date = new Date(key);
                 if (!isNaN(date.getTime())) {
                     return date.setHours(0,0,0,0); // Compare based on date part
                 }

                 // Fallback for unparsed keys
                 console.warn("Could not parse date key for sorting:", key);
                 return Infinity; // Sort unparseable keys last
             };

             const valueA = getDateValue(a);
             const valueB = getDateValue(b);

             // Sort descending: newest dates first. Infinity (Unknown/Unparsed) goes last.
             if (valueA === Infinity && valueB === Infinity) return 0; // Keep original order if both are unknown
             if (valueA === Infinity) return 1; // a (Infinity) goes after b
             if (valueB === Infinity) return -1; // b (Infinity) goes after a
             return valueB - valueA; // Sort numerically by timestamp (newest first)
          });
      } catch (error) {
          console.error("Error during group key sorting:", error);
          return Object.keys(groupedLogs); // Fallback to unsorted keys on error
      }
  }, [groupedLogs]); // Dependency array for useMemo


  return (
    <>
      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-gray-300 flex flex-col h-full border-r border-gray-700/50
                    transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 md:z-auto
                    ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}
        role="navigation"
        aria-label="Task History Navigation"
      >
        {/* Top Section */}
        <div className="p-3 flex justify-between items-center border-b border-gray-700/50 flex-shrink-0">
           {/* ... AppIcon and Title ... */}
           <div className="flex items-center gap-2">
              <AppIcon />
              <span className="text-base font-semibold text-gray-100">Task History</span>
           </div>
           {/* ... Buttons ... */}
           <div className='flex items-center gap-1'>
                <button
                    onClick={() => onNewTask()}
                    className="p-2 rounded-md text-gray-300 hover:text-teal-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150"
                    aria-label="New Task"
                    title="New Task"
                > <NewTaskIcon /> </button>
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
                    aria-label="Close Menu"
                    title="Close Menu"
                 > <CloseIcon /> </button>
           </div>
        </div>

        {/* Command History List */}
        <div className="flex-grow overflow-y-auto px-2 py-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-800/50">
          {/* **Handle case where commandHistory is empty OR grouping/sorting failed** */}
          {sortedGroupKeys.length === 0 && (
              <p className="text-sm text-gray-500 px-3 text-center mt-4">
                {commandHistory.length === 0 ? "No tasks yet. Start a new one!" : "Could not display task history."}
              </p>
          )}

          {/* Map over sorted keys */}
          {sortedGroupKeys.map(groupKey => (
             // **DEFENSIVE CHECK 4: Ensure groupKey is valid before rendering section**
             groupKey && groupedLogs[groupKey] && (
                 <div key={groupKey}>
                   <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1.5 px-3">{groupKey}</h3>
                   <ul className="space-y-0.5">
                     {/* **DEFENSIVE CHECK 5: Ensure groupedLogs[groupKey] is an array before mapping** */}
                     {Array.isArray(groupedLogs[groupKey]) && groupedLogs[groupKey].map(log => (
                       // **CRITICAL: Use log.id as key, ensure it's unique and exists**
                       <li key={log.id} className="relative group mx-1">
                         <div
                              role="button"
                              tabIndex={0}
                              // **DEFENSIVE CHECK 6: Ensure log.id exists before calling handler**
                              onClick={() => log.id && onSelectLog(log.id)}
                              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && log.id) { e.preventDefault(); onSelectLog(log.id); } }}
                              className={`w-full text-left flex items-center justify-between text-sm px-3 py-2 rounded-md truncate transition-all duration-150 ease-in-out cursor-pointer focus:outline-none ${
                                  activeLogId === log.id
                                  ? 'bg-gray-700 text-white font-medium shadow-inner'
                                  : 'text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/60 focus:text-white'
                              }`}
                               aria-current={activeLogId === log.id ? 'page' : undefined}
                          >
                            <span className="flex-1 truncate pr-8 pointer-events-none">
                              {/* Use fallback title */}
                              {log.title || 'Untitled Task'}
                            </span>
                            {/* Delete button */}
                            <button
                              // **DEFENSIVE CHECK 7: Ensure log.id exists before trying to delete**
                              onClick={(e) => {
                                  e.stopPropagation();
                                  if (log.id && window.confirm(`Are you sure you want to delete the task log "${log.title || 'Untitled Task'}"? This cannot be undone.`)) {
                                      onDeleteLog(log.id);
                                  }
                              }}
                              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-opacity duration-150 z-10"
                              aria-label={`Delete task log: ${log.title || 'Untitled Task'}`}
                              title="Delete task log"
                              disabled={!log.id} // Disable if log.id is missing
                            >
                                <DeleteIcon />
                            </button>
                          </div>
                       </li>
                     ))}
                   </ul>
                 </div>
             )
          ))}
        </div> {/* End Command History List */}
      </div> {/* End Sidebar Container */}
    </>
  );
}

export default Sidebar;