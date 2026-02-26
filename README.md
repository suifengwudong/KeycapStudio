# KeycapStudio

> Design keycap legends in 2D, export production-ready PNG / SVG, and compose 3D models with a node-based CSG tree for STL printing — all in one browser-based tool.

---

## V1 – 2D Design Tool

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

---

## 3D Modeling Mode

Switch to **3D Modeling** mode with the toggle in the top-right corner.

### Layout

| Panel | Description |
|-------|-------------|
| **Outliner** (left) | Node tree — add, select, and delete nodes |
| **Viewport** (centre) | Interactive 3D preview (orbit/pan/zoom) |
| **Inspector** (right) | Edit the selected node's parameters and transform |

### Workflow

```
Add nodes  →  Edit params  →  Arrange  →  Save Scene  →  Export STL
```

1. **Add nodes** — click the buttons in the Outliner toolbar:
   - **+ Keycap** — Cherry MX-compatible keycap (wraps the existing generator)
   - **+ Box / Cyl / Sphere** — primitive shapes (mm units)
   - **+ Bool** — Boolean subtraction node (drag children into it)
   - **+ Group** — group of nodes
2. **Edit parameters** — select a node and edit in the Inspector: dimensions, colour, profile/size (keycaps), boolean operation type.
3. **Transform** — set Position and Rotation directly in the Inspector (mm / radians).
4. **Save Scene** — downloads a `.kcs3d.json` file.
5. **Open Scene** — load a previously saved `.kcs3d.json` file.
6. **Export STL** — runs the full CSG export pipeline (via `three-csg-ts`) and downloads a binary STL.

### Pipelines

| Pipeline | Trigger | Behaviour |
|----------|---------|-----------|
| **Preview** | Real-time in viewport | No CSG; Boolean nodes show children overlaid (second operand ghosted) |
| **Export** | *Export STL* button | Full CSG evaluation; produces watertight merged mesh |

### Performance Notes

- The preview pipeline never runs CSG, so it stays fast regardless of tree depth.
- Keycap nodes use the same LRU-cached async generator as the original 3D preview.
- CSG export is synchronous on the main thread; complex scenes with many Boolean ops may take a few seconds.

---

## File Formats

### `.kcs.json` — Unified project file *(new in v1.2)*

A single self-contained file that embeds **both** the 3D shape parameters and
the 2D legend data.  Produced and consumed by `kcsDocument.js` / `kcsIO.js`.

```json
{
  "format": "kcs",
  "version": 1,
  "name": "Demo – A key",
  "shape3d": {
    "engine": "keycap-param-v1",
    "params": {
      "profile": "Cherry",
      "size": "1u",
      "color": "#2563eb",
      "text": "A",
      "fontSize": 14,
      "textDepth": 0.5,
      "topRadius": 0.5,
      "wallThickness": 1.5,
      "hasStem": true,
      "texture": "smooth",
      "pattern": null
    }
  },
  "legend2d": {
    "keycap": {
      "preset": "1u",
      "bgColor": "#2563eb",
      "outlineEnabled": true,
      "outlineColor": "#1d4ed8",
      "outlineThickness": 2
    },
    "legends": {
      "main":        { "enabled": true,  "text": "A", "x": 0,     "y": 0,     "font": "Arial", "fontSize": 24, "color": "#ffffff" },
      "topLeft":     { "enabled": false, "text": "",  "x": -0.28, "y": -0.28, "font": "Arial", "fontSize": 11, "color": "#111111" },
      "bottomRight": { "enabled": false, "text": "",  "x":  0.28, "y":  0.28, "font": "Arial", "fontSize": 11, "color": "#111111" },
      "left":        { "enabled": false, "text": "",  "x": -0.3,  "y":  0,    "font": "Arial", "fontSize": 11, "color": "#111111" }
    }
  }
}
```

| Top-level field | Description |
|-----------------|-------------|
| `format` | Always `"kcs"` |
| `version` | Schema version (currently `1`) |
| `name` | Human-readable project name |
| `shape3d.engine` | Always `"keycap-param-v1"` |
| `shape3d.params` | Flat keycap geometry parameters (profile, size, color, texture, …) |
| `legend2d.keycap` | 2D style: preset, bgColor, outline settings |
| `legend2d.legends` | Four legend slots: main, topLeft, bottomRight, left |

A complete example is in [`examples/demo.kcs.json`](examples/demo.kcs.json).

The helper functions `buildKcsDocument`, `extractShape3dParams`, and
`extractLegend2dProject` (in `kcsDocument.js`) convert between a KCS document
and the individual store objects (`keycapStore.params` / `projectStore.project`).

---

### `.keycap` — 2D legend project

Plain UTF-8 JSON; produced/consumed by the 2D Design mode.

```json
{
  "version": 1,
  "keycap": { "preset": "1u", "bgColor": "#e0e0e0", "outlineEnabled": true, ... },
  "legends": {
    "main":        { "enabled": true,  "text": "A",  "x": 0, "y": 0, "font": "Arial", "fontSize": 24, "color": "#111111" },
    "topLeft":     { "enabled": false, "text": "",   "x": -0.3, "y": -0.3, ... },
    "bottomRight": { "enabled": false, "text": "",   "x":  0.3, "y":  0.3, ... },
    "left":        { "enabled": false, "text": "",   "x": -0.3, "y":  0,   ... }
  }
}
```

### `.kcs3d.json` — 3D scene document

Plain UTF-8 JSON; produced/consumed by the 3D Modeling mode.  
Units are **millimetres** throughout.

```json
{
  "version": 1,
  "format": "kcs3d",
  "name": "My Scene",
  "root": {
    "id": "root",
    "type": "Group",
    "name": "Scene",
    "children": [
      {
        "id": "keycap-1",
        "type": "KeycapTemplate",
        "name": "Main Keycap",
        "params": {
          "profile": "Cherry", "size": "1u", "color": "#2563eb",
          "hasStem": true, "topRadius": 0.5, "wallThickness": 1.5
        },
        "position": [0, 0, 0],
        "rotation": [0, 0, 0]
      },
      {
        "id": "bool-1",
        "type": "Boolean",
        "name": "Boolean (subtract)",
        "operation": "subtract",
        "children": [
          {
            "id": "box-1", "type": "Primitive", "name": "Box",
            "primitive": "box",
            "params": { "width": 20, "height": 10, "depth": 20 },
            "material": { "color": "#6b7280" },
            "position": [0, 0, 0], "rotation": [0, 0, 0]
          },
          {
            "id": "cyl-1", "type": "Primitive", "name": "Drill",
            "primitive": "cylinder",
            "params": { "radiusTop": 4, "radiusBottom": 4, "height": 15, "radialSegments": 32 },
            "material": { "color": "#ef4444" },
            "position": [0, 0, 0], "rotation": [0, 0, 0]
          }
        ],
        "position": [-30, 0, 0], "rotation": [0, 0, 0]
      }
    ],
    "position": [0, 0, 0],
    "rotation": [0, 0, 0]
  }
}
```

#### Node types

| `type` | Description | Extra fields |
|--------|-------------|--------------|
| `KeycapTemplate` | Cherry MX keycap (uses generator) | `params`: profile, size, color, hasStem, topRadius, wallThickness |
| `Primitive` | Box / Cylinder / Sphere | `primitive`, `params`, `material.color` |
| `Boolean` | CSG union / subtract / intersect | `operation`, `children[]` |
| `Group` | Container | `children[]` |

All nodes share `id`, `name`, `position [x,y,z]`, `rotation [x,y,z]` (radians).

A complete example is in [`examples/example.kcs3d.json`](examples/example.kcs3d.json).

---

## Export Behaviour (2D)

| Format | Scale | Dimensions (1u) |
|---|---|---|
| PNG 2× | ×2 | 108 × 108 px |
| PNG 4× | ×4 | 216 × 216 px |
| SVG | ×1 (vector) | 54 × 54 px viewBox |

---

## Running Tests

```bash
npm test
```

Tests cover:

| File | Coverage |
|------|----------|
| `projectModel.test.js` | 2D model serialisation, presets |
| `sceneDocument.test.js` | 3D scene model, node factories, tree helpers, round-trip |
| `kcsDocument.test.js` | Unified `.kcs.json` format, validation, round-trip, conversions |
| `export.test.js` | Export dimension calculations, SVG generation |
| `projectStore.test.js` | Undo/redo stack, autosave |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + Tailwind CSS |
| 2D preview | HTML5 Canvas |
| 3D rendering | Three.js + @react-three/fiber + @react-three/drei |
| CSG boolean ops | three-csg-ts |
| State management | Zustand |
| Testing | Vitest |
| Build tool | Vite |

---

## Project Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── KeycapCanvas2D.jsx        # 2D canvas
│   │   ├── Scene3D.jsx               # 3D viewport (uses scene store)
│   │   ├── Keycap.jsx                # Single keycap mesh (async gen)
│   │   └── SceneNodeRenderer.jsx     # Renders full scene document tree
│   ├── layout/
│   │   └── DesignHeader.jsx          # Toolbar (mode-aware: 2D / 3D actions)
│   └── panels/
│       ├── InspectorPanel.jsx        # 2D inspector
│       ├── Outliner.jsx              # 3D node tree
│       └── NodeInspector.jsx         # 3D node parameter editor
├── constants/
│   ├── profiles.js                   # Keycap profile + size data
│   └── cherry.js                     # Cherry MX stem dimensions
├── core/
│   ├── csg/
│   │   └── csgEvaluator.js           # Preview + export pipelines
│   ├── export/
│   │   ├── PNGExporter.js
│   │   ├── SVGExporter.js
│   │   ├── STLExporter.js
│   │   └── export.test.js
│   ├── geometry/
│   │   ├── OptimizedKeycapGenerator.js
│   │   └── AsyncKeycapGenerator.js
│   ├── io/
│   │   ├── projectIO.js
│   │   └── kcsIO.js
│   └── model/
│       ├── projectModel.js           # 2D .keycap format
│       ├── projectModel.test.js
│       ├── sceneDocument.js          # 3D .kcs3d.json format
│       ├── sceneDocument.test.js
│       ├── kcsDocument.js            # Unified .kcs.json format
│       └── kcsDocument.test.js
└── store/
    ├── projectStore.js               # 2D Zustand store (undo/redo)
    ├── projectStore.test.js
    ├── keycapStore.js                # Keycap params + perf stats
    └── sceneStore.js                 # 3D scene Zustand store
examples/
├── demo.keycap                       # Sample 2D project
├── demo.kcs.json                     # Sample unified project
└── example.kcs3d.json               # Sample 3D scene document
```

---

## Milestones

- [x] **v0.1** Basic geometry (Cherry 1u, stem hole)
- [x] **v0.2** Parametric UI + LRU cache
- [x] **v0.3** STL export + README
- [x] **v0.4** Preview/export pipeline split (no-CSG preview)
- [x] **v1.0** 2D design tool: presets, legends, PNG/SVG, `.keycap` format, undo/redo, autosave
- [x] **v1.1** 3D modeling: node-based CSG tree, Outliner, Inspector, `.kcs3d.json` format, STL export
- [x] **v1.2** Unified `.kcs.json` project format: single file embeds `shape3d` (keycap params) + `legend2d` (2D style/legends)


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

