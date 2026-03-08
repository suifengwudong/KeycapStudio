# KeycapStudio

> Design and export production-ready 3D keycap models (STL) with a clean, single-page browser-based tool.

> If you want to read the Chinese pdf version of this README, please check the file in the `docs/` folder.

---

## V1.4 – Single-Mode Redesign & Indicator Overhaul

### What's new in V1.4

- **2D legend page removed** — the separate 2D legend editor has been deleted. The app is now a single 3D workspace.
- **Legend settings moved to 3D inspector** — text content, text color, font size, and X/Y position for the main legend slot are now edited directly in the right-hand inspector panel alongside shape parameters.
- **Unoccluded dashed-line indicators** — Cherry MX stem hole cross and text emboss area are now drawn using `depthTest: false` / `depthWrite: false` dashed `LineSegments`, guaranteeing they are always visible regardless of camera angle or keycap orientation.
- **i18n module** — Chinese (default) / English language toggle (stored in `localStorage`) via a single-click button in the toolbar.

---

## V1.3 – Performance & Bundle Optimisation

### What's new in V1.3

- **Bundle splitting** — the three.js / @react-three stack is now in a dedicated `three-vendor` chunk so the browser can cache it independently.
- **Lazy-loaded 3D viewport** — `Scene3D` and `NodeInspector` are loaded on demand.
- **Off-thread STL export** — CSG evaluation and STL serialisation run in a dedicated Web Worker (`stlExportWorker.js`).

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The app opens directly in the 3D workspace.

## Workflow

```
Configure shape  →  Set legend text  →  Export STL / Package
```

1. **Shape** — configure in the right-hand inspector:
   - Profile (Cherry, SA, DSA, OEM), size, color, top radius, wall thickness, height, dish depth.
   - Sizes include: `1u`, `1.25u`, `1.5u`, `1.75u`, `2u`, `2.25u`, `2.75u`, `6.25u`, **`ISO-Enter`** (22.5 × 27 mm rectangular).
   - Toggle **Cherry MX stem hole** — a dashed orange cross (always-visible indicator) shows the hole location.
   - Toggle **Text Emboss** — a dashed outline shows the approximate text area in the preview.
2. **Legend text** — in the **Legend Text** section of the inspector:
   - Set text, color, font size, and X/Y position for the main label.
3. **Export** — toolbar buttons:
   - **Export STL** — single STL via background Web Worker.
   - **Batch Export** — export multiple sizes at once.
   - **Export Package** — downloads `.stl` + `.png` + `.svg` in sequence.

## Size presets

| Preset | Width | Depth | Physical size |
|--------|-------|-------|--------------|
| `1u`       | 1.0u  | 1u    | 18.0 × 18.0 mm |
| `1.25u`    | 1.25u | 1u    | 22.5 × 18.0 mm |
| `1.5u`     | 1.5u  | 1u    | 27.0 × 18.0 mm |
| `1.75u`    | 1.75u | 1u    | 31.5 × 18.0 mm |
| `2u`       | 2.0u  | 1u    | 36.0 × 18.0 mm |
| `2.25u`    | 2.25u | 1u    | 40.5 × 18.0 mm |
| `2.75u`    | 2.75u | 1u    | 49.5 × 18.0 mm |
| `6.25u`    | 6.25u | 1u    | 112.5 × 18.0 mm |
| `ISO-Enter`| —     | —     | 22.5 × 27.0 mm *(non-symmetric)* |

## File formats

| Format | Used for |
|--------|---------|
| `.kcs.json` | **Unified project file** — 3D shape params + legend data |
| `.keycap` | Legacy 2D-only project (still importable via **Legacy ▾**) |

## Autosave & Crash Recovery

The app autosaves to `localStorage` (key: `kcs_autosave_v1`). On the next launch, if an autosave is detected, you will be offered the option to restore it.

---

## 3D Workspace

### Layout

| Panel | Description |
|-------|-------------|
| **Viewport** (main) | Interactive 3D preview — orbit / pan / zoom |
| **Inspector** (right) | Shape params, emboss, and legend text settings |

### Indicators (dashed overlay)

| Indicator | Description |
|-----------|-------------|
| Orange `+` cross | Cherry MX stem hole location (when enabled) |
| Dashed rectangle | Text emboss area (when emboss is enabled) |

Both indicators use `depthTest: false` so they are always rendered on top of the keycap body.

---

## File Formats

### `.kcs.json` — Unified project file

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
      "color": "#c8dff0",
      "topRadius": 0.5,
      "wallThickness": 1.5,
      "hasStem": true,
      "embossEnabled": false,
      "embossText": "",
      "embossFontSize": 5,
      "embossDepth": 1.0,
      "embossColor": "#222222"
    }
  },
  "legend2d": {
    "keycap": { "preset": "1u", "bgColor": "#c8dff0", "outlineEnabled": true, "outlineColor": "#a0b8c8", "outlineThickness": 2 },
    "legends": {
      "main": { "enabled": true, "text": "A", "x": 0, "y": 0, "font": "Arial", "fontSize": 24, "color": "#ffffff" }
    }
  }
}
```

---

### `.keycap` — 2D legend project (legacy)

Plain UTF-8 JSON; still importable via **Legacy ▾ → Import .keycap**.

---

## Export Behaviour

| Format | Description |
|--------|-------------|
| STL    | Binary STL from CSG pipeline (Web Worker) |
| PNG 2× / 4× | Rasterised keycap face image |
| SVG    | Vector keycap face image |

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
| `sizeMapping.test.js` | 3D size → 2D preset mapping, ISO Enter |
| `filename.test.js` | Export filename sanitization and naming rules |
| `export.test.js` | Export dimension calculations, SVG generation |
| `projectStore.test.js` | Undo/redo stack, autosave |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + Tailwind CSS |
| 3D rendering | Three.js + @react-three/fiber + @react-three/drei |
| CSG boolean ops | three-csg-ts |
| State management | Zustand |
| Off-thread export | Web Worker (`stlExportWorker.js`) |
| i18n | Custom store (`langStore.js`, `translations.js`) |
| Testing | Vitest |
| Build tool | Vite |

---

## Project Structure

```
src/
├── App.jsx                           # Root: lazy-loads 3D components, autosave
├── i18n/
│   └── translations.js               # zh / en string tables
├── store/
│   ├── langStore.js                  # Language preference (default zh)
│   ├── projectStore.js               # Legend/keycap 2D data
│   ├── sceneStore.js                 # 3D scene document
│   └── assetStore.js                 # Unified .kcs.json asset
├── components/
│   ├── canvas/
│   │   ├── Scene3D.jsx               # 3D viewport (lazy-loaded)
│   │   └── SceneNodeRenderer.jsx     # Renders scene document tree + dashed indicators
│   ├── common/
│   │   ├── LangSwitcher.jsx          # 中 / EN toggle button
│   │   ├── Slider.jsx
│   │   ├── ColorPicker.jsx
│   │   └── ExportOverlay.jsx
│   ├── layout/
│   │   └── DesignHeader.jsx          # Toolbar: file ops, export buttons
│   └── panels/
│       ├── KeycapInspector.jsx       # Shape + emboss + legend text params
│       └── NodeInspector.jsx         # Auto-selects keycap node, renders inspector
├── core/
│   ├── geometry/
│   │   └── OptimizedKeycapGenerator.js  # ExtrudeGeometry + CSG keycap generator
│   ├── csg/
│   │   └── csgEvaluator.js           # CSG tree → STL (Web Worker)
│   ├── export/
│   │   ├── PNGExporter.js
│   │   ├── SVGExporter.js
│   │   ├── exportPackage.js
│   │   └── batchExport.js
│   ├── io/
│   │   ├── kcsIO.js                  # .kcs.json open/save/autosave
│   │   └── projectIO.js              # Legacy .keycap open/save
│   └── model/
│       ├── kcsDocument.js            # Unified format schema
│       ├── sceneDocument.js          # 3D scene node model
│       └── projectModel.js           # 2D legend data model
└── constants/
    ├── profiles.js                   # PROFILES + KEYCAP_SIZES
    ├── cherry.js                     # Cherry MX geometry constants
    └── presets.js                    # PresetsGallery data
```

---

## Version History

| Version | Milestone |
|---------|-----------|
| **V1.4** | Single-mode redesign: remove 2D legend page, move legend settings to 3D inspector, unoccluded dashed-line indicators (depthTest:false), zh/en i18n module |
| V1.3 | Performance: bundle splitting, lazy-loaded 3D, off-thread STL export (Web Worker) |
| V1.2 | Outliner + custom shape-building removed; keycap auto-selected on mount |
| V1.1 | Unified `.kcs.json` format; 3D Shape → 2D Legends → Export workflow |
| V1.0 | Initial release: 2D legend editor, Cherry profile generator, STL export |

