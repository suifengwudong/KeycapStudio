import * as THREE from 'three';
import { PROFILES } from '../../constants/profiles';

/**
 * 键帽生成器类
 * 负责根据参数生成键帽的3D几何体
 */
export class KeycapGenerator {
  /**
   * @param {Object} params - 键帽参数
   * @param {string} params.profile - 键帽高度（Cherry/SA/DSA/OEM）
   * @param {string} params.size - 键帽大小（1u/1.5u/2u等）
   * @param {number} params.height - 键帽高度(mm)
   * @param {number} params.topRadius - 顶部圆角半径
   * @param {boolean} params.hasStem - 是否包含十字轴
   */
  generate(params) {
    const {
      profile = 'Cherry',
      size = '1u',
      height = 11.5,
      topRadius = 0.5,
      hasStem = true
    } = params;

    // TODO: 实现逻辑
    // 1. 创建底部形状（正方形，考虑键帽大小）
    // 2. 创建顶部形状（根据profile曲线生成）
    // 3. 使用ExtrudeGeometry或Loft连接顶底
    // 4. 添加倒角和圆角
    // 5. 如果hasStem，减去十字轴孔

    const keycapMesh = this._createKeycapBody(params);
    
    if (hasStem) {
      const stem = this._createStem();
      // 布尔运算：keycap - stem
    }

    return keycapMesh;
  }

  _createKeycapBody(params) {
    // TODO: 实现键帽主体生成
    // 使用LatheGeometry或自定义几何体
    
    const points = this._getProfilePoints(params.profile, params.height);
    const geometry = new THREE.LatheGeometry(points, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    return new THREE.Mesh(geometry, material);
  }

  _getProfilePoints(profile, height) {
    // TODO: 根据profile类型返回轮廓点
    // Cherry: 球面
    // SA: 圆柱面
    // DSA: 球面低矮
    
    const profileData = PROFILES[profile];
    return profileData.generatePoints(height);
  }

  _createStem() {
    // TODO: 创建Cherry MX十字轴
    // 尺寸: 4mm x 4mm, 中心十字 1.27mm x 4mm
    
    const stemGeometry = new THREE.BoxGeometry(4, 4, 5);
    // 减去十字孔...
    
    return new THREE.Mesh(stemGeometry);
  }
}
