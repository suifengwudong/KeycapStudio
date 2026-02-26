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

  // 拖动时实时触发 onChange（预览为无 CSG 轻量计算，足够快）
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    setLocalValue(newValue);
    setIsDragging(true);
    onChange(newValue);
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
        onMouseUp={() => setIsDragging(false)}
        onTouchEnd={() => setIsDragging(false)}
        className="w-full"
      />
    </div>
  );
}

