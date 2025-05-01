import React from 'react';

// --- NEW ICONS ---
// Icon for New Task Button (Using a Plus for simplicity)
const NewTaskIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

// Icon for Delete Button (Trash Can - unchanged is fine)
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

// App Icon (Gear for robotics/tasks)
const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-teal-400"> {/* Changed color */}
      <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.855a1.5 1.5 0 0 1-1.415 1.415l-2.033.171c-.904.076-1.567.83-1.567 1.732v3.582c0 .902.663 1.656 1.567 1.732l2.033.171a1.5 1.5 0 0 1 1.415 1.415l.178 2.033c.076.904.83 1.567 1.732 1.567h3.582c.902 0 1.656-.663 1.732-1.567l.171-2.033a1.5 1.5 0 0 1 1.415-1.415l2.033-.171c.904-.076 1.567-.83 1.567-1.732V8.582c0-.902-.663-1.656-1.567-1.732l-2.033-.171a1.5 1.5 0 0 1-1.415-1.415l-.171-2.033c-.076-.904-.83-1.567-1.732-1.567h-3.582ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" clipRule="evenodd" />
    </svg>
);


// Renamed props to match App.jsx
function Sidebar({ commandHistory = [], activeLogId, onNewTask, onSelectLog, onDeleteLog }) { // Added default for commandHistory

  // Helper to format date (unchanged, but applies to command logs)
  const formatDateHeading = (timestamp) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
      // Fallback for invalid dates if needed
      if (isNaN(date.getTime())) return "Unknown Date";
      return date.toLocaleDateString();
  };

  // Group command logs by date
  const groupedLogs = commandHistory.reduce((acc, log) => {
    // Ensure log and createdAt exist, provide a fallback time if needed
    const timestamp = log?.createdAt || Date.now();
    const dateKey = formatDateHeading(timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    // Make sure log has an id and title, provide fallbacks
    acc[dateKey].push({
        id: log?.id || `unknown-${Math.random()}`,
        title: log?.title || 'Untitled Log',
        createdAt: timestamp // keep original or fallback timestamp
    });
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedLogs).sort((a, b) => {
      // Handle potential "Unknown Date" group
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Yesterday") return -1;
      if (b === "Yesterday") return 1;
      // Attempt date comparison, fallback if not standard date strings
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB - dateA; // Sort recent dates first
      }
      // Fallback sort: keep unknown dates or handle specific order
      if (a === "Unknown Date") return 1; // Put Unknown last
      if (b === "Unknown Date") return -1;
      return a.localeCompare(b); // Alphabetical for other keys
  });


  return (
    // Added a subtle gradient background for a more 'tech' feel
    <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-gray-300 flex flex-col h-full flex-shrink-0 border-r border-gray-700/50">
      {/* Top Section: New Task */}
      <div className="p-3 flex justify-between items-center border-b border-gray-700/50">
         <div className="flex items-center gap-2">
            <AppIcon />
            {/* Changed Title */}
            <span className="text-base font-semibold text-gray-100">Task History</span>
         </div>
         <button
            // Use the new task handler
            onClick={onNewTask}
            // Changed styles slightly, maybe different accent color
            className="p-2 rounded-md text-gray-300 hover:text-teal-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150"
            // Updated labels
            aria-label="New Task"
            title="New Task"
         >
           {/* Use the new icon */}
           <NewTaskIcon />
         </button>
      </div>

      {/* Command History List */}
      <div className="flex-grow overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* Updated empty state message */}
        {commandHistory.length === 0 && (
            <p className="text-sm text-gray-500 px-3 text-center mt-4">No tasks yet. Issue your first command!</p>
        )}
        {/* Render grouped command logs */}
        {sortedGroupKeys.map(groupKey => (
           <div key={groupKey}>
             <h3 className="text-xs text-gray-500 uppercase font-semibold mb-2 px-3">{groupKey}</h3>
             <ul className="space-y-1">
               {groupedLogs[groupKey].map(log => (
                 <li key={log.id} className="relative group">
                   {/* ****** CHANGE HERE: Use DIV instead of BUTTON ****** */}
                   <div
                        role="button" // Accessibility: informs assistive tech this is interactive
                        tabIndex={0} // Accessibility: makes it keyboard focusable
                        onClick={() => onSelectLog(log.id)}
                        // Accessibility: Allow activation with Enter/Space keys
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectLog(log.id); } }}
                        className={`w-full text-left flex items-center justify-between text-sm px-3 py-2 rounded-md truncate transition-colors duration-150 cursor-pointer focus:outline-none ${ // Add cursor-pointer and basic focus style
                            activeLogId === log.id
                            ? 'bg-gray-700 text-white font-medium shadow-inner' // Added inner shadow for active state
                            : 'text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/60' // Hover and Focus styles for non-active
                        }`}
                    >
                      {/* Display log title */}
                      <span className="flex-1 truncate pr-8 pointer-events-none"> {/* Increased padding-right to avoid overlap; pointer-events-none helps ensure div click */}
                        {log.title}
                      </span>
                      {/* Delete button (remains a button, positioned absolutely) */}
                      <button
                        onClick={(e) => {
                            e.stopPropagation(); // IMPORTANT: Prevent triggering the div's onClick
                            if (window.confirm(`Are you sure you want to delete the task log "${log.title}"? This cannot be undone.`)) {
                                onDeleteLog(log.id); // Use the delete log handler
                            }
                        }}
                        // Adjusted visibility/styling slightly
                        className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all duration-150 z-10" // Ensure button is clickable (z-index)
                        // Updated labels
                        aria-label="Delete task log"
                        title="Delete task log"
                      >
                          <DeleteIcon />
                      </button>
                    {/* ****** CHANGE HERE: Close DIV instead of BUTTON ****** */}
                    </div>
                 </li>
               ))}
             </ul>
           </div>
        ))}

      </div>
      {/* Footer removed */}
    </div>
  );
}

export default Sidebar;