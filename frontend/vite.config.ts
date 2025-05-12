import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
/* import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
 */

// https://vitejs.dev/config/
export default defineConfig({
  /* optimizeDeps: {
    esbuildOptions: {
      // make `global` point to the browser global
      define: { global: 'globalThis' },
      plugins: [
        // Inject process and Buffer
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        // Polyfill other Node built-ins if needed
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        // for prod: shim Buffer wherever it's used
        inject({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  }, */
  plugins: [
    nodePolyfills({
      // polyfill Buffer & process, plus whatever core-modules you need
      globals: { Buffer: true, process: true },
      protocolImports: true,
      // optionally include/exclude specific modules here
    }),
    react(),
    tailwindcss(),
    ,
  ],
})
