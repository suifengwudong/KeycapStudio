import { KeycapGenerator } from './KeycapGenerator';

/**
 * 异步键帽生成器
 * 使用 Promise 包装，允许在生成过程中不阻塞渲染
 */
export class AsyncKeycapGenerator {
  constructor() {
    this.generator = new KeycapGenerator();
    this.cache = new Map(); // 缓存已生成的几何体
  }

  /**
   * 异步生成键帽
   * @returns {Promise<{geometry, material}>}
   */
  async generateAsync(params) {
    // 生成缓存键
    const cacheKey = this._getCacheKey(params);

    // ✅ 添加调试日志
    console.log('🔧 生成键帽参数:', {
        profile: params.profile,
        size: params.size,
        topRadius: params.topRadius,
        wallThickness: params.wallThickness,
        hasStem: params.hasStem,
        cacheKey
    });
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log('✅ 使用缓存');
      return this.cache.get(cacheKey);
    }

    // 模拟异步操作（将计算放到下一个事件循环）
    return new Promise((resolve) => {
      // 使用 setTimeout 让出主线程，以便 UI 有机会先渲染"加载中"状态
      setTimeout(() => {
        try {
            const mesh = this.generator.generate(params);
            
            // 为了安全传递，我们提取 geometry 和 material
            // 注意：Geometry 是不能跨线程的（如果我们以后用Worker），但在这里是在主线程
            const result = {
              geometry: mesh.geometry,
              material: mesh.material,
              stemHelp: this.generator.getStemGeometry() // 同时也获取辅助线数据
            };
            
            // 缓存结果 (简单的LRU策略可以在这里实现，目前先无限制)
            this.cache.set(cacheKey, result);
            console.log('✅ 生成完成并缓存');
            
            resolve(result);
        } catch (e) {
            console.error("❌ 几何体生成失败", e);
            resolve(null);
        }
      }, 50); // 稍微延迟一点，确保React有时间渲染Loading状态
    });
  }

  _getCacheKey(params) {
    // 只基于影响几何体的参数生成缓存键
    const { profile, size, hasStem, topRadius, wallThickness } = params;
    // 注意：浮点数可能会有精度问题，实际项目中可能需要通过 toFixed 处理
    return `${profile}-${size}-${hasStem}-${topRadius}-${wallThickness}`;
  }

  clearCache() {
    this.cache.clear();
  }
}
