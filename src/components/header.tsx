import { Button, Switch, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Link } from '@nextui-org/react'
import { SunIcon, MoonIcon, Github } from '../icons'
import { useEffect, useState } from 'react'

export function Header() {
  const [theme, setTheme] = useState(() => {
    // 防止服务端渲染时的主题闪烁
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') ?? 'light'
    }
    return 'light'
  })
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  
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
          thumbIcon={({ isSelected, className }) =>
            isSelected ? (
              <SunIcon className={className} />
            ) : (
              <MoonIcon className={className} />
            )
          }
          isSelected={theme === 'light'}
          onValueChange={(v) => {
            setTheme(v ? 'light' : 'dark')
          }}
        ></Switch>
      </div>
      
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">关于本项目</ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <p>本项目开源自：</p>
                  <Link 
                    href="https://github.com/devhappys/imgbed" 
                    isExternal
                    showAnchorIcon
                    className="block"
                  >
                    https://github.com/devhappys/imgbed
                  </Link>
                  <p>基于以下项目更改：</p>
                  <Link 
                    href="https://github.com/xhofe/imgbed" 
                    isExternal
                    showAnchorIcon
                    className="block"
                  >
                    https://github.com/xhofe/imgbed
                  </Link>
                  <p className="text-sm text-gray-600">
                    感谢原作者的贡献，本项目在原基础上进行了功能修复、功能优化和用户体验改进。
                  </p>
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
