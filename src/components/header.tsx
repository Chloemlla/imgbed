import { useState, useEffect } from 'react'
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Link } from '@nextui-org/react'
import { Switch } from '@nextui-org/react'
import { PROTECTED_LINKS } from '../utils/linkIntegrity'
import { useSecurityMonitor } from '../hooks/useSecurityMonitor'
import { FaLock, FaCheckCircle, FaSun, FaMoon, FaInfoCircle, FaCodeBranch, FaFileContract, FaCogs, FaBug, FaRocket, FaSmile, FaExternalLinkAlt } from 'react-icons/fa'

export function Header() {
  const [theme, setTheme] = useState(() => {
    // 防止服务端渲染时的主题闪烁
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') ?? 'light'
    }
    return 'light'
  })
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Initialize security monitoring
  useSecurityMonitor()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [theme])
  return (
    <div className="relative z-40 mx-auto flex max-w-[1280px] flex-row flex-nowrap items-center justify-between px-6 py-4">
      <h1 className="text-2xl font-bold">图片上传</h1>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onPress={onOpen}>
          关于
        </Button>
        <Switch
          defaultSelected
          size="md"
          color="primary"
          thumbIcon={({ isSelected, className }: { isSelected: boolean; className: string }) =>
            isSelected ? (
              <FaSun aria-label="light-mode" className={className} />
            ) : (
              <FaMoon aria-label="dark-mode" className={className} />
            )
          }
          isSelected={theme === 'light'}
          onValueChange={(v: boolean) => {
            setTheme(v ? 'light' : 'dark')
          }}
        ></Switch>
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "mx-2 my-2 sm:mx-6 sm:my-16",
          wrapper: "w-full",
          body: "py-6"
        }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="flex flex-col gap-1 px-4 sm:px-6">关于本项目</ModalHeader>
              <ModalBody className="px-4 sm:px-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <p className="font-semibold mb-2 text-base sm:text-lg"><FaInfoCircle className="inline mr-1 align-[-2px]" /> 项目信息</p>
                    <p className="text-sm sm:text-base mb-2">本项目开源自：</p>
                    <Link
                      href={PROTECTED_LINKS[0].url}
                      isExternal
                      className="block text-sm sm:text-base break-all"
                      data-integrity-hash={PROTECTED_LINKS[0].hash}
                    >
                      <span className="inline-flex items-center gap-1">
                        <FaExternalLinkAlt aria-hidden className="text-blue-600" />
                        {PROTECTED_LINKS[0].text}
                      </span>
                    </Link>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-base sm:text-lg"><FaCodeBranch className="inline mr-1 align-[-2px]" /> 基于项目</p>
                    <p className="text-sm sm:text-base mb-2">基于以下项目更改：</p>
                    <Link
                      href={PROTECTED_LINKS[1].url}
                      isExternal
                      className="block text-sm sm:text-base break-all"
                      data-integrity-hash={PROTECTED_LINKS[1].hash}
                    >
                      <span className="inline-flex items-center gap-1">
                        <FaExternalLinkAlt aria-hidden className="text-blue-600" />
                        {PROTECTED_LINKS[1].text}
                      </span>
                    </Link>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-base sm:text-lg"><FaFileContract className="inline mr-1 align-[-2px]" /> 开源协议</p>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      本项目不同于原开源项目，因为原开源项目没有开源协议。
                    </p>
                    <p className="text-xs sm:text-sm">
                      本项目使用 <Link
                        href={PROTECTED_LINKS[2].url}
                        isExternal
                        className="font-mono text-blue-600 text-xs sm:text-sm"
                        data-integrity-hash={PROTECTED_LINKS[2].hash}
                      >
                        <span className="inline-flex items-center gap-1">
                          <FaExternalLinkAlt aria-hidden className="text-blue-600" />
                          {PROTECTED_LINKS[2].text}
                        </span>
                      </Link> 作为开源协议。
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-base sm:text-lg"><FaCogs className="inline mr-1 align-[-2px]" /> 项目改进</p>
                    <div className="text-xs sm:text-sm text-gray-600 space-y-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm sm:text-base"><FaBug className="inline mr-1 align-[-2px]" /> 功能修复：</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                          <li>修复了 useEffect 缺少依赖数组导致的内存泄漏</li>
                          <li>修复了重复选择同一API仍显示通知的问题</li>
                          <li>修复了主题初始化可能导致的闪烁问题</li>
                          <li>修复了空文件复制和重试验证问题</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-gray-800 text-sm sm:text-base"><FaRocket className="inline mr-1 align-[-2px]" /> 功能优化：</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                          <li>统一通知系统，替换 react-hot-toast 为自定义组件</li>
                          <li>添加文件选择器图片类型限制</li>
                          <li>改进按钮状态管理和用户反馈</li>
                          <li>更新 Telegraph API 配置和端点</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-gray-800 text-sm sm:text-base"><FaSmile className="inline mr-1 align-[-2px]" /> 用户体验改进：</p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                          <li>添加 ImgBB 和 Telegraph 服务连通性提示</li>
                          <li>改进进度条可访问性（aria-label）</li>
                          <li>优化空操作时的提示信息</li>
                          <li>添加 Wrangler 部署支持和完整文档</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-green-600 text-sm sm:text-base">
                          <FaLock aria-label="security-fix" className="inline mr-1 align-[-2px] text-green-600" /> 安全漏洞修复：
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                          <li>修复非空断言操作符 (!) 导致的运行时错误风险</li>
                          <li>添加文件类型和大小验证，防止恶意文件上传</li>
                          <li>完善 URL 协议检查，阻止 javascript:、data:、vbscript: 等危险协议</li>
                          <li>增强异步操作错误处理，提升系统稳定性</li>
                          <li>添加 API 模块加载验证，防止恶意代码注入</li>
                          <li>实现文件名净化，防止路径遍历攻击</li>
                        </ul>
                        <p className="text-xs text-green-600 mt-2 font-medium">
                          <FaCheckCircle aria-label="codeql-passed" className="inline mr-1 align-[-2px] text-green-600" /> 已通过 CodeQL 安全扫描验证
                        </p>
                      </div>

                      <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                        以上为本作者的贡献，这些改进让应用更加稳定和易用。
                      </p>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
