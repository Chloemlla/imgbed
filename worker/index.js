/**
 * Cloudflare Worker - CORS proxy for image upload APIs
 * 
 * Security fixes:
 * - Strict origin allowlist enforcement
 * - URL allowlist to prevent SSRF/open proxy abuse
 * - Proper CORS headers (no wildcard)
 * - URL validation to block internal network access
 */

const allowedOrigins = ['https://img.nn.ci']

// Allowlist of API domains this proxy is permitted to forward to
const allowedApiDomains = [
  'im.ge',
  'mjj.today',
  'zh-cn.imgbb.com',
  'www.freebuf.com',
  'pic.sl.al',
  'changyan.sohu.com',
  'tucdn.wpon.cn',
  'upload.cc',
  'tgimg.hapxs.com',
  'telegra.ph',
]

function isAllowedOrigin(origin) {
  return allowedOrigins.includes(origin)
}

function isAllowedApiUrl(urlString) {
  try {
    const url = new URL(urlString)
    // Block non-HTTP(S) schemes
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }
    // Block internal/private IPs
    const hostname = url.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname === '169.254.169.254' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      return false
    }
    // Check against domain allowlist
    return allowedApiDomains.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain),
    )
  } catch {
    return false
  }
}

function makeCorsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
  }
}

async function handleRequest(request) {
  const origin = request.headers.get('origin') || ''
  const url = new URL(request.url)

  if (!isAllowedOrigin(origin)) {
    return new Response(
      JSON.stringify({ code: 403, message: 'Origin not allowed' }),
      {
        status: 403,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
        },
      },
    )
  }

  let apiUrl = request.url.substr(8)
  apiUrl = decodeURIComponent(apiUrl.substr(apiUrl.indexOf('/') + 1))

  if (!apiUrl) {
    return new Response(
      JSON.stringify({ code: 400, message: `usage: ${url.origin}/API-URL` }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          ...makeCorsHeaders(origin),
        },
      },
    )
  }

  if (apiUrl.indexOf('://') === -1) {
    apiUrl = 'https://' + apiUrl
  }

  // Validate the target URL against allowlist
  if (!isAllowedApiUrl(apiUrl)) {
    return new Response(
      JSON.stringify({ code: 403, message: 'Target API domain not allowed' }),
      {
        status: 403,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          ...makeCorsHeaders(origin),
        },
      },
    )
  }

  request = new Request(apiUrl, request)
  request.headers.set('Origin', new URL(apiUrl).origin)
  request.headers.set('Referer', new URL(apiUrl).origin)
  let response = await fetch(request)

  response = new Response(response.body, response)
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.append('Vary', 'Origin')

  return response
}

function handleOptions(request) {
  const origin = request.headers.get('origin') || ''
  const headers = request.headers

  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403 })
  }

  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null
  ) {
    return new Response(null, {
      headers: {
        ...makeCorsHeaders(origin),
        'Access-Control-Allow-Headers':
          request.headers.get('Access-Control-Request-Headers') || '',
      },
    })
  } else {
    return new Response(null, {
      headers: { Allow: 'GET, HEAD, POST, OPTIONS' },
    })
  }
}

addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method === 'OPTIONS') {
    event.respondWith(handleOptions(request))
  } else if (['GET', 'HEAD', 'POST'].includes(request.method)) {
    event.respondWith(handleRequest(request))
  } else {
    event.respondWith(
      new Response(null, { status: 405, statusText: 'Method Not Allowed' }),
    )
  }
})
