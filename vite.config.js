import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver, ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-imports.d.ts',
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [VantResolver(), ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/mixin.scss" as *;`
      }
    }
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://172.16.11.110:8089/',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      // '/api': {
      //   target: 'http://192.168.1.3:8089/',
      //   changeOrigin: true,
      //   rewrite: path => path.replace(/^\/api/, '')
      // }
    }
  }
})
