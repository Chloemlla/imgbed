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
            // Maximum security settings
            compact: true,
            controlFlowFlattening: true,
            // Reduced obfuscation for size optimization
            deadCodeInjection: false,
            debugProtection: false,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: false,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: false,
            stringArray: true,
            stringArrayCallsTransform: false,
            stringArrayEncoding: ['base64'],
            stringArrayIndexShift: false,
            stringArrayRotate: false,
            stringArrayShuffle: false,
            stringArrayWrappersCount: 1,
            stringArrayWrappersChainedCalls: false,
            stringArrayWrappersParametersMaxCount: 2,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.5,
            transformObjectKeys: false,
            unicodeEscapeSequence: false,
            // String array optimizations
            stringArrayIndexesType: ['hexadecimal-number'],
            // Preserve essential names
            reservedNames: [
              '^React',
              '^ReactDOM', 
              '^__vite',
              '^import',
              '^export'
            ],
            // Force transform security-related strings
            forceTransformStrings: [
              'security',
              'integrity', 
              'protection',
              'monitor',
              'github',
              'devhappys',
              'imgbed'
            ]
          })
          
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
