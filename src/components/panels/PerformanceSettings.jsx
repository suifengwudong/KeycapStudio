import React from 'react';
import { asyncGenerator } from '../canvas/Keycap';

export default function PerformanceSettings() {
  const [mode, setMode] = React.useState('balanced');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    asyncGenerator.setPerformanceMode(newMode);
    asyncGenerator.clearCache(); // 清除缓存以应用新设置
  };

  return (
    <div className="p-4 border-t border-gray-700">
      <h3 className="text-sm font-bold mb-2 text-white">性能模式</h3>
      <div className="space-y-2">
        {[
          { value: 'fast', label: '快速', desc: '低细节，高性能' },
          { value: 'balanced', label: '平衡', desc: '推荐设置' },
          { value: 'quality', label: '质量', desc: '高细节，较慢' }
        ].map(option => (
          <label 
            key={option.value}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded"
          >
            <input
              type="radio"
              name="performance"
              value={option.value}
              checked={mode === option.value}
              onChange={(e) => handleModeChange(e.target.value)}
              className="text-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-200">{option.label}</div>
              <div className="text-xs text-gray-400">{option.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
