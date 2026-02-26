# KeycapStudio v0.4.0 - Deployment Guide

## 🚀 Quick Deployment

### Option 1: Direct File Serving
```bash
# Unzip the release package
unzip KeycapStudio-v0.4.0.zip -d keycap-studio

# Serve with any static web server
cd keycap-studio

# Python 3
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080

# Nginx/Apache
# Copy contents to web root
```

### Option 2: Docker Deployment
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Option 3: Cloud Deployment

#### Vercel
```bash
npm i -g vercel
vercel --prod
```

#### Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages
```bash
npm i -g gh-pages
npm run build
gh-pages -d dist
```

## 📋 System Requirements

- **Browser**: Chrome 90+, Firefox 90+, Safari 15+, Edge 90+
- **WebGL**: WebGL2 support required
- **Storage**: ~5MB for caching
- **Network**: ~300KB initial load

## 🔧 Configuration

The app is fully self-contained. No server-side configuration required.

## 🎯 Features in v0.4.0

- ⚡ Real-time 3D preview
- 📤 One-click STL export
- 🎨 Cherry MX profile support
- 📏 Multiple key sizes (1u to 6.25u)
- 🎛️ Performance modes
- 🔄 Smart caching

## 🐛 Known Issues

- Large keycaps (>2.25u) may take 200-800ms to export
- CSG meshes may need "repair" in some slicers
- SA/DSA/OEM profiles use Cherry geometry (visual only)

## 📞 Support

- GitHub Issues: [suifengwudong/KeycapStudio](https://github.com/suifengwudong/KeycapStudio)
- Documentation: [README.md](https://github.com/suifengwudong/KeycapStudio/blob/main/README.md)