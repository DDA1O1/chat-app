import React from 'react';

// --- Add/Import Icons ---
// Icon for Hamburger Menu (visible on mobile) - Assuming defined elsewhere or here
const MenuIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>);
// Icon for Closing Sidebar (visible on mobile when sidebar is open) - Assuming defined elsewhere or here
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
// Icon for New Task Button (Using a Plus for simplicity)
const NewTaskIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
// Icon for Delete Button (Trash Can)
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>);
// App Icon (Gear)
const AppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-teal-400"><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.855a1.5 1.5 0 0 1-1.415 1.415l-2.033.171c-.904.076-1.567.83-1.567 1.732v3.582c0 .902.663 1.656 1.567 1.732l2.033.171a1.5 1.5 0 0 1 1.415 1.415l.178 2.033c.076.904.83 1.567 1.732 1.567h3.582c.902 0 1.656-.663 1.732-1.567l.171-2.033a1.5 1.5 0 0 1 1.415-1.415l2.033-.171c.904-.076 1.567-.83 1.567-1.732V8.582c0-.902-.663-1.656-1.567-1.732l-2.033-.171a1.5 1.5 0 0 1-1.415-1.415l-.171-2.033c-.076-.904-.83-1.567-1.732-1.567h-3.582ZM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" clipRule="evenodd" /></svg>);
// --- End Icons ---


// Accept isSidebarOpen and setIsSidebarOpen props
function Sidebar({ commandHistory = [], activeLogId, onNewTask, onSelectLog, onDeleteLog, isSidebarOpen, setIsSidebarOpen }) {

  // --- Grouping and Sorting Logic --- (Keep as is)
  const formatDateHeading = (timestamp) => { /* ... */ };
  const groupedLogs = commandHistory.reduce((acc, log) => { /* ... */ }, {});
  const sortedGroupKeys = Object.keys(groupedLogs).sort((a, b) => { /* ... */ });


  return (
    <>
      {/* Overlay for Mobile: closes sidebar on click */}
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
                    ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`} // Apply transform based on state, add shadow when open on mobile
        role="navigation"
        aria-label="Task History Navigation"
      >
        {/* Top Section: New Task & Close Button (for mobile) */}
        <div className="p-3 flex justify-between items-center border-b border-gray-700/50 flex-shrink-0">
           <div className="flex items-center gap-2">
              <AppIcon />
              <span className="text-base font-semibold text-gray-100">Task History</span>
           </div>
           <div className='flex items-center gap-1'>
                {/* New Task Button */}
                <button
                    onClick={() => onNewTask()} // Call onNewTask, which now handles closing sidebar
                    className="p-2 rounded-md text-gray-300 hover:text-teal-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-150"
                    aria-label="New Task"
                    title="New Task"
                >
                    <NewTaskIcon />
                </button>
                {/* Close button - visible only on mobile */}
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white md:hidden" // Hide on medium screens and up
                    aria-label="Close Menu"
                    title="Close Menu"
                 >
                    <CloseIcon />
                </button>
           </div>
        </div>

        {/* Command History List */}
        <div className="flex-grow overflow-y-auto px-2 py-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500 scrollbar-track-gray-800/50">
          {commandHistory.length === 0 && (
              <p className="text-sm text-gray-500 px-3 text-center mt-4">No tasks yet. Issue your first command!</p>
          )}
          {sortedGroupKeys.map(groupKey => (
             <div key={groupKey}>
               <h3 className="text-xs text-gray-500 uppercase font-semibold mb-1.5 px-3">{groupKey}</h3>
               <ul className="space-y-0.5"> {/* Slightly reduced space */}
                 {groupedLogs[groupKey].map(log => (
                   <li key={log.id} className="relative group mx-1"> {/* Added horizontal margin */}
                     <div
                          role="button"
                          tabIndex={0}
                          // Use onSelectLog which now handles closing sidebar
                          onClick={() => onSelectLog(log.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectLog(log.id); } }}
                          className={`w-full text-left flex items-center justify-between text-sm px-3 py-2 rounded-md truncate transition-all duration-150 ease-in-out cursor-pointer focus:outline-none ${
                              activeLogId === log.id
                              ? 'bg-gray-700 text-white font-medium shadow-inner'
                              : 'text-gray-300 hover:bg-gray-700/50 focus:bg-gray-700/60 focus:text-white'
                          }`}
                           aria-current={activeLogId === log.id ? 'page' : undefined} // Accessibility improvement
                      >
                        <span className="flex-1 truncate pr-8 pointer-events-none">
                          {log.title}
                        </span>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete the task log "${log.title}"? This cannot be undone.`)) {
                                  onDeleteLog(log.id);
                              }
                          }}
                          className="absolute right-1.5 top-1/2 transform -translate-y-1/2 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-red-500 transition-opacity duration-150 z-10"
                          aria-label={`Delete task log: ${log.title}`}
                          title="Delete task log"
                        >
                            <DeleteIcon />
                        </button>
                      </div>
                   </li>
                 ))}
               </ul>
             </div>
          ))}

        </div>
      </div>
    </>
  );
}

export default Sidebar;