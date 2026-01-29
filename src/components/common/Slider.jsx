import React, { useState, useEffect } from 'react';

export default function Slider({ label, min, max, step, value, onChange, unit }) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // 当外部value改变时（比如重置），同步localValue，但如果正在拖动则不干扰
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const handleChange = (e) => {
    setLocalValue(parseFloat(e.target.value));
    setIsDragging(true);
  };

  const handleCommit = () => {
    setIsDragging(false);
    if (localValue !== value) {
        onChange(localValue);
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm">{label}</label>
        <span className="text-sm text-gray-400">
            {localValue}{unit}
            {isDragging && <span className="ml-2 text-xs text-yellow-500">●</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="w-full"
      />
    </div>
  );
}

