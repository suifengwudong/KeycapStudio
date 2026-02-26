# KeycapStudio Releases

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