import { NextRequest } from "next/server"

export const runtime = "edge"
export const preferredRegion = ["fra1", "cdg1", "ams1"] // European regions

// Headers that should not be forwarded
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "accept-encoding",
])

// Headers we remove from response
const HEADERS_TO_REMOVE = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
  "strict-transport-security",
])

async function handleProxy(request: NextRequest, targetUrl: string, proxyBaseUrl: string) {
  console.log("[v0] Proxying request to:", targetUrl)
  
  const targetUrlObj = new URL(targetUrl)
  
  // Build headers for the proxied request
  const headers = new Headers()
  
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  
  // Set proper headers for the target
  headers.set("Host", targetUrlObj.host)
  headers.set("Origin", targetUrlObj.origin)
  headers.set("Referer", targetUrlObj.origin + "/")
  headers.set("Accept", request.headers.get("accept") || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
  headers.set("Accept-Language", request.headers.get("accept-language") || "en-US,en;q=0.9,ru;q=0.8")
  headers.set("User-Agent", request.headers.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
  
  // Remove problematic headers
  headers.delete("x-forwarded-host")
  headers.delete("x-forwarded-proto")
  headers.delete("x-forwarded-for")
  headers.delete("x-vercel-forwarded-for")
  headers.delete("x-real-ip")
  
  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    }
    
    // Add body for non-GET requests
    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = request.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        fetchOptions.body = await request.text()
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        fetchOptions.body = await request.arrayBuffer()
      } else {
        fetchOptions.body = request.body
      }
    }
    
    console.log("[v0] Fetching with method:", request.method)
    const response = await fetch(targetUrl, fetchOptions)
    console.log("[v0] Got response status:", response.status)
    
    // Handle redirects - follow them through proxy
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      console.log("[v0] Redirect to:", location)
      
      if (location) {
        let newLocation: string
        
        if (location.startsWith("/")) {
          // Relative redirect - same domain
          newLocation = `${proxyBaseUrl}/proxy/${targetUrlObj.host}${location}`
        } else if (location.startsWith("http")) {
          // Absolute redirect
          const redirectUrl = new URL(location)
          newLocation = `${proxyBaseUrl}/proxy/${redirectUrl.host}${redirectUrl.pathname}${redirectUrl.search}`
        } else {
          // Protocol-relative or other
          newLocation = `${proxyBaseUrl}/proxy/${location}`
        }
        
        return new Response(null, {
          status: 302,
          headers: {
            "Location": newLocation,
          },
        })
      }
    }
    
    // Build response headers
    const responseHeaders = new Headers()
    
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase()
      if (!HOP_BY_HOP_HEADERS.has(lowerKey) && !HEADERS_TO_REMOVE.has(lowerKey)) {
        responseHeaders.set(key, value)
      }
    })
    
    // Add CORS headers
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
    responseHeaders.set("Access-Control-Allow-Headers", "*")
    responseHeaders.set("Access-Control-Expose-Headers", "*")
    
    const contentType = response.headers.get("content-type") || ""
    
    // For HTML content, rewrite URLs
    if (contentType.includes("text/html")) {
      let html = await response.text()
      console.log("[v0] Processing HTML, length:", html.length)
      
      // Rewrite URLs in HTML
      html = rewriteHtml(html, targetUrlObj, proxyBaseUrl)
      
      responseHeaders.set("Content-Type", "text/html; charset=utf-8")
      responseHeaders.delete("content-length")
      responseHeaders.delete("content-encoding")
      
      return new Response(html, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // For CSS, rewrite url() references
    if (contentType.includes("text/css")) {
      let css = await response.text()
      css = rewriteCss(css, targetUrlObj, proxyBaseUrl)
      
      responseHeaders.delete("content-length")
      responseHeaders.delete("content-encoding")
      
      return new Response(css, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // For JS, try to rewrite fetch/XMLHttpRequest URLs
    if (contentType.includes("javascript") || contentType.includes("application/json")) {
      responseHeaders.delete("content-encoding")
      responseHeaders.delete("content-length")
      
      const text = await response.text()
      return new Response(text, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // For other content (images, fonts, etc), stream through
    responseHeaders.delete("content-encoding")
    
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
    
  } catch (error) {
    console.error("[v0] Proxy error:", error)
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Proxy Error</title></head>
<body style="font-family: system-ui; padding: 40px; background: #1a1a1a; color: #fff;">
  <h1 style="color: #ef4444;">Proxy Error</h1>
  <p><strong>Target URL:</strong> ${targetUrl}</p>
  <p><strong>Error:</strong> ${error instanceof Error ? error.message : "Unknown error"}</p>
  <p style="color: #888;">The target site may be blocking proxy requests or is unavailable.</p>
  <a href="/" style="color: #3b82f6;">Back to home</a>
</body>
</html>`,
      {
        status: 502,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    )
  }
}

function rewriteHtml(html: string, targetUrl: URL, proxyBaseUrl: string): string {
  const targetOrigin = targetUrl.origin
  const targetHost = targetUrl.host
  
  // Inject base tag at the start of head for relative resources
  // This helps with resources that use relative paths
  const baseTag = `<base href="${targetOrigin}/">`
  if (html.includes("<head")) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
  } else if (html.includes("<html")) {
    html = html.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`)
  }
  
  // Rewrite href and src attributes with absolute URLs to proxy
  // Match: href="https://domain.com/..." or src="https://domain.com/..."
  html = html.replace(
    /(href|src|action|data-src|poster)=(["'])(https?:\/\/)([^"']+)(["'])/gi,
    (match, attr, q1, protocol, rest, q2) => {
      const fullUrl = protocol + rest
      try {
        const url = new URL(fullUrl)
        // Only proxy same-origin or common CDN resources
        if (url.host === targetHost || shouldProxyHost(url.host)) {
          return `${attr}=${q1}${proxyBaseUrl}/proxy/${url.host}${url.pathname}${url.search}${q2}`
        }
      } catch {
        // Invalid URL, leave as is
      }
      return match
    }
  )
  
  // Rewrite protocol-relative URLs (//domain.com/path)
  html = html.replace(
    /(href|src|action|data-src|poster)=(["'])(\/\/)([^"']+)(["'])/gi,
    (match, attr, q1, slashes, rest, q2) => {
      try {
        const url = new URL("https:" + slashes + rest)
        if (url.host === targetHost || shouldProxyHost(url.host)) {
          return `${attr}=${q1}${proxyBaseUrl}/proxy/${url.host}${url.pathname}${url.search}${q2}`
        }
      } catch {
        // Invalid URL
      }
      return match
    }
  )
  
  // Inject script to intercept XHR and fetch calls
  const proxyScript = `
<script>
(function() {
  const PROXY_BASE = "${proxyBaseUrl}/proxy/";
  const TARGET_ORIGIN = "${targetOrigin}";
  const TARGET_HOST = "${targetHost}";
  
  // Helper to convert URL to proxied URL
  function toProxyUrl(url) {
    if (!url) return url;
    try {
      if (url.startsWith('/') && !url.startsWith('//')) {
        return PROXY_BASE + TARGET_HOST + url;
      }
      if (url.startsWith('//')) {
        const parsed = new URL('https:' + url);
        return PROXY_BASE + parsed.host + parsed.pathname + parsed.search;
      }
      if (url.startsWith('http')) {
        const parsed = new URL(url);
        return PROXY_BASE + parsed.host + parsed.pathname + parsed.search;
      }
    } catch(e) {}
    return url;
  }
  
  // Intercept fetch
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      input = toProxyUrl(input);
    } else if (input instanceof Request) {
      input = new Request(toProxyUrl(input.url), input);
    }
    return originalFetch.call(this, input, init);
  };
  
  // Intercept XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    return originalOpen.call(this, method, toProxyUrl(url), ...args);
  };
})();
</script>
`
  
  // Insert proxy script after <head>
  if (html.includes("<head")) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${proxyScript}`)
  }
  
  return html
}

function rewriteCss(css: string, targetUrl: URL, proxyBaseUrl: string): string {
  const targetOrigin = targetUrl.origin
  const targetHost = targetUrl.host
  
  // Rewrite url() with absolute URLs
  css = css.replace(
    /url\(\s*(["']?)(https?:\/\/)([^"')]+)(["']?)\s*\)/gi,
    (match, q1, protocol, rest, q2) => {
      try {
        const url = new URL(protocol + rest)
        return `url(${q1}${proxyBaseUrl}/proxy/${url.host}${url.pathname}${url.search}${q2})`
      } catch {
        return match
      }
    }
  )
  
  // Rewrite url() with root-relative paths
  css = css.replace(
    /url\(\s*(["']?)\/([^"')]+)(["']?)\s*\)/gi,
    (match, q1, path, q2) => {
      if (path.startsWith("/")) return match // Already absolute or protocol-relative
      return `url(${q1}${proxyBaseUrl}/proxy/${targetHost}/${path}${q2})`
    }
  )
  
  // Rewrite @import
  css = css.replace(
    /@import\s+(["'])(https?:\/\/)([^"']+)(["'])/gi,
    (match, q1, protocol, rest, q2) => {
      try {
        const url = new URL(protocol + rest)
        return `@import ${q1}${proxyBaseUrl}/proxy/${url.host}${url.pathname}${url.search}${q2}`
      } catch {
        return match
      }
    }
  )
  
  return css
}

function shouldProxyHost(host: string): boolean {
  // Proxy common CDNs and asset hosts
  const proxyHosts = [
    "cdn.",
    "static.",
    "assets.",
    "images.",
    "img.",
    "fonts.",
    "js.",
    "css.",
    "media.",
  ]
  return proxyHosts.some(prefix => host.includes(prefix))
}

function buildTargetUrl(path: string[], searchParams: string): string {
  // Join all path segments - Next.js splits the path by /
  const fullPath = path.join("/")
  
  console.log("[v0] Path segments:", path)
  console.log("[v0] Full path:", fullPath)
  
  // The path should be: domain.com/rest/of/path
  // First segment is the domain, rest is the path
  
  let targetUrl: string
  if (fullPath.startsWith("http://") || fullPath.startsWith("https://")) {
    targetUrl = fullPath
  } else {
    // Assume HTTPS
    targetUrl = `https://${fullPath}`
  }
  
  // Add query string if present
  if (searchParams) {
    targetUrl += searchParams
  }
  
  console.log("[v0] Target URL:", targetUrl)
  return targetUrl
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const url = new URL(request.url)
  const proxyBaseUrl = `${url.protocol}//${url.host}`
  const targetUrl = buildTargetUrl(path, url.search)
  
  return handleProxy(request, targetUrl, proxyBaseUrl)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const url = new URL(request.url)
  const proxyBaseUrl = `${url.protocol}//${url.host}`
  const targetUrl = buildTargetUrl(path, url.search)
  
  return handleProxy(request, targetUrl, proxyBaseUrl)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const url = new URL(request.url)
  const proxyBaseUrl = `${url.protocol}//${url.host}`
  const targetUrl = buildTargetUrl(path, url.search)
  
  return handleProxy(request, targetUrl, proxyBaseUrl)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const url = new URL(request.url)
  const proxyBaseUrl = `${url.protocol}//${url.host}`
  const targetUrl = buildTargetUrl(path, url.search)
  
  return handleProxy(request, targetUrl, proxyBaseUrl)
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const url = new URL(request.url)
  const proxyBaseUrl = `${url.protocol}//${url.host}`
  const targetUrl = buildTargetUrl(path, url.search)
  
  return handleProxy(request, targetUrl, proxyBaseUrl)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  })
}
