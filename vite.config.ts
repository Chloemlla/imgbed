import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "node:path"
import JavaScriptObfuscator from 'javascript-obfuscator'

// Custom obfuscation plugin using javascript-obfuscator
function obfuscatorPlugin() {
  return {
    name: 'obfuscator',
    generateBundle(options: any, bundle: any) {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName]
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          // 使用更安全的混淆配置
          const obfuscationResult = JavaScriptObfuscator.obfuscate(chunk.code, {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: false, // 保留console输出用于调试
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: false,
            renameGlobals: false,
            selfDefending: false,
            simplify: false, // 禁用简化避免破坏函数结构
            splitStrings: false,
            stringArray: false, // 完全禁用字符串数组避免运行时错误
            stringArrayCallsTransform: false,
            stringArrayEncoding: [],
            stringArrayIndexShift: false,
            stringArrayRotate: false,
            stringArrayShuffle: false,
            stringArrayWrappersCount: 0,
            stringArrayWrappersChainedCalls: false,
            stringArrayWrappersParametersMaxCount: 0,
            stringArrayThreshold: 0,
            transformObjectKeys: false,
            unicodeEscapeSequence: false,
            // 扩展保护的标识符
            reservedNames: [
              '^React',
              '^ReactDOM',
              '^__vite',
              '^import',
              '^export',
              '^useState',
              '^useEffect',
              '^useRef',
              '^useCallback',
              '^useMemo',
              '^useStore',
              '^create',
              'props',
              'children',
              'key',
              'ref',
              'className',
              'onClick',
              'onChange',
              'onSubmit',
              'value',
              'defaultValue',
              'preload',
              'domAnimation'
            ]
          });

          chunk.code = obfuscationResult.getObfuscatedCode()
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // 暂时禁用混淆插件避免运行时错误
    // ...(mode === 'production' ? [obfuscatorPlugin()] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  server: {
    proxy: {
      '/api/tgimg': {
        target: 'https://tgimg.hapxs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tgimg/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Override headers to mimic Telegraph origin
            proxyReq.setHeader('Origin', 'https://telegra.ph');
            proxyReq.setHeader('Referer', 'https://telegra.ph/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            // Remove the actual origin header
            proxyReq.removeHeader('host');
          });
        },
      },
      '/api/uploadcc': {
        target: 'https://upload.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/uploadcc/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Override headers to mimic legitimate browser request
            proxyReq.setHeader('Origin', 'https://upload.cc');
            proxyReq.setHeader('Referer', 'https://upload.cc/');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            proxyReq.removeHeader('host');
          });
        },
      }
    }
  },
  build: {
    // Enhanced build settings for maximum obfuscation
    // 使用 terser  minifier
    minify: 'terser',
    // chunk 大小警告限制
    chunkSizeWarningLimit: 1000,
    // terser 选项
    terserOptions: {
      // 压缩选项
      compress: {
        // 删除 console 语句
        drop_console: true,
        // 删除 debugger 语句
        drop_debugger: true,
        // 删除死代码
        dead_code: true
      },
      //混淆选项
      mangle: {
        // 该选项控制是否混淆所有的标识符
        toplevel: false, // 禁用顶级混淆避免破坏导入导出
        // 该选项控制是否混淆 eval 语句中的标识符
        eval: false,
        // 禁用属性混淆避免破坏React组件属性
        properties: false
      },
      // 格式化选项
      format: {
        // 该选项控制是否生成注释
        comments: false,
        // 该选项控制是否美化代码
        beautify: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@nextui-org/react'],
        }
      }
    }
  }
}))
