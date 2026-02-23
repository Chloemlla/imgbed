import { Api } from '@/types'

const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return '/api/tgimg/upload'
  }
  return 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://tgimg.hapxs.com/upload')
}

const api: Api = {
  name: 'Telegraph',
  transit: false,
  url: getApiUrl(),
  field_name: 'file',
  resp_type: 'json',
  url_field: [0, 'src'],
  code_field: [],
  success_code: 0,
  max_size: 0,
  extensions: [],
  headers: {
    'Accept': 'application/json, text/plain, */*'
  },
  final_handler: (text) => {
    return `https://tgimg.hapxs.com${text}`
  },
}

export default api
