import React from 'react';
import { useKeycapStore } from '../../store/keycapStore';
import Slider from '../common/Slider';
import ColorPicker from '../common/ColorPicker';
import PerformanceSettings from './PerformanceSettings';
import { PROFILES, KEYCAP_SIZES } from '../../constants/profiles';

export default function ParameterEditor() {
  const { params, updateParams } = useKeycapStore();

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-bold">基础参数</h3>
      
      {/* 键帽高度 */}
      <div>
        <label className="block text-sm mb-2">键帽高度</label>
        <select 
          value={params.profile}
          onChange={(e) => updateParams({ profile: e.target.value })}
          className="w-full bg-gray-800 rounded px-3 py-2"
        >
          {Object.keys(PROFILES).map(key => (
            <option key={key} value={key}>
              {PROFILES[key].name}
            </option>
          ))}
        </select>
      </div>

      {/* 键帽大小 */}
      <div>
        <label className="block text-sm mb-2">键帽大小</label>
        <select 
          value={params.size}
          onChange={(e) => updateParams({ size: e.target.value })}
          className="w-full bg-gray-800 rounded px-3 py-2"
        >
          {Object.keys(KEYCAP_SIZES).map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </div>

      {/* 颜色选择 */}
      <div>
        <label className="block text-sm mb-2">颜色</label>
        <ColorPicker
          value={params.color}
          onChange={(color) => updateParams({ color })}
        />
      </div>

      {/* 圆角半径 */}
      <Slider
        label="顶部圆角"
        min={0.1}
        max={3.0}
        step={0.1}
        value={params.topRadius}
        onChange={(value) => updateParams({ topRadius: value })}
        unit="mm"
      />

      {/* 壁厚 */}
      <Slider
        label="壁厚"
        min={0.8}
        max={3.5}
        step={0.1}
        value={params.wallThickness}
        onChange={(value) => updateParams({ wallThickness: value })}
        unit="mm"
      />

      {/* 是否包含十字轴 */}
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={params.hasStem}
          onChange={(e) => updateParams({ hasStem: e.target.checked })}
          className="mr-2"
        />
        <label className="text-sm">包含Cherry MX轴孔</label>
      </div>
    </div>
  );
}
