# KeycapStudio

> **小而精**的 Cherry 1u 参数化键帽生成器 — 可在浏览器中实时预览并导出 STL。

---

## 项目定位

KeycapStudio 是一个**单一用途、轻量级**的 3D 键帽参数化生成工具，专注于：

- 生成符合 **Cherry MX 轴座规格**的键帽几何体
- 支持 **Cherry Profile**（主力）及 SA / DSA / OEM（轮廓待完善）
- 在浏览器中实时 3D 预览，参数变化后自动更新模型
- 一键**导出 STL 文件**，可直接送入切片软件（Bambu Studio、Cura 等）打印

**不做的事：** 不做整套键盘布局编辑、不做固件烧录、不做纹理贴图渲染管线、不做 STEP/OBJ 导出。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | React 18 + Tailwind CSS |
| 3D 渲染 | Three.js + @react-three/fiber + @react-three/drei |
| CSG 布尔运算 | three-csg-ts |
| 状态管理 | Zustand（含 localStorage 持久化） |
| 构建工具 | Vite |

---

## 功能范围

### 已实现
- ✅ Cherry Profile 键帽几何体生成（梯形轮廓 + 顶部球面内凹）
- ✅ Cherry MX 十字轴孔（4.15 × 1.35 mm，深 4.0 mm）
- ✅ 参数化壁厚（内腔挖空）
- ✅ 多尺寸支持（1u / 1.25u / 1.5u / 1.75u / 2u / 2.25u / 2.75u / 6.25u / ISO-Enter）
- ✅ 颜色调节（不触发重新生成几何体）
- ✅ LRU 几何体缓存（避免重复 CSG 计算）
- ✅ **导出 STL**（二进制格式，文件名含 profile/size 信息，如 `Cherry-1u.stl`）
- ✅ 3D 轨道相机控制

### 暂不支持
- ⬜ SA / DSA / OEM 精确轮廓（界面可选，几何体尚未定制）
- ⬜ 键帽图例（刻字/UV 打印）
- ⬜ Watertight 验证（导出时仅提示，不阻塞）
- ⬜ Web Worker 多线程生成

---

## 参数说明

| 参数 | 单位 | 范围 | 说明 |
|------|------|------|------|
| `profile` | — | Cherry / SA / DSA / OEM | 键帽轮廓 |
| `size` | — | 1u … 6.25u / ISO-Enter | 键帽横向尺寸 |
| `color` | hex | — | 表面颜色（仅影响材质，不触发 CSG） |
| `topRadius` | mm | 0.1 – 3.0 | 键帽横截面圆角半径（影响底部至顶部全体圆角，数值越大四角越圆润） |
| `wallThickness` | mm | 0.8 – 3.5 | 键帽侧壁厚度（内腔偏移量） |
| `hasStem` | bool | — | 是否包含 Cherry MX 十字轴孔 |

> ⚠️ 参数在生成器入口处会被 clamp 到安全范围，防止 CSG 运算崩溃。

---

## 使用方式

### 在线预览（本地开发）

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173`，左侧/右侧面板调节参数，中间实时显示键帽 3D 模型。

### 导出 STL

1. 等待右侧 3D 视图加载完成（加载中指示消失）
2. 点击顶部右侧 **Export STL** 按钮
3. 浏览器自动下载文件（如 `Cherry-1u.stl`）
4. 用 PrusaSlicer / Bambu Studio / Cura 打开即可切片打印

---

## 项目结构

```
src/
├── components/
│   ├── canvas/
│   │   ├── Scene3D.jsx        # Three.js Canvas 容器
│   │   └── Keycap.jsx         # 键帽组件（异步生成 + 上报 geometry）
│   ├── layout/
│   │   └── Header.jsx         # 顶部工具栏（含 Export STL 按钮）
│   └── panels/
│       └── ParameterEditor.jsx # 参数面板（Slider / ColorPicker）
├── constants/
│   └── profiles.js            # Cherry/SA/DSA/OEM 轮廓数据 & 尺寸表
├── core/
│   ├── export/
│   │   ├── STLExporter.js     # 导出入口（调用 Three.js STLExporter）
│   │   └── PrintValidator.js  # 轻量提示系统（warnings，不阻塞导出）
│   └── geometry/
│       ├── OptimizedKeycapGenerator.js  # ✅ 唯一权威几何生成器
│       ├── AsyncKeycapGenerator.js      # 异步包装 + LRU 缓存
│       └── legacy/
│           └── KeycapGenerator.js       # 旧版生成器（已废弃，仅供参考）
├── store/
│   └── keycapStore.js         # Zustand store（params + currentGeometry）
└── workers/
    └── KeycapGeneratorCore.js # Worker 版本（实验性）
```

> **唯一几何生成路径：** `Keycap.jsx` → `AsyncKeycapGenerator` → `OptimizedKeycapGenerator`

---

## 已知限制

1. **非 Watertight**：CSG 运算生成的网格不保证完全封闭，部分切片软件需要开启"修复网格"选项。
2. **SA / DSA / OEM 轮廓**：目前使用与 Cherry 相同的几何体生成，轮廓差异尚未实现。
3. **大尺寸键帽（≥2.25u）**：CSG 耗时较长（200–800ms），页面短暂卡顿属正常现象。
4. **浏览器兼容**：需要 WebGL2 支持（Chrome 90+ / Firefox 90+ / Safari 15+）。

---

## 里程碑

- [x] **v0.1** 基础几何体生成（Cherry 1u，含轴孔）
- [x] **v0.2** 参数化 UI + LRU 缓存
- [x] **v0.3** STL 导出闭环 + README 完善
- [ ] **v0.4** SA / DSA / OEM 轮廓精化
- [ ] **v0.5** 键帽图例（文字刻印）
- [ ] **v1.0** Web Worker 生成 + 完整测试覆盖

