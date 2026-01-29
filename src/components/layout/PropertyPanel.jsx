import React from 'react';
import ParameterEditor from '../panels/ParameterEditor';

export default function PropertyPanel() {
  return (
    <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Properties</h2>
      </div>
      <ParameterEditor />
    </aside>
  );
}
