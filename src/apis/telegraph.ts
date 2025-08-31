import { Api } from '@/types'

const getApiUrl = () => {
  // Use proxy in development, direct URL in production
  console.log('Environment DEV:', import.meta.env.DEV)
  console.log('Environment MODE:', import.meta.env.MODE)
  
  if (import.meta.env.DEV) {
    console.log('Using proxy URL: /api/tgimg/upload')
    return '/api/tgimg/upload'
  }
  
  console.log('Using direct URL: https://tgimg.hapxs.com/upload')
  // For production, use a CORS proxy as fallback
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
