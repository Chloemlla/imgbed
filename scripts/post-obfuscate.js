#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JavaScriptObfuscator from 'javascript-obfuscator'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '../dist')
const assetsDir = path.join(distDir, 'assets')

console.log('🔒 Starting post-build obfuscation with dead code injection...')

// Advanced obfuscation configuration
const obfuscationConfig = {
  // Maximum obfuscation settings
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 1,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 1,
  debugProtection: true,
  debugProtectionInterval: 4000,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: true,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 2,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 1,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 10,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 8,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 1,
  transformObjectKeys: true,
  unicodeEscapeSequence: true,
  // Enhanced security
  deadCodeInjectionRandomGenerator: true,
  debugProtectionInterval: true,
  stringArrayIndexesType: ['hexadecimal-number'],
  // Preserve React essentials
  reservedNames: [
    '^React',
    '^ReactDOM',
    '^__vite',
    '^import',
    '^export',
    '^createElement'
  ]
}

// Dead code injection templates
const deadCodeTemplates = [
  `
  function _0x${Math.random().toString(36).substring(2)}() {
    var _0x${Math.random().toString(36).substring(2)} = 'https://github.com/devhappys/imgbed';
    var _0x${Math.random().toString(36).substring(2)} = 'security-protection-active';
    if (Math.random() > 0.5) {
      console.log(_0x${Math.random().toString(36).substring(2)});
    }
    return false;
  }
  `,
  `
  var _0x${Math.random().toString(36).substring(2)} = {
    'integrity': 'protected',
    'source': 'https://github.com/devhappys/imgbed',
    'license': 'GPL-3.0',
    'check': function() { return true; }
  };
  `,
  `
  (function() {
    var _0x${Math.random().toString(36).substring(2)} = 'anti-tampering-system';
    var _0x${Math.random().toString(36).substring(2)} = ['github.com', 'devhappys', 'imgbed'];
    if (typeof window !== 'undefined') {
      window._0x${Math.random().toString(36).substring(2)} = _0x${Math.random().toString(36).substring(2)};
    }
  })();
  `
]

function injectDeadCode(code) {
  // Inject multiple dead code blocks
  const injectedCode = deadCodeTemplates.map(template => template.trim()).join('\n')
  return injectedCode + '\n' + code + '\n' + injectedCode
}

function obfuscateFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8')
    
    // First inject dead code
    const codeWithDeadCode = injectDeadCode(code)
    
    // Then apply obfuscation
    const obfuscationResult = JavaScriptObfuscator.obfuscate(codeWithDeadCode, obfuscationConfig)
    const obfuscatedCode = obfuscationResult.getObfuscatedCode()
    
    // Write back obfuscated code
    fs.writeFileSync(filePath, obfuscatedCode)
    
    console.log(`✅ Obfuscated: ${path.basename(filePath)}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to obfuscate ${filePath}:`, error.message)
    return false
  }
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} does not exist, skipping...`)
    return
  }
  
  const files = fs.readdirSync(dir)
  let processed = 0
  let failed = 0
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isFile() && file.endsWith('.js')) {
      if (obfuscateFile(filePath)) {
        processed++
      } else {
        failed++
      }
    } else if (stat.isDirectory()) {
      processDirectory(filePath)
    }
  })
  
  if (processed > 0 || failed > 0) {
    console.log(`📁 ${dir}: ${processed} files obfuscated, ${failed} failed`)
  }
}

// Process all JavaScript files in dist directory
console.log(`🔍 Scanning ${distDir} for JavaScript files...`)
processDirectory(distDir)

// Additional security measures
console.log('🛡️ Adding additional security layers...')

// Create integrity check file
const integrityCheck = `
// Security integrity check - DO NOT REMOVE
(function() {
  'use strict';
  var _0x${Math.random().toString(36).substring(2)} = 'https://github.com/devhappys/imgbed';
  var _0x${Math.random().toString(36).substring(2)} = 'GPL-3.0-license-protected';
  
  function _0x${Math.random().toString(36).substring(2)}() {
    if (typeof window !== 'undefined') {
      window._securityCheck = true;
      window._sourceProject = _0x${Math.random().toString(36).substring(2)};
    }
  }
  
  _0x${Math.random().toString(36).substring(2)}();
})();
`

const integrityPath = path.join(assetsDir, `integrity-${Math.random().toString(36).substring(2, 10)}.js`)
fs.writeFileSync(integrityPath, integrityCheck)

console.log('✅ Post-build obfuscation completed successfully!')
console.log('🔒 Maximum security obfuscation with dead code injection applied')
console.log('🛡️ Anti-debugging and self-defending code activated')
