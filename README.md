# KeycapStudio

> Design keycap legends in 2D, export production-ready PNG / SVG, and generate Cherry MX-compatible STL files for 3D printing — all in one browser-based tool.

---

## V1 – 2D Design Tool (current)

### Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app opens in **2D Design** mode by default.

### Workflow

```
New / Open  →  Set preset + style  →  Edit legends  →  Position  →  Export
```

1. **New / Open project** — use the toolbar to create a fresh keycap or load an existing `.keycap` file.
2. **Choose a size preset** — Inspector → *Size Preset*: `1u`, `1.25u`, `1.5u`, `2u`, `Shift (2.25u)`, `Enter (2.25u)`.
3. **Set style** — background colour, outline toggle + colour + thickness slider.
4. **Edit legends** — four legend slots: *Main*, *Top-Left*, *Bottom-Right*, *Left*.  
   Each can be independently enabled/disabled with its own text, colour, font, and font size.
5. **Position legends** — drag legend handles on the canvas, use **Arrow keys** (1 px nudge) or **Shift+Arrows** (8 px nudge), or type exact X/Y fractions in the inspector.  
   Click *Center main legend* to snap the main legend to the keycap centre.
6. **Zoom** — scroll wheel on canvas, or use the `+` / `−` / `Reset` controls in the canvas corner.
7. **Save** — *Save* button downloads a `.keycap` JSON file (see [File Format](#file-format)).
8. **Export** — *Export ▾* dropdown:
   - **PNG 2× / 4×** (opaque or transparent background)
   - **SVG** (opaque or transparent background)

### Undo / Redo

Full undo/redo history (up to 100 steps) for all edits: text, position, colours, preset changes.  
Click **↩ Undo** / **↪ Redo** in the toolbar, or use `Ctrl+Z` / `Ctrl+Y`.

### Autosave & Crash Recovery

The app autosaves your project to `localStorage` every 30 seconds.  
On the next launch, if an unsaved autosave is detected, you will be offered the option to restore it.

### 3D Preview

Switch to **3D Preview** mode with the mode toggle in the top-right corner to see the Cherry Profile 3D model and export an STL for 3D printing.

---

## File Format

Projects are saved as **`.keycap`** files — plain UTF-8 JSON.

```json
{
  "version": 1,
  "keycap": {
    "preset": "1u",
    "bgColor": "#e0e0e0",
    "outlineEnabled": true,
    "outlineColor": "#555555",
    "outlineThickness": 2
  },
  "legends": {
    "main":        { "enabled": true,  "text": "A",  "x": 0,    "y": 0,    "font": "Arial", "fontSize": 24, "color": "#111111" },
    "topLeft":     { "enabled": false, "text": "",   "x": -0.3, "y": -0.3, "font": "Arial", "fontSize": 11, "color": "#111111" },
    "bottomRight": { "enabled": false, "text": "",   "x": 0.3,  "y": 0.3,  "font": "Arial", "fontSize": 11, "color": "#111111" },
    "left":        { "enabled": false, "text": "",   "x": -0.3, "y": 0,    "font": "Arial", "fontSize": 11, "color": "#111111" }
  }
}
```

| Field | Description |
|---|---|
| `version` | Schema version (currently `1`) |
| `keycap.preset` | Size preset key (`1u`, `1.25u`, `1.5u`, `2u`, `Shift`, `Enter`) |
| `keycap.bgColor` | Background fill colour (hex) |
| `keycap.outlineEnabled` | Whether to draw an outline stroke |
| `keycap.outlineColor` | Outline stroke colour (hex) |
| `keycap.outlineThickness` | Stroke thickness in canvas pixels |
| `legends.<slot>.x` / `.y` | Position offset from centre, as fraction of keycap width/height (range −0.5 … +0.5) |

A sample project is provided in [`examples/demo.keycap`](examples/demo.keycap).

---

## Export Behaviour

| Format | Scale | Dimensions (1u) |
|---|---|---|
| PNG 2× | ×2 | 108 × 108 px |
| PNG 4× | ×4 | 216 × 216 px |
| SVG | ×1 (vector) | 54 × 54 px viewBox |

Dimensions scale proportionally with the preset's `widthUnits`:

| Preset | Width units | PNG 2× width |
|---|---|---|
| 1u | 1.0 | 108 px |
| 1.25u | 1.25 | 135 px |
| 1.5u | 1.5 | 162 px |
| 2u | 2.0 | 216 px |
| Shift / Enter | 2.25 | 243 px |

---

## Running Tests

```bash
npm test
```

Tests cover: model serialisation round-trip, undo/redo stack, export dimension calculations, and SVG generation correctness.

---

## V0 – 3D STL Generator (original)

> 在浏览器中实时预览并导出 STL。**3D 预览与 STL 导出完全解耦：调参时仅运行轻量外壳计算，CSG 仅在点击 Export STL 时触发。**

Switch to **3D Preview** mode in the app to access the original 3D tool.

### 功能范围（3D 模式）

- ✅ Cherry Profile 键帽几何体生成（梯形轮廓 + 顶部球面内凹）
- ✅ Cherry MX 十字轴孔（4.15 × 1.35 mm，深 4.0 mm）
- ✅ 多尺寸支持（1u / 1.25u / 1.5u / 1.75u / 2u / 2.25u / 2.75u / 6.25u / ISO-Enter）
- ✅ 导出 STL（二进制格式）

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | React 18 + Tailwind CSS |
| 2D 预览 | HTML5 Canvas |
| 3D 渲染 | Three.js + @react-three/fiber |
| CSG 布尔运算 | three-csg-ts |
| 状态管理 | Zustand |
| 测试 | Vitest |
| 构建工具 | Vite |

---

## 项目结构

```
src/
├── components/
│   ├── canvas/
│   │   ├── KeycapCanvas2D.jsx   # 2D canvas (drag, zoom, nudge)
│   │   ├── Scene3D.jsx          # Three.js 3D canvas
│   │   └── Keycap.jsx           # 3D keycap mesh
│   ├── layout/
│   │   ├── DesignHeader.jsx     # V1 toolbar (new/open/save/export/undo/redo)
│   │   └── ...
│   └── panels/
│       ├── InspectorPanel.jsx   # V1 left panel (preset/style/legends/font/position)
│       └── ParameterEditor.jsx  # 3D parameter editor
├── constants/
│   └── profiles.js              # Cherry/SA/DSA/OEM profile data & size table
├── core/
│   ├── export/
│   │   ├── PNGExporter.js       # PNG export (2×/4×, optional transparent bg)
│   │   ├── SVGExporter.js       # SVG export
│   │   ├── STLExporter.js       # STL export (3D mode)
│   │   └── export.test.js       # Export dimension + SVG tests
│   ├── geometry/                # 3D geometry generators
│   ├── io/
│   │   └── projectIO.js         # Open/save .keycap files + autosave
│   └── model/
│       ├── projectModel.js      # V1 data model + serialisation
│       └── projectModel.test.js # Model tests
├── store/
│   ├── projectStore.js          # V1 Zustand store (undo/redo, autosave)
│   ├── projectStore.test.js     # Undo/redo tests
│   └── keycapStore.js           # 3D parameter store
└── ...
examples/
└── demo.keycap                  # Sample project file
```

---

## 里程碑

- [x] **v0.1** 基础几何体生成（Cherry 1u，含轴孔）
- [x] **v0.2** 参数化 UI + LRU 缓存
- [x] **v0.3** STL 导出闭环 + README 完善
- [x] **v0.4** 预览/导出解耦（无 CSG 实时预览 + 按需 CSG 导出）
- [x] **v1.0** 2D 设计工具：尺寸预设、样式、图例、字体、位置、PNG/SVG 导出、.keycap 文件格式、撤销/重做、自动保存

