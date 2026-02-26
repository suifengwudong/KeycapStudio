/**
 * 打印验证器 - 轻量提示系统
 * 注意：此验证器仅提供建议性 warnings，不保证 watertight，不阻塞导出。
 */
export class PrintValidator {
  validate(mesh) {
    const errors = [];
    const warnings = [];

    // 仅在 mesh/geometry 不存在时报错（真正的硬错误）
    if (!mesh || !mesh.geometry) {
      errors.push('模型几何体缺失，无法导出');
      return { isPrintable: false, errors, warnings, suggestions: [] };
    }

    // 以下为提示性 warnings（不阻塞导出）
    // 壁厚检查为静态提示，不做实际几何分析
    warnings.push(...this._checkBasicGeometry(mesh));

    return {
      isPrintable: true, // 只要 mesh 存在就允许导出
      errors,
      warnings,
      suggestions: this.getSuggestions(mesh)
    };
  }

  _checkBasicGeometry(mesh) {
    const warnings = [];
    const geo = mesh.geometry;
    if (geo && geo.attributes.position && geo.attributes.position.count === 0) {
      warnings.push('几何体顶点数为0，模型可能为空');
    }
    return warnings;
  }

  isWatertight(mesh) {
    // 暂未实现封闭性检查，保留接口
    return true;
  }

  getMinWallThickness(mesh) {
    // 暂未实现壁厚检查，保留接口
    return 1.5;
  }

  getSuggestions(mesh) {
    return ['建议使用光固化打印以获得最佳细节'];
  }
}
