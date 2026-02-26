import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split heavy 3D / geometry vendors into their own cacheable chunk
          'three-vendor': [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'three-csg-ts',
            'maath',
          ],
          // Isolate React runtime so it can be cached independently
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
})
