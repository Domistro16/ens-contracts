import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// https://vitejs.dev/config/
export default defineConfig({
/*   define: { global: 'globalThis', 'process.env': {} },
  resolve: { alias: { buffer: 'buffer/' } },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      plugins: [NodeGlobalsPolyfillPlugin({ buffer: true })],
    },
  }, */
  plugins: [
    nodePolyfills({
      // enable Buffer & process globals
      globals: {
        Buffer: true,
        process: true,
      },
      // allow imports like "import fs from 'fs'" if you ever need them
      protocolImports: true,
    }),
    react(),
    tailwindcss(),
    ,
  ],
})
