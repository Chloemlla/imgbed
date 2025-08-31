import { apis, useApiStore } from '@/store/api'
import { Card, CardBody, Radio, RadioGroup } from '@nextui-org/react'
import { useNotification } from './Notification'

export function ApiSelect() {
  const [current, setCurrent] = useApiStore((state) => [
    state.current,
    state.setCurrent,
  ])
  const { setNotification } = useNotification()

  return (
    <div>
      <Card>
        <CardBody>
          <RadioGroup
            orientation="horizontal"
            value={current}
            onValueChange={(v) => {
              const api = apis.find((item) => item.name === v)
              if (api) {
                // 只有当选择的API与当前不同时才显示通知
                if (api.name !== current) {
                  setCurrent(api.name)
                  // 当选择 Telegraph 时显示不可用提示
                  if (api.name === 'Telegraph') {
                    setNotification({
                      message: 'Telegraph 服务暂时不可用，建议选择其他图床服务',
                      type: 'warning'
                    })
                  }
                  // 当选择 Upload.cc 时显示不可用提示
                  if (api.name === 'Upload.cc') {
                    setNotification({
                      message: 'Upload.cc 服务暂时不可用，建议选择其他图床服务',
                      type: 'warning'
                    })
                  }
                  // 当选择 ImgBB 时显示连通性警告
                  if (api.name === 'ImgBB') {
                    setNotification({
                      message: 'ImgBB主要节点在加利福尼亚州和佛罗里达州，大陆连通性较差，谨慎使用',
                      type: 'warning'
                    })
                  }
                }
              }
            }}
          >
            {apis.map((item, index) => (
              <Radio key={`${item}${index}`} value={item.name}>
                {item.name}
              </Radio>
            ))}
          </RadioGroup>
        </CardBody>
      </Card>
    </div>
  )
}
