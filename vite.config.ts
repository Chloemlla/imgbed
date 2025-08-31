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
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            debugProtection: false, // 禁用调试保护避免运行时错误
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: false, // 禁用数字表达式转换
            renameGlobals: false,
            selfDefending: false, // 禁用自我防护避免运行时冲突
            simplify: true,
            splitStrings: false, // 禁用字符串拆分
            stringArray: true,
            stringArrayCallsTransform: false, // 禁用字符串调用转换
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: false, // 禁用索引偏移
            stringArrayRotate: false, // 禁用数组旋转
            stringArrayShuffle: false, // 禁用数组打乱
            stringArrayWrappersCount: 1, // 减少包装器数量
            stringArrayWrappersChainedCalls: false, // 禁用链式调用
            stringArrayWrappersParametersMaxCount: 2,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.3, // 降低字符串数组阈值
            transformObjectKeys: false, // 禁用对象键转换避免React属性问题
            unicodeEscapeSequence: false, // 禁用Unicode转义
            // 保护关键标识符
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
              'props',
              'children',
              'key',
              'ref'
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
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    minify: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@nextui-org/react'],
          utils: ['./src/utils/linkIntegrity.ts', './src/utils/aggressiveProtection.ts']
        }
      }
    }
  }
}))
