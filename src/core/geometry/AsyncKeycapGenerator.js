import { OptimizedKeycapGenerator } from './OptimizedKeycapGenerator';

/**
 * 异步键帽生成器
 * 使用优化的生成器 + LRU 缓存
 */
export class AsyncKeycapGenerator {
  constructor() {
    this.generator = new OptimizedKeycapGenerator();
    this.cache = new Map();
    this.maxCacheSize = 15; // 最多缓存15个几何体
  }

  /**
   * 异步生成预览键帽（跳过 CSG，速度快）
   */
  async generatePreviewAsync(params) {
    const cacheKey = 'preview-' + this._getCacheKey(params);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const mesh = this.generator.generatePreview(params);

          const result = {
            geometry: mesh.geometry,
            material: mesh.material,
            stemHelp: this.generator.getStemGeometry()
          };

          this._addToCache(cacheKey, result);
          resolve(result);
        } catch (error) {
          console.error(' 预览生成失败:', error);
          resolve(null);
        }
      }, 10);
    });
  }

  /**
   * 异步生成键帽
   */
  async generateAsync(params) {
    const cacheKey = this._getCacheKey(params);
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log(' 使用缓存:', cacheKey);
      return this.cache.get(cacheKey);
    }

    console.log(' 生成新几何体:', cacheKey);

    // 使用 requestIdleCallback 或 setTimeout 让出主线程
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        try {
          const mesh = this.generator.generate(params);
          
          const result = {
            geometry: mesh.geometry,
            material: mesh.material,
            stemHelp: this.generator.getStemGeometry()
          };
          
          // 缓存管理（LRU）
          this._addToCache(cacheKey, result);
          
          resolve(result);
        } catch (error) {
          console.error(' 几何体生成失败:', error);
          resolve(null);
        }
      }, 10); // 延迟 10ms 确保 UI 先更新
    });
  }

  /**
   * 添加到缓存（LRU 策略）
   */
  _addToCache(key, value) {
    // 如果已存在，先删除（确保 LRU 顺序）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 添加新项
    this.cache.set(key, value);

    // 超出容量时删除最旧的
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      console.log(' 清理缓存:', firstKey);
    }
  }

  /**
   * 生成缓存键
   */
  _getCacheKey(params) {
    const { profile, size, hasStem, topRadius, wallThickness } = params;
    
    // 使用 toFixed 避免浮点数精度问题
    const radius = typeof topRadius === 'number' ? topRadius.toFixed(2) : topRadius;
    const thickness = typeof wallThickness === 'number' ? wallThickness.toFixed(2) : wallThickness;
    
    return `${profile}-${size}-${hasStem}-${radius}-${thickness}`;
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
    console.log(' 缓存已清空');
  }

  /**
   * 设置性能模式
   */
  setPerformanceMode(mode) {
    this.generator.setPerformanceMode(mode);
  }
}
