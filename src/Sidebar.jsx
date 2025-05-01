import React from 'react';

// Icon for New Chat Button
const NewChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

// Icon for Delete Button (Optional)
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


// Placeholder for logo/app icon
const AppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-400">
      <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
    </svg>
);


function Sidebar({ chatHistory, activeChatId, onNewChat, onSelectChat, onDeleteChat }) {

  // Helper to format date (optional)
  const formatDateHeading = (timestamp) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
      // Could add more logic for "Previous 7 Days", "Previous 30 Days" etc.
      return date.toLocaleDateString(); // Default date format
  };

  // Group chats by date (optional, for better organization)
  // This is a basic example; more robust grouping might be needed
  const groupedChats = chatHistory.reduce((acc, chat) => {
    const dateKey = formatDateHeading(chat.createdAt || Date.now()); // Use creation time or fallback
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(chat);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedChats).sort((a, b) => {
      // Sort groups logically: Today > Yesterday > Older Dates
      if (a === "Today") return -1;
      if (b === "Today") return 1;
      if (a === "Yesterday") return -1;
      if (b === "Yesterday") return 1;
      return new Date(b) - new Date(a); // Sort older dates descending
  });


  return (
    <div className="w-64 bg-gray-900 text-gray-300 flex flex-col h-full flex-shrink-0 border-r border-gray-700/50">
      {/* Top Section: New Chat */}
      <div className="p-3 flex justify-between items-center border-b border-gray-700/50">
         <div className="flex items-center gap-2">
            <AppIcon />
            <span className="text-base font-semibold text-gray-100">History</span>
         </div>
         <button
            onClick={onNewChat}
            className="p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors duration-150"
            aria-label="New Chat"
            title="New Chat"
         >
           <NewChatIcon />
         </button>
      </div>

      {/* Chat History List */}
      <div className="flex-grow overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {chatHistory.length === 0 && (
            <p className="text-sm text-gray-500 px-3 text-center mt-4">No chats yet. Start a new conversation!</p>
        )}
        {/* Render grouped chats */}
        {sortedGroupKeys.map(groupKey => (
           <div key={groupKey}>
             <h3 className="text-xs text-gray-500 uppercase font-semibold mb-2 px-3">{groupKey}</h3>
             <ul className="space-y-1">
               {groupedChats[groupKey].map(chat => (
                 <li key={chat.id} className="relative group">
                    <button
                        onClick={() => onSelectChat(chat.id)}
                        className={`w-full text-left flex items-center justify-between text-sm px-3 py-2 rounded-md truncate transition-colors duration-150 ${
                            activeChatId === chat.id
                            ? 'bg-gray-700 text-white font-medium'
                            : 'text-gray-300 hover:bg-gray-700/50'
                        }`}
                    >
                      <span className="flex-1 truncate pr-2">{chat.title}</span>
                      {/* Optional: Delete button shown on hover */}
                      <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent chat selection when clicking delete
                            if (window.confirm(`Are you sure you want to delete "${chat.title}"?`)) {
                                onDeleteChat(chat.id);
                            }
                        }}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete chat"
                        title="Delete chat"
                      >
                          <DeleteIcon />
                      </button>
                    </button>
                 </li>
               ))}
             </ul>
           </div>
        ))}

      </div>

      {/* Removed Footer / Upgrade Plan / User Profile */}
    </div>
  );
}

export default Sidebar;