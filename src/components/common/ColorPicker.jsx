import React from 'react';

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="flex items-center space-x-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border-none p-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm font-mono"
      />
    </div>
  );
}
