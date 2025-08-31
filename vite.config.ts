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
          // Apply maximum obfuscation with dead code injection
          const obfuscationResult = JavaScriptObfuscator.obfuscate(chunk.code, {
            compact: true, // 压缩输出体积，去除多余空白与换行
            controlFlowFlattening: false, // 关闭控制流扁平化（性能开销大，影响运行速度）
            deadCodeInjection: false, // 不注入死代码（避免包体积大幅增长）
            debugProtection: true, // 阻止使用 DevTools 调试（检测 debugger 等）
            debugProtectionInterval: 2000, // 调试防护轮询间隔（毫秒），与 debugProtection 配合
            disableConsoleOutput: true, // 移除/替换 console 输出，降低信息泄露
            identifierNamesGenerator: 'hexadecimal', // 标识符改写为十六进制格式
            log: false, // 关闭混淆器自身日志
            numbersToExpressions: true, // 将字面量数字替换为等价表达式，增加阅读难度
            renameGlobals: false, // 不重命名全局变量，避免与外部环境冲突
            selfDefending: true, // 自我防护：防止格式化/美化与运行时篡改
            simplify: true, // 启用语义保持的简化变换，提升混淆一致性
            splitStrings: true, // 拆分长字符串为片段
            splitStringsChunkLength: 10, // 字符串拆分片段长度
            stringArray: true, // 启用字符串抽离到数组
            stringArrayCallsTransform: true, // 将直接字符串访问改为通过函数访问
            stringArrayCallsTransformThreshold: 0.75, // 上述转换应用的概率阈值
            stringArrayEncoding: ['base64'], // 字符串数组编码方式（base64）
            stringArrayIndexShift: true, // 访问字符串数组时启用索引偏移
            stringArrayRotate: true, // 旋转字符串数组元素顺序
            stringArrayShuffle: true, // 打乱字符串数组顺序
            stringArrayWrappersCount: 2, // 生成多层包装器数量（增加还原成本）
            stringArrayWrappersChainedCalls: true, // 包装器链式调用，进一步混淆
            stringArrayWrappersParametersMaxCount: 4, // 包装器的最大参数个数
            stringArrayWrappersType: 'function', // 包装器实现类型
            stringArrayThreshold: 0.75, // 抽离到字符串数组的概率阈值
            transformObjectKeys: true, // 混淆对象字面量的键名
            unicodeEscapeSequence: true // 使用 Unicode 转义输出字符串
          });

          chunk.code = obfuscationResult.getObfuscatedCode()
        }
      })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    obfuscatorPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    // Enhanced build settings for maximum obfuscation
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.warn'],
        dead_code: true,
        unused: true,
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        toplevel: true,
        eval: true,
        properties: {
          regex: /^_|^[A-Z]/
        }
      },
      format: {
        comments: false,
        beautify: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@nextui-org/react'],
          utils: ['./src/utils/linkIntegrity.ts', './src/utils/aggressiveProtection.ts']
        },
        // Randomized file names for additional obfuscation
        chunkFileNames: () => {
          const hash1 = Math.random().toString(36).substring(2, 10)
          const hash2 = Math.random().toString(36).substring(2, 8)
          return `assets/${hash1}-${hash2}.[hash].js`
        },
        entryFileNames: () => {
          const hash1 = Math.random().toString(36).substring(2, 10)
          const hash2 = Math.random().toString(36).substring(2, 8)
          return `assets/${hash1}-${hash2}.[hash].js`
        },
        assetFileNames: () => {
          const hash1 = Math.random().toString(36).substring(2, 10)
          const hash2 = Math.random().toString(36).substring(2, 8)
          return `assets/${hash1}-${hash2}.[hash].[ext]`
        }
      }
    }
  }
})
