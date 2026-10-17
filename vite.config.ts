import { defineConfig } from 'vite';
export default defineConfig({ build: { target: 'es2022', rollupOptions: { output: { manualChunks: { engine: ['./src/engine/bus.ts', './src/engine/loop.ts'], gl: ['./src/engine/gl/shader.ts'] } } } } });
