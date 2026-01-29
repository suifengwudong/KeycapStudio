import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { PrintValidator } from './PrintValidator';

export class KeycapSTLExporter {
  constructor() {
    this.exporter = new STLExporter();
    this.validator = new PrintValidator();
  }

  /**
   * 导出键帽为STL文件
   * @param {THREE.Object3D} keycapMesh - 键帽网格对象
   * @param {string} filename - 文件名
   * @param {boolean} binary - 是否使用二进制格式
   */
  export(keycapMesh, filename = 'keycap.stl', binary = true) {
    // 1. 验证可打印性
    const validation = this.validator.validate(keycapMesh);
    
    if (!validation.isPrintable) {
      console.error('模型存在问题:', validation.errors);
      alert(`无法导出：\n${validation.errors.join('\n')}`);
      return;
    }

    // 2. 生成STL
    const result = this.exporter.parse(keycapMesh, { binary });

    // 3. 触发下载
    const blob = new Blob([result], { 
      type: binary ? 'application/octet-stream' : 'text/plain' 
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // 4. 显示打印建议
    console.log('打印参数建议:', validation.suggestions);
  }
}
