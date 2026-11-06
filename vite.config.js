import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5180, // 固定 port
    strictPort: true, //如果被占用就報錯，不自動換port
    allowedHosts: [
      'localhost',
      '.ngrok-free.app'
    ],
    // host: 'localhost', // 明確設定主機
    proxy: { //導向圖片image資料夾用的
      '/ProductImages': {
        target: 'https://localhost:7017',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://localhost:7017',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})



