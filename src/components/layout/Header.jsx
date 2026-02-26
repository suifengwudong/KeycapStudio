import React from 'react';
import * as THREE from 'three';
import { KeycapSTLExporter } from '../../core/export/STLExporter';
import { useKeycapStore } from '../../store/keycapStore';

const stlExporter = new KeycapSTLExporter();

export default function Header() {
  const currentGeometry = useKeycapStore(state => state.currentGeometry);
  const params = useKeycapStore(state => state.params);

  const handleExportSTL = () => {
    if (!currentGeometry) {
      alert('键帽尚未生成，请稍等...');
      return;
    }
    const material = new THREE.MeshStandardMaterial();
    const mesh = new THREE.Mesh(currentGeometry, material);
    const filename = `${params.profile}-${params.size}.stl`;
    stlExporter.export(mesh, filename);
  };

  return (
    <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
      <h1 className="text-xl font-bold">🎮 Keycap Studio</h1>
      <div className="flex space-x-4">
        <button 
          onClick={handleExportSTL}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Export STL
        </button>
      </div>
    </header>
  );
}
