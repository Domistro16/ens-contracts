import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
// https://vitejs.dev/config/
export default defineConfig({
   define: { global: 'globalThis',
               'process.env': {},
    },
  resolve: { alias: { buffer: 'buffer/' } },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({ buffer: true })
      ]
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    ,
  ],
})
