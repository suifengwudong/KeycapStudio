# KeycapStudio

> Design keycap legends in 2D, export production-ready PNG / SVG, and compose 3D models with a node-based CSG tree for STL printing — all in one browser-based tool.

---

## V1.3 – Performance & Bundle Optimisation

### What's new in V1.3

- **Bundle splitting** — the three.js / @react-three stack is now in a dedicated `three-vendor` chunk so the browser can cache it independently; the main app chunk shrank from ~1,100 kB to ~50 kB.
- **Lazy-loaded 3D viewport** — `Scene3D`, `Outliner`, and `NodeInspector` are loaded on demand; users who only work in 2D mode never download the 3D code.
- **Off-thread STL export** — CSG evaluation and STL serialisation now run in a dedicated Web Worker (`stlExportWorker.js`), keeping the UI responsive during heavy geometry operations. A transparent main-thread fallback ensures compatibility in environments where workers are unavailable.
- **Streamlined toolbar** — the redundant `2D Design / 3D Modeling` toggle was removed; the step-navigation buttons (`← Back: Shape` / `Next: Legends →`) and the stage indicator (`1 Shape → 2 Legends → 3 Export`) are the single, authoritative way to move between modes.

---

## V1.1 – Unified 3D Shape → 2D Legends → Export Workflow

### Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app opens in **3D Shape** mode (Step 1).

### Closed-loop workflow: 3D Shape → 2D Legends → Export Package

```
1 Shape (3D)  →  2 Legends (2D)  →  3 Export Package
```

1. **1 Shape** — Configure 3D keycap geometry in the 3D inspector:
   - Choose profile (Cherry, SA, DSA, OEM), size, color, stem hole, etc.
   - Click **Next: Legends →** to proceed to step 2.
2. **2 Legends** — Switch to the 2D design editor:
   - The 2D canvas automatically resizes to match the 3D size preset.
   - Edit four legend slots (Main, Top-Left, Bottom-Right, Left).
   - Click **← Back: Shape** to return to 3D if needed.
3. **Export Package** — Click the **Export Package** button (always visible):
   - Downloads three files in sequence: `.stl` (3D print), `.png` (4× scale), `.svg` (vector).
   - All files share the same base name: `{preset}_{legend}.stl/png/svg`.

### Size presets (V1.1)

| Preset | Width | Physical width |
|--------|-------|---------------|
| `1u`    | 1.0u  | 18.0 mm |
| `1.25u` | 1.25u | 22.5 mm |
| `1.5u`  | 1.5u  | 27.0 mm |
| `1.75u` | 1.75u | 31.5 mm |
| `2u`    | 2.0u  | 36.0 mm |
| `2.25u` | 2.25u | 40.5 mm *(canonical; replaces Shift/Enter aliases)* |
| `6.25u` | 6.25u | 112.5 mm |
| `7u`    | 7.0u  | 126.0 mm |

> **ISO Enter note:** ISO Enter is approximated as a **2.25u rectangular** keycap.
> When you select ISO Enter in the 3D inspector, the 2D canvas automatically
> switches to the `2.25u` preset and shows a "⚠ ISO Enter（矩形近似）" notice.

### File formats

| Format | Used for |
|--------|---------|
| `.kcs.json` | **Unified project file** — embeds 3D shape params + 2D legend data |
| `.keycap` | Legacy 2D-only project (still importable) |

### Autosave & Crash Recovery

The app autosaves the entire `.kcs.json` project (including `uiContext`) to `localStorage` (key: `kcs_autosave_v1`).
- **On-change writes** use `requestIdleCallback` to avoid blocking the main thread.
- A **30-second interval** provides an additional safety net.

On the next launch, if an unsaved autosave is detected, you will be offered the option to restore it.  
Restoration also recovers the last active mode (2D/3D) and the selected legend slot.

---

## 3D Modeling Mode

Enter 3D modeling by clicking **Next: Legends →** in the toolbar from step 1, or by clicking **← Back: Shape** when in 2D mode.

### Layout

| Panel | Description |
|-------|-------------|
| **Outliner** (left) | Node tree — add, select, and delete nodes |
| **Viewport** (centre) | Interactive 3D preview (orbit/pan/zoom) |
| **Inspector** (right) | Edit the selected node's parameters and transform |

### Workflow

```
Add nodes  →  Edit params  →  Arrange  →  Save Project  →  Export STL
```

1. **Add nodes** — click the buttons in the Outliner toolbar:
   - **+ Keycap** — Cherry MX-compatible keycap (wraps the existing generator)
   - **+ Box / Cyl / Sphere** — primitive shapes (mm units)
   - **+ Bool** — Boolean subtraction node (drag children into it)
   - **+ Group** — group of nodes
2. **Edit parameters** — select a node and edit in the Inspector: dimensions, colour, profile/size (keycaps), boolean operation type.
3. **Transform** — set Position and Rotation directly in the Inspector (mm / radians).
4. **Export STL** — runs the CSG export pipeline in a **background Web Worker** and downloads a binary STL without blocking the UI.

### Pipelines

| Pipeline | Trigger | Behaviour |
|----------|---------|-----------|
| **Preview** | Real-time in viewport | No CSG; Boolean nodes show children overlaid (second operand ghosted) |
| **Export** | *Export STL* button | Full CSG evaluation in Web Worker; produces watertight merged mesh |

### Performance Notes

- The preview pipeline never runs CSG, so it stays fast regardless of tree depth.
- STL export runs in a dedicated Web Worker (`stlExportWorker.js`), keeping the UI fully responsive during heavy keycap generation and CSG boolean operations.
- A transparent main-thread fallback is used if workers are unavailable.

---

## File Formats

### `.kcs.json` — Unified project file *(V1.1)*

A single self-contained file that embeds **both** the 3D shape parameters and
the 2D legend data, plus minimal UI context.  Produced and consumed by `kcsDocument.js` / `kcsIO.js`.

```json
{
  "format": "kcs",
  "version": 1,
  "asset": { "name": "Demo – A key" },
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
  },
  "uiContext": { "mode": "2d", "selectedLegend": "main" }
}
```

| Top-level field | Description |
|-----------------|-------------|
| `format` | Always `"kcs"` |
| `version` | Schema version (currently `1`) |
| `asset.name` | Human-readable project name |
| `shape3d.engine` | Always `"keycap-param-v1"` |
| `shape3d.params` | Flat keycap geometry parameters (profile, size, color, texture, …) |
| `legend2d.keycap` | 2D style: preset, bgColor, outline settings |
| `legend2d.legends` | Four legend slots: main, topLeft, bottomRight, left |
| `uiContext.mode` | Last active mode: `"3d"` or `"2d"` (restored on crash recovery) |
| `uiContext.selectedLegend` | Last selected legend slot (restored on crash recovery) |

A complete example is in [`examples/demo.kcs.json`](examples/demo.kcs.json).

---

### `.keycap` — 2D legend project (legacy)

Plain UTF-8 JSON; still importable via **Legacy ▾ → Import .keycap**.

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

---

## Export Behaviour (2D)

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
| 2.25u | 2.25 | 243 px |

---

## Running Tests

```bash
npm test
```

Tests cover:

| File | Coverage |
|------|----------|
| `projectModel.test.js` | 2D model serialisation, presets, normalisePreset |
| `sceneDocument.test.js` | 3D scene model, node factories, tree helpers, round-trip |
| `kcsDocument.test.js` | Unified `.kcs.json` format, validation, round-trip, conversions |
| `sizeMapping.test.js` | 3D size → 2D preset mapping, ISO Enter approximation |
| `filename.test.js` | Export filename sanitization and naming rules |
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
| Off-thread export | Web Worker (`stlExportWorker.js`) |
| Testing | Vitest |
| Build tool | Vite |

---

## Project Structure

```
src/
├── App.jsx                           # Root: lazy-loads 3D components, autosave
├── components/
│   ├── canvas/
│   │   ├── KeycapCanvas2D.jsx        # 2D canvas
│   │   ├── Scene3D.jsx               # 3D viewport (lazy-loaded)
│   │   ├── Keycap.jsx                # Single keycap mesh
│   │   └── SceneNodeRenderer.jsx     # Renders full scene document tree
│   ├── common/
│   │   ├── Slider.jsx                # Shared slider input
│   │   ├── ColorPicker.jsx           # Shared color picker
│   │   └── ExportOverlay.jsx         # Blocking overlay during export
│   ├── layout/
│   │   └── DesignHeader.jsx          # Toolbar: step nav, file ops, export
│   └── panels/
│       ├── InspectorPanel.jsx        # 2D inspector (lazy-loaded)
│       ├── Outliner.jsx              # 3D node tree (lazy-loaded)
│       └── NodeInspector.jsx         # 3D node parameter editor (lazy-loaded)
├── constants/
│   ├── profiles.js                   # Keycap profile + size data
│   └── cherry.js                     # Cherry MX stem dimensions
├── core/
│   ├── csg/
│   │   └── csgEvaluator.js           # Preview + export pipelines; dispatches to worker
│   ├── export/
│   │   ├── PNGExporter.js
│   │   ├── SVGExporter.js
│   │   ├── STLExporter.js
│   │   ├── exportPackage.js          # One-click STL + PNG + SVG bundle
│   │   └── export.test.js
│   ├── geometry/
│   │   ├── OptimizedKeycapGenerator.js
│   │   └── AsyncKeycapGenerator.js
│   ├── io/
│   │   ├── projectIO.js
│   │   ├── kcsIO.js
│   │   └── filename.js               # Export filename generation
│   └── model/
│       ├── projectModel.js           # 2D .keycap format
│       ├── sceneDocument.js          # 3D node types and tree helpers
│       ├── kcsDocument.js            # Unified .kcs.json format
│       └── sizeMapping.js            # 3D size ↔ 2D preset mapping
├── hooks/
│   └── useExportController.js        # Export lifecycle state
├── store/
│   ├── assetStore.js                 # Master .kcs.json document store
│   ├── projectStore.js               # 2D Zustand store (undo/redo)
│   ├── keycapStore.js                # 3D keycap params + perf stats
│   └── sceneStore.js                 # 3D scene node tree store
└── workers/
    ├── KeycapGeneratorCore.js        # (legacy reference worker stub)
    └── stlExportWorker.js            # Off-thread CSG evaluation + STL serialisation
examples/
├── demo.keycap                       # Sample 2D project
└── demo.kcs.json                     # Sample unified project
```

---

## Pain Points & Roadmap

The following known limitations shape the upcoming milestone plan:

| # | Pain Point | Status |
|---|-----------|--------|
| 1 | **Preview ≠ Export** — stem hole and emboss text are invisible in the 3D preview (CSG only runs at export). | ✅ Fixed in v1.4 |
| 2 | **Single-key focus** — the app designs and previews one key at a time. There is no view showing all keys in a real keyboard layout together. | Planned v2.0 |
| 3 | **Legend UI confusion** — "Step 2: Legends" edits the *printed label* on a single keycap (4 text slots: Main / Top-Left / Bottom-Right / Left). It is **not** a full keyboard layout tool. | Planned v2.0 |
| 4 | **Emboss font locked** — only Helvetiker Bold is available for 3D emboss text. | Planned v2.2 |
| 5 | **No cross-section or wireframe view** — impossible to inspect inner geometry (wall thickness, stem post) in the 3D preview without exporting. | Planned v2.3 |

---

## Milestones

- [x] **v0.1** Basic geometry (Cherry 1u, stem hole)
- [x] **v0.2** Parametric UI + LRU cache
- [x] **v0.3** STL export + README
- [x] **v0.4** Preview/export pipeline split (no-CSG preview)
- [x] **v1.0** 2D design tool: presets, legends, PNG/SVG, `.keycap` format, undo/redo, autosave
- [x] **v1.1** 3D modeling: node-based CSG tree, Outliner, Inspector, STL export
- [x] **v1.2** Unified `.kcs.json` project format: single file embeds `shape3d` + `legend2d`
- [x] **v1.3** Performance: bundle splitting, lazy 3D loading, off-thread STL export worker, unified step navigation
- [x] **v1.4** Preview fidelity: immediate geometry on first frame (no async placeholder); stem hole cross indicator visible in 3D viewport; emboss text rendered as a 3D overlay in preview
- [ ] **v2.0** Keyboard layout view: place multiple keycap nodes in a standard keyboard arrangement and preview the full layout in 3D
- [ ] **v2.1** Full keyboard export: batch-generate and download the complete layout as individual STL + PNG files
- [ ] **v2.2** Font management: upload custom TTF/OTF for emboss text; live font preview in the 3D viewport
- [ ] **v2.3** Section / wireframe view: inspect inner geometry (wall thickness, stem post) without needing an STL export

