import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-4">
      {/* Icons for different tools */}
      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600">
        🛠️
      </div>
      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600">
        🎨
      </div>
      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600">
        🤖
      </div>
    </aside>
  );
}
