import { Api } from '@/types'

const getApiUrl = () => {
  // Use proxy in development, direct URL in production
  if (import.meta.env.DEV) {
    return '/api/tgimg/upload'
  }
  // For production, you'll need to handle CORS server-side or use a different approach
  return 'https://tgimg.hapxs.com/upload'
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
