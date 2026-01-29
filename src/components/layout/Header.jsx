import React from 'react';

export default function Header() {
  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
      <h1 className="text-xl font-bold">🎮 Keycap Studio</h1>
      <div className="flex space-x-4">
        <button className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Export STL</button>
      </div>
    </header>
  );
}
