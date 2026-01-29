import React from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Scene3D from './components/canvas/Scene3D';
import PropertyPanel from './components/layout/PropertyPanel';
import { useKeycapStore } from './store/keycapStore';

export default function App() {
  const { currentProfile } = useKeycapStore();

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* 顶部工具栏 */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧功能面板 */}
        <Sidebar />
        
        {/* 中间3D视图 */}
        <main className="flex-1 relative">
          <Scene3D />
        </main>
        
        {/* 右侧属性面板 */}
        <PropertyPanel />
      </div>
    </div>
  );
}
