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
])

// Headers we add/modify
const PROXY_HEADERS_TO_REMOVE = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-content-type-options",
])

function decodeProxyPath(encodedPath: string): string {
  // Replace -SLASH- back to /
  return encodedPath.replace(/-SLASH-/g, "/")
}

function rewriteUrls(content: string, baseUrl: string, targetOrigin: string): string {
  // Rewrite absolute URLs in HTML/CSS/JS
  const targetHost = new URL(targetOrigin).host
  
  // Replace absolute URLs with proxy URLs
  content = content.replace(
    new RegExp(`(href|src|action)=["'](https?://)?${escapeRegExp(targetHost)}(/[^"']*)?["']`, "gi"),
    (match, attr, protocol, path) => {
      const fullPath = path || ""
      const encodedPath = `${targetHost}${fullPath}`.replace(/\//g, "-SLASH-")
      return `${attr}="${baseUrl}/proxy/${encodedPath}"`
    }
  )
  
  // Replace relative URLs
  content = content.replace(
    /(href|src|action)=["']\/([^"']*?)["']/gi,
    (match, attr, path) => {
      const encodedPath = `${targetHost}-SLASH-${path}`.replace(/\//g, "-SLASH-")
      return `${attr}="${baseUrl}/proxy/${encodedPath}"`
    }
  )
  
  return content
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

async function handleProxy(request: NextRequest, targetUrl: string) {
  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`
  
  // Build headers for the proxied request
  const headers = new Headers()
  
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  
  // Set the correct host header
  const targetUrlObj = new URL(targetUrl)
  headers.set("Host", targetUrlObj.host)
  headers.set("Origin", targetUrlObj.origin)
  headers.set("Referer", targetUrl)
  
  // Remove headers that might cause issues
  headers.delete("x-forwarded-host")
  headers.delete("x-forwarded-proto")
  
  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual",
    })
    
    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (location) {
        let newLocation: string
        if (location.startsWith("/")) {
          // Relative redirect
          newLocation = `${baseUrl}/proxy/${targetUrlObj.host}${location.replace(/\//g, "-SLASH-")}`
        } else if (location.startsWith("http")) {
          // Absolute redirect
          const redirectUrl = new URL(location)
          newLocation = `${baseUrl}/proxy/${redirectUrl.host}${redirectUrl.pathname.replace(/\//g, "-SLASH-")}${redirectUrl.search}`
        } else {
          newLocation = location
        }
        
        return new Response(null, {
          status: response.status,
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
      if (!HOP_BY_HOP_HEADERS.has(lowerKey) && !PROXY_HEADERS_TO_REMOVE.has(lowerKey)) {
        responseHeaders.set(key, value)
      }
    })
    
    // Allow embedding in iframes
    responseHeaders.delete("x-frame-options")
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    responseHeaders.set("Access-Control-Allow-Headers", "*")
    
    const contentType = response.headers.get("content-type") || ""
    
    // For HTML content, rewrite URLs
    if (contentType.includes("text/html")) {
      let html = await response.text()
      html = rewriteUrls(html, baseUrl, targetUrlObj.origin)
      
      // Inject base tag for relative resources
      const baseTag = `<base href="${targetUrlObj.origin}/">`
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
      
      return new Response(html, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // For CSS, rewrite URLs
    if (contentType.includes("text/css")) {
      let css = await response.text()
      // Rewrite url() references
      css = css.replace(/url\(['"]?\/([^'")]+)['"]?\)/gi, `url(${targetUrlObj.origin}/$1)`)
      return new Response(css, {
        status: response.status,
        headers: responseHeaders,
      })
    }
    
    // For other content, stream through
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
    
  } catch (error) {
    console.error("Proxy error:", error)
    return new Response(
      JSON.stringify({
        error: "Proxy Error",
        message: error instanceof Error ? error.message : "Unknown error",
        targetUrl,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const encodedPath = path.join("/")
  const decodedPath = decodeProxyPath(encodedPath)
  
  // Build the target URL
  let targetUrl: string
  if (decodedPath.startsWith("http://") || decodedPath.startsWith("https://")) {
    targetUrl = decodedPath
  } else {
    targetUrl = `https://${decodedPath}`
  }
  
  // Append query string if present
  const url = new URL(request.url)
  if (url.search) {
    targetUrl += url.search
  }
  
  return handleProxy(request, targetUrl)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const encodedPath = path.join("/")
  const decodedPath = decodeProxyPath(encodedPath)
  
  let targetUrl: string
  if (decodedPath.startsWith("http://") || decodedPath.startsWith("https://")) {
    targetUrl = decodedPath
  } else {
    targetUrl = `https://${decodedPath}`
  }
  
  const url = new URL(request.url)
  if (url.search) {
    targetUrl += url.search
  }
  
  return handleProxy(request, targetUrl)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const encodedPath = path.join("/")
  const decodedPath = decodeProxyPath(encodedPath)
  
  let targetUrl: string
  if (decodedPath.startsWith("http://") || decodedPath.startsWith("https://")) {
    targetUrl = decodedPath
  } else {
    targetUrl = `https://${decodedPath}`
  }
  
  const url = new URL(request.url)
  if (url.search) {
    targetUrl += url.search
  }
  
  return handleProxy(request, targetUrl)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const encodedPath = path.join("/")
  const decodedPath = decodeProxyPath(encodedPath)
  
  let targetUrl: string
  if (decodedPath.startsWith("http://") || decodedPath.startsWith("https://")) {
    targetUrl = decodedPath
  } else {
    targetUrl = `https://${decodedPath}`
  }
  
  const url = new URL(request.url)
  if (url.search) {
    targetUrl += url.search
  }
  
  return handleProxy(request, targetUrl)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  })
}
