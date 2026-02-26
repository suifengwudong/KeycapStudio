import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useKeycapStore = create(
  persist(
    (set, get) => ({
      // 当前键帽参数
      params: {
        profile: 'Cherry',
        size: '1u',
        color: '#ffffff',
        text: 'A',
        fontSize: 14,
        textDepth: 0.5,
        topRadius: 0.5,
        wallThickness: 1.5,
        hasStem: true,
        
        // 表面处理
        texture: 'smooth', // smooth, matte, glossy, textured
        pattern: null,     // 图案ID
      },

      // 更新参数
      updateParams: (newParams) => 
        set((state) => ({ 
          params: { ...state.params, ...newParams } 
        })),

      // 重置为默认值
      resetParams: () => 
        set(() => ({ 
          params: get().defaultParams 
        })),

      // 默认参数
      defaultParams: {
        profile: 'Cherry',
        size: '1u',
        color: '#ffffff',
        // ...
      },

      // 当前键帽几何体引用（非持久化，用于STL导出）
      currentGeometry: null,
      setCurrentGeometry: (geometry) => set({ currentGeometry: geometry }),

      // 性能统计（非持久化）
      performanceStats: { fps: 60, frameTime: '16.67' },
      setPerformanceStats: (stats) => set({ performanceStats: stats }),
    }),
    {
      name: 'keycap-storage', // LocalStorage key
      partialize: (state) => ({ params: state.params })
    }
  )
);
