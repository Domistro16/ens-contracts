import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'


// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
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
  plugins: [react(), tailwindcss()],
})
