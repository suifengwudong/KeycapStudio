import React from 'react';

export default function Slider({ label, min, max, step, value, onChange, unit }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm">{label}</label>
        <span className="text-sm text-gray-400">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
