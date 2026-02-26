# KeycapStudio Releases

## v1.3.0 - Performance & Bundle Optimisation (2026-02-26)

### 🎉 Major Features

- **🚀 Bundle Splitting**: Code-split React, Three.js, and UI components for better caching and loading
- **⚡ STL Export Worker**: Off-thread STL generation using Web Workers (no UI blocking)
- **🎛️ Lazy 3D Loading**: Scene3D component loads on-demand
- **🔄 Unified Step Navigation**: Cleaner toolbar with consistent step flow
- **📤 Enhanced Export Feedback**: Robust export overlays and toast notifications

### 🔧 Technical Improvements

- **Architecture**: Vite build optimisation with manual chunking
- **Performance**: Web Worker for heavy STL computations
- **UI**: Improved CSG evaluator and error handling
- **Build**: Better code splitting and loading performance

### 📋 What's New

- ✅ Bundle splitting for React, Three.js, and UI components
- ✅ Web Worker for STL export (non-blocking)
- ✅ Lazy loading for 3D scene components
- ✅ Unified step navigation in toolbar
- ✅ Enhanced export feedback with overlays and toasts

### 🐛 Bug Fixes

- Improved export controller with lock mechanism
- Better error state management
- Enhanced user feedback during operations

### 📦 Files

- `KeycapStudio-v1.3.0.zip` - Complete web application with performance optimizations
- `dist/` - Production build ready for deployment

### 🚀 Deployment

The application is a static single-page application. Simply serve the `dist/` folder with any static web server.

```bash
# Using Python
python -m http.server 8080 -d dist

# Using Node.js
npx serve dist
```

### 🔄 Migration Notes

- Application now loads faster with code splitting
- STL export runs in background without freezing UI
- Better performance on lower-end devices

--------

## Previous Versions

## v0.4.0 - Preview/Export Decoupling (2026-02-26)

### 🎉 Major Features

- **🚀 Real-time Preview**: Instant 3D preview with fast CSG-free rendering
- **📤 On-demand Export**: Full CSG computation only when exporting STL
- **⚡ Performance Boost**: Typed arrays optimization and mode-aware geometry steps
- **🎛️ Enhanced UI**: Drag indicators and improved user feedback
- **🔄 Smart Caching**: Separate cache for preview vs export operations

### 🔧 Technical Improvements

- **Architecture**: Decoupled preview/export pipelines for optimal performance
- **Memory**: Reduced memory usage with typed arrays in normal smoothing
- **UI**: Fixed FPS overlay positioning (screen space vs world space)
- **Constants**: Extracted Cherry MX specs to dedicated constants file
- **Build**: Optimized bundle size and loading performance

### 📋 What's New

- ✅ Live slider preview with visual drag indicators
- ✅ Export STL with progress feedback
- ✅ Performance mode selector (Fast/Balanced/Quality)
- ✅ Shared generator instance across components
- ✅ Parameter clamping to prevent CSG failures

### 🐛 Bug Fixes

- Fixed FPS/frame time overlay positioning
- Improved CSG operation stability
- Better error handling in geometry generation

### 📦 Files

- `KeycapStudio-v0.4.0.zip` - Complete web application
- `dist/` - Production build ready for deployment

### 🚀 Deployment

The application is a static single-page application. Simply serve the `dist/` folder with any static web server.

```bash
# Using Python
python -m http.server 8080 -d dist

# Using Node.js
npx serve dist
```

### 🔄 Migration Notes

- Preview rendering is now significantly faster
- Export may take longer due to full CSG computation
- UI provides clear feedback during operations

--------

## Previous Versions

### v0.3.0 - STL Export & Documentation

- Complete STL export pipeline
- Comprehensive README documentation
- Print validation warnings

### v0.2.0 - Parameterized UI & Caching

- Full parameter editor with sliders
- LRU caching system
- Color picker integration

### v0.1.0 - Basic Geometry Generation

- Cherry MX keycap geometry
- Basic 3D rendering
- Stem hole generation

# Using any static server
```

### 🔄 Migration Notes

- Preview rendering is now significantly faster
- Export may take longer due to full CSG computation
- UI provides clear feedback during operations

---

## Previous Versions

### v0.3.0 - STL Export & Documentation
- Complete STL export pipeline
- Comprehensive README documentation
- Print validation warnings

### v0.2.0 - Parameterized UI & Caching
- Full parameter editor with sliders
- LRU caching system
- Color picker integration

### v0.1.0 - Basic Geometry Generation
- Cherry MX keycap geometry
- Basic 3D rendering
- Stem hole generation