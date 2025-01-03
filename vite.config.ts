import dts from 'vite-plugin-dts'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type UserConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [dts({ rollupTypes: true }), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'kikai',
      formats: ['es', 'cjs', 'umd', 'iife'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
} satisfies UserConfig)
