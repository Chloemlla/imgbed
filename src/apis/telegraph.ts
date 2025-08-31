import { Api } from '@/types'

const api: Api = {
  name: 'Telegraph',
  transit: false,
  url: 'https://tgimg.hapxs.com/upload',
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
