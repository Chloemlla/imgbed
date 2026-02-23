import { Api } from '@/types'

export const transit_api = 'https://img.xcool.workers.dev/'

export interface Resp {
  url: string
  err: string
}

export const http2https = (text: string): string => {
  return text.replace('http://', 'https://')
}

// Safe field accessor - prevents prototype pollution via __proto__, constructor, prototype
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export const getField = (obj: any, field: (string | number)[]): any => {
  let res = obj
  for (const key of field) {
    if (res == null) return undefined
    if (typeof key === 'string' && BLOCKED_KEYS.has(key)) return undefined
    res = res[key]
  }
  return res
}

// Validate that a URL string is safe (no javascript:, data:, etc.)
function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('blob:')
  ) {
    return false
  }
  return true
}

export const generateFormData = (api: Api, file: File): FormData => {
  const data = new FormData()
  data.append(api.field_name, file)
  if (api.additional_data) {
    let additional_data = api.additional_data
    if (typeof additional_data === 'function') {
      additional_data = additional_data(file)
    }
    for (const key in additional_data) {
      if (Object.prototype.hasOwnProperty.call(additional_data, key)) {
        data.append(key, (additional_data as any)[key])
      }
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
  if (!res_text || typeof res_text !== 'string') {
    return { url: '', err: '上传失败' }
  }
  if (api.final_handler) {
    res_text = api.final_handler(res_text)
  }
  res_text = http2https(res_text)

  // Validate the resulting URL is safe
  if (!isSafeUrl(res_text)) {
    return { url: '', err: '不安全的URL' }
  }

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
        if (evt.total === 0) return
        const complete = (evt.loaded / evt.total) * 100
        if (complete < 100) {
          progress(complete)
        }
      })
      xhr.addEventListener('load', () => {
        progress(100)

        // Detect DDoS-Guard protection
        if (xhr.status === 403 && xhr.responseText.includes('DDoS-Guard')) {
          if (retryCount < 3) {
            setTimeout(() => {
              upload(api, file, progress, retryCount + 1).then(resolve).catch(reject)
            }, 5000)
            return
          } else {
            resolve({ url: '', err: 'DDoS-Guard保护：重试次数已达上限' })
            return
          }
        }

        // Detect rate limiting
        if (xhr.responseText.includes('Please wait a few seconds')) {
          if (retryCount < 3) {
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

        let res: any = ''
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
        } catch {
          resolve({ url: '', err: 'Invalid response format' })
        }
      })
      xhr.addEventListener('error', () => {
        resolve({ url: '', err: '网络错误' })
      })
      xhr.addEventListener('loadend', () => {
        // Fallback - only resolve if not already resolved
      })
      xhr.open('POST', url)
      if (api.headers) {
        for (const h in api.headers) {
          if (Object.prototype.hasOwnProperty.call(api.headers, h)) {
            xhr.setRequestHeader(h, api.headers[h])
          }
        }
      }
      xhr.send(data)
    })
  } catch (e: any) {
    return { url: '', err: e.message || '上传失败' }
  }
}
