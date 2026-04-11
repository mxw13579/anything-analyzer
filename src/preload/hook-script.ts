/**
 * Hook script injected into the target browser page context.
 * Intercepts fetch, XMLHttpRequest, crypto.subtle, and document.cookie.
 */
;(function () {
  const HOOK_MSG_TYPE = 'ar-hook'

  function sendHookData(hookType: string, functionName: string, args: unknown, result: unknown, callStack: string | null): void {
    try {
      window.postMessage({ type: HOOK_MSG_TYPE, hookType, functionName, arguments: JSON.stringify(args), result: result != null ? JSON.stringify(result) : null, callStack, timestamp: Date.now() }, '*')
    } catch { /* ignore serialization errors */ }
  }

  function getCallStack(): string {
    return new Error().stack?.split('\n').slice(2).join('\n') || ''
  }

  function arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Hook: window.fetch
  const originalFetch = window.fetch
  const hookedFetch = function(this: typeof globalThis, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const stack = getCallStack()
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    const method = init?.method || (input instanceof Request ? input.method : 'GET')
    sendHookData('fetch', 'window.fetch', { url, method, body: init?.body?.toString() }, null, stack)
    return originalFetch.call(this, input, init).then(response => {
      sendHookData('fetch', 'window.fetch.response', { url, method }, { status: response.status, statusText: response.statusText }, null)
      return response
    })
  }
  try { Object.defineProperty(window, 'fetch', { value: hookedFetch, writable: false, configurable: false }) } catch { (window as any).fetch = hookedFetch }

  // Hook: XMLHttpRequest
  const XHRProto = XMLHttpRequest.prototype
  const originalOpen = XHRProto.open
  const originalSend = XHRProto.send
  const originalSetHeader = XHRProto.setRequestHeader

  XHRProto.open = function(method: string, url: string | URL, ...args: any[]) {
    (this as any)._arMethod = method;
    (this as any)._arUrl = typeof url === 'string' ? url : url.href;
    (this as any)._arHeaders = {}
    return (originalOpen as Function).call(this, method, url, ...args)
  }

  XHRProto.setRequestHeader = function(name: string, value: string) {
    if ((this as any)._arHeaders) (this as any)._arHeaders[name] = value
    return originalSetHeader.call(this, name, value)
  }

  XHRProto.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
    const xhr = this as any
    const stack = getCallStack()
    sendHookData('xhr', 'XMLHttpRequest.send', { method: xhr._arMethod, url: xhr._arUrl, headers: xhr._arHeaders, body: body?.toString() || null }, null, stack)
    this.addEventListener('load', function() {
      sendHookData('xhr', 'XMLHttpRequest.response', { method: xhr._arMethod, url: xhr._arUrl }, { status: this.status, statusText: this.statusText }, null)
    })
    return originalSend.call(this, body)
  }

  // Hook: crypto.subtle
  if (window.crypto?.subtle) {
    const subtle = window.crypto.subtle
    for (const methodName of ['sign', 'digest', 'encrypt', 'decrypt'] as const) {
      const original = subtle[methodName].bind(subtle)
      ;(subtle as any)[methodName] = async function(...args: any[]) {
        const stack = getCallStack()
        const serializedArgs = args.map(arg => {
          if (arg instanceof ArrayBuffer) return arrayBufferToHex(arg)
          if (ArrayBuffer.isView(arg)) return arrayBufferToHex(arg.buffer)
          return arg
        })
        sendHookData('crypto', `crypto.subtle.${methodName}`, serializedArgs, null, stack)
        const result = await (original as Function)(...args)
        sendHookData('crypto', `crypto.subtle.${methodName}.result`, serializedArgs, result instanceof ArrayBuffer ? arrayBufferToHex(result) : result, null)
        return result
      }
    }
  }

  // Hook: document.cookie setter
  const cookieDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')
  if (cookieDesc) {
    try {
      Object.defineProperty(document, 'cookie', {
        get: function() { return cookieDesc.get?.call(this) },
        set: function(value: string) { sendHookData('cookie_set', 'document.cookie.set', { value }, null, getCallStack()); return cookieDesc.set?.call(this, value) },
        configurable: false
      })
    } catch { /* CSP or already locked */ }
  }
})()
