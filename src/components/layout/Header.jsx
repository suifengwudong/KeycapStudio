import React, { useState } from 'react';
import * as THREE from 'three';
import { KeycapSTLExporter } from '../../core/export/STLExporter';
import { useKeycapStore } from '../../store/keycapStore';
import { asyncGenerator } from '../../core/geometry/generatorInstance';

const stlExporter = new KeycapSTLExporter();

export default function Header() {
  const params = useKeycapStore(state => state.params);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSTL = async () => {
    setIsExporting(true);
    try {
      const result = await asyncGenerator.generateAsync({
        profile: params.profile,
        size: params.size,
        hasStem: params.hasStem,
        topRadius: params.topRadius,
        wallThickness: params.wallThickness,
      });

      if (!result) {
        alert('生成失败，请重试');
        return;
      }

      const mesh = new THREE.Mesh(result.geometry, result.material);
      const filename = `${params.profile}-${params.size}.stl`;
      stlExporter.export(mesh, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
      <h1 className="text-xl font-bold">🎮 Keycap Studio</h1>
      <div className="flex space-x-4">
        <button 
          onClick={handleExportSTL}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isExporting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
          )}
          {isExporting ? '生成中...' : 'Export STL'}
        </button>
      </div>
    </header>
  );
}
