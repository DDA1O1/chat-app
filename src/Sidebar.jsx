import React from 'react';

// --- Icons --- (Assuming they are correct and imported/defined)
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const NewTaskIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
const AppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-teal-400"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.855a1.5 1.5 0 0 1-1.415 1.415l-2.033.171c-.904.076-1.567.83-1.567 1.732v3.582c0 .902.663 1.656 1.567 1.732l2.033.171a1.5 1.5 0 0 1 1.415 1.415l.178 2.033c.076.904.83 1.567 1.732 1.567h3.582c.902 0 1.656-.663 1.732-1.567l.171-2.033a1.5 1.5 0 0 1 1.415-1.415l2.033-.171c.904-.076 1.567-.83 1.567-1.732V8.582c0-.902-.663-1.656-1.567-1.732l-2.033-.171a1.5 1.5 0 0 1-1.415-1.415l-.171-2.033c-.076-.904-.83-1.567-1.732-1.567h-3.582ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" clipRule="evenodd" /></svg>);
// --- End Icons ---

function Sidebar({ commandHistory = [], activeLogId, onNewTask, onSelectLog, onDeleteLog, isSidebarOpen, setIsSidebarOpen }) {

  // --- Grouping and Sorting Logic --- (No changes here)

  const formatDateHeading = (timestamp) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp detected in formatDateHeading:", timestamp);
        return "Unknown Date";
    }
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === yesterday.getTime()) return "Yesterday";
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const groupedLogs = React.useMemo(() => {
     try {
        return commandHistory.reduce((acc, log) => {
          if (!log || typeof log !== 'object') {
            console.warn("Skipping invalid item in commandHistory:", log);
            return acc;
          }
          const timestamp = log.createdAt && !isNaN(new Date(log.createdAt).getTime()) ? log.createdAt : Date.now();
          const dateKey = formatDateHeading(timestamp);
          if (typeof dateKey !== 'string') {
              console.error("formatDateHeading returned non-string:", dateKey, "for timestamp:", timestamp);
              return acc;
          }
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push({
              id: log.id || `fallback-id-${Math.random()}`,
              title: log.title || 'Untitled Task',
              createdAt: timestamp
          });
          return acc;
        }, {});
     } catch (error) {
         console.error("Error during command history grouping:", error);
         return {};
     }
  }, [commandHistory]);

  const sortedGroupKeys = React.useMemo(() => {
      if (!groupedLogs || typeof groupedLogs !== 'object') {
          console.error("Cannot sort keys, groupedLogs is not a valid object:", groupedLogs);
          return [];
      }
      try {
          return Object.keys(groupedLogs).sort((a, b) => {
             const getDateValue = (key) => {
                 if (key === "Today") { const today = new Date(); return today.setHours(0, 0, 0, 0); }
                 if (key === "Yesterday") { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); return yesterday.setHours(0, 0, 0, 0); }
                 if (key === "Unknown Date") { return Infinity; }
                 const date = new Date(key);
                 if (!isNaN(date.getTime())) { return date.setHours(0,0,0,0); }
                 console.warn("Could not parse date key for sorting:", key);
                 return Infinity;
             };
             const valueA = getDateValue(a);
             const valueB = getDateValue(b);
             if (valueA === Infinity && valueB === Infinity) return 0;
             if (valueA === Infinity) return 1;
             if (valueB === Infinity) return -1;
             return valueB - valueA;
          });
      } catch (error) {
          console.error("Error during group key sorting:", error);
          return Object.keys(groupedLogs);
      }
  }, [groupedLogs]);

  // --- UI Rendering --- (Focusing on Tailwind classes for responsiveness)
  return (
    <>
      {/* Overlay for Mobile - No changes needed here, logic is sound */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden" // md:hidden ensures it's only for mobile
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-gray-300 flex flex-col h-full border-r border-gray-700/50
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
                    md:relative md:translate-x-0 md:flex-shrink-0 md:z-auto`} // Core responsive logic: fixed/sliding on mobile, relative/static on desktop
        role="navigation"
        aria-label="Task History Navigation"
      >
        {/* Top Section */}
        <div className="p-3 flex justify-between items-center border-b border-gray-700/50 flex-shrink-0">
           {/* App Icon and Title */}
           <div className="flex items-center gap-2 overflow-hidden"> {/* Added overflow-hidden for safety */}
              <AppIcon />
              <span className="text-base font-semibold text-gray-100 truncate"> {/* Added truncate */}
                Task History
              </span>
           </div>
           {/* Buttons */}
           <div className='flex items-center gap-1'>
                {/* New Task Button - Styling seems ok */}
                <button
                    onClick={() => onNewTask()}
                    className="p-2 rounded-md text-gray-300 hover:text-teal-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150"
                    aria-label="New Task"
                    title="New Task"
                >
                    <NewTaskIcon />
                </button>
                {/* Close Button for Mobile - md:hidden ensures it only shows on mobile */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
                    aria-label="Close Menu"
                    title="Close Menu"
                 >
                    <CloseIcon />
                 </button>
           </div>
        </div>

        {/* Command History List */}
        <div className="flex-grow overflow-y-auto px-2 py-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-800/50">
          {/* Empty State - Styling seems ok */}
          {sortedGroupKeys.length === 0 && (
              <p className="text-sm text-gray-500 px-3 text-center mt-4">
                {commandHistory.length === 0 ? "No tasks yet. Start a new one!" : "Could not display task history."}
              </p>
          )}

          {/* Map over sorted keys - Ensure keys are valid */}
          {sortedGroupKeys.map(groupKey => (
             groupKey && groupedLogs[groupKey] && (
                 <div key={groupKey}>
                   {/* Group Heading - Styling seems ok */}
                   <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1.5 px-3">{groupKey}</h3>
                   <ul className="space-y-0.5">
                     {/* Map over logs in the group - Ensure logs are valid */}
                     {Array.isArray(groupedLogs[groupKey]) && groupedLogs[groupKey].map(log => (
                       <li key={log.id} className="relative group mx-1"> {/* Use unique log.id */}
                         <div
                              role="button"
                              tabIndex={0}
                              onClick={() => log.id && onSelectLog(log.id)}
                              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && log.id) { e.preventDefault(); onSelectLog(log.id); } }}
                              // Responsive styling for list items (padding, text size)
                              className={`w-full text-left flex items-center justify-between text-sm px-3 py-2 rounded-md truncate transition-all duration-150 ease-in-out cursor-pointer focus:outline-none ${
                                  activeLogId === log.id
                                  ? 'bg-gray-700 text-white font-medium shadow-inner' // Active state
                                  : 'text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/60 focus:text-white' // Inactive state
                              }`}
                               aria-current={activeLogId === log.id ? 'page' : undefined}
                          >
                            {/* Log Title - truncate ensures it doesn't overflow */}
                            <span className="flex-1 truncate pr-8 pointer-events-none">
                              {log.title || 'Untitled Task'}
                            </span>
                            {/* Delete button - Positioned absolutely, appears on hover/focus */}
                            <button
                              onClick={(e) => {
                                  e.stopPropagation(); // Prevent selecting the log when clicking delete
                                  if (log.id && window.confirm(`Are you sure you want to delete the task log "${log.title || 'Untitled Task'}"? This cannot be undone.`)) {
                                      onDeleteLog(log.id);
                                  }
                              }}
                              // Styling ensures it's hidden until group hover/focus
                              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-opacity duration-150 z-10"
                              aria-label={`Delete task log: ${log.title || 'Untitled Task'}`}
                              title="Delete task log"
                              disabled={!log.id} // Safety disable if ID is missing
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