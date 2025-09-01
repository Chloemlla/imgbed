import { Api } from '@/types'

export const transit_api = 'https://img.xcool.workers.dev/'

export interface Resp {
  url: string
  err: string
}

export const http2https = (text: string): string => {
  return text.replace('http://', 'https://')
}

export const getField = (obj: any, field: (string | number)[]) => {
  let res = obj
  for (const key of field) {
    res = res[key]
  }
  return res
}

export const generateFormData = (api: Api, file: File): FormData => {
  let data = new FormData()
  data.append(api.field_name, file)
  if (api.additional_data) {
    let additional_data = api.additional_data
    if (typeof additional_data === 'function') {
      additional_data = additional_data(file)
    }
    for (const key in additional_data) {
      data.append(key, (additional_data as any)[key])
    }
  }
  return data
}

export const handleRes = (api: Api, res: any): Resp => {
  if (!res) {
    return { url: '', err: '上传失败' }
  }
  let res_text = ''
  switch (api.resp_type) {
    case 'json': {
      if (api.code_field.length !== 0) {
        const code = getField(res, api.code_field)
        if (code != api.success_code) {
          return { url: '', err: '上传失败' }
        }
      }
      res_text = getField(res, api.url_field)
      break
    }
    case 'text': {
      res_text = res
    }
  }
  if (!res_text) {
    return { url: '', err: '上传失败' }
  }
  console.log(api.final_handler)
  if (api.final_handler) {
    res_text = api.final_handler(res_text)
  }
  res_text = http2https(res_text)
  return { url: res_text, err: res_text ? '' : '上传失败' }
}

export const upload = async (
  api: Api,
  file: File,
  progress: (text: number) => void,
  retryCount: number = 0,
): Promise<Resp> => {
  const data = generateFormData(api, file)
  let url = api.url
  if (api.transit) {
    if (api.transit_api) {
      url = `${api.transit_api}${url}`
    } else {
      url = `${transit_api}${url}`
    }
  }
  try {
    return new Promise<Resp>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (evt) => {
        const complete = (evt.loaded / evt.total) * 100
        console.log(complete)
        if (complete == 100) {
          console.log('upload complete')
        } else {
          progress(complete)
        }
      })
      xhr.addEventListener('load', () => {
        progress(100)
        console.log('Response status:', xhr.status)
        console.log('Response text:', xhr.responseText)
        
        // 检测 DDoS-Guard 保护
        if (xhr.status === 403 && xhr.responseText.includes('DDoS-Guard')) {
          if (retryCount < 3) {
            console.log(`检测到DDoS-Guard保护，等待5秒后重试 (${retryCount + 1}/3)`)
            setTimeout(() => {
              // 递归重试上传，增加重试计数
              upload(api, file, progress, retryCount + 1).then(resolve).catch(reject)
            }, 5000)
            return
          } else {
            console.log('DDoS-Guard重试次数已达上限，上传失败')
            resolve({ url: '', err: 'DDoS-Guard保护：重试次数已达上限' })
            return
          }
        }
        
        // 检测其他需要等待的情况
        if (xhr.responseText.includes('Please wait a few seconds')) {
          if (retryCount < 3) {
            console.log(`检测到Please wait a few seconds. Once this check is complete, the website will open automatically等待5s重新尝试`)
            setTimeout(() => {
              upload(api, file, progress, retryCount + 1).then(resolve).catch(reject)
            }, 5000)
            return
          } else {
            resolve({ url: '', err: '服务器繁忙：重试次数已达上限' })
            return
          }
        }
        
        if (xhr.status !== 200) {
          resolve({ url: '', err: `HTTP ${xhr.status}: ${xhr.statusText}` })
          return
        }
        
        let res = ''
        try {
          switch (api.resp_type) {
            case 'json': {
              res = JSON.parse(xhr.responseText)
              break
            }
            case 'text': {
              res = xhr.responseText
            }
          }
          resolve(handleRes(api, res))
        } catch (e) {
          console.error('Failed to parse response:', e)
          console.error('Raw response:', xhr.responseText)
          resolve({ url: '', err: 'Invalid response format' })
        }
      })
      xhr.addEventListener('loadend', (evt) => {
        // progress(100)
        resolve(handleRes(api, ''))
      })
      xhr.open('POST', url)
      if (api.headers) {
        for (const h in api.headers) {
          xhr.setRequestHeader(h, api.headers[h])
        }
      }
      xhr.send(data)
    })
  } catch (e: any) {
    console.log('err', e)
    return { url: '', err: e.message || '上传失败' }
  }
}
