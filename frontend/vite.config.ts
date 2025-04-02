import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// 获取当前文件的目录路径（在ESM中替代__dirname）
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      cors: true,
      hmr: {
        // 解决WebSocket连接问题
        host: 'localhost',
        port: 5173,
        protocol: 'ws'
      },
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8888',
          changeOrigin: true,
        }
      },
    },
    // 为Vercel部署优化构建配置
    build: {
      outDir: 'dist',
      // 生成静态资源的文件名包含hash
      assetsDir: 'assets',
      // 小于此阈值的导入或引用资源将内联为base64编码
      assetsInlineLimit: 4096,
      // 启用/禁用CSS代码拆分
      cssCodeSplit: true,
      // 构建后是否生成source map文件
      sourcemap: !isProduction,
    }
  }
})
